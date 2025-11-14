import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Megaphone, Users, Clock, Send, Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AlertBroadcast {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  target_audience: 'all' | 'paramedics' | 'doctors' | 'admin' | 'drivers';
  broadcast_type: 'emergency' | 'maintenance' | 'training' | 'general';
  expires_at?: string;
  created_by: string;
  created_at: string;
}

const EmergencyAlertBroadcast: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertBroadcast[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    priority: 'medium' as AlertBroadcast['priority'],
    target_audience: 'all' as AlertBroadcast['target_audience'],
    broadcast_type: 'general' as AlertBroadcast['broadcast_type'],
    expires_at: '',
    created_by: 'Admin',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('alert_broadcasts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data as AlertBroadcast[] || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const createAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const alertData = {
        ...formData,
        expires_at: formData.expires_at || null,
      };

      const { error } = await supabase
        .from('alert_broadcasts')
        .insert([alertData]);

      if (error) throw error;

      // Simulate push notification (in real app, this would be handled by a service worker or push service)
      simulatePushNotification(formData);

      await fetchAlerts();
      setShowCreateForm(false);
      setFormData({
        title: '',
        message: '',
        priority: 'medium',
        target_audience: 'all',
        broadcast_type: 'general',
        expires_at: '',
        created_by: 'Admin',
      });

      toast({
        title: "📢 Alert Broadcast Sent",
        description: `Alert berhasil dikirim ke ${getAudienceLabel(formData.target_audience)}`,
      });

    } catch (error) {
      console.error('Error creating alert:', error);
      toast({
        title: "Error",
        description: "Gagal mengirim alert broadcast",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const simulatePushNotification = (alertData: typeof formData) => {
    // In a real application, this would integrate with a push notification service
    // For now, we'll simulate it with browser notifications
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`🚨 ${alertData.title}`, {
        body: alertData.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(`🚨 ${alertData.title}`, {
            body: alertData.message,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
          });
        }
      });
    }

    // Show toast notification as fallback
    toast({
      title: `🚨 ${alertData.title}`,
      description: alertData.message,
      duration: 5000,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '📢';
      case 'low': return 'ℹ️';
      default: return '📋';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'emergency': return '🚨';
      case 'maintenance': return '🔧';
      case 'training': return '📚';
      case 'general': return '📢';
      default: return '📋';
    }
  };

  const getAudienceLabel = (audience: string) => {
    switch (audience) {
      case 'all': return 'Semua Personel';
      case 'paramedics': return 'Paramedis';
      case 'doctors': return 'Dokter';
      case 'admin': return 'Admin';
      case 'drivers': return 'Driver';
      default: return audience;
    }
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  // Quick alert templates
  const quickAlerts = [
    {
      title: 'Emergency Drill',
      message: 'Emergency drill akan dilaksanakan dalam 30 menit. Semua personel bersiap.',
      priority: 'high' as const,
      type: 'training' as const,
      audience: 'all' as const,
    },
    {
      title: 'System Maintenance',
      message: 'Sistem akan menjalani maintenance scheduled dari 02:00 - 04:00.',
      priority: 'medium' as const,
      type: 'maintenance' as const,
      audience: 'all' as const,
    },
    {
      title: 'Critical Alert',
      message: 'Mass casualty incident reported. All available units respond immediately.',
      priority: 'critical' as const,
      type: 'emergency' as const,
      audience: 'all' as const,
    },
  ];

  const sendQuickAlert = (template: typeof quickAlerts[0]) => {
    setFormData({
      title: template.title,
      message: template.message,
      priority: template.priority,
      target_audience: template.audience,
      broadcast_type: template.type,
      expires_at: '',
      created_by: 'Admin',
    });
    setShowCreateForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Megaphone className="w-5 h-5" />
              <span>Emergency Alert Broadcast</span>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Buat Alert
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Quick Alert Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Alert Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickAlerts.map((template, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => sendQuickAlert(template)}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">{getTypeIcon(template.type)}</span>
                  <Badge className={`${getPriorityColor(template.priority)} text-white text-xs`}>
                    {template.priority}
                  </Badge>
                </div>
                <h4 className="font-semibold text-sm">{template.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{template.message}</p>
                <p className="text-xs text-blue-600 mt-2">Klik untuk gunakan template</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alert History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Alert History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 border rounded-lg ${
                  isExpired(alert.expires_at) ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{getPriorityIcon(alert.priority)}</span>
                      <Badge className={`${getPriorityColor(alert.priority)} text-white text-xs`}>
                        {alert.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getTypeIcon(alert.broadcast_type)} {alert.broadcast_type}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        {getAudienceLabel(alert.target_audience)}
                      </Badge>
                    </div>
                    
                    <h4 className="font-semibold">{alert.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                    
                    <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                      <span>
                        <Clock className="w-3 h-3 inline mr-1" />
                        {new Date(alert.created_at).toLocaleString('id-ID')}
                      </span>
                      <span>By: {alert.created_by}</span>
                      {alert.expires_at && (
                        <span className={isExpired(alert.expires_at) ? 'text-red-500' : ''}>
                          Expires: {new Date(alert.expires_at).toLocaleString('id-ID')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {isExpired(alert.expires_at) && (
                    <Badge variant="secondary" className="text-xs">
                      Expired
                    </Badge>
                  )}
                </div>
              </div>
            ))}

            {alerts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada alert yang dikirim
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Alert Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Buat Alert Broadcast
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateForm(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createAlert} className="space-y-4">
                <div>
                  <Label htmlFor="title">Judul Alert</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Judul alert yang menarik perhatian"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="message">Pesan</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="Detail pesan yang ingin disampaikan"
                    className="min-h-[80px]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Prioritas</Label>
                    <Select 
                      value={formData.priority} 
                      onValueChange={(value: any) => setFormData({...formData, priority: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">🟢 Low</SelectItem>
                        <SelectItem value="medium">🟡 Medium</SelectItem>
                        <SelectItem value="high">🟠 High</SelectItem>
                        <SelectItem value="critical">🔴 Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="broadcast_type">Jenis</Label>
                    <Select 
                      value={formData.broadcast_type} 
                      onValueChange={(value: any) => setFormData({...formData, broadcast_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="emergency">🚨 Emergency</SelectItem>
                        <SelectItem value="maintenance">🔧 Maintenance</SelectItem>
                        <SelectItem value="training">📚 Training</SelectItem>
                        <SelectItem value="general">📢 General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="target_audience">Target Audience</Label>
                  <Select 
                    value={formData.target_audience} 
                    onValueChange={(value: any) => setFormData({...formData, target_audience: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">👥 Semua Personel</SelectItem>
                      <SelectItem value="paramedics">🏥 Paramedis</SelectItem>
                      <SelectItem value="doctors">👨‍⚕️ Dokter</SelectItem>
                      <SelectItem value="drivers">🚗 Driver</SelectItem>
                      <SelectItem value="admin">👨‍💼 Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="expires_at">Waktu Kadaluarsa (Opsional)</Label>
                  <Input
                    id="expires_at"
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({...formData, expires_at: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="created_by">Dikirim Oleh</Label>
                  <Input
                    id="created_by"
                    value={formData.created_by}
                    onChange={(e) => setFormData({...formData, created_by: e.target.value})}
                    placeholder="Nama pengirim"
                    required
                  />
                </div>

                <div className="flex space-x-2">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Mengirim...' : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Kirim Alert
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EmergencyAlertBroadcast;