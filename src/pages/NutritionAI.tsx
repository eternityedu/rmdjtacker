import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Image as ImageIcon,
  X,
  Apple,
  Beef,
  Wheat,
  Droplet
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your Nutrition AI assistant. 📸 Upload a photo of your food and I'll analyze its nutritional content, or ask me any nutrition-related questions!"
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
      // Try to extract JSON from the response
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
      <Card className="mt-4 bg-secondary/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Apple className="h-5 w-5 text-primary" />
            Nutrition Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 rounded-lg bg-background">
              <div className="text-2xl font-bold text-orange-500">{data.totals.calories}</div>
              <div className="text-xs text-muted-foreground">Calories</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-background">
              <div className="flex items-center justify-center gap-1">
                <Beef className="h-4 w-4 text-red-500" />
                <span className="text-2xl font-bold">{data.totals.protein}g</span>
              </div>
              <div className="text-xs text-muted-foreground">Protein</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-background">
              <div className="flex items-center justify-center gap-1">
                <Wheat className="h-4 w-4 text-amber-500" />
                <span className="text-2xl font-bold">{data.totals.carbs}g</span>
              </div>
              <div className="text-xs text-muted-foreground">Carbs</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-background">
              <div className="flex items-center justify-center gap-1">
                <Droplet className="h-4 w-4 text-blue-500" />
                <span className="text-2xl font-bold">{data.totals.fats}g</span>
              </div>
              <div className="text-xs text-muted-foreground">Fats</div>
            </div>
          </div>

          {data.foods && data.foods.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Foods identified:</p>
              {data.foods.map((food, index) => (
                <div key={index} className="flex justify-between items-center text-sm py-1 border-b last:border-0">
                  <span>{food.name} ({food.portion})</span>
                  <span className="text-muted-foreground">{food.calories} cal</span>
                </div>
              ))}
            </div>
          )}

          {data.warnings && data.warnings.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm font-medium text-amber-600 mb-1">Health Notes:</p>
              <ul className="text-sm text-muted-foreground">
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
      <div className="container py-4 h-[calc(100vh-80px)] flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <UtensilsCrossed className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">Nutrition AI</h1>
              <p className="text-sm text-muted-foreground">Analyze your food with photos</p>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
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
                        className="rounded-lg mb-2 max-h-48 object-cover"
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
                  className="h-20 rounded-lg object-cover"
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
          <div className="p-4 border-t">
            <div className="flex gap-2">
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
              >
                <Upload className="h-5 w-5" />
              </Button>
              <Input
                placeholder="Ask about nutrition or describe your meal..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                disabled={isAnalyzing}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isAnalyzing || (!inputMessage.trim() && !selectedImage)}
                className="brand-gradient"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
