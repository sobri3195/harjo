import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEmergencyReports } from '@/hooks/useEmergencyReports';

interface ChatMessage {
  id: string;
  report_id: string;
  sender_name: string;
  sender_role: 'dispatcher' | 'paramedic' | 'doctor' | 'driver' | 'admin';
  message: string;
  message_type: 'text' | 'location' | 'image' | 'audio';
  attachment_url?: string;
  is_urgent: boolean;
  created_at: string;
}

const TeamCommunicationChat: React.FC = () => {
  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [senderName, setSenderName] = useState('Tim Ambulans');
  const [senderRole, setSenderRole] = useState<'dispatcher' | 'paramedic' | 'doctor' | 'driver' | 'admin'>('paramedic');
  const [isUrgent, setIsUrgent] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { reports } = useEmergencyReports();
  const { toast } = useToast();

  const activeReports = reports.filter(report => report.status === 'pending');

  useEffect(() => {
    if (selectedReportId) {
      fetchMessages();
      setupRealtimeSubscription();
    }
  }, [selectedReportId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!selectedReportId) return;

    try {
      const { data, error } = await supabase
        .from('team_chat')
        .select('*')
        .eq('report_id', selectedReportId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data as ChatMessage[] || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!selectedReportId) return;

    const channel = supabase
      .channel(`team_chat_${selectedReportId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_chat',
          filter: `report_id=eq.${selectedReportId}`
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMessage]);
          
          // Show notification for urgent messages
          if (newMessage.is_urgent && newMessage.sender_name !== senderName) {
            toast({
              title: "🚨 Pesan Urgent",
              description: `${newMessage.sender_name}: ${newMessage.message}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedReportId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('team_chat')
        .insert([{
          report_id: selectedReportId,
          sender_name: senderName,
          sender_role: senderRole,
          message: newMessage,
          message_type: 'text',
          is_urgent: isUrgent,
        }]);

      if (error) throw error;

      setNewMessage('');
      setIsUrgent(false);

      toast({
        title: "✅ Pesan Terkirim",
        description: "Pesan berhasil dikirim ke tim",
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Gagal mengirim pesan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendLocation = async () => {
    if (!selectedReportId) return;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const locationMessage = `📍 Lokasi: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        
        try {
          const { error } = await supabase
            .from('team_chat')
            .insert([{
              report_id: selectedReportId,
              sender_name: senderName,
              sender_role: senderRole,
              message: locationMessage,
              message_type: 'location',
              is_urgent: false,
            }]);

          if (error) throw error;

          toast({
            title: "📍 Lokasi Dikirim",
            description: "Koordinat lokasi berhasil dibagikan",
          });

        } catch (error) {
          console.error('Error sending location:', error);
          toast({
            title: "Error",
            description: "Gagal mengirim lokasi",
            variant: "destructive",
          });
        }
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'dispatcher': return 'bg-blue-500';
      case 'paramedic': return 'bg-green-500';
      case 'doctor': return 'bg-purple-500';
      case 'driver': return 'bg-orange-500';
      case 'admin': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'dispatcher': return 'Dispatcher';
      case 'paramedic': return 'Paramedis';
      case 'doctor': return 'Dokter';
      case 'driver': return 'Driver';
      case 'admin': return 'Admin';
      default: return role;
    }
  };

  return (
    <div className="space-y-4">
      {/* Report Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <span>Team Communication</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Pilih Kasus</label>
              <Select value={selectedReportId} onValueChange={setSelectedReportId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kasus emergency..." />
                </SelectTrigger>
                <SelectContent>
                  {activeReports.map((report) => (
                    <SelectItem key={report.id} value={report.id}>
                      {report.patient_name} - {report.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <Select value={senderRole} onValueChange={(value: any) => setSenderRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paramedic">Paramedis</SelectItem>
                  <SelectItem value="doctor">Dokter</SelectItem>
                  <SelectItem value="driver">Driver</SelectItem>
                  <SelectItem value="dispatcher">Dispatcher</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chat Messages */}
      {selectedReportId && (
        <Card className="flex flex-col h-[500px]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              Chat - {activeReports.find(r => r.id === selectedReportId)?.patient_name}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_name === senderName ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender_name === senderName
                        ? 'bg-blue-600 text-white'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge className={`${getRoleColor(message.sender_role)} text-white text-xs`}>
                        {getRoleLabel(message.sender_role)}
                      </Badge>
                      {message.is_urgent && (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    
                    <div className="text-sm font-medium mb-1">
                      {message.sender_name}
                    </div>
                    
                    <div className="text-sm">
                      {message.message_type === 'location' && <MapPin className="w-4 h-4 inline mr-1" />}
                      {message.message}
                    </div>
                    
                    <div className="text-xs opacity-70 mt-1">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(message.created_at).toLocaleTimeString('id-ID')}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t p-4">
              <form onSubmit={sendMessage} className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Input
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Nama Anda"
                    className="w-32"
                  />
                  <Button
                    type="button"
                    variant={isUrgent ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => setIsUrgent(!isUrgent)}
                  >
                    {isUrgent ? "URGENT" : "Normal"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={sendLocation}
                  >
                    <MapPin className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Ketik pesan..."
                    className="flex-1"
                  />
                  <Button type="submit" disabled={loading || !newMessage.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeamCommunicationChat;