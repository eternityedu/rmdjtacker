import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, DollarSign, Loader2, Home, MessageSquare, Building, Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface House {
  id: string;
  title: string;
  description: string | null;
  location: string;
  rental_price: number;
  images: string[] | null;
  nearby_places: string[] | null;
  is_available: boolean;
  area_sqft: number | null;
  features: string[] | null;
}

export default function Houses() {
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

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
      
      // Set max price based on data
      if (data && data.length > 0) {
        const maxRent = Math.max(...data.map(h => h.rental_price));
        setMaxPrice(Math.ceil(maxRent / 1000) * 1000);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Extract all unique amenities from houses
  const allAmenities = useMemo(() => {
    const amenitiesSet = new Set<string>();
    houses.forEach(house => {
      house.nearby_places?.forEach(place => amenitiesSet.add(place));
      house.features?.forEach(feature => amenitiesSet.add(feature));
    });
    return Array.from(amenitiesSet).sort();
  }, [houses]);

  // Filter houses based on criteria
  const filteredHouses = useMemo(() => {
    return houses.filter(house => {
      // Search filter (title, location, description)
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        house.title.toLowerCase().includes(searchLower) ||
        house.location.toLowerCase().includes(searchLower) ||
        (house.description?.toLowerCase().includes(searchLower));

      // Price filter
      const matchesPrice = house.rental_price >= minPrice && house.rental_price <= maxPrice;

      // Amenities filter
      const matchesAmenities = selectedAmenities.length === 0 || 
        selectedAmenities.every(amenity => 
          house.nearby_places?.includes(amenity) || house.features?.includes(amenity)
        );

      return matchesSearch && matchesPrice && matchesAmenities;
    });
  }, [houses, searchQuery, minPrice, maxPrice, selectedAmenities]);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setMinPrice(0);
    setMaxPrice(houses.length > 0 ? Math.max(...houses.map(h => h.rental_price)) : 100000);
    setSelectedAmenities([]);
  };

  const hasActiveFilters = searchQuery || minPrice > 0 || maxPrice < Math.max(...houses.map(h => h.rental_price), 100000) || selectedAmenities.length > 0;

  return (
    <Layout>
      <div className="px-4 py-6 pb-20 max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold mb-1">Find Your Home</h1>
          <p className="text-sm text-muted-foreground">Browse admin-approved rentals</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by location, title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <SlidersHorizontal className="h-4 w-4" />
                {(selectedAmenities.length > 0 || minPrice > 0) && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {selectedAmenities.length + (minPrice > 0 ? 1 : 0)}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Properties</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                {/* Price Range */}
                <div className="space-y-4">
                  <Label>Price Range (₹/month)</Label>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Min</Label>
                      <Input
                        type="number"
                        value={minPrice}
                        onChange={(e) => setMinPrice(Number(e.target.value))}
                        min={0}
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Max</Label>
                      <Input
                        type="number"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                        min={0}
                      />
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground text-center">
                    ₹{minPrice.toLocaleString()} - ₹{maxPrice.toLocaleString()}
                  </div>
                </div>

                {/* Amenities / Nearby Places */}
                {allAmenities.length > 0 && (
                  <div className="space-y-3">
                    <Label>Nearby Amenities & Features</Label>
                    <div className="flex flex-wrap gap-2">
                      {allAmenities.map((amenity) => (
                        <Badge
                          key={amenity}
                          variant={selectedAmenities.includes(amenity) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => toggleAmenity(amenity)}
                        >
                          {amenity}
                          {selectedAmenities.includes(amenity) && (
                            <X className="ml-1 h-3 w-3" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1" onClick={clearFilters}>
                    Clear All
                  </Button>
                  <Button className="flex-1 brand-gradient" onClick={() => setFiltersOpen(false)}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            {minPrice > 0 && (
              <Badge variant="secondary" className="gap-1">
                Min: ₹{minPrice.toLocaleString()}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setMinPrice(0)} />
              </Badge>
            )}
            {selectedAmenities.map(amenity => (
              <Badge key={amenity} variant="secondary" className="gap-1">
                {amenity}
                <X className="h-3 w-3 cursor-pointer" onClick={() => toggleAmenity(amenity)} />
              </Badge>
            ))}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                Clear all
              </button>
            )}
          </div>
        )}

        {/* Results count */}
        {!loading && (
          <p className="text-sm text-muted-foreground mb-4">
            {filteredHouses.length} {filteredHouses.length === 1 ? 'property' : 'properties'} found
          </p>
        )}

        {/* AI Assistant CTA */}
        <Link to="/ai/housing">
          <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 hover:shadow-card transition-all">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-6 w-6 text-primary-foreground" />
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
        ) : filteredHouses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              {houses.length === 0 ? (
                <>
                  <p className="text-muted-foreground mb-2">No listings available yet</p>
                  <p className="text-sm text-muted-foreground">Check back soon for new homes!</p>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground mb-2">No properties match your filters</p>
                  <Button variant="outline" onClick={clearFilters} className="mt-2">
                    Clear Filters
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredHouses.map((house) => (
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
                  
                  {/* Features */}
                  {house.features && house.features.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {house.features.slice(0, 3).map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {house.features.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{house.features.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {/* Nearby places */}
                  {house.nearby_places && house.nearby_places.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-muted-foreground mr-1">
                        <MapPin className="h-3 w-3 inline" /> Nearby:
                      </span>
                      {house.nearby_places.slice(0, 3).map((place, index) => (
                        <Badge key={index} variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
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
                    {house.area_sqft && (
                      <span className="text-sm text-muted-foreground">{house.area_sqft} sq.ft</span>
                    )}
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
