// Vercel Serverless API Route: /api/sync
// Synchronizes Tool Statuses and Push Notifications across all users globally

let inMemoryConfig = {
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

  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  // GET: Return current global configuration
  if (req.method === 'GET') {
    try {
      if (kvUrl && kvToken) {
        const kvRes = await fetch(`${kvUrl}/get/pdfbolt_global_config`, {
          headers: { Authorization: `Bearer ${kvToken}` }
        });
        if (kvRes.ok) {
          const data = await kvRes.json();
          if (data && data.result) {
            const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
            return res.status(200).json({ success: true, config: parsed, source: 'kv' });
          }
        }
      }
    } catch (e) {
      console.warn('KV read failed, using fallback memory', e);
    }

    return res.status(200).json({ success: true, config: inMemoryConfig, source: 'memory' });
  }

  // POST: Admin updates global configuration
  if (req.method === 'POST') {
    const adminKey = req.headers['x-admin-key'] || (req.body && req.body.adminKey);
    const expectedKey = process.env.VITE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'webbits2026';

    if (!adminKey || adminKey.trim() !== expectedKey.trim()) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid master admin key.' });
    }

    const { toolStatuses, notification } = req.body || {};

    const updatedConfig = {
      toolStatuses: toolStatuses !== undefined ? toolStatuses : inMemoryConfig.toolStatuses,
      notification: notification !== undefined ? notification : inMemoryConfig.notification,
      updatedAt: new Date().toISOString()
    };

    inMemoryConfig = updatedConfig;

    // Persist to Vercel KV if available
    if (kvUrl && kvToken) {
      try {
        await fetch(`${kvUrl}/set/pdfbolt_global_config`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${kvToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedConfig)
        });
      } catch (e) {
        console.warn('KV write error', e);
      }
    }

    return res.status(200).json({ success: true, config: updatedConfig, message: 'Global config updated successfully.' });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
