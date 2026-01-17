import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  UtensilsCrossed, 
  Home, 
  Flame, 
  Trophy, 
  TrendingUp,
  Camera,
  ArrowRight
} from 'lucide-react';

export default function UserDashboard() {
  const { user } = useAuth();

  const quickActions = [
    {
      icon: Brain,
      title: 'Lifestyle AI',
      description: 'Get personalized productivity tips',
      href: '/ai/lifestyle',
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      icon: UtensilsCrossed,
      title: 'Nutrition AI',
      description: 'Analyze your food with photos',
      href: '/ai/nutrition',
      gradient: 'from-amber-500 to-orange-500'
    },
    {
      icon: Home,
      title: 'Find Homes',
      description: 'Discover rentals that fit your lifestyle',
      href: '/houses',
      gradient: 'from-blue-500 to-indigo-500'
    }
  ];

  const stats = [
    { icon: Flame, label: 'Day Streak', value: '0', color: 'text-orange-500' },
    { icon: Trophy, label: 'Medals', value: '0', color: 'text-amber-500' },
    { icon: TrendingUp, label: 'Weekly Score', value: '0', color: 'text-emerald-500' },
  ];

  return (
    <Layout>
      <div className="container py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-muted-foreground">
            {user?.email} • Let's make today count
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="text-center">
              <CardContent className="pt-6">
                <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
                <p className="font-display text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="font-display text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link key={action.href} to={action.href}>
                <Card className="h-full hover:shadow-card transition-all duration-300 group cursor-pointer border-border/50">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {action.title}
                      <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Today's Nutrition */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
              Today's Nutrition
            </CardTitle>
            <CardDescription>Track your meals to see insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Camera className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">
                No meals logged yet today
              </p>
              <Link to="/ai/nutrition">
                <Button className="brand-gradient text-primary-foreground">
                  <Camera className="mr-2 h-4 w-4" />
                  Log Your First Meal
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest interactions and achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">
              Start using the platform to see your activity here
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
