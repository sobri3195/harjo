import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface NotificationPayload {
  token?: string;
  tokens?: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
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

  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    // Get Firebase server key from environment
    const firebaseServerKey = Deno.env.get('FIREBASE_SERVER_KEY');
    if (!firebaseServerKey) {
      console.error('FIREBASE_SERVER_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Firebase server key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const payload: NotificationPayload = await req.json();
    console.log('Sending Firebase notification:', payload);

    // Validate required fields
    if (!payload.title || !payload.body) {
      return new Response(
        JSON.stringify({ error: 'Title and body are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!payload.token && !payload.tokens) {
      return new Response(
        JSON.stringify({ error: 'Either token or tokens array is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Prepare FCM message
    const fcmMessage: any = {
      notification: {
        title: payload.title,
        body: payload.body,
        ...(payload.imageUrl && { image: payload.imageUrl })
      },
      data: {
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        ...payload.data
      },
      webpush: {
        notification: {
          title: payload.title,
          body: payload.body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          requireInteraction: payload.data?.severity === 'critical',
          tag: 'emergency-notification',
          ...(payload.imageUrl && { image: payload.imageUrl }),
          actions: [
            {
              action: 'view',
              title: 'View Details'
            },
            {
              action: 'dismiss', 
              title: 'Dismiss'
            }
          ]
        },
        fcm_options: {
          link: '/'
        }
      }
    };

    // Send to single token or multiple tokens
    let fcmPayload;
    if (payload.token) {
      fcmPayload = {
        to: payload.token,
        ...fcmMessage
      };
    } else if (payload.tokens && payload.tokens.length > 0) {
      fcmPayload = {
        registration_ids: payload.tokens,
        ...fcmMessage
      };
    }

    // Send notification via FCM
    const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${firebaseServerKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(fcmPayload)
    });

    const fcmResult = await fcmResponse.json();
    console.log('FCM Response:', fcmResult);

    if (!fcmResponse.ok) {
      console.error('FCM Error:', fcmResult);
      return new Response(
        JSON.stringify({ error: 'Failed to send notification', details: fcmResult }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check for failures in batch sending
    if (fcmResult.failure && fcmResult.failure > 0) {
      console.warn('Some notifications failed:', fcmResult);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: fcmResult.success || 1,
        failed: fcmResult.failure || 0,
        results: fcmResult.results || []
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in send-firebase-notification function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});