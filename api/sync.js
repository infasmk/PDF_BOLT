// Vercel Serverless API Route: /api/sync
// Synchronizes Tool Statuses, Announcements, and Global Multi-Device Visitor Analytics

let inMemoryData = {
  config: {
    toolStatuses: {},
    notification: {
      enabled: false,
      type: 'announcement',
      title: '⚡ Welcome to PDFBolt 2.0!',
      message: 'All 24 tools are 100% free with zero file size limits and client-side privacy.',
      linkText: 'Explore Tools',
      linkUrl: 'https://github.com',
      openInNewTab: true,
      updatedAt: new Date().toISOString()
    },
    updatedAt: new Date().toISOString()
  },
  analytics: {
    visits: 1,
    processed: 0,
    toolsUsage: {},
    lastUpdated: new Date().toISOString()
  }
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-admin-key'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  // Helper to read from persistent KV/Redis store
  const readKV = async () => {
    if (!kvUrl || !kvToken) return null;
    try {
      const kvRes = await fetch(`${kvUrl}/get/pdfbolt_global_data`, {
        headers: { Authorization: `Bearer ${kvToken}` }
      });
      if (kvRes.ok) {
        const data = await kvRes.json();
        if (data && data.result) {
          return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
        }
      }
    } catch (e) {
      console.warn('KV read failed, using memory', e);
    }
    return null;
  };

  // Helper to persist to KV/Redis store
  const saveKV = async (data) => {
    if (!kvUrl || !kvToken) return;
    try {
      await fetch(`${kvUrl}/set/pdfbolt_global_data`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kvToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
    } catch (e) {
      console.warn('KV write error', e);
    }
  };

  // GET: Return current global configuration and analytics
  if (req.method === 'GET') {
    const kvData = await readKV();
    if (kvData) {
      inMemoryData = {
        config: kvData.config || inMemoryData.config,
        analytics: kvData.analytics || inMemoryData.analytics
      };
      return res.status(200).json({ success: true, config: inMemoryData.config, analytics: inMemoryData.analytics, source: 'kv' });
    }

    return res.status(200).json({ success: true, config: inMemoryData.config, analytics: inMemoryData.analytics, source: 'memory' });
  }

  // POST: Actions Router
  if (req.method === 'POST') {
    // Expected key supports ADMIN_PASSWORD (preferred Vercel Secret) and VITE_ADMIN_PASSWORD (Config)
    const expectedKey = (process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD || 'webbits2026').trim();
    const adminKey = ((req.headers && req.headers['x-admin-key']) || (req.body && req.body.adminKey) || '').trim();
    const action = req.body && req.body.action ? req.body.action : (adminKey ? 'update_config' : '');

    // Sync state with KV first if available
    const kvData = await readKV();
    if (kvData) {
      inMemoryData = {
        config: kvData.config || inMemoryData.config,
        analytics: kvData.analytics || inMemoryData.analytics
      };
    }

    // 1. PUBLIC ACTION: Track Visitor Session (from any phone or computer)
    if (action === 'track_visit') {
      inMemoryData.analytics.visits = (inMemoryData.analytics.visits || 0) + 1;
      inMemoryData.analytics.lastUpdated = new Date().toISOString();
      await saveKV(inMemoryData);
      return res.status(200).json({ success: true, visits: inMemoryData.analytics.visits });
    }

    // 2. PUBLIC ACTION: Track File Processed & Tool Usage (from any device)
    if (action === 'track_process') {
      const toolId = req.body.toolId || 'general';
      inMemoryData.analytics.processed = (inMemoryData.analytics.processed || 0) + 1;
      inMemoryData.analytics.toolsUsage = inMemoryData.analytics.toolsUsage || {};
      inMemoryData.analytics.toolsUsage[toolId] = (inMemoryData.analytics.toolsUsage[toolId] || 0) + 1;
      inMemoryData.analytics.lastUpdated = new Date().toISOString();
      await saveKV(inMemoryData);
      return res.status(200).json({ success: true, processed: inMemoryData.analytics.processed, toolsUsage: inMemoryData.analytics.toolsUsage });
    }

    // 3. AUTHENTICATED ACTION: Admin Login
    if (action === 'login') {
      if (!adminKey || adminKey !== expectedKey) {
        return res.status(401).json({ success: false, error: 'Invalid master password. Access denied.' });
      }
      return res.status(200).json({ 
        success: true, 
        message: 'Authentication successful',
        config: inMemoryData.config,
        analytics: inMemoryData.analytics
      });
    }

    // 4. AUTHENTICATED ACTION: Reset Global Analytics
    if (action === 'reset_analytics') {
      if (!adminKey || adminKey !== expectedKey) {
        return res.status(401).json({ success: false, error: 'Unauthorized: Invalid master password.' });
      }
      inMemoryData.analytics = {
        visits: 1,
        processed: 0,
        toolsUsage: {},
        lastUpdated: new Date().toISOString()
      };
      await saveKV(inMemoryData);
      return res.status(200).json({ success: true, analytics: inMemoryData.analytics, message: 'Analytics reset successfully.' });
    }

    // 5. AUTHENTICATED ACTION: Update Global Config (Tool switches & Notification broadcast)
    if (action === 'update_config' || (!action && adminKey)) {
      if (!adminKey || adminKey !== expectedKey) {
        return res.status(401).json({ success: false, error: 'Unauthorized: Invalid master admin key.' });
      }

      const { toolStatuses, notification } = req.body || {};
      const updatedConfig = {
        toolStatuses: toolStatuses !== undefined ? toolStatuses : inMemoryData.config.toolStatuses,
        notification: notification !== undefined ? notification : inMemoryData.config.notification,
        updatedAt: new Date().toISOString()
      };

      inMemoryData.config = updatedConfig;
      await saveKV(inMemoryData);

      return res.status(200).json({ 
        success: true, 
        config: updatedConfig, 
        analytics: inMemoryData.analytics,
        message: 'Global config updated successfully.' 
      });
    }

    return res.status(400).json({ success: false, error: 'Unknown action request.' });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
