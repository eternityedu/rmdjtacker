import { useState, useEffect } from 'react';
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
  User
} from 'lucide-react';

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
}

interface Message {
  id: string;
  message: string;
  sender_id: string;
  is_from_admin: boolean;
  created_at: string;
  house_id: string | null;
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
  
  const [houses, setHouses] = useState<House[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user || userRole !== 'admin') {
        navigate('/auth');
        return;
      }
      fetchData();
    }
  }, [user, userRole, authLoading, navigate]);

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
      const { error } = await supabase
        .from('owner_admin_messages')
        .insert({
          message: newMessage.trim(),
          sender_id: user.id,
          is_from_admin: true,
        });

      if (error) throw error;

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        message: newMessage.trim(),
        sender_id: user.id,
        is_from_admin: true,
        created_at: new Date().toISOString(),
        house_id: null,
      }]);

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
    return messages.filter(m => m.sender_id === ownerId || (m.is_from_admin && selectedOwner === ownerId));
  };

  const pendingHouses = houses.filter(h => !h.is_approved);
  const approvedHouses = houses.filter(h => h.is_approved);

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

        <div className="grid md:grid-cols-3 gap-4 mb-8">
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
              <p className="font-display text-3xl font-bold text-blue-500">{owners.length}</p>
              <p className="text-sm text-muted-foreground">House Owners</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Pending ({pendingHouses.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Approved ({approvedHouses.length})
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages
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
                  <Card key={house.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{house.title}</CardTitle>
                          <CardDescription>{house.location}</CardDescription>
                        </div>
                        <Badge variant="secondary">Pending</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          {house.description || 'No description provided'}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-lg">
                            ₹{house.rental_price.toLocaleString()}/month
                          </p>
                          <div className="flex gap-2">
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
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
                  <Card key={house.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{house.title}</CardTitle>
                          <CardDescription>{house.location}</CardDescription>
                        </div>
                        <Badge className="bg-emerald-500">Approved</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          {house.description || 'No description provided'}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-lg">
                            ₹{house.rental_price.toLocaleString()}/month
                          </p>
                          <div className="flex gap-2">
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
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="messages">
            <div className="grid md:grid-cols-3 gap-4 h-[600px]">
              {/* Owners List */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">House Owners</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[500px]">
                    {owners.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No house owners yet</p>
                    ) : (
                      owners.map((owner) => (
                        <button
                          key={owner.user_id}
                          onClick={() => setSelectedOwner(owner.user_id)}
                          className={`w-full p-4 text-left border-b transition-colors hover:bg-secondary/50 ${
                            selectedOwner === owner.user_id ? 'bg-secondary' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{owner.full_name || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">{owner.email}</p>
                            </div>
                          </div>
                        </button>
                      ))
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
      </div>
    </Layout>
  );
}
