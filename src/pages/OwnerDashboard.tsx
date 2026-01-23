import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Home, 
  Plus, 
  MessageSquare, 
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Send,
  Upload,
  X,
  Image as ImageIcon
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
  area_sqft?: number;
  features?: string[];
  images?: string[];
  description?: string;
}

interface Message {
  id: string;
  message: string;
  sender_id: string;
  is_from_admin: boolean;
  created_at: string;
  house_id: string | null;
}

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [houses, setHouses] = useState<House[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [area, setArea] = useState('');
  const [features, setFeatures] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Real-time subscription for messages
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('owner-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'owner_admin_messages',
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      // Fetch houses
      const { data: housesData, error: housesError } = await supabase
        .from('houses')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (housesError) throw housesError;
      setHouses(housesData || []);

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('owner_admin_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},is_from_admin.eq.true`)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).slice(0, 5 - images.length);
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (images.length === 0) return [];
    
    setUploadingImages(true);
    const uploadedUrls: string[] = [];
    
    try {
      for (const image of images) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${user!.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('house-images')
          .upload(fileName, image);
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('house-images')
          .getPublicUrl(fileName);
          
        uploadedUrls.push(publicUrl);
      }
      return uploadedUrls;
    } finally {
      setUploadingImages(false);
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
      // Upload images first
      const imageUrls = await uploadImages();
      
      // Parse features from comma-separated string
      const featuresList = features
        .split(',')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const { error } = await supabase
        .from('houses')
        .insert({
          owner_id: user.id,
          title,
          description,
          location,
          rental_price: parseFloat(price),
          area_sqft: area ? parseInt(area) : null,
          features: featuresList.length > 0 ? featuresList : null,
          images: imageUrls.length > 0 ? imageUrls : null,
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
      setArea('');
      setFeatures('');
      setImages([]);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setSendingMessage(true);
    try {
      const { data, error } = await supabase
        .from('owner_admin_messages')
        .insert({
          message: newMessage.trim(),
          sender_id: user.id,
          is_from_admin: false,
        })
        .select()
        .single();

      if (error) throw error;

      setMessages(prev => [...prev, data]);
      setNewMessage('');
      toast.success('Message sent to admin');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
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
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Submit New Property</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>Property Photos (up to 5)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((img, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                        <img 
                          src={URL.createObjectURL(img)} 
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {images.length < 5 && (
                      <label className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/50 transition-colors">
                        <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">Add Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                          multiple
                        />
                      </label>
                    )}
                  </div>
                </div>

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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Monthly Rent (₹) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="15000"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="area">Area (sq.ft)</Label>
                    <Input
                      id="area"
                      type="number"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="1200"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="features">Specialties / Features</Label>
                  <Input
                    id="features"
                    value={features}
                    onChange={(e) => setFeatures(e.target.value)}
                    placeholder="Parking, Garden, Gym, Swimming Pool"
                  />
                  <p className="text-xs text-muted-foreground">Separate features with commas</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your property in detail..."
                    rows={3}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Your property will be reviewed by admin before being listed publicly.
                </p>
                <Button 
                  type="submit" 
                  className="w-full brand-gradient text-primary-foreground"
                  disabled={submitting || uploadingImages}
                >
                  {submitting || uploadingImages ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {uploadingImages ? 'Uploading Images...' : 'Submitting...'}
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

        <Tabs defaultValue="properties" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="properties" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Properties
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat with Admin
            </TabsTrigger>
          </TabsList>

          <TabsContent value="properties">
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
                        className="p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex gap-4">
                          {/* House Image */}
                          {house.images && house.images.length > 0 ? (
                            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                              <img 
                                src={house.images[0]} 
                                alt={house.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-20 h-20 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold truncate">{house.title}</h3>
                              <Badge variant={house.is_approved ? 'default' : 'secondary'}>
                                {house.is_approved ? 'Approved' : 'Pending'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{house.location}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <p className="text-sm font-medium text-primary">₹{house.rental_price.toLocaleString()}/month</p>
                              {house.area_sqft && (
                                <p className="text-xs text-muted-foreground">{house.area_sqft} sq.ft</p>
                              )}
                            </div>
                            {house.features && house.features.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {house.features.slice(0, 3).map((feature, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
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
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card className="h-[500px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Admin Chat
                </CardTitle>
                <CardDescription>
                  Discuss listing requests, pricing, and approvals with the admin
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 px-6">
                  <div className="space-y-4 py-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No messages yet. Start a conversation with the admin.</p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.is_from_admin ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                              msg.is_from_admin
                                ? 'bg-secondary'
                                : 'bg-primary text-primary-foreground'
                            }`}
                          >
                            <p className="text-sm">{msg.message}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(msg.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message to admin..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      disabled={sendingMessage}
                    />
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={sendingMessage || !newMessage.trim()}
                      className="brand-gradient"
                    >
                      {sendingMessage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
