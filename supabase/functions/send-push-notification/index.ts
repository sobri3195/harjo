import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface NotificationPayload {
  title: string;
  body: string;
  data?: any;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  target_user_id?: string;
  target_role?: string;
  emergency_type?: 'trauma' | 'heart' | 'ambulance' | 'admin';
  report_id?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: NotificationPayload = await req.json();
    console.log('Received notification payload:', payload);

    // Validate payload
    if (!payload.title || !payload.body) {
      return new Response(JSON.stringify({ error: 'Missing required fields: title, body' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Store notification in queue first
    const { data: queueEntry, error: queueError } = await supabase
      .from('notification_queue')
      .insert({
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
        target_user_id: payload.target_user_id,
        target_role: payload.target_role,
        priority: payload.priority || 'normal',
        status: 'pending'
      })
      .select()
      .single();

    if (queueError) {
      console.error('Error storing notification in queue:', queueError);
      return new Response(JSON.stringify({ error: 'Failed to queue notification' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Prepare notification data for Capacitor
    const notificationData = {
      title: payload.title,
      body: payload.body,
      data: {
        ...payload.data,
        emergency_type: payload.emergency_type,
        report_id: payload.report_id,
        priority: payload.priority || 'normal'
      },
      priority: payload.priority || 'normal',
      requireInteraction: payload.priority === 'critical'
    };

    // Update queue status to sent
    await supabase
      .from('notification_queue')
      .update({ 
        status: 'sent', 
        sent_at: new Date().toISOString() 
      })
      .eq('id', queueEntry.id);

    console.log('Notification processed successfully:', {
      id: queueEntry.id,
      title: payload.title,
      emergency_type: payload.emergency_type
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Notification sent successfully',
      notification_id: queueEntry.id,
      data: notificationData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Push notification error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});