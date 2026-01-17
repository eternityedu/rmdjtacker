import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, DollarSign, Loader2, Home, MessageSquare, Building } from 'lucide-react';

interface House {
  id: string;
  title: string;
  description: string | null;
  location: string;
  rental_price: number;
  images: string[] | null;
  nearby_places: string[] | null;
  is_available: boolean;
}

export default function Houses() {
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHouses();
  }, []);

  const fetchHouses = async () => {
    try {
      const { data, error } = await supabase
        .from('houses')
        .select('*')
        .eq('is_approved', true)
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHouses(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="px-4 py-6 pb-20 max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold mb-1">Find Your Home</h1>
          <p className="text-sm text-muted-foreground">Browse admin-approved rentals</p>
        </div>

        {/* AI Assistant CTA */}
        <Link to="/ai/housing">
          <Card className="mb-6 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-500/20 hover:shadow-card transition-all">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Need help finding a home?</p>
                <p className="text-sm text-muted-foreground">Chat with Housing AI for personalized recommendations</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : houses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">No listings available yet</p>
              <p className="text-sm text-muted-foreground">Check back soon for new homes!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {houses.map((house) => (
              <Card key={house.id} className="overflow-hidden hover:shadow-card transition-shadow">
                {/* Image placeholder */}
                <div className="h-40 bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
                  {house.images && house.images.length > 0 ? (
                    <img 
                      src={house.images[0]} 
                      alt={house.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Home className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-1">{house.title}</CardTitle>
                    <Badge variant="outline" className="flex-shrink-0 text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                      Available
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {house.location}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0 space-y-3">
                  {house.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {house.description}
                    </p>
                  )}
                  
                  {house.nearby_places && house.nearby_places.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {house.nearby_places.slice(0, 3).map((place, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {place}
                        </Badge>
                      ))}
                      {house.nearby_places.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{house.nearby_places.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <p className="flex items-center gap-1 text-xl font-bold text-primary">
                      <DollarSign className="h-5 w-5" />
                      <span>₹{house.rental_price.toLocaleString()}</span>
                      <span className="text-sm font-normal text-muted-foreground">/month</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
