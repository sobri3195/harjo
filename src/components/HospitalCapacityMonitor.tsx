import React from 'react';
import { Building2, Bed, Heart, AlertTriangle, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useHospitalCapacity } from '@/hooks/useHospitalCapacity';

interface HospitalCapacityMonitorProps {
  showMap?: boolean;
  maxItems?: number;
}

export const HospitalCapacityMonitor: React.FC<HospitalCapacityMonitorProps> = ({
  showMap = false,
  maxItems = 5
}) => {
  const { hospitals, loading, getOccupancyRate, getCapacityStatus } = useHospitalCapacity();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 size={20} />
            Hospital Capacity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical': return <AlertTriangle size={14} className="text-red-600" />;
      case 'high': return <AlertTriangle size={14} className="text-orange-600" />;
      case 'moderate': return <Heart size={14} className="text-yellow-600" />;
      default: return <Bed size={14} className="text-green-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'critical': return 'Critical';
      case 'high': return 'High';
      case 'moderate': return 'Moderate';
      default: return 'Available';
    }
  };

  const displayHospitals = hospitals.slice(0, maxItems);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 size={20} />
          Hospital Capacity Monitor
        </CardTitle>
        <CardDescription>
          Real-time bed availability and capacity status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayHospitals.map((hospital) => {
            const occupancyRate = getOccupancyRate(hospital);
            const status = getCapacityStatus(hospital);
            const totalBeds = hospital.emergency_beds_total + hospital.icu_beds_total;
            const availableBeds = hospital.emergency_beds_available + hospital.icu_beds_available;

            return (
              <div key={hospital.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {hospital.hospital_name}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPin size={12} />
                      {hospital.hospital_address}
                    </p>
                  </div>
                  <Badge className={`${getStatusColor(status)} flex items-center gap-1`}>
                    {getStatusIcon(status)}
                    {getStatusText(status)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Emergency Beds</p>
                    <p className="text-gray-600">
                      {hospital.emergency_beds_available}/{hospital.emergency_beds_total} available
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">ICU Beds</p>
                    <p className="text-gray-600">
                      {hospital.icu_beds_available}/{hospital.icu_beds_total} available
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Occupancy Rate</span>
                    <span className="text-gray-600">{occupancyRate.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={occupancyRate} 
                    className={`h-2 ${
                      occupancyRate >= 90 ? 'bg-red-100' :
                      occupancyRate >= 75 ? 'bg-orange-100' :
                      occupancyRate >= 50 ? 'bg-yellow-100' :
                      'bg-green-100'
                    }`}
                  />
                </div>

                <div className="flex flex-wrap gap-1 pt-2">
                  {hospital.trauma_capacity && (
                    <Badge variant="outline" className="text-xs">Trauma</Badge>
                  )}
                  {hospital.cardiac_capacity && (
                    <Badge variant="outline" className="text-xs">Cardiac</Badge>
                  )}
                  {hospital.stroke_capacity && (
                    <Badge variant="outline" className="text-xs">Stroke</Badge>
                  )}
                  {hospital.pediatric_capacity && (
                    <Badge variant="outline" className="text-xs">Pediatric</Badge>
                  )}
                </div>

                <div className="text-xs text-gray-500">
                  Last updated: {new Date(hospital.last_updated).toLocaleString('id-ID')}
                </div>
              </div>
            );
          })}

          {hospitals.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Building2 size={48} className="mx-auto mb-4 opacity-50" />
              <p>No hospital data available</p>
            </div>
          )}

          {hospitals.length > maxItems && (
            <div className="text-center pt-4">
              <p className="text-sm text-gray-500">
                Showing {maxItems} of {hospitals.length} hospitals
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};