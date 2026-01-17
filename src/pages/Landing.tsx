import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Brain, 
  UtensilsCrossed, 
  Home, 
  Shield, 
  Zap, 
  Trophy,
  ArrowRight,
  Camera,
  TrendingUp,
  MapPin
} from 'lucide-react';
import rmdjLogo from '@/assets/rmdj-logo.png';

export default function Landing() {
  const features = [
    {
      icon: Brain,
      title: 'Lifestyle AI',
      description: 'Personalized coaching for productivity, habits, and daily routines. Build discipline with AI-powered guidance.',
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      icon: UtensilsCrossed,
      title: 'Nutrition AI',
      description: 'Snap a photo of your food and get instant calorie, protein, and macro analysis. Track your nutrition effortlessly.',
      gradient: 'from-amber-500 to-orange-500'
    },
    {
      icon: Home,
      title: 'Housing Discovery',
      description: 'Find your perfect rental based on purpose, budget, and lifestyle. AI explains why each home fits you.',
      gradient: 'from-blue-500 to-indigo-500'
    }
  ];

  const benefits = [
    { icon: Camera, text: 'Photo-based food analysis' },
    { icon: Trophy, text: 'Streaks, medals & rewards' },
    { icon: TrendingUp, text: 'Daily & weekly insights' },
    { icon: MapPin, text: 'Location-aware housing' },
    { icon: Shield, text: 'Privacy-first design' },
    { icon: Zap, text: 'Real-time AI responses' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="container py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center animate-fade-up">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <img 
                  src={rmdjLogo} 
                  alt="RMDJ Tracker" 
                  className="h-24 w-24 md:h-32 md:w-32 rounded-3xl shadow-card animate-float"
                />
                <div className="absolute inset-0 rounded-3xl glow-primary opacity-50" />
              </div>
            </div>

            <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              <span className="text-gradient">AI-Powered</span> Lifestyle
              <br />
              & Rental Discovery
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Track your nutrition with photo AI, build healthy habits with smart coaching, 
              and find your perfect rental—all in one free platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="brand-gradient text-primary-foreground w-full sm:w-auto glow-primary">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/houses">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Browse Rentals
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Three AIs, One Platform
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our multi-AI architecture works together to help you live better and find your perfect home.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={feature.title}
                className="group hover:shadow-card transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="font-display text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Everything You Need
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {benefits.map((benefit) => (
              <div 
                key={benefit.text}
                className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="font-medium text-sm">{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Lifestyle?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of users who are already tracking their nutrition, 
              building better habits, and finding their dream homes.
            </p>
            <Link to="/auth">
              <Button size="lg" className="brand-gradient text-primary-foreground glow-primary">
                Start Free Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={rmdjLogo} alt="RMDJ Tracker" className="h-8 w-8 rounded-lg" />
              <span className="font-display font-semibold">RMDJ Tracker</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 RMDJ Tracker. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
