import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, MapPin, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  type: 'hospital' | 'police' | 'fire_department' | 'other';
  address?: string;
  is_active: boolean;
}

const EmergencyContactSpeedDial: React.FC = () => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('is_active', true)
        .order('type', { ascending: true });

      if (error) throw error;
      setContacts(data as EmergencyContact[] || []);
    } catch (error) {
      console.error('Error fetching emergency contacts:', error);
      toast({
        title: "Error",
        description: "Gagal memuat kontak darurat",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const makeCall = (phone: string, name: string) => {
    // Create tel: link for mobile devices
    const telLink = `tel:${phone}`;
    window.open(telLink, '_self');
    
    toast({
      title: "📞 Menghubungi",
      description: `Menghubungi ${name}...`,
    });
  };

  const getContactIcon = (type: string) => {
    switch (type) {
      case 'hospital':
        return '🏥';
      case 'police':
        return '👮‍♂️';
      case 'fire_department':
        return '🚒';
      default:
        return '📞';
    }
  };

  const getContactColor = (type: string) => {
    switch (type) {
      case 'hospital':
        return 'bg-green-600 hover:bg-green-700';
      case 'police':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'fire_department':
        return 'bg-red-600 hover:bg-red-700';
      default:
        return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Emergency Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Memuat kontak darurat...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Phone className="w-5 h-5" />
          <span>Emergency Contacts</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
          >
            <div className="flex items-center space-x-3 flex-1">
              <div className="text-2xl">
                {getContactIcon(contact.type)}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{contact.name}</h3>
                <p className="text-xs text-muted-foreground">{contact.phone}</p>
                {contact.address && (
                  <div className="flex items-center space-x-1 mt-1">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground truncate">
                      {contact.address}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <Button
              onClick={() => makeCall(contact.phone, contact.name)}
              className={`${getContactColor(contact.type)} text-white p-2 h-auto`}
              size="sm"
            >
              <Phone className="w-4 h-4" />
            </Button>
          </div>
        ))}

        {contacts.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            Tidak ada kontak darurat yang tersedia
          </div>
        )}

        {/* Emergency Numbers Quick Access */}
        <div className="border-t pt-3 mt-3">
          <h4 className="font-semibold text-sm mb-2">Nomor Darurat Nasional</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => makeCall('112', 'Call Center Nasional')}
              className="bg-red-600 hover:bg-red-700 text-white text-xs"
              size="sm"
            >
              🆘 112 - Darurat
            </Button>
            <Button
              onClick={() => makeCall('118', 'Ambulans')}
              className="bg-green-600 hover:bg-green-700 text-white text-xs"
              size="sm"
            >
              🚑 118 - Ambulans
            </Button>
            <Button
              onClick={() => makeCall('110', 'Polisi')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
              size="sm"
            >
              👮‍♂️ 110 - Polisi
            </Button>
            <Button
              onClick={() => makeCall('113', 'Pemadam Kebakaran')}
              className="bg-orange-600 hover:bg-orange-700 text-white text-xs"
              size="sm"
            >
              🚒 113 - Damkar
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          <Clock className="w-3 h-3 inline mr-1" />
          Layanan 24/7 - Tekan tombol untuk menghubungi langsung
        </div>
      </CardContent>
    </Card>
  );
};

export default EmergencyContactSpeedDial;