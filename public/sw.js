// Service Worker for Push Notifications
const CACHE_NAME = 'rspau-emergency-cache-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push message received:', event);

  let notificationData = {
    title: 'RSPAU Emergency Alert',
    body: 'New emergency notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'emergency-notification',
    requireInteraction: true,
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
  };

  // Parse push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        data: data.data || {},
        tag: data.tag || notificationData.tag
      };

      // Set priority styling based on notification priority
      if (data.priority === 'critical') {
        notificationData.requireInteraction = true;
        notificationData.tag = 'critical-emergency';
      }
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    notificationData
  );

  event.waitUntil(promiseChain);
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Open or focus the app window
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((clientList) => {
    // Check if app is already open
    for (let i = 0; i < clientList.length; i++) {
      const client = clientList[i];
      if (client.url.includes('lovableproject.com') && 'focus' in client) {
        return client.focus();
      }
    }

    // Open new window if app is not open
    if (clients.openWindow) {
      return clients.openWindow('/');
    }
  });

  event.waitUntil(promiseChain);
});

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);

  if (event.tag === 'emergency-report-sync') {
    event.waitUntil(syncEmergencyReports());
  }
});

// Sync emergency reports when coming back online
async function syncEmergencyReports() {
  try {
    // Get pending reports from IndexedDB or localStorage
    const pendingReports = await getPendingReports();
    
    for (const report of pendingReports) {
      try {
        // Attempt to submit pending report
        await submitEmergencyReport(report);
        
        // Remove from pending queue on success
        await removePendingReport(report.id);
      } catch (error) {
        console.error('Failed to sync report:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Helper functions for offline storage
async function getPendingReports() {
  // In a real implementation, this would read from IndexedDB
  return JSON.parse(localStorage.getItem('pendingEmergencyReports') || '[]');
}

async function submitEmergencyReport(report) {
  // Submit to Supabase API
  const response = await fetch('/api/emergency-reports', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(report)
  });

  if (!response.ok) {
    throw new Error('Failed to submit report');
  }

  return response.json();
}

async function removePendingReport(reportId) {
  const pending = await getPendingReports();
  const filtered = pending.filter(report => report.id !== reportId);
  localStorage.setItem('pendingEmergencyReports', JSON.stringify(filtered));
}

// Cache static assets
self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;

  // Skip caching for API requests
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached version if available
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise fetch from network
      return fetch(event.request).then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        
        return response;
      });
    })
  );
});
