# Petualangan Bahasa Indonesia Ceria 🎈

Game edukasi Bahasa Indonesia untuk anak — kini sebuah **platform**: main sendiri,
main bareng (live quiz), progres pemain, PWA, dan panel admin white-label + kelola
konten. Jalan **tanpa backend** (mode lokal) dan otomatis naik ke **mode server**
saat Redis (Vercel KV / Upstash) diaktifkan.

## 📘 Panduan

| Panduan | Untuk siapa |
|---|---|
| **[PANDUAN-MAIN.md](PANDUAN-MAIN.md)** | Anak, orang tua, guru — cara main, bintang, badge, room, Live |
| **[PANDUAN-INSTALL.md](PANDUAN-INSTALL.md)** | Admin — pasang di Vercel dari nol, 4 tahap, + mengatasi masalah |

## Fitur

**Untuk pemain**
- **Penyiapan bertahap (4 langkah)**: **Nama → Level → Fokus → Main**, dengan
  indikator langkah di atas (bisa diklik untuk mundur), tombol *Kembali*/*Lanjut*, dan
  ringkasan pilihan sebelum mulai. Muncul saat pertama kali main atau lewat *Ganti
  pemain*; pemain lama langsung ke menu.
- **Menu utama**: kartu sapaan + pangkat, **Misi Hari Ini**, kartu **Main bersama**
  (buat room / masukkan kode), 4 kartu statistik, permainan (Peta/Daftar),
  **Koleksiku**, papan bintang, dan panel **Aplikasi**. Level & fokus cukup satu bar
  chip dengan tombol **⚙️ Ubah**.
- **20 mini-game**: Tebak Huruf, Lawan Kata, Persamaan Kata, Tebak Warna, Mana yang
  Beda?, Dengar & Pilih (suara TTS), Susun Suku Kata, Susun Kalimat, Tanda Baca,
  Kata Depan (di/ke/dari), **Kata Baku** (ejaan KBBI: *apotek* atau *apotik*?), Baca
  & Jawab, Ayo Berhitung, **Kata Tanya** (apa/siapa/mengapa…), **Imbuhan**
  (me-/di-/pe-/ter-), **Huruf Kapital** (cari kata yang seharusnya kapital),
  **Jenis Kata** (benda/kerja/sifat), **Peribahasa** (peribahasa & ungkapan),
  **Soal Cerita** (berhitung dari cerita), dan **Dengar & Tulis** (suara → tulisan).
- **Bank ≥30 soal per game** (total 535 soal; "Ayo Berhitung" digenerate acak tanpa
  batas). Satu sesi main mengambil **8 soal acak** dari bank, jadi tiap main ulang
  terasa baru. Ingin sesi lebih panjang? Ubah satu konstanta `ROUNDS` di
  `index.html` (mis. `const ROUNDS=30;`).
- **3 Level** (Pemula/Menengah/Mahir) & **8 Fokus** (Semua, Kosakata, Kalimat, Tata
  Bahasa, Membaca, Menyimak, Berhitung, Ungkapan).

> **Ukuran bank & level.** Level menyaring bank berdasarkan panjang kata (Pemula 0–6
> huruf, Menengah 5–8, Mahir 7+) lewat `bandFilter`. Bila hasil saringan **kurang dari
> `ROUNDS`**, fungsi itu diam-diam mundur ke seluruh bank — levelnya jadi tak terasa.
> Karena itu bank `huruf` (44) dan `suku` (41) sengaja lebih besar dari 30: tiap level
> harus punya ≥8 soal *sendiri*. Kalau menambah/mengurangi soal lewat panel admin,
> jaga agar tiap rentang panjang tetap terisi. Bank `kapital` disaring dengan cara
> yang sama (panjang kata jawabannya: 19/22/11 soal per level), dan `cerita`
> disaring lewat besar jawabannya (≤10 Pemula, ≤15 Menengah, bebas di Mahir).
> Bank lain (`katatanya`, `imbuhan`, `jeniskata`, `peribahasa`) tidak berjenjang —
> yang berubah antar level hanya **jumlah pilihan jawaban** (3/4/5).
- **Progres pemain**: XP & level pemain, **runtun harian (streak)**, **9 badge**,
  **riwayat main** — semua di modal **👤 Profil**.
- **Pangkat**: 6 tingkat dari *Penjelajah Kata* sampai *Maestro Bahasa*, naik lewat
  total bintang. Bar kemajuannya tampil di kartu sapaan menu utama.
- **Buka kunci bertahap**: **7 permainan gratis sejak awal — satu per fokus** (supaya
  fokus mana pun langsung bisa dimainkan), 13 sisanya terbuka satu per satu pada
  2, 5, 8, 12, … 62 ⭐. Kartu terkunci menampilkan sisa bintang yang dibutuhkan,
  jadi tujuannya selalu terlihat. **Mode guru** (Profil → *Buka semua permainan*)
  membuka semuanya sekaligus untuk kelas atau demo.
- **Misi Hari Ini**: 3 misi berganti tiap hari (main di 2 kategori, 8 jawaban
  beruntun, sesi ⭐⭐⭐, dll), masing-masing **bonus 5 ⭐**. Misinya diturunkan dari
  tanggal — tetap sepanjang hari, berganti sendiri besoknya.
- **Koleksiku**: **Album Stiker** 50 stiker (1 tiap 10 ⭐) dan **7 Lencana Ahli**
  (dapat ⭐⭐⭐ di *semua* permainan satu fokus).
- **Dua tampilan permainan**: 🗺️ **Peta** (jalur petualangan berkelok) atau ☰
  **Daftar** (grid kartu). Pilihan tersimpan per perangkat.
- **Panel Aplikasi**: status pasang PWA (+ tombol *Pasang*), status siap-offline,
  dan **perlindungan penyimpanan** (`navigator.storage.persist()`) supaya browser
  tidak menghapus bintang saat ruang menipis — plus tautan *muat ulang isi terbaru*.
- **Room & papan bintang** per room (kode + link `?room=...&level=...`).
- **🎮 Main bareng (Live)** — kuis serentak: host membuat kuis, semua pemain
  menjawab soal yang **sama pada waktu yang sama**, skor live + bel cepat (poin
  bonus makin cepat menjawab). *(butuh mode server)*
- **PWA**: bisa di-*install* ke layar utama dengan nama **"Bhs Indo"** & ikon dari
  `logo.png`, dan main **offline** (shell dicache). Ikon di-generate ke 192/512 px
  plus varian **maskable** berpadding — isinya tetap utuh saat Android memotongnya
  jadi lingkaran. Regenerate setelah mengganti `logo.png`:
  ```bash
  sips -s format png -Z 192 logo.png --out icon-192.png
  sips -s format png -Z 512 logo.png --out icon-512.png
  sips -s format png -Z 180 logo.png --out apple-touch-icon.png
  sips -s format png -Z 400 logo.png --out /tmp/m.png
  sips -p 512 512 --padColor 129E75 /tmp/m.png --out icon-maskable-512.png
  ```
  Lalu naikkan `CACHE` di `sw.js` supaya perangkat lama ikut memperbarui ikonnya.
- **Interaktif & animasi**: efek suara (Web Audio, tanpa file — tombol 🔊 di header
  untuk mute), animasi kartu & tombol, percikan bintang saat benar, maskot yang
  bereaksi, hitung bintang beranimasi, **combo** (bonus untuk jawaban benar
  beruntun), dan transisi antar layar. Semua otomatis nonaktif bila perangkat
  memilih *reduce motion*.
- **Suara ucap native Indonesia (Gemini TTS)**: game "Dengar & Pilih" dan tombol
  🔊 Dengar (di Tebak Huruf, Lawan Kata, Persamaan Kata) memakai suara natural
  Bahasa Indonesia dari **Gemini TTS**. Aktif bila `GEMINI_API_KEY` diset; jika
  tidak, otomatis **fallback ke suara TTS bawaan browser** (`id-ID`). Audio
  di-cache di sisi klien (per sesi) dan di **Vercel KV** (lintas pengguna) agar
  hemat biaya & cepat.

**Untuk admin** — **halaman terpisah `admin.html`** (tautan ⚙️ Admin di footer, atau
buka `/admin` langsung)
- **Merek (white-label)**: nama, warna aksen, maskot, logo, sub-judul, footer,
  ganti password — dengan **pratinjau langsung** yang meniru header game, berubah
  saat mengetik sebelum disimpan. White-label ikut mewarnai halaman admin sendiri.
- **Kelola konten soal**: edit/tambah/hapus soal tiap game (editor JSON dengan
  **validasi hidup** — memberi tahu JSON rusak & jumlah soal saat mengetik).
  Simpan **lokal** (perangkat ini) atau **ke server** (berlaku untuk semua pemain).
- **Dashboard**: total game dimainkan & jumlah pemain unik *(butuh mode server + kunci admin)*.
- **Status server**: menampilkan Redis / `ADMIN_KEY` / Gemini TTS aktif atau tidak,
  supaya jelas kenapa sebuah tombol nonaktif.

## Peran (Role)

| Peran | Masuk | Kemampuan |
|-------|-------|-----------|
| **User** | `index.html` — isi nama | Main solo & live, progres, room |
| **Admin** | `admin.html` (`/admin`) + password (`admin123` bawaan — ganti!) | White-label, kelola konten, dashboard |

Password admin diverifikasi di sisi klien (praktis, bukan pengaman server). Aksi
yang menulis ke server (simpan konten global, dashboard) diamankan terpisah oleh
**`ADMIN_KEY`** (lihat bawah) — kunci ini tidak ada di kode; admin mengetiknya di
panel dan dikirim lewat header `x-admin-key`.

> **Memisahkan admin ke halaman sendiri tidak menambah keamanan.** `admin.html`
> tetap bisa dibuka siapa pun, dan passwordnya tetap diperiksa di browser — sama
> seperti sebelumnya saat masih berupa panel di dalam `index.html`. Yang berubah
> hanya kerapian: game tidak lagi memuat kode admin. Satu-satunya pengaman nyata
> tetap `ADMIN_KEY` di sisi server. Halaman admin diberi `noindex,nofollow` agar
> tidak muncul di mesin pencari — itu menghindari penemuan tak sengaja, bukan
> pengaman.

## Arsitektur file

Sejak admin dipisah, ada kode yang dipakai bersama dua halaman:

| File | Isi | Dipakai |
|---|---|---|
| `shared.js` | kunci localStorage, merek (`CFG`, `applyBranding`), **bank soal**, `applyContent`/`currentContent`, `detectCaps` | `index.html` + `admin.html` |
| `app.css` | token warna `:root`, appbar, panel, btn, field, tabbar | `index.html` + `admin.html` |
| `index.html` | mesin game, wizard, live, profil (+ CSS khusus game) | — |
| `admin.html` | gerbang login, 3 tab, pratinjau white-label | — |

**Aturan penting:**
- `shared.js` adalah **script klasik, bukan ES module** — supaya `index.html` tetap
  bisa dibuka lewat `file://` untuk pengembangan cepat (modul ditolak CORS di `file://`).
  Ia harus dimuat **sebelum** `<script>` inline tiap halaman.
- Jangan mendeklarasikan ulang nama yang sudah ada di `shared.js` (`$`, `esc`,
  `showFeedback`, `ONLINE`, `CFG`, bank soal, …). Deklarasi ganda di dua script
  klasik = **SyntaxError** dan seluruh halaman mati.
- Bank soal **hanya** boleh hidup di `shared.js`. Kalau diduplikat, soal yang diedit
  admin akan menyimpang dari yang dipakai game.

## Mode Lokal vs Server

| | Mode lokal (default) | Mode server (Vercel KV) |
|--|--|--|
| Backend | Tidak perlu | Vercel KV (Redis) |
| Progres, XP, badge | localStorage per perangkat | localStorage per perangkat |
| Papan bintang | Per perangkat | **Lintas perangkat, sinkron** |
| Live quiz | ❌ (butuh server) | ✅ |
| Konten admin | Lokal per perangkat | ✅ global untuk semua |
| Dashboard | ❌ | ✅ (butuh `ADMIN_KEY`) |

App mendeteksi mode otomatis via `GET /api/health`.

> **Batas "real-time":** Live quiz memakai **timeline deterministik** + polling
> (~1.3 dtk). Semua klien menghitung soal aktif dari waktu mulai, jadi soal
> tersinkron tanpa perlu koneksi persisten. Ini bukan WebSocket; untuk latensi
> lebih rendah bisa ditambah Ably/Pusher/Supabase Realtime nanti.

## Deploy ke Vercel

### 1. Deploy (mode lokal langsung jalan)
```bash
npm i -g vercel
cd bhs-indo
vercel --prod
```
Atau import repo di dashboard Vercel (Framework Preset: **Other**, tanpa build).

### 2. Aktifkan mode server (papan bintang lintas perangkat + Live quiz)
1. Vercel → project → **Storage** → **Create Database** → **KV** → **Connect**.
   Vercel menambah env `KV_REST_API_URL` & `KV_REST_API_TOKEN` otomatis.
2. **Redeploy**.

### 3. (Opsional) Suara native Indonesia dari Gemini
1. Buat API key di **Google AI Studio** (Gemini API).
2. Vercel → project → **Settings → Environment Variables** → tambah:
   - **`GEMINI_API_KEY`** = API key kamu (wajib untuk fitur ini)
   - **`GEMINI_VOICE`** = *(opsional)* nama suara, mis. `Kore`, `Aoede`, `Puck`, `Leda`
   - **`GEMINI_TTS_MODEL`** = *(opsional)* default `gemini-2.5-flash-preview-tts`
3. **Redeploy**. Endpoint `/api/tts` akan mengubah teks → suara Bahasa Indonesia.
   Admin juga bisa memilih suara per perangkat di ⚙️ Admin → tab Merek → *Suara Gemini*.

> Key **hanya** dibaca di serverless function (`/api/tts`) — tidak pernah dikirim
> ke browser. Untuk cache lintas pengguna, aktifkan KV (langkah 2). Biaya TTS
> ditekan oleh cache: tiap kata unik hanya sekali panggil ke Gemini.

### 4. (Opsional) Konten global + dashboard
1. Vercel → project → **Settings → Environment Variables** → tambah
   **`ADMIN_KEY`** = kunci rahasia pilihanmu → **Redeploy**.
2. Di app: ⚙️ Admin → tab **Merek** → isi **"Kunci server admin"** dengan nilai
   `ADMIN_KEY` yang sama → **Simpan**. Sekarang tombol *Simpan ke server* & Dashboard aktif.

## Struktur
```
bhs-indo/
├── PANDUAN-MAIN.md     # panduan bermain (anak/guru)
├── PANDUAN-INSTALL.md  # panduan pasang di Vercel (admin)
├── index.html          # game (solo, live, profil) + CSS/JS khusus game
├── admin.html          # panel admin — halaman terpisah, ikut white-label
├── shared.js           # dipakai BERSAMA: merek, bank soal, deteksi server
├── app.css             # dipakai BERSAMA: token warna + komponen dasar
├── manifest.json       # PWA manifest (nama aplikasi: "Bhs Indo")
├── logo.png            # logo sumber 1254×1254 — dari sini ikon di-generate
├── icon-192.png        # ikon PWA + favicon
├── icon-512.png        # ikon PWA (splash & daftar aplikasi)
├── icon-maskable-512.png # ikon maskable (Android memotong jadi lingkaran/squircle)
├── apple-touch-icon.png  # ikon layar utama iOS (180×180)
├── icon.svg            # ikon lama (tidak lagi dipakai)
├── sw.js               # service worker (offline shell)
├── api/
│   ├── _lib.js         # helper KV, rate-limit, auth, stats (bukan route)
│   ├── health.js       # GET  status server
│   ├── leaderboard.js  # GET  papan bintang room
│   ├── score.js        # POST kirim skor
│   ├── live.js         # GET/POST state live quiz
│   ├── content.js      # GET publik / POST admin: konten global
│   ├── stats.js        # GET admin: dashboard
│   └── tts.js          # GET suara Gemini (native ID) -> WAV, cache KV
├── vercel.json         # header keamanan + cleanUrls
├── package.json        # type:module (ESM), node>=18
└── Game_Bahasa_Indonesia_Ceria.html   # versi asli (arsip)
```

## Keandalan & keamanan
- Input API disanitasi & di-*clamp*; body dibatasi ukurannya.
- **Rate limit** per-IP (via KV) untuk skor, leaderboard, live, konten, stats.
- Skor live dihitung **di server** (anti-curang dari sisi klien); jawaban benar
  dikunci atomik (`HSETNX`/`HINCRBY`) sehingga aman dari balapan antar pemain.
- Service worker tidak pernah men-*cache* `/api/*`.

## Yang belum diuji
Fungsi API **belum diuji terhadap Vercel KV hidup** (Redis tak tersedia di mesin
pengembangan). Logika & sintaks sudah divalidasi; frontend (solo, profil, level,
generator live, editor konten) sudah diuji render di browser headless. Setelah KV
tersambung & redeploy, uji: buat room live di 2 tab, kirim skor, simpan konten
global, buka dashboard.

## Pengembangan lokal
- Cepat: buka `index.html` (mode lokal; API 404 → fallback aman, SW nonaktif di file://).
- Dengan API/KV: `vercel dev` + env `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `ADMIN_KEY`.
