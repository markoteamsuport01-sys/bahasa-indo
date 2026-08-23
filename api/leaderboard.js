import { serverOn, cleanCode, getBoard, rateLimit } from './_lib.js';

export default async function handler(req, res) {
  if (!serverOn()) return res.status(200).json({ mode: 'local', board: [] });
  const rl = await rateLimit(req, 'lb', 240, 60);
  if (!rl.ok) return res.status(429).json({ error: 'terlalu sering' });
  const code = cleanCode(req.query.room);
  if (!code) return res.status(400).json({ error: 'room wajib diisi' });
  try {
    const board = await getBoard(code);
    res.status(200).json({ mode: 'server', board });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
}
