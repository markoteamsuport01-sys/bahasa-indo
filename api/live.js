import { serverOn, redis, kvGetJSON, kvSetJSON, cleanCode, cleanName, readBody, rateLimit, json } from './_lib.js';

// Synchronized live-quiz room. Deterministic timeline (no host clicks needed):
// once started, question index is derived from elapsed time, so every client
// sees the same question at the same moment.
const QUESTION_MS = 15000;
const REVEAL_MS = 4000;
const SLOT = QUESTION_MS + REVEAL_MS;
const TTL = 60 * 60 * 3; // 3h

const kRoom = (c) => `live:${c}`;
const kPlayers = (c) => `live:${c}:players`;
const kSeen = (c) => `live:${c}:seen`;
const kScores = (c) => `live:${c}:scores`;
const kAns = (c) => `live:${c}:ans`;

function derive(room, now) {
  if (!room.gameStartedAt || room.ended) {
    return { phase: room.ended ? 'ended' : 'lobby', qIndex: -1, msLeft: 0 };
  }
  const elapsed = now - room.gameStartedAt;
  const idx = Math.floor(elapsed / SLOT);
  if (idx >= room.total) return { phase: 'ended', qIndex: room.total, msLeft: 0 };
  const inSlot = elapsed - idx * SLOT;
  const phase = inSlot < QUESTION_MS ? 'question' : 'reveal';
  const msLeft = phase === 'question' ? QUESTION_MS - inSlot : REVEAL_MS - (inSlot - QUESTION_MS);
  return { phase, qIndex: idx, msLeft };
}

async function expireAll(c) {
  for (const k of [kRoom(c), kPlayers(c), kSeen(c), kScores(c), kAns(c)]) {
    try { await redis(['EXPIRE', k, String(TTL)]); } catch { /* ignore */ }
  }
}

async function loadPlayers(c) {
  const names = (await redis(['SMEMBERS', kPlayers(c)])) || [];
  const scoresFlat = (await redis(['HGETALL', kScores(c)])) || [];
  const seenFlat = (await redis(['HGETALL', kSeen(c)])) || [];
  const scores = {}, seen = {};
  for (let i = 0; i < scoresFlat.length; i += 2) scores[scoresFlat[i]] = Number(scoresFlat[i + 1]) || 0;
  for (let i = 0; i < seenFlat.length; i += 2) seen[seenFlat[i]] = Number(seenFlat[i + 1]) || 0;
  const now = Date.now();
  return names.map((n) => ({ name: n, score: scores[n] || 0, online: now - (seen[n] || 0) < 12000 }))
    .sort((a, b) => b.score - a.score);
}

async function buildView(c, room, name) {
  const now = Date.now();
  const d = derive(room, now);
  const players = await loadPlayers(c);
  const view = {
    exists: true, code: c, host: room.host, gameId: room.gameId, level: room.level,
    focus: room.focus, total: room.total, phase: d.phase, qIndex: d.qIndex,
    msLeft: Math.max(0, d.msLeft), players, isHost: name === room.host,
  };
  if (d.phase === 'question' || d.phase === 'reveal') {
    const q = room.questions[d.qIndex] || {};
    view.question = { prompt: q.prompt, sub: q.sub || '', para: q.para || '', options: q.options || [] };
    if (name) {
      const my = await redis(['HGET', kAns(c), `${d.qIndex}:${name}`]);
      view.myAnswer = my == null ? null : Number(my);
    }
    if (d.phase === 'reveal') view.question.answer = q.answer; // reveal correct only after time
  }
  return view;
}

export default async function handler(req, res) {
  if (!serverOn()) return json(res, 200, { mode: 'local', exists: false, error: 'Fitur live butuh mode server (Vercel KV).' });

  const code = cleanCode(req.method === 'GET' ? req.query.room : (await peekRoom(req)));
  if (!code) return json(res, 400, { error: 'room wajib diisi' });

  if (req.method === 'GET') {
    const rl = await rateLimit(req, 'live-get', 600, 60);
    if (!rl.ok) return json(res, 429, { error: 'terlalu sering' });
    const name = cleanName(req.query.name);
    try {
      const room = await kvGetJSON(kRoom(code));
      if (!room) return json(res, 200, { exists: false });
      if (name) await redis(['HSET', kSeen(code), name, String(Date.now())]);
      return json(res, 200, await buildView(code, room, name));
    } catch (e) { return json(res, 500, { error: String(e.message || e) }); }
  }

  if (req.method !== 'POST') return json(res, 405, { error: 'metode tidak didukung' });

  const rl = await rateLimit(req, 'live-post', 240, 60);
  if (!rl.ok) return json(res, 429, { error: 'terlalu sering' });

  const body = await readBody(req);
  const name = cleanName(body.name);
  const action = String(body.action || '');
  if (!name) return json(res, 400, { error: 'name wajib diisi' });

  try {
    if (action === 'create') {
      const questions = sanitizeQuestions(body.questions);
      if (!questions.length) return json(res, 400, { error: 'soal tidak valid' });
      const room = {
        code, host: name, gameId: String(body.gameId || '').slice(0, 20),
        level: String(body.level || '').slice(0, 20), focus: String(body.focus || '').slice(0, 20),
        total: questions.length, questions, gameStartedAt: null, ended: false, createdAt: Date.now(),
      };
      await kvSetJSON(kRoom(code), room, TTL);
      await redis(['SADD', kPlayers(code), name]);
      await redis(['HSETNX', kScores(code), name, '0']);
      await redis(['HSET', kSeen(code), name, String(Date.now())]);
      await expireAll(code);
      return json(res, 200, await buildView(code, room, name));
    }

    const room = await kvGetJSON(kRoom(code));
    if (!room) return json(res, 404, { error: 'room tidak ditemukan' });

    if (action === 'join' || action === 'ping') {
      await redis(['SADD', kPlayers(code), name]);
      await redis(['HSETNX', kScores(code), name, '0']);
      await redis(['HSET', kSeen(code), name, String(Date.now())]);
      await expireAll(code);
      return json(res, 200, await buildView(code, room, name));
    }

    if (action === 'start') {
      if (name !== room.host) return json(res, 403, { error: 'hanya host yang bisa memulai' });
      room.gameStartedAt = Date.now(); room.ended = false;
      await kvSetJSON(kRoom(code), room, TTL);
      return json(res, 200, await buildView(code, room, name));
    }

    if (action === 'answer') {
      const now = Date.now();
      const d = derive(room, now);
      const qIndex = Number(body.qIndex);
      const choice = Number(body.choice);
      if (d.phase !== 'question' || d.qIndex !== qIndex) {
        return json(res, 200, await buildView(code, room, name)); // too late / wrong slot
      }
      const first = await redis(['HSETNX', kAns(code), `${qIndex}:${name}`, String(choice)]);
      if (first === 1) {
        const q = room.questions[qIndex];
        if (q && choice === q.answer) {
          const bonus = Math.floor((Math.max(0, d.msLeft) / QUESTION_MS) * 50);
          await redis(['HINCRBY', kScores(code), name, String(100 + bonus)]);
        }
        await expireAll(code);
      }
      return json(res, 200, await buildView(code, room, name));
    }

    if (action === 'restart') {
      if (name !== room.host) return json(res, 403, { error: 'hanya host' });
      room.gameStartedAt = null; room.ended = false;
      await kvSetJSON(kRoom(code), room, TTL);
      await redis(['DEL', kAns(code)]);
      // reset scores
      const names = (await redis(['SMEMBERS', kPlayers(code)])) || [];
      for (const n of names) await redis(['HSET', kScores(code), n, '0']);
      return json(res, 200, await buildView(code, room, name));
    }

    if (action === 'leave') {
      await redis(['SREM', kPlayers(code), name]);
      await redis(['HDEL', kSeen(code), name]);
      return json(res, 200, { ok: true });
    }

    return json(res, 400, { error: 'action tidak dikenal' });
  } catch (e) {
    return json(res, 500, { error: String(e.message || e) });
  }
}

async function peekRoom(req) {
  const b = await readBody(req);
  req.body = b; // cache so readBody later returns same
  return b.room;
}

function sanitizeQuestions(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, 20).map((q) => {
    const options = Array.isArray(q.options) ? q.options.slice(0, 6).map((o) => String(o).slice(0, 120)) : [];
    let answer = Number(q.answer) || 0;
    if (answer < 0 || answer >= options.length) answer = 0;
    return {
      prompt: String(q.prompt || '').slice(0, 300),
      sub: String(q.sub || '').slice(0, 160),
      para: String(q.para || '').slice(0, 1000),
      options, answer,
    };
  }).filter((q) => q.options.length >= 2 && q.prompt);
}
