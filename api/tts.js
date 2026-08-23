import { serverOn, redis, rateLimit, json } from './_lib.js';

// Text-to-speech dengan suara NATIVE Indonesia dari Gemini TTS.
// Butuh env GEMINI_API_KEY. Opsional: GEMINI_VOICE, GEMINI_TTS_MODEL.
// Output: WAV base64 (PCM dari Gemini dibungkus header WAV). Di-cache di KV bila ada.

const VOICES = ['Kore','Puck','Charon','Fenrir','Aoede','Leda','Zephyr','Orus',
  'Callirrhoe','Autonoe','Enceladus','Iapetus','Umbriel','Algieba','Achird','Despina'];
const DEFAULT_VOICE = VOICES.includes(process.env.GEMINI_VOICE || '') ? process.env.GEMINI_VOICE : 'Kore';
const MODEL = process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts';
const CACHE_TTL = 60 * 60 * 24 * 30; // 30 hari

function cleanText(s) {
  return String(s || '').replace(/[^\p{L}\p{N} .,!?'-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 200);
}
function pickVoice(v) { return VOICES.includes(v) ? v : DEFAULT_VOICE; }

function pcmToWav(pcm, sampleRate) {
  const numCh = 1, bits = 16;
  const byteRate = sampleRate * numCh * bits / 8;
  const blockAlign = numCh * bits / 8;
  const buf = Buffer.alloc(44 + pcm.length);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + pcm.length, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(numCh, 22); buf.writeUInt32LE(sampleRate, 24); buf.writeUInt32LE(byteRate, 28);
  buf.writeUInt16LE(blockAlign, 32); buf.writeUInt16LE(bits, 34);
  buf.write('data', 36); buf.writeUInt32LE(pcm.length, 40); pcm.copy(buf, 44);
  return buf;
}

export default async function handler(req, res) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return json(res, 501, { error: 'GEMINI_API_KEY belum diset', tts: false });

  const rl = await rateLimit(req, 'tts', 120, 60);
  if (!rl.ok) return json(res, 429, { error: 'terlalu sering' });

  const text = cleanText(req.query.text);
  const voice = pickVoice(req.query.voice);
  if (!text) return json(res, 400, { error: 'text wajib diisi' });

  const cacheKey = `tts:${MODEL}:${voice}:${text.toLowerCase()}`;

  // cache hit
  if (serverOn()) {
    try {
      const hit = await redis(['GET', cacheKey]);
      if (hit) {
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return json(res, 200, { audio: hit, mime: 'audio/wav', cached: true });
      }
    } catch { /* ignore */ }
  }

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
        },
      }),
    });
    const j = await r.json();
    if (!r.ok) return json(res, 502, { error: (j.error && j.error.message) || 'gemini error' });

    const parts = (((j.candidates || [])[0] || {}).content || {}).parts || [];
    const inline = (parts.find((p) => p.inlineData) || {}).inlineData;
    if (!inline || !inline.data) return json(res, 502, { error: 'tidak ada audio dari Gemini' });

    const rate = parseInt(((inline.mimeType || '').match(/rate=(\d+)/) || [])[1] || '24000', 10);
    const wav = pcmToWav(Buffer.from(inline.data, 'base64'), rate);
    const b64 = wav.toString('base64');

    if (serverOn()) { try { await redis(['SET', cacheKey, b64, 'EX', String(CACHE_TTL)]); } catch { /* ignore */ } }

    res.setHeader('Cache-Control', 'public, max-age=86400');
    return json(res, 200, { audio: b64, mime: 'audio/wav' });
  } catch (e) {
    return json(res, 500, { error: String(e.message || e) });
  }
}
