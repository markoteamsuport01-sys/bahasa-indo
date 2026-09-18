// Jalankan: node scripts/gen-audio.mjs
// Butuh: npm install --save-dev msedge-tts
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts'
import fs from 'fs'
import path from 'path'

const VOICE = 'id-ID-GadisNeural'   // suara Bahasa Indonesia

// Slug HARUS identik dengan yang di index.html
const slug = s => s.trim().toLowerCase().replace(/[!?.…,'"]/g, '').replace(/\s+/g, '-')

async function main() {
  // Daftar kata dibaca dari kata-indo.txt (satu kata/kalimat per baris)
  const list = fs.readFileSync('kata-indo.txt', 'utf-8')
    .split('\n').map(s => s.trim()).filter(Boolean)

  const outDir = path.join('audio')
  fs.mkdirSync(outDir, { recursive: true })

  const tts = new MsEdgeTTS()
  await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3)

  let baru = 0, lewati = 0, gagal = 0
  for (const teks of list) {
    const file = path.join(outDir, `${slug(teks)}.mp3`)
    if (fs.existsSync(file)) { lewati++; continue }
    try {
      const { audioStream } = tts.toStream(teks)
      await new Promise((res, rej) => {
        const ws = fs.createWriteStream(file)
        audioStream.on('error', rej); ws.on('error', rej)
        ws.on('finish', res); audioStream.pipe(ws)
      })
      // validasi: file kosong = gagal, hapus biar bisa di-resume nanti
      const stat = fs.statSync(file)
      if (stat.size < 1000) { fs.unlinkSync(file); throw new Error('audio kosong (0-byte)') }
      baru++; console.log('✓', teks)
    } catch (e) { gagal++; console.error('✗', teks, e.message) }
  }
  console.log(`\n🎉 ${baru} baru, ${lewati} dilewati, ${gagal} gagal`)
}
main()