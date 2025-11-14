
import { useState, useEffect } from 'react';
import { useEmergencyReports } from './useEmergencyReports';
import { toast } from './use-toast';

export interface EmergencyCall {
  id: string;
  reportId: string;
  status: 'diterima' | 'dalam_perjalanan' | 'tiba_di_lokasi' | 'selesai';
  ambulanceId: string;
  teamMembers: string[];
  estimatedArrival?: string;
  actualArrival?: string;
  completedAt?: string;
  notes?: string;
  location: {
    lat?: number;
    lng?: number;
    address: string;
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
}

export const useEmergencyCallSystem = () => {
  const { reports } = useEmergencyReports();
  const [emergencyCalls, setEmergencyCalls] = useState<EmergencyCall[]>([]);
  const [activeCall, setActiveCall] = useState<EmergencyCall | null>(null);

  useEffect(() => {
    // Load existing calls from localStorage
    const savedCalls = localStorage.getItem('emergency_calls');
    if (savedCalls) {
      setEmergencyCalls(JSON.parse(savedCalls));
    }
  }, []);

  useEffect(() => {
    // Auto-create emergency calls from new reports
    reports.forEach(report => {
      const existingCall = emergencyCalls.find(call => call.reportId === report.id);
      if (!existingCall && report.status === 'pending') {
        createEmergencyCall(report.id);
      }
    });
  }, [reports]);

  const createEmergencyCall = (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    const priority = report.severity === 'berat' ? 'critical' 
                   : report.severity === 'sedang' ? 'high' 
                   : 'medium';

    const newCall: EmergencyCall = {
      id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reportId,
      status: 'diterima',
      ambulanceId: 'AMB-001',
      teamMembers: ['dr. Ahmad Syahroni', 'Perawat Sari', 'Paramedis Budi'],
      location: {
        address: report.location,
      },
      priority,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedCalls = [...emergencyCalls, newCall];
    setEmergencyCalls(updatedCalls);
    localStorage.setItem('emergency_calls', JSON.stringify(updatedCalls));

    toast({
      title: "🚨 Emergency Call Activated",
      description: `Tim ambulans telah diberitahu dan sedang bersiap untuk ${report.type} emergency.`,
    });

    return newCall;
  };

  const updateCallStatus = (callId: string, status: EmergencyCall['status'], notes?: string, location?: {lat: number, lng: number}) => {
    const updatedCalls = emergencyCalls.map(call => {
      if (call.id === callId) {
        const updatedCall = {
          ...call,
          status,
          notes,
          updated_at: new Date().toISOString(),
        };

        // Enhanced arrival validation
        if (status === 'tiba_di_lokasi') {
          updatedCall.actualArrival = new Date().toISOString();
          
          // Add location validation if provided
          if (location && call.location.lat && call.location.lng) {
            const distance = calculateDistance(
              location.lat, location.lng,
              call.location.lat, call.location.lng
            );
            
            // Auto-validate if within 100m radius
            if (distance <= 0.1) { // 0.1km = 100m
              updatedCall.notes = `${notes || ''} ✓ Lokasi tervalidasi (${Math.round(distance * 1000)}m dari target)`.trim();
            } else {
              updatedCall.notes = `${notes || ''} ⚠️ Jarak ${Math.round(distance * 1000)}m dari target lokasi`.trim();
            }
          }
        }
        
        if (status === 'selesai') {
          updatedCall.completedAt = new Date().toISOString();
        }

        return updatedCall;
      }
      return call;
    });

    // Helper function for distance calculation
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Earth radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    setEmergencyCalls(updatedCalls);
    localStorage.setItem('emergency_calls', JSON.stringify(updatedCalls));

    const statusMessages = {
      'diterima': '✅ Panggilan diterima tim medis',
      'dalam_perjalanan': '🚑 Ambulans dalam perjalanan',
      'tiba_di_lokasi': '📍 Tim medis telah tiba di lokasi',
      'selesai': '✅ Panggilan darurat selesai ditangani'
    };

    toast({
      title: "Status Update",
      description: statusMessages[status],
    });
  };

  const setActiveEmergencyCall = (callId: string) => {
    const call = emergencyCalls.find(c => c.id === callId);
    setActiveCall(call || null);
  };

  const getCallsByStatus = (status: EmergencyCall['status']) => {
    return emergencyCalls.filter(call => call.status === status);
  };

  const getCriticalCalls = () => {
    return emergencyCalls.filter(call => call.priority === 'critical' && call.status !== 'selesai');
  };

  return {
    emergencyCalls,
    activeCall,
    createEmergencyCall,
    updateCallStatus,
    setActiveEmergencyCall,
    getCallsByStatus,
    getCriticalCalls,
  };
};
