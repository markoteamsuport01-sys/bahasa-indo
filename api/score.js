import { serverOn, cleanCode, cleanName, readBody, putScore, getBoard, rateLimit, bumpStats } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'gunakan POST' });
  if (!serverOn()) return res.status(200).json({ mode: 'local', board: [] });

  const rl = await rateLimit(req, 'score', 60, 60); // 60 skor / menit / IP
  if (!rl.ok) return res.status(429).json({ error: 'terlalu sering, coba lagi sebentar' });

  const body = await readBody(req);
  const code = cleanCode(body.room);
  const name = cleanName(body.name);
  if (!code || !name) return res.status(400).json({ error: 'room & name wajib diisi' });

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Number(v) || 0));
  const entry = {
    name,
    total: clamp(body.total, 0, 1e7),
    game: String(body.game || '').slice(0, 40),
    level: String(body.level || '').slice(0, 20),
    focus: String(body.focus || '').slice(0, 20),
    correct: clamp(body.correct, 0, 999),
    rounds: clamp(body.rounds, 0, 999),
    delta: clamp(body.delta, 0, 999),
    ts: Date.now(),
  };

  try {
    await putScore(code, entry);
    await bumpStats(name);
    const board = await getBoard(code);
    res.status(200).json({ mode: 'server', board });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
}
