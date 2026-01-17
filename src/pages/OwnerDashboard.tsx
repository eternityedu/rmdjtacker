import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Home, 
  Plus, 
  MessageSquare, 
  Clock,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface House {
  id: string;
  title: string;
  location: string;
  rental_price: number;
  is_approved: boolean;
  is_available: boolean;
  created_at: string;
}

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    fetchHouses();
  }, [user]);

  const fetchHouses = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('houses')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHouses(data || []);
    } catch (error) {
      console.error('Error fetching houses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!title || !location || !price) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('houses')
        .insert({
          owner_id: user.id,
          title,
          description,
          location,
          rental_price: parseFloat(price),
          is_approved: false,
          is_available: true
        });

      if (error) throw error;

      toast.success('Property submitted for review!');
      setDialogOpen(false);
      setTitle('');
      setDescription('');
      setLocation('');
      setPrice('');
      fetchHouses();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">
              Owner Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage your rental properties
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="brand-gradient text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                Add Property
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Submit New Property</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Property Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="2BHK Apartment in Downtown"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="123 Main St, City"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Monthly Rent ($) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="1500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your property..."
                    rows={3}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Your property will be reviewed by admin before being listed publicly.
                </p>
                <Button 
                  type="submit" 
                  className="w-full brand-gradient text-primary-foreground"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit for Review'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <Home className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="font-display text-2xl font-bold">{houses.length}</p>
              <p className="text-xs text-muted-foreground">Total Properties</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
              <p className="font-display text-2xl font-bold">
                {houses.filter(h => h.is_approved).length}
              </p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-amber-500" />
              <p className="font-display text-2xl font-bold">
                {houses.filter(h => !h.is_approved).length}
              </p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
        </div>

        {/* Properties List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Properties</CardTitle>
            <CardDescription>Properties you've submitted for listing</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : houses.length === 0 ? (
              <div className="text-center py-8">
                <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  You haven't added any properties yet
                </p>
                <Button 
                  onClick={() => setDialogOpen(true)}
                  className="brand-gradient text-primary-foreground"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Property
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {houses.map((house) => (
                  <div 
                    key={house.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{house.title}</h3>
                        <Badge variant={house.is_approved ? 'default' : 'secondary'}>
                          {house.is_approved ? 'Approved' : 'Pending'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{house.location}</p>
                      <p className="text-sm font-medium text-primary">${house.rental_price}/month</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
