import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Home, 
  MessageSquare, 
  Check, 
  X, 
  Loader2,
  Send,
  User,
  Image as ImageIcon,
  MapPin,
  Maximize2,
  Bell
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface House {
  id: string;
  title: string;
  location: string;
  rental_price: number;
  is_approved: boolean;
  is_available: boolean;
  owner_id: string;
  created_at: string;
  description: string | null;
  images: string[] | null;
  area_sqft: number | null;
  features: string[] | null;
  nearby_places: string[] | null;
}

interface Message {
  id: string;
  message: string;
  sender_id: string;
  is_from_admin: boolean;
  created_at: string;
  house_id: string | null;
  is_read: boolean;
  recipient_id: string | null;
}

interface Owner {
  user_id: string;
  email: string;
  full_name: string | null;
}

export default function AdminDashboard() {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [houses, setHouses] = useState<House[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedHouseImages, setSelectedHouseImages] = useState<string[] | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user || userRole !== 'admin') {
        navigate('/auth');
        return;
      }
      fetchData();
    }
  }, [user, userRole, authLoading, navigate]);

  // Real-time subscription for messages
  useEffect(() => {
    const channel = supabase
      .channel('admin-messages')
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
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedOwner]);

  // Mark messages as read when selecting an owner
  useEffect(() => {
    if (selectedOwner && user) {
      markMessagesAsRead(selectedOwner);
    }
  }, [selectedOwner, user]);

  const fetchData = async () => {
    try {
      // Fetch all houses
      const { data: housesData, error: housesError } = await supabase
        .from('houses')
        .select('*')
        .order('created_at', { ascending: false });

      if (housesError) throw housesError;
      setHouses(housesData || []);

      // Fetch all messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('owner_admin_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);

      // Fetch house owner profiles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'house_owner');

      if (rolesError) throw rolesError;

      if (rolesData && rolesData.length > 0) {
        const ownerIds = rolesData.map(r => r.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, email, full_name')
          .in('user_id', ownerIds);

        if (profilesError) throw profilesError;
        setOwners(profilesData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async (ownerId: string) => {
    try {
      // Mark all messages from this owner as read
      const unreadMessageIds = messages
        .filter(m => m.sender_id === ownerId && !m.is_from_admin && !m.is_read)
        .map(m => m.id);

      if (unreadMessageIds.length === 0) return;

      const { error } = await supabase
        .from('owner_admin_messages')
        .update({ is_read: true })
        .in('id', unreadMessageIds);

      if (error) throw error;

      // Update local state
      setMessages(prev => prev.map(m => 
        unreadMessageIds.includes(m.id) ? { ...m, is_read: true } : m
      ));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleApproveHouse = async (houseId: string) => {
    setActionLoading(houseId);
    try {
      const { error } = await supabase
        .from('houses')
        .update({ is_approved: true })
        .eq('id', houseId);

      if (error) throw error;

      setHouses(prev => prev.map(h => 
        h.id === houseId ? { ...h, is_approved: true } : h
      ));

      toast({
        title: "Success",
        description: "House approved successfully",
      });
    } catch (error) {
      console.error('Error approving house:', error);
      toast({
        title: "Error",
        description: "Failed to approve house",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectHouse = async (houseId: string) => {
    setActionLoading(houseId);
    try {
      const { error } = await supabase
        .from('houses')
        .update({ is_approved: false, is_available: false })
        .eq('id', houseId);

      if (error) throw error;

      setHouses(prev => prev.map(h => 
        h.id === houseId ? { ...h, is_approved: false, is_available: false } : h
      ));

      toast({
        title: "Success",
        description: "House rejected",
      });
    } catch (error) {
      console.error('Error rejecting house:', error);
      toast({
        title: "Error",
        description: "Failed to reject house",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteHouse = async (houseId: string) => {
    setActionLoading(houseId);
    try {
      const { error } = await supabase
        .from('houses')
        .delete()
        .eq('id', houseId);

      if (error) throw error;

      setHouses(prev => prev.filter(h => h.id !== houseId));

      toast({
        title: "Success",
        description: "House deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting house:', error);
      toast({
        title: "Error",
        description: "Failed to delete house",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedOwner || !user) return;

    try {
      const { data, error } = await supabase
        .from('owner_admin_messages')
        .insert({
          message: newMessage.trim(),
          sender_id: user.id,
          is_from_admin: true,
          recipient_id: selectedOwner,
          is_read: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Message will be added via realtime subscription
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const getOwnerMessages = (ownerId: string) => {
    return messages.filter(m => 
      m.sender_id === ownerId || 
      (m.is_from_admin && m.recipient_id === ownerId)
    );
  };

  const getUnreadCount = (ownerId: string) => {
    return messages.filter(
      m => m.sender_id === ownerId && !m.is_from_admin && !m.is_read
    ).length;
  };

  const getTotalUnreadCount = () => {
    return messages.filter(m => !m.is_from_admin && !m.is_read).length;
  };

  const getOwnerName = (ownerId: string) => {
    const owner = owners.find(o => o.user_id === ownerId);
    return owner?.full_name || owner?.email || 'Unknown Owner';
  };

  const openImageDialog = (images: string[]) => {
    setSelectedHouseImages(images);
    setImageDialogOpen(true);
  };

  const pendingHouses = houses.filter(h => !h.is_approved);
  const approvedHouses = houses.filter(h => h.is_approved);
  const totalUnread = getTotalUnreadCount();

  const HouseCard = ({ house, showActions }: { house: House; showActions: 'pending' | 'approved' }) => (
    <Card key={house.id}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* House Images */}
          <div className="flex-shrink-0">
            {house.images && house.images.length > 0 ? (
              <button
                onClick={() => openImageDialog(house.images!)}
                className="relative w-24 h-24 rounded-lg overflow-hidden group"
              >
                <img 
                  src={house.images[0]} 
                  alt={house.title}
                  className="w-full h-full object-cover"
                />
                {house.images.length > 1 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="h-5 w-5 text-white" />
                    <span className="text-white text-xs ml-1">+{house.images.length - 1}</span>
                  </div>
                )}
              </button>
            ) : (
              <div className="w-24 h-24 rounded-lg bg-secondary flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* House Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-semibold text-lg">{house.title}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {house.location}
                </div>
              </div>
              <Badge variant={house.is_approved ? 'default' : 'secondary'}>
                {house.is_approved ? 'Approved' : 'Pending'}
              </Badge>
            </div>

            {house.description && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {house.description}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-sm font-semibold text-primary">
                ₹{house.rental_price.toLocaleString()}/month
              </span>
              {house.area_sqft && (
                <span className="text-sm text-muted-foreground">
                  • {house.area_sqft} sq.ft
                </span>
              )}
            </div>

            {house.features && house.features.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {house.features.slice(0, 4).map((feature, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
                {house.features.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{house.features.length - 4} more
                  </Badge>
                )}
              </div>
            )}

            {/* Nearby Places */}
            {house.nearby_places && house.nearby_places.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                <span className="text-xs text-muted-foreground mr-1">Nearby:</span>
                {house.nearby_places.slice(0, 3).map((place, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
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

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Owner: {getOwnerName(house.owner_id)}
              </span>
              <div className="flex gap-2">
                {showActions === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectHouse(house.id)}
                      disabled={actionLoading === house.id}
                    >
                      {actionLoading === house.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4 mr-1" />
                      )}
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApproveHouse(house.id)}
                      disabled={actionLoading === house.id}
                      className="brand-gradient"
                    >
                      {actionLoading === house.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-1" />
                      )}
                      Approve
                    </Button>
                  </>
                )}
                {showActions === 'approved' && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteHouse(house.id)}
                    disabled={actionLoading === house.id}
                  >
                    {actionLoading === house.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4 mr-1" />
                    )}
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="font-display text-3xl font-bold text-primary">{pendingHouses.length}</p>
              <p className="text-sm text-muted-foreground">Pending Approval</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="font-display text-3xl font-bold text-emerald-500">{approvedHouses.length}</p>
              <p className="text-sm text-muted-foreground">Approved Listings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="font-display text-3xl font-bold text-blue-500">{houses.length}</p>
              <p className="text-sm text-muted-foreground">Total Houses</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="font-display text-3xl font-bold text-purple-500">{owners.length}</p>
              <p className="text-sm text-muted-foreground">House Owners</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Pending ({pendingHouses.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Approved ({approvedHouses.length})
            </TabsTrigger>
            <TabsTrigger value="owners" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Owners ({owners.length})
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2 relative">
              <MessageSquare className="h-4 w-4" />
              Messages
              {totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center px-1">
                  {totalUnread}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pendingHouses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Check className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No pending houses to review</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingHouses.map((house) => (
                  <HouseCard key={house.id} house={house} showActions="pending" />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved">
            {approvedHouses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Home className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No approved houses yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {approvedHouses.map((house) => (
                  <HouseCard key={house.id} house={house} showActions="approved" />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="owners">
            <Card>
              <CardHeader>
                <CardTitle>All House Owners</CardTitle>
                <CardDescription>Registered house owners in the system</CardDescription>
              </CardHeader>
              <CardContent>
                {owners.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No house owners registered yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {owners.map((owner) => {
                      const ownerHouses = houses.filter(h => h.owner_id === owner.user_id);
                      const approvedCount = ownerHouses.filter(h => h.is_approved).length;
                      const pendingCount = ownerHouses.filter(h => !h.is_approved).length;
                      const unreadCount = getUnreadCount(owner.user_id);
                      
                      return (
                        <div 
                          key={owner.user_id}
                          className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center relative">
                              <User className="h-5 w-5 text-primary" />
                              {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                                  {unreadCount}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{owner.full_name || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">{owner.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <p className="font-semibold">{ownerHouses.length}</p>
                              <p className="text-xs text-muted-foreground">Properties</p>
                            </div>
                            <div className="text-center">
                              <p className="font-semibold text-emerald-500">{approvedCount}</p>
                              <p className="text-xs text-muted-foreground">Approved</p>
                            </div>
                            <div className="text-center">
                              <p className="font-semibold text-amber-500">{pendingCount}</p>
                              <p className="text-xs text-muted-foreground">Pending</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedOwner(owner.user_id);
                                // Switch to messages tab
                                const messagesTab = document.querySelector('[value="messages"]') as HTMLElement;
                                messagesTab?.click();
                              }}
                              className="relative"
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Chat
                              {unreadCount > 0 && (
                                <span className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                                  {unreadCount}
                                </span>
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <div className="grid md:grid-cols-3 gap-4 h-[600px]">
              {/* Owners List */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    House Owners
                    {totalUnread > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {totalUnread} unread
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[500px]">
                    {owners.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No house owners yet</p>
                    ) : (
                      owners.map((owner) => {
                        const unreadCount = getUnreadCount(owner.user_id);
                        
                        return (
                          <button
                            key={owner.user_id}
                            onClick={() => setSelectedOwner(owner.user_id)}
                            className={`w-full p-4 text-left border-b transition-colors hover:bg-secondary/50 ${
                              selectedOwner === owner.user_id ? 'bg-secondary' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center relative">
                                <User className="h-5 w-5 text-primary" />
                                {unreadCount > 0 && (
                                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                                    {unreadCount}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium truncate">{owner.full_name || 'Unknown'}</p>
                                  {unreadCount > 0 && (
                                    <Bell className="h-4 w-4 text-destructive animate-pulse" />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground truncate">{owner.email}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Chat Area */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {selectedOwner 
                      ? `Chat with ${owners.find(o => o.user_id === selectedOwner)?.full_name || 'Owner'}`
                      : 'Select an owner to chat'
                    }
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex flex-col h-[500px]">
                  {selectedOwner ? (
                    <>
                      <ScrollArea className="flex-1 p-4">
                        <div className="space-y-4">
                          {getOwnerMessages(selectedOwner).map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.is_from_admin ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                  msg.is_from_admin
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary'
                                }`}
                              >
                                <p className="text-sm">{msg.message}</p>
                                <p className="text-xs opacity-70 mt-1">
                                  {new Date(msg.created_at).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>
                      <div className="p-4 border-t">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          />
                          <Button onClick={handleSendMessage} className="brand-gradient">
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Select an owner from the list to start chatting</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Image Gallery Dialog */}
        <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Property Photos</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              {selectedHouseImages?.map((img, idx) => (
                <img 
                  key={idx}
                  src={img} 
                  alt={`Property ${idx + 1}`}
                  className="w-full h-48 object-cover rounded-lg"
                />
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
