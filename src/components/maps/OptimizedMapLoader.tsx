import React, { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load map components for better performance
const LeafletMap = lazy(() => import('./LeafletMap'));
const RealTimeAmbulanceMap = lazy(() => import('./RealTimeAmbulanceMap').then(module => ({ default: module.RealTimeAmbulanceMap })));
const SimpleAmbulanceMap = lazy(() => import('./SimpleAmbulanceMap').then(module => ({ default: module.SimpleAmbulanceMap })));

interface OptimizedMapLoaderProps {
  mapType: 'leaflet' | 'realtime' | 'simple';
  className?: string;
  [key: string]: any;
}

const MapSkeleton = ({ className }: { className?: string }) => (
  <div className={`w-full h-full relative ${className}`}>
    <Skeleton className="w-full h-full rounded-lg" />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  </div>
);

const OptimizedMapLoader: React.FC<OptimizedMapLoaderProps> = ({
  mapType,
  className,
  ...props
}) => {
  const renderMap = () => {
    switch (mapType) {
      case 'leaflet':
        return <LeafletMap {...props} />;
      case 'realtime':
        return <RealTimeAmbulanceMap {...props} />;
      case 'simple':
        return <SimpleAmbulanceMap {...props} />;
      default:
        return <SimpleAmbulanceMap {...props} />;
    }
  };

  return (
    <div className={className}>
      <Suspense fallback={<MapSkeleton className="h-[400px]" />}>
        {renderMap()}
      </Suspense>
    </div>
  );
};

export default OptimizedMapLoader;