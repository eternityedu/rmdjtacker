import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { DisciplineStats } from '@/components/gamification/DisciplineStats';
import { DisciplineMedals } from '@/components/gamification/DisciplineMedals';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  UtensilsCrossed, 
  Home, 
  Camera,
  ArrowRight,
  Loader2,
  Beef,
  Wheat,
  Droplet
} from 'lucide-react';

interface TodayNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  mealsLogged: number;
}

export default function UserDashboard() {
  const { user } = useAuth();
  const [todayNutrition, setTodayNutrition] = useState<TodayNutrition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTodayNutrition();
    }
  }, [user]);

  const fetchTodayNutrition = async () => {
    if (!user) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('food_logs')
        .select('calories, protein, carbohydrates, fats')
        .eq('user_id', user.id)
        .gte('logged_at', today.toISOString());

      if (error) throw error;

      if (data && data.length > 0) {
        const totals = data.reduce((acc, log) => ({
          calories: acc.calories + (log.calories || 0),
          protein: acc.protein + (Number(log.protein) || 0),
          carbs: acc.carbs + (Number(log.carbohydrates) || 0),
          fats: acc.fats + (Number(log.fats) || 0),
        }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

        setTodayNutrition({
          ...totals,
          mealsLogged: data.length,
        });
      }
    } catch (error) {
      console.error('Error fetching nutrition:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      icon: Brain,
      title: 'Lifestyle AI',
      description: 'Get productivity tips',
      href: '/ai/lifestyle',
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      icon: UtensilsCrossed,
      title: 'Nutrition AI',
      description: 'Analyze food photos',
      href: '/ai/nutrition',
      gradient: 'from-amber-500 to-orange-500'
    },
    {
      icon: Home,
      title: 'Housing AI',
      description: 'Find your home',
      href: '/ai/housing',
      gradient: 'from-blue-500 to-indigo-500'
    }
  ];

  return (
    <Layout>
      <div className="px-4 py-6 pb-20 max-w-lg mx-auto">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold mb-1">
            Welcome back! 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Let's make today count
          </p>
        </div>

        {/* Discipline Stats */}
        <DisciplineStats />

        {/* Medals Display */}
        <DisciplineMedals />

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="font-display text-lg font-semibold mb-3">AI Assistants</h2>
          <div className="grid gap-3">
            {quickActions.map((action) => (
              <Link key={action.href} to={action.href}>
                <Card className="hover:shadow-card transition-all duration-300 group cursor-pointer border-border/50">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-base">{action.title}</p>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Today's Nutrition */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
              Today's Nutrition
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : todayNutrition ? (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center p-2 rounded-lg bg-secondary">
                    <p className="text-lg font-bold text-orange-500">{todayNutrition.calories}</p>
                    <p className="text-xs text-muted-foreground">Calories</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-secondary">
                    <div className="flex items-center justify-center gap-1">
                      <Beef className="h-3 w-3 text-red-500" />
                      <span className="text-lg font-bold">{Math.round(todayNutrition.protein)}g</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Protein</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-secondary">
                    <div className="flex items-center justify-center gap-1">
                      <Wheat className="h-3 w-3 text-amber-500" />
                      <span className="text-lg font-bold">{Math.round(todayNutrition.carbs)}g</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Carbs</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-secondary">
                    <div className="flex items-center justify-center gap-1">
                      <Droplet className="h-3 w-3 text-blue-500" />
                      <span className="text-lg font-bold">{Math.round(todayNutrition.fats)}g</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Fats</p>
                  </div>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  {todayNutrition.mealsLogged} meal{todayNutrition.mealsLogged !== 1 ? 's' : ''} logged today
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-3">
                  <Camera className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  No meals logged yet today
                </p>
                <Link to="/ai/nutrition">
                  <Button className="brand-gradient text-primary-foreground" size="sm">
                    <Camera className="mr-2 h-4 w-4" />
                    Log Your First Meal
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Browse Homes CTA */}
        <Link to="/houses">
          <Card className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-500/20 hover:shadow-card transition-all">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                <Home className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Browse Rentals</p>
                <p className="text-sm text-muted-foreground">View approved listings</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </Layout>
  );
}
