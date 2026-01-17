import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, DollarSign, Loader2 } from 'lucide-react';

interface House {
  id: string;
  title: string;
  description: string;
  location: string;
  rental_price: number;
  images: string[];
  nearby_places: string[];
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
        .eq('is_available', true);

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
      <div className="container py-8">
        <h1 className="font-display text-3xl font-bold mb-2">Find Your Home</h1>
        <p className="text-muted-foreground mb-8">Browse admin-approved rentals</p>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : houses.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">No listings available yet. Check back soon!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {houses.map((house) => (
              <Card key={house.id} className="overflow-hidden hover:shadow-card transition-shadow">
                <div className="h-48 bg-secondary flex items-center justify-center">
                  <MapPin className="h-12 w-12 text-muted-foreground" />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{house.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {house.location}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="flex items-center gap-1 text-lg font-bold text-primary">
                    <DollarSign className="h-5 w-5" />{house.rental_price}/month
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
