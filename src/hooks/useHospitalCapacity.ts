import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from './use-toast';

export interface Hospital {
  id: string;
  hospital_name: string;
  hospital_address: string;
  latitude: number;
  longitude: number;
  emergency_beds_total: number;
  emergency_beds_available: number;
  icu_beds_total: number;
  icu_beds_available: number;
  trauma_capacity: boolean;
  cardiac_capacity: boolean;
  stroke_capacity: boolean;
  pediatric_capacity: boolean;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

export const useHospitalCapacity = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculate occupancy rate
  const getOccupancyRate = (hospital: Hospital) => {
    const totalBeds = hospital.emergency_beds_total + hospital.icu_beds_total;
    const availableBeds = hospital.emergency_beds_available + hospital.icu_beds_available;
    const occupiedBeds = totalBeds - availableBeds;
    return totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;
  };

  // Get capacity status
  const getCapacityStatus = (hospital: Hospital) => {
    const rate = getOccupancyRate(hospital);
    if (rate >= 90) return 'critical';
    if (rate >= 75) return 'high';
    if (rate >= 50) return 'moderate';
    return 'low';
  };

  // Find best hospital for emergency type
  const findBestHospital = (
    emergencyType: 'trauma' | 'heart' | 'stroke' | 'pediatric',
    patientLocation: { lat: number; lng: number }
  ) => {
    const suitableHospitals = hospitals.filter(hospital => {
      switch (emergencyType) {
        case 'trauma':
          return hospital.trauma_capacity && hospital.emergency_beds_available > 0;
        case 'heart':
          return hospital.cardiac_capacity && (hospital.icu_beds_available > 0 || hospital.emergency_beds_available > 0);
        case 'stroke':
          return hospital.stroke_capacity && hospital.icu_beds_available > 0;
        case 'pediatric':
          return hospital.pediatric_capacity && hospital.emergency_beds_available > 0;
        default:
          return hospital.emergency_beds_available > 0;
      }
    });

    if (suitableHospitals.length === 0) return null;

    // Calculate distance and find closest available hospital
    const hospitalsWithDistance = suitableHospitals.map(hospital => {
      const distance = calculateDistance(
        patientLocation.lat,
        patientLocation.lng,
        hospital.latitude,
        hospital.longitude
      );
      
      return {
        ...hospital,
        distance,
        capacityScore: getCapacityScore(hospital)
      };
    });

    // Sort by combined score (distance + capacity)
    hospitalsWithDistance.sort((a, b) => {
      const scoreA = a.distance * 0.7 + (100 - a.capacityScore) * 0.3;
      const scoreB = b.distance * 0.7 + (100 - b.capacityScore) * 0.3;
      return scoreA - scoreB;
    });

    return hospitalsWithDistance[0];
  };

  // Calculate capacity score (0-100, higher is better)
  const getCapacityScore = (hospital: Hospital) => {
    const totalBeds = hospital.emergency_beds_total + hospital.icu_beds_total;
    const availableBeds = hospital.emergency_beds_available + hospital.icu_beds_available;
    
    if (totalBeds === 0) return 0;
    return (availableBeds / totalBeds) * 100;
  };

  // Fetch hospitals data
  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hospital_capacity')
        .select('*')
        .order('hospital_name');

      if (error) throw error;
      setHospitals(data || []);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      toast({
        title: "Error",
        description: "Failed to load hospital data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Update hospital capacity
  const updateHospitalCapacity = async (
    hospitalId: string,
    updates: Partial<Pick<Hospital, 'emergency_beds_available' | 'icu_beds_available'>>
  ) => {
    try {
      const { error } = await supabase
        .from('hospital_capacity')
        .update({
          ...updates,
          last_updated: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', hospitalId);

      if (error) throw error;

      toast({
        title: "✅ Updated",
        description: "Hospital capacity updated successfully",
      });
    } catch (error) {
      console.error('Error updating hospital capacity:', error);
      toast({
        title: "Error",
        description: "Failed to update hospital capacity",
        variant: "destructive"
      });
    }
  };

  // Setup real-time subscription
  useEffect(() => {
    fetchHospitals();

    const channel = supabase
      .channel('hospital_capacity_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hospital_capacity'
        },
        (payload) => {
          console.log('Hospital capacity change:', payload);
          
          if (payload.eventType === 'UPDATE') {
            const updatedHospital = payload.new as Hospital;
            setHospitals(prev => 
              prev.map(hospital => 
                hospital.id === updatedHospital.id ? updatedHospital : hospital
              )
            );

            // Show notification for critical capacity changes
            const capacityRate = getOccupancyRate(updatedHospital);
            if (capacityRate >= 90) {
              toast({
                title: "🚨 Critical Capacity",
                description: `${updatedHospital.hospital_name} is at ${capacityRate.toFixed(1)}% capacity`,
                variant: "destructive"
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    hospitals,
    loading,
    getOccupancyRate,
    getCapacityStatus,
    findBestHospital,
    updateHospitalCapacity,
    refetch: fetchHospitals
  };
};

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}