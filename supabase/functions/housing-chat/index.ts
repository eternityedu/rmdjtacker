import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, preferences, conversationHistory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Housing AI chat started...");

    // Fetch approved houses from database
    let housesContext = "";
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: houses, error } = await supabase
        .from('houses')
        .select('id, title, description, location, rental_price, nearby_places, is_available')
        .eq('is_approved', true)
        .eq('is_available', true);

      if (!error && houses && houses.length > 0) {
        housesContext = `\n\nAVAILABLE APPROVED LISTINGS:\n${houses.map((h, i) => 
          `${i + 1}. "${h.title}" - Location: ${h.location}, Price: ₹${h.rental_price}/month${h.nearby_places?.length ? `, Nearby: ${h.nearby_places.join(', ')}` : ''}${h.description ? `, Description: ${h.description}` : ''}`
        ).join('\n')}`;
      } else {
        housesContext = "\n\nNote: No approved listings are currently available.";
      }
    }

    const systemPrompt = `You are an expert Housing Purpose AI assistant. Your role is to help users find rental homes based on:
- Budget constraints
- Location preferences
- Lifestyle needs
- Proximity to important places

${preferences ? `User preferences:
- Budget: ₹${preferences.minBudget || 0} - ₹${preferences.maxBudget || 'unlimited'}/month
- Preferred location: ${preferences.location || 'Not specified'}
- Lifestyle: ${preferences.lifestyle || 'Not specified'}` : ''}
${housesContext}

Guidelines:
1. ONLY recommend houses from the approved listings above
2. Explain why each recommendation fits the user's needs
3. If no listings match, be honest and suggest checking back later
4. Ask clarifying questions about budget, location, or lifestyle needs
5. Provide helpful context about locations and neighborhoods
6. Keep responses conversational and helpful
7. Format recommendations clearly with key details`;

    const messages: any[] = [
      { role: "system", content: systemPrompt }
    ];

    if (conversationHistory && Array.isArray(conversationHistory)) {
      messages.push(...conversationHistory.slice(-10));
    }

    messages.push({ role: "user", content: message });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service credits depleted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    console.log("Housing AI response complete");

    return new Response(JSON.stringify({ result: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("housing-chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
