import { serverOn, adminOK, adminConfigured, kvGetJSON, kvSetJSON, readBody, rateLimit, json } from './_lib.js';

// GET  /api/content            -> public: shared content overrides (or null)
// POST /api/content {content}  -> admin only (x-admin-key): save shared overrides
export default async function handler(req, res) {
  if (!serverOn()) return json(res, 200, { mode: 'local', content: null, admin: false });

  if (req.method === 'GET') {
    try { return json(res, 200, { mode: 'server', content: await kvGetJSON('content'), admin: adminConfigured() }); }
    catch (e) { return json(res, 500, { error: String(e.message || e) }); }
  }

  if (req.method === 'POST') {
    const rl = await rateLimit(req, 'content', 30, 60);
    if (!rl.ok) return json(res, 429, { error: 'terlalu sering' });
    if (!adminConfigured()) return json(res, 501, { error: 'ADMIN_KEY belum diset di server' });
    if (!adminOK(req)) return json(res, 401, { error: 'kunci admin salah' });

    const body = await readBody(req);
    const content = body.content;
    if (content == null || typeof content !== 'object') return json(res, 400, { error: 'content tidak valid' });
    const raw = JSON.stringify(content);
    if (raw.length > 200000) return json(res, 413, { error: 'konten terlalu besar (maks 200KB)' });

    try { await kvSetJSON('content', content); return json(res, 200, { ok: true }); }
    catch (e) { return json(res, 500, { error: String(e.message || e) }); }
  }

  return json(res, 405, { error: 'metode tidak didukung' });
}
