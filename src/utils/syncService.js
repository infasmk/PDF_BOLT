/**
 * PDFBolt Global Synchronization Service
 * Keeps tool availability and push announcements synchronized across all users worldwide
 */

const SYNC_ENDPOINT = '/api/sync';

export async function fetchGlobalConfig() {
  try {
    const res = await fetch(SYNC_ENDPOINT, { method: 'GET', headers: { 'Accept': 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      if (data && data.config) {
        // Cache in localStorage
        try {
          if (data.config.toolStatuses) {
            localStorage.setItem('pdfbolt_tool_status', JSON.stringify(data.config.toolStatuses));
          }
          if (data.config.notification) {
            localStorage.setItem('pdfbolt_global_notification', JSON.stringify(data.config.notification));
          }
        } catch (e) {}
        return data.config;
      }
    }
  } catch (err) {
    // Expected in standalone local dev if serverless API isn't served locally
  }

  // Fallback to cached localStorage
  try {
    const cachedTools = JSON.parse(localStorage.getItem('pdfbolt_tool_status') || '{}');
    const cachedNotification = JSON.parse(localStorage.getItem('pdfbolt_global_notification') || 'null');
    return {
      toolStatuses: cachedTools,
      notification: cachedNotification || {
        enabled: false,
        type: 'announcement',
        title: '⚡ PDFBolt Notification',
        message: 'No active notifications at this time.',
        linkText: 'Learn More',
        linkUrl: '',
        openInNewTab: true
      }
    };
  } catch (e) {
    return { toolStatuses: {}, notification: { enabled: false } };
  }
}

export async function saveGlobalConfig({ toolStatuses, notification }) {
  // Always update local storage first
  try {
    if (toolStatuses !== undefined) {
      localStorage.setItem('pdfbolt_tool_status', JSON.stringify(toolStatuses));
    }
    if (notification !== undefined) {
      localStorage.setItem('pdfbolt_global_notification', JSON.stringify(notification));
    }
  } catch (e) {}

  // Attempt to sync to Vercel Serverless API
  const adminKey = import.meta.env.VITE_ADMIN_PASSWORD || 'webbits2026';
  try {
    const res = await fetch(SYNC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey
      },
      body: JSON.stringify({ toolStatuses, notification })
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, config: data.config, synced: true };
    }
  } catch (err) {
    // Offline or serverless endpoint not active locally
  }

  return { 
    success: true, 
    config: { toolStatuses, notification }, 
    synced: false, 
    notice: 'Saved locally. Deployed Vercel API will sync globally across all users.' 
  };
}

export function subscribeGlobalConfig(onUpdate, intervalMs = 40000) {
  // Initial fetch
  fetchGlobalConfig().then(cfg => {
    if (cfg && onUpdate) onUpdate(cfg);
  });

  // Polling interval
  const intervalId = setInterval(() => {
    fetchGlobalConfig().then(cfg => {
      if (cfg && onUpdate) onUpdate(cfg);
    });
  }, intervalMs);

  return () => clearInterval(intervalId);
}
