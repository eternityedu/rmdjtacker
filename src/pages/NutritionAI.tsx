import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useDisciplineEngine } from '@/hooks/useDisciplineEngine';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  UtensilsCrossed, 
  Camera, 
  Send, 
  Loader2, 
  Upload,
  X,
  Apple,
  Beef,
  Wheat,
  Droplet,
  AlertTriangle,
  Mic,
  MicOff
} from 'lucide-react';

interface NutritionData {
  foods?: {
    name: string;
    portion: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  }[];
  totals?: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  analysis?: string;
  warnings?: string[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  nutritionData?: NutritionData;
}

export default function NutritionAI() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logMealPoints, logAIChatPoints } = useDisciplineEngine();
  const { isListening, isSupported, transcript, startListening, stopListening, resetTranscript } = useVoiceInput();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! 📸 I'm your Nutrition AI. Take a photo of your food or upload an image, and I'll analyze its nutritional content. I can estimate calories, protein, carbs, fats, and even flag unhealthy patterns!"
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Sync voice transcript to input
  useEffect(() => {
    if (transcript) {
      setInputMessage(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Image too large",
          description: "Please select an image under 5MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const parseNutritionData = (content: string): NutritionData | null => {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.log('Could not parse as structured data');
    }
    return null;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !selectedImage) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage || 'Please analyze this food image',
      imageUrl: selectedImage || undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    resetTranscript();
    const imageToSend = selectedImage;
    setSelectedImage(null);
    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-food', {
        body: {
          imageBase64: imageToSend,
          message: inputMessage || undefined,
        }
      });

      if (error) throw error;

      const result = data.result || 'I apologize, but I could not analyze that. Please try again.';
      const nutritionData = parseNutritionData(result);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: result,
        nutritionData: nutritionData || undefined,
      }]);

      // Save to food logs if we have nutrition data
      if (nutritionData?.totals && user) {
        const foodName = nutritionData.foods?.map(f => f.name).join(', ') || 'Meal';
        await supabase.from('food_logs').insert({
          user_id: user.id,
          food_name: foodName,
          calories: nutritionData.totals.calories,
          protein: nutritionData.totals.protein,
          carbohydrates: nutritionData.totals.carbs,
          fats: nutritionData.totals.fats,
          image_url: imageToSend || null,
        });

        // Award gamification points
        await logMealPoints();
      } else {
        // Just chatting, award chat points
        await logAIChatPoints();
      }
    } catch (error) {
      console.error('Error analyzing food:', error);
      toast({
        title: "Analysis failed",
        description: "Failed to analyze the food. Please try again.",
        variant: "destructive",
      });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, I encountered an error analyzing your request. Please try again.",
      }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const NutritionCard = ({ data }: { data: NutritionData }) => {
    if (!data.totals) return null;

    return (
      <Card className="mt-3 bg-background/50 border-primary/20">
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Apple className="h-4 w-4 text-primary" />
            Nutrition Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="text-center p-2 rounded-lg bg-secondary">
              <p className="text-lg font-bold text-orange-500">{data.totals.calories}</p>
              <p className="text-xs text-muted-foreground">Cal</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-secondary">
              <div className="flex items-center justify-center gap-1">
                <Beef className="h-3 w-3 text-red-500" />
                <span className="text-lg font-bold">{data.totals.protein}g</span>
              </div>
              <p className="text-xs text-muted-foreground">Protein</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-secondary">
              <div className="flex items-center justify-center gap-1">
                <Wheat className="h-3 w-3 text-amber-500" />
                <span className="text-lg font-bold">{data.totals.carbs}g</span>
              </div>
              <p className="text-xs text-muted-foreground">Carbs</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-secondary">
              <div className="flex items-center justify-center gap-1">
                <Droplet className="h-3 w-3 text-blue-500" />
                <span className="text-lg font-bold">{data.totals.fats}g</span>
              </div>
              <p className="text-xs text-muted-foreground">Fats</p>
            </div>
          </div>

          {data.foods && data.foods.length > 0 && (
            <div className="space-y-1 mb-3">
              <p className="text-xs font-medium text-muted-foreground">Foods:</p>
              {data.foods.map((food, index) => (
                <div key={index} className="flex justify-between items-center text-xs py-1 border-b border-border/50 last:border-0">
                  <span>{food.name} ({food.portion})</span>
                  <span className="text-muted-foreground">{food.calories} cal</span>
                </div>
              ))}
            </div>
          )}

          {data.warnings && data.warnings.length > 0 && (
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-1 mb-1">
                <AlertTriangle className="h-3 w-3 text-amber-500" />
                <p className="text-xs font-medium text-amber-600">Notes:</p>
              </div>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                {data.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Header */}
        <div className="px-4 py-3 border-b bg-background/95 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <UtensilsCrossed className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold">Nutrition AI</h1>
              <p className="text-xs text-muted-foreground">Analyze food with photos</p>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="py-4 space-y-4 max-w-2xl mx-auto">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary'
                  }`}
                >
                  {message.imageUrl && (
                    <img
                      src={message.imageUrl}
                      alt="Food"
                      className="rounded-lg mb-2 max-h-40 object-cover"
                    />
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.nutritionData && <NutritionCard data={message.nutritionData} />}
                </div>
              </div>
            ))}
            {isAnalyzing && (
              <div className="flex justify-start">
                <div className="bg-secondary rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Analyzing your food...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Image Preview */}
        {selectedImage && (
          <div className="px-4 py-2 border-t bg-secondary/50">
            <div className="relative inline-block">
              <img
                src={selectedImage}
                alt="Selected"
                className="h-16 rounded-lg object-cover"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t bg-background/95 backdrop-blur">
          <div className="flex gap-2 max-w-2xl mx-auto">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="flex-shrink-0"
            >
              <Camera className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.removeAttribute('capture');
                  fileInputRef.current.click();
                  fileInputRef.current.setAttribute('capture', 'environment');
                }
              }}
              disabled={isAnalyzing}
              className="flex-shrink-0"
            >
              <Upload className="h-5 w-5" />
            </Button>
            {isSupported && (
              <Button
                variant={isListening ? "destructive" : "outline"}
                size="icon"
                onClick={() => {
                  if (isListening) {
                    stopListening();
                  } else {
                    resetTranscript();
                    setInputMessage('');
                    startListening();
                  }
                }}
                disabled={isAnalyzing}
                className={`flex-shrink-0 ${isListening ? 'animate-pulse' : ''}`}
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
            )}
            <Input
              placeholder={isListening ? "Listening..." : "Ask about nutrition..."}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              disabled={isAnalyzing || isListening}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isAnalyzing || (!inputMessage.trim() && !selectedImage)}
              className="brand-gradient flex-shrink-0"
              size="icon"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
