import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, message } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing food image...");

    const messages: any[] = [
      {
        role: "system",
        content: `You are an expert nutritionist AI assistant. When analyzing food images:
1. Identify all visible foods in the image
2. Estimate portion sizes based on visual cues
3. Calculate approximate nutritional values for each item
4. Provide a total summary

Always respond in this JSON format:
{
  "foods": [
    {
      "name": "Food name",
      "portion": "Estimated portion size",
      "calories": number,
      "protein": number (grams),
      "carbs": number (grams),
      "fats": number (grams)
    }
  ],
  "totals": {
    "calories": number,
    "protein": number,
    "carbs": number,
    "fats": number
  },
  "analysis": "Brief health analysis and recommendations",
  "warnings": ["Any health concerns or notes"]
}

If no image is provided or you cannot identify food, provide helpful guidance about nutrition tracking.
Be realistic with estimates and explain your reasoning.`
      }
    ];

    if (imageBase64) {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: message || "Please analyze this food image and provide detailed nutritional information."
          },
          {
            type: "image_url",
            image_url: {
              url: imageBase64
            }
          }
        ]
      });
    } else {
      messages.push({
        role: "user",
        content: message || "Hello, I need help with nutrition tracking."
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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

    console.log("Food analysis complete");

    return new Response(JSON.stringify({ result: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-food error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
