/**
 * PDFBolt Global Synchronization Service
 * Synchronizes tool availability, announcements, and cross-device visitor analytics worldwide.
 */

const SYNC_ENDPOINT = '/api/sync';

/**
 * Fetch global configuration and analytics from the serverless backend
 */
export async function fetchGlobalData() {
  try {
    const res = await fetch(SYNC_ENDPOINT, { 
      method: 'GET', 
      headers: { 'Accept': 'application/json' } 
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        // Cache configuration
        if (data.config) {
          try {
            if (data.config.toolStatuses) {
              localStorage.setItem('pdfbolt_tool_status', JSON.stringify(data.config.toolStatuses));
            }
            if (data.config.notification) {
              localStorage.setItem('pdfbolt_global_notification', JSON.stringify(data.config.notification));
            }
          } catch (e) {}
        }
        // Cache analytics
        if (data.analytics) {
          try {
            if (data.analytics.visits !== undefined) {
              localStorage.setItem('pdfbolt_analytics_visits', data.analytics.visits.toString());
            }
            if (data.analytics.processed !== undefined) {
              localStorage.setItem('pdfbolt_analytics_processed', data.analytics.processed.toString());
            }
            if (data.analytics.toolsUsage) {
              localStorage.setItem('pdfbolt_analytics_tools_usage', JSON.stringify(data.analytics.toolsUsage));
            }
          } catch (e) {}
        }
        return {
          config: data.config,
          analytics: data.analytics
        };
      }
    }
  } catch (err) {
    // Expected in standalone local dev if serverless API isn't running locally
  }

  // Fallback to cached localStorage
  try {
    const cachedTools = JSON.parse(localStorage.getItem('pdfbolt_tool_status') || '{}');
    const cachedNotification = JSON.parse(localStorage.getItem('pdfbolt_global_notification') || 'null');
    const cachedVisits = parseInt(localStorage.getItem('pdfbolt_analytics_visits') || '1', 10);
    const cachedProcessed = parseInt(localStorage.getItem('pdfbolt_analytics_processed') || '0', 10);
    const cachedUsage = JSON.parse(localStorage.getItem('pdfbolt_analytics_tools_usage') || '{}');

    return {
      config: {
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
      },
      analytics: {
        visits: cachedVisits,
        processed: cachedProcessed,
        toolsUsage: cachedUsage
      }
    };
  } catch (e) {
    return {
      config: { toolStatuses: {}, notification: { enabled: false } },
      analytics: { visits: 1, processed: 0, toolsUsage: {} }
    };
  }
}

/**
 * Backwards-compatible helper for fetching config only
 */
export async function fetchGlobalConfig() {
  const data = await fetchGlobalData();
  return data.config;
}

/**
 * Record a visit session from any device (phone, tablet, computer) globally
 */
export async function recordGlobalVisit() {
  // Check if this browser session was already counted
  try {
    if (sessionStorage.getItem('pdfbolt_visited_session')) {
      return;
    }
    sessionStorage.setItem('pdfbolt_visited_session', 'true');
  } catch (e) {}

  // Update local fallback immediately
  try {
    const current = parseInt(localStorage.getItem('pdfbolt_analytics_visits') || '0', 10);
    localStorage.setItem('pdfbolt_analytics_visits', (current + 1).toString());
  } catch (e) {}

  // Sync with global serverless API
  try {
    const res = await fetch(SYNC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'track_visit' })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.visits) {
        localStorage.setItem('pdfbolt_analytics_visits', data.visits.toString());
        return data.visits;
      }
    }
  } catch (err) {
    // Network error or local dev
  }
}

/**
 * Record a completed tool processing action globally across all devices
 */
export async function recordGlobalProcess(toolId = 'general') {
  // Update local storage first
  try {
    const pCount = parseInt(localStorage.getItem('pdfbolt_analytics_processed') || '0', 10);
    localStorage.setItem('pdfbolt_analytics_processed', (pCount + 1).toString());
    const usage = JSON.parse(localStorage.getItem('pdfbolt_analytics_tools_usage') || '{}');
    usage[toolId] = (usage[toolId] || 0) + 1;
    localStorage.setItem('pdfbolt_analytics_tools_usage', JSON.stringify(usage));
  } catch (e) {}

  // Sync to backend
  try {
    const res = await fetch(SYNC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'track_process', toolId })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.processed) {
        localStorage.setItem('pdfbolt_analytics_processed', data.processed.toString());
      }
      if (data && data.toolsUsage) {
        localStorage.setItem('pdfbolt_analytics_tools_usage', JSON.stringify(data.toolsUsage));
      }
      return data;
    }
  } catch (err) {
    // Standalone fallback
  }
}

/**
 * Verify admin password securely via serverless backend
 */
export async function verifyAdminLogin(password) {
  const trimmed = (password || '').trim();
  if (!trimmed) {
    return { success: false, error: 'Password cannot be empty.' };
  }

  try {
    const res = await fetch(SYNC_ENDPOINT, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-admin-key': trimmed
      },
      body: JSON.stringify({ action: 'login', adminKey: trimmed })
    });

    if (res.status === 401) {
      return { success: false, error: 'Invalid master password. Access denied.' };
    }

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        try {
          sessionStorage.setItem('pdfbolt_admin_key', trimmed);
          sessionStorage.setItem('pdfbolt_admin_session', 'true');
        } catch (e) {}
        return { 
          success: true, 
          config: data.config, 
          analytics: data.analytics 
        };
      }
    }
  } catch (err) {
    // Network offline or running on plain Vite dev without serverless backend
  }

  // Fallback for local Vite dev environment
  const localMasterPassword = (import.meta.env.VITE_ADMIN_PASSWORD || 'webbits2026').trim();
  if (trimmed === localMasterPassword) {
    try {
      sessionStorage.setItem('pdfbolt_admin_key', trimmed);
      sessionStorage.setItem('pdfbolt_admin_session', 'true');
    } catch (e) {}
    return { success: true, localFallback: true };
  }

  return { success: false, error: 'Invalid master password. Access denied.' };
}

/**
 * Save tool enablement and announcements globally across all users
 */
export async function saveGlobalConfig({ toolStatuses, notification }) {
  // Cache in local storage
  try {
    if (toolStatuses !== undefined) {
      localStorage.setItem('pdfbolt_tool_status', JSON.stringify(toolStatuses));
    }
    if (notification !== undefined) {
      localStorage.setItem('pdfbolt_global_notification', JSON.stringify(notification));
    }
  } catch (e) {}

  const adminKey = (sessionStorage.getItem('pdfbolt_admin_key') || import.meta.env.VITE_ADMIN_PASSWORD || 'webbits2026').trim();

  try {
    const res = await fetch(SYNC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey
      },
      body: JSON.stringify({ 
        action: 'update_config',
        adminKey,
        toolStatuses, 
        notification 
      })
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
    notice: 'Saved locally. Connected Vercel API will sync globally across all users.' 
  };
}

/**
 * Reset all analytics globally from the admin panel
 */
export async function resetGlobalAnalytics() {
  try {
    localStorage.setItem('pdfbolt_analytics_visits', '1');
    localStorage.setItem('pdfbolt_analytics_processed', '0');
    localStorage.setItem('pdfbolt_analytics_tools_usage', JSON.stringify({}));
  } catch (e) {}

  const adminKey = (sessionStorage.getItem('pdfbolt_admin_key') || import.meta.env.VITE_ADMIN_PASSWORD || 'webbits2026').trim();

  try {
    const res = await fetch(SYNC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey
      },
      body: JSON.stringify({ action: 'reset_analytics', adminKey })
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, analytics: data.analytics };
    }
  } catch (err) {}

  return { 
    success: true, 
    analytics: { visits: 1, processed: 0, toolsUsage: {} } 
  };
}

/**
 * Poll global configuration and analytics updates periodically
 */
export function subscribeGlobalConfig(onUpdate, intervalMs = 30000) {
  // Initial fetch
  fetchGlobalData().then(data => {
    if (data && onUpdate) onUpdate(data);
  });

  // Polling interval
  const intervalId = setInterval(() => {
    fetchGlobalData().then(data => {
      if (data && onUpdate) onUpdate(data);
    });
  }, intervalMs);

  return () => clearInterval(intervalId);
}
