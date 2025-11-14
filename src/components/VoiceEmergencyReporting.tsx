import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VoiceEmergencyReportingProps {
  onReportSubmit: (text: string, type: 'trauma' | 'heart') => void;
}

const VoiceEmergencyReporting: React.FC<VoiceEmergencyReportingProps> = ({ onReportSubmit }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [emergencyType, setEmergencyType] = useState<'trauma' | 'heart'>('trauma');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "🎙️ Merekam Suara",
        description: "Mulai bicara untuk melaporkan darurat...",
      });

    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Error",
        description: "Tidak dapat mengakses mikrofon. Pastikan izin telah diberikan.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Convert audio blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const base64Audio = btoa(String.fromCharCode(...uint8Array));

      // Send to voice-to-text edge function
      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: base64Audio }
      });

      if (error) {
        throw error;
      }

      if (data?.text) {
        setTranscribedText(data.text);
        toast({
          title: "✅ Suara Dikonversi",
          description: "Teks berhasil dihasilkan dari rekaman suara",
        });
      } else {
        throw new Error('No text returned from transcription');
      }

    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Error",
        description: "Gagal memproses rekaman suara. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const submitReport = () => {
    if (transcribedText.trim()) {
      onReportSubmit(transcribedText, emergencyType);
      setTranscribedText('');
      toast({
        title: "📝 Laporan Dikirim",
        description: "Laporan darurat berhasil dikirim ke sistem",
      });
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mic className="w-5 h-5" />
          <span>Voice Emergency Reporting</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Emergency Type Selection */}
        <div className="flex space-x-4">
          <Button
            variant={emergencyType === 'trauma' ? 'default' : 'outline'}
            onClick={() => setEmergencyType('trauma')}
            className="flex-1"
          >
            🚨 Trauma
          </Button>
          <Button
            variant={emergencyType === 'heart' ? 'default' : 'outline'}
            onClick={() => setEmergencyType('heart')}
            className="flex-1"
          >
            ❤️ Jantung
          </Button>
        </div>

        {/* Voice Recording Button */}
        <div className="flex justify-center">
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`w-20 h-20 rounded-full ${
              isRecording 
                ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isRecording ? (
              <MicOff className="w-8 h-8" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          {isRecording ? 'Tekan untuk berhenti merekam' : 'Tekan & bicara untuk melaporkan darurat'}
          {isProcessing && <div className="mt-2">Memproses rekaman...</div>}
        </div>

        {/* Transcribed Text */}
        {transcribedText && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Hasil Konversi Suara:</label>
            <Textarea
              value={transcribedText}
              onChange={(e) => setTranscribedText(e.target.value)}
              placeholder="Teks dari rekaman suara akan muncul di sini..."
              className="min-h-[100px]"
            />
            <Button 
              onClick={submitReport} 
              className="w-full" 
              disabled={!transcribedText.trim()}
            >
              <Send className="w-4 h-4 mr-2" />
              Kirim Laporan Darurat
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VoiceEmergencyReporting;