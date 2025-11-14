import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, MapPin, Truck, AlertCircle } from 'lucide-react';
import { useRealtimeAmbulanceStatus } from '@/hooks/useRealtimeAmbulanceStatus';
import { useToast } from '@/hooks/use-toast';

interface StatusStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed';
  icon: React.ComponentType<any>;
  description: string;
}

interface AmbulanceStatusFlowProps {
  ambulanceId: string;
  emergencyReportId?: string;
  onStatusChange?: (status: string) => void;
}

const AmbulanceStatusFlow: React.FC<AmbulanceStatusFlowProps> = ({ 
  ambulanceId, 
  emergencyReportId,
  onStatusChange 
}) => {
  const { updateAmbulanceStatus } = useRealtimeAmbulanceStatus();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  const statusSteps: StatusStep[] = [
    {
      id: 'dispatched',
      label: 'Dikirim',
      status: 'pending',
      icon: AlertCircle,
      description: 'Ambulans sedang bersiap berangkat'
    },
    {
      id: 'en_route',
      label: 'Dalam Perjalanan',
      status: 'pending', 
      icon: Truck,
      description: 'Ambulans menuju lokasi kejadian'
    },
    {
      id: 'arrived',
      label: 'Tiba di Lokasi',
      status: 'pending',
      icon: MapPin,
      description: 'Ambulans telah sampai di lokasi'
    },
    {
      id: 'completed',
      label: 'Selesai',
      status: 'pending',
      icon: CheckCircle,
      description: 'Misi telah selesai'
    }
  ];

  const [steps, setSteps] = useState(statusSteps);

  useEffect(() => {
    // Update step status based on current step
    const updatedSteps = steps.map((step, index) => ({
      ...step,
      status: (index < currentStep ? 'completed' : index === currentStep ? 'active' : 'pending') as 'pending' | 'active' | 'completed'
    }));
    setSteps(updatedSteps);
  }, [currentStep]);

  const handleStatusUpdate = async (stepIndex: number) => {
    if (isUpdating || stepIndex !== currentStep) return;

    setIsUpdating(true);
    const step = steps[stepIndex];

    try {
      const result = await updateAmbulanceStatus(ambulanceId, step.id, emergencyReportId);
      
      if (result.success) {
        setCurrentStep(stepIndex + 1);
        onStatusChange?.(step.id);
        
        toast({
          title: "Status Diperbarui",
          description: `Status ambulans: ${step.label}`,
        });

        // Auto-progress untuk demo (bisa dihapus di produksi)
        if (stepIndex < steps.length - 1) {
          setTimeout(() => {
            setCurrentStep(stepIndex + 1);
          }, 3000); // Auto progress after 3 seconds
        }
      } else {
        toast({
          title: "Error",
          description: "Gagal memperbarui status ambulans",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error", 
        description: "Terjadi kesalahan sistem",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getProgressPercentage = () => {
    return (currentStep / steps.length) * 100;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Status Perjalanan - {ambulanceId}
        </CardTitle>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress:</span>
            <span>{currentStep}/{steps.length} tahap</span>
          </div>
          <Progress value={getProgressPercentage()} className="h-2" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.status === 'active';
            const isCompleted = step.status === 'completed';
            const isPending = step.status === 'pending';

            return (
              <div key={step.id} className="flex items-center gap-4 p-3 rounded-lg border">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full
                  ${isCompleted ? 'bg-green-100 text-green-600' : 
                    isActive ? 'bg-blue-100 text-blue-600' : 
                    'bg-gray-100 text-gray-400'}
                `}>
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{step.label}</h4>
                    <Badge variant={
                      isCompleted ? 'default' : 
                      isActive ? 'secondary' : 
                      'outline'
                    }>
                      {isCompleted ? 'Selesai' : 
                       isActive ? 'Aktif' : 
                       'Menunggu'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>

                {isActive && (
                  <Button 
                    onClick={() => handleStatusUpdate(index)}
                    disabled={isUpdating}
                    size="sm"
                  >
                    {isUpdating ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      'Konfirmasi'
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {currentStep >= steps.length && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Misi Selesai!</span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              Ambulans {ambulanceId} telah menyelesaikan tugasnya
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AmbulanceStatusFlow;