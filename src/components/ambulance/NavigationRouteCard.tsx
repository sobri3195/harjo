import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigation } from 'lucide-react';
import { formatDistance, formatTravelTime } from '@/utils/distanceCalculator';

interface RouteSegment {
  id: string;
  from: { lat: number; lng: number; name: string };
  to: { lat: number; lng: number; name: string };
  coordinates: Array<[number, number]>;
  distance: number;
  duration: number;
  instructions: Array<{
    text: string;
    distance: number;
    duration: number;
  }>;
}

interface NavigationRouteCardProps {
  segment: RouteSegment;
  index: number;
  currentStep: number;
  navigationActive: boolean;
  onOpenExternalNavigation: (segment: RouteSegment) => void;
  onNextStep?: () => void;
}

export const NavigationRouteCard: React.FC<NavigationRouteCardProps> = ({
  segment,
  index,
  currentStep,
  navigationActive,
  onOpenExternalNavigation,
  onNextStep
}) => {
  return (
    <Card className={`${
      index === currentStep && navigationActive ? 'border-blue-500 bg-blue-50' : ''
    } ${index < currentStep ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
              index === currentStep && navigationActive ? 'bg-blue-500' :
              index < currentStep ? 'bg-green-500' : 'bg-gray-400'
            }`}>
              {index + 1}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">
                {index === 0 ? '📍 Menuju Lokasi Darurat' : '🏥 Menuju RSPAU'}
              </h4>
              <p className="text-sm text-gray-600">
                {segment.from.name} → {segment.to.name}
              </p>
            </div>
          </div>
          {index === currentStep && navigationActive && (
            <Badge variant="default">AKTIF</Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm mb-3">
          <div>
            <p className="text-gray-500">Jarak</p>
            <p className="font-medium">{formatDistance(segment.distance)}</p>
          </div>
          <div>
            <p className="text-gray-500">Waktu</p>
            <p className="font-medium">{formatTravelTime(segment.duration)}</p>
          </div>
          <div>
            <p className="text-gray-500">Status</p>
            <p className="font-medium">
              {index < currentStep ? '✅ Selesai' :
               index === currentStep && navigationActive ? '🚑 Aktif' : '⏳ Menunggu'}
            </p>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={() => onOpenExternalNavigation(segment)}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Navigation className="w-4 h-4 mr-1" />
            Google Maps
          </Button>
          {index === currentStep && navigationActive && onNextStep && (
            <Button
              onClick={onNextStep}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              {index === 0 ? '📍 Tiba di Lokasi' : '🏥 Tiba di RS'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};