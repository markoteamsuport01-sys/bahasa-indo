import { serverOn, adminOK, adminConfigured, getStats, rateLimit, json } from './_lib.js';

// GET /api/stats -> admin only (x-admin-key): dashboard counters
export default async function handler(req, res) {
  if (!serverOn()) return json(res, 200, { mode: 'local' });
  const rl = await rateLimit(req, 'stats', 60, 60);
  if (!rl.ok) return json(res, 429, { error: 'terlalu sering' });
  if (!adminConfigured()) return json(res, 501, { error: 'ADMIN_KEY belum diset di server' });
  if (!adminOK(req)) return json(res, 401, { error: 'kunci admin salah' });
  try {
    const s = await getStats();
    json(res, 200, { mode: 'server', ...s });
  } catch (e) {
    json(res, 500, { error: String(e.message || e) });
  }
}
