import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Menu, X, LogOut, User, Home, Brain, UtensilsCrossed, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import rmdjLogo from '@/assets/rmdj-logo.png';

export const Header = () => {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const getDashboardPath = () => {
    if (userRole === 'admin') return '/admin';
    if (userRole === 'house_owner') return '/owner';
    return '/dashboard';
  };

  return (
    <header className="sticky top-0 z-50 glass-strong">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src={rmdjLogo} alt="RMDJ Tracker" className="h-10 w-10 rounded-lg" />
          <span className="font-display text-xl font-bold text-foreground hidden sm:block">
            RMDJ Tracker
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              <Link 
                to={getDashboardPath()} 
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              {userRole !== 'admin' && (
                <>
                  <Link 
                    to="/ai/lifestyle" 
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Brain className="h-4 w-4" />
                    Lifestyle AI
                  </Link>
                  <Link 
                    to="/ai/nutrition" 
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <UtensilsCrossed className="h-4 w-4" />
                    Nutrition AI
                  </Link>
                  <Link 
                    to="/houses" 
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Home className="h-4 w-4" />
                    Find Homes
                  </Link>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/houses" className="text-muted-foreground hover:text-foreground transition-colors">
                Browse Homes
              </Link>
              <Link to="/auth">
                <Button variant="default" size="sm" className="brand-gradient text-primary-foreground">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background animate-fade-in">
          <nav className="container py-4 flex flex-col gap-3">
            {user ? (
              <>
                <Link 
                  to={getDashboardPath()} 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="h-5 w-5 text-primary" />
                  <span>Dashboard</span>
                </Link>
                {userRole !== 'admin' && (
                  <>
                    <Link 
                      to="/ai/lifestyle" 
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Brain className="h-5 w-5 text-primary" />
                      <span>Lifestyle AI</span>
                    </Link>
                    <Link 
                      to="/ai/nutrition" 
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <UtensilsCrossed className="h-5 w-5 text-primary" />
                      <span>Nutrition AI</span>
                    </Link>
                    <Link 
                      to="/houses" 
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Home className="h-5 w-5 text-primary" />
                      <span>Find Homes</span>
                    </Link>
                  </>
                )}
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left w-full"
                >
                  <LogOut className="h-5 w-5 text-destructive" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/houses" 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Home className="h-5 w-5 text-primary" />
                  <span>Browse Homes</span>
                </Link>
                <Link 
                  to="/auth" 
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button className="w-full brand-gradient text-primary-foreground">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
