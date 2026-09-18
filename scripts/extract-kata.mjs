// Jalankan: node scripts/extract-kata.mjs
// Membaca shared.js → menulis kata-indo.txt (semua teks unik yang diucapkan)
import fs from 'fs'
import vm from 'vm'

const src = fs.readFileSync('shared.js', 'utf-8')

// Shim browser minimal — shared.js menyentuh localStorage saat dimuat
const shim = {
  document: {
    getElementById: () => null,
    querySelector: () => null,
    documentElement: { style: { setProperty() {} } },
    title: '',
  },
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  fetch: async () => ({ json: async () => ({}) }),
  console,
}
shim.window = shim
const ctx = vm.createContext(shim)

vm.runInContext(src, ctx, { filename: 'shared.js' })

// const/let top-level tetap terlihat oleh script kedua di context yang sama
const data = vm.runInContext(`({
  HURUF, SUKU, KALIMAT, TANDA, ANTONIM, BACA, SINONIM, WARNA, KATADEPAN,
  BEDA, BAKU, KATATANYA, IMBUHAN, KAPITAL, PERIBAHASA, JENISKATA, CERITA,
  NUMWORDS, KATA_TANYA, JENIS_LABEL
})`, ctx)

const out = new Set()
const add = s => {
  if (s == null) return
  const t = String(s).trim()
  if (t) out.add(t)
}

data.HURUF.forEach(([, w]) => add(w))
data.SUKU.forEach(([, w, syl]) => { add(w); (syl || []).forEach(add) })
data.KALIMAT.forEach(add)
data.TANDA.forEach(([s, p]) => { add(s); add(s + p) }) // kalimat polos & lengkap tanda baca
data.ANTONIM.forEach(([a, b]) => { add(a); add(b) })
data.BACA.forEach(it => {
  add(it.p)
  ;(it.q || []).forEach(([q, opts]) => { add(q); (opts || []).forEach(add) })
})
data.SINONIM.forEach(([a, b]) => { add(a); add(b) })
data.WARNA.forEach(([w]) => add(w))
data.KATADEPAN.forEach(([s, a]) => { add(a); add(s.replaceAll('___', a)); add(s) })
data.BEDA.forEach(it => { (it.g || []).forEach(add); add(it.odd) })
data.BAKU.forEach(([a, b]) => { add(a); add(b) })
data.KATATANYA.forEach(([s, a]) => { add(a); add(s.replaceAll('___', a)); add(s) })
data.IMBUHAN.forEach(([s, a, ds]) => { add(s.replaceAll('___', a)); add(s); add(a); (ds || []).forEach(add) })
data.KAPITAL.forEach(([s, w]) => { add(s); add(w) })
data.PERIBAHASA.forEach(([a, b]) => { add(a); add(b) })
data.JENISKATA.forEach(([w]) => add(w))
Object.values(data.JENIS_LABEL || {}).forEach(add)
data.CERITA.forEach(([s, n]) => { add(s); add(data.NUMWORDS[n] ?? String(n)); add(String(n)) })
data.NUMWORDS.forEach(add)
data.KATA_TANYA.forEach(add)

fs.writeFileSync('kata-indo.txt', [...out].join('\n') + '\n')
console.log('✓ kata-indo.txt:', out.size, 'teks unik')