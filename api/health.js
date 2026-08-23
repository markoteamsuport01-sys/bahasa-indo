import { serverOn, adminConfigured } from './_lib.js';

export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    server: serverOn(),
    admin: adminConfigured(),
    tts: !!process.env.GEMINI_API_KEY,
  });
}
