# Panduan Install — Petualangan Bahasa Indonesia Ceria

Panduan lengkap memasang game ini di **Vercel**, dari nol sampai semua fitur aktif.
Ditulis untuk guru/admin yang belum pernah pakai Vercel.

**Yang perlu disiapkan:**
- Akun [GitHub](https://github.com) (gratis)
- Akun [Vercel](https://vercel.com) (gratis, bisa daftar pakai GitHub)
- ±15 menit

> **Catatan tentang Supabase:** aplikasi ini **tidak memakai Supabase**. Penyimpanannya
> memakai **Redis** (Vercel KV / Upstash) lewat REST API. Kalau ada panduan yang
> menyuruh membuat tabel Supabase untuk game ini, itu keliru — tidak ada kode yang
> membacanya. Lihat [Kenapa Redis, bukan Supabase?](#kenapa-redis-bukan-supabase) di bawah.

---

## Ringkasan: 4 tahap

Tiap tahap berdiri sendiri. **Tahap 1 saja sudah bisa dipakai main.** Tahap 2–4
opsional, tambahkan kalau memang butuh fiturnya.

| Tahap | Waktu | Hasil | Wajib? |
|---|---|---|---|
| **1. Deploy** | 5 mnt | Game jalan, bisa dibagikan linknya | ✅ Wajib |
| **2. Redis** | 5 mnt | Papan bintang lintas perangkat + Live quiz | Opsional |
| **3. Gemini** | 3 mnt | Suara ucap native Bahasa Indonesia | Opsional |
| **4. ADMIN_KEY** | 2 mnt | Simpan soal ke server + dashboard | Opsional |

---

## Tahap 1 — Deploy ke Vercel (wajib)

Setelah tahap ini game **sudah bisa dimainkan**. Semua 13 mini-game, level, fokus,
progres pemain, dan badge jalan tanpa server apa pun — semuanya tersimpan di
perangkat masing-masing (`localStorage`).

### 1.1 Masukkan kode ke GitHub

Kalau kodenya masih di komputer saja, unggah dulu:

1. Buka [github.com/new](https://github.com/new)
2. Isi **Repository name**, mis. `bahasa-indonesia-ceria`
3. Pilih **Private** (kalau tak ingin dilihat umum) → **Create repository**
4. Ikuti perintah di layar bagian *"…or push an existing repository"*

### 1.2 Import ke Vercel

1. Buka [vercel.com/new](https://vercel.com/new)
2. Pilih repo yang barusan dibuat → **Import**
3. **Framework Preset**: pilih **Other**
4. **Build Command** dan **Output Directory**: **kosongkan** — aplikasi ini tidak
   punya proses build, cuma HTML + serverless function
5. Klik **Deploy**, tunggu ±1 menit

### 1.3 Cek hasilnya

Buka URL yang diberikan Vercel (mis. `bahasa-indonesia-ceria.vercel.app`).
Kamu harusnya melihat layar **"Halo, teman kecil!"**.

Cek juga `https://<url-kamu>/api/health` — akan muncul:

```json
{ "ok": true, "server": false, "admin": false, "tts": false }
```

Ketiga `false` itu **normal** — artinya tahap 2, 4, dan 3 belum dikerjakan.
Aplikasi membaca ini untuk tahu fitur mana yang boleh ditampilkan.

> **Bagikan ke anak/murid:** cukup kirim URL-nya. Tidak perlu login, tidak perlu
> install. Di HP bisa **Add to Home Screen** supaya seperti aplikasi (PWA), dan
> tetap bisa dimainkan **offline**.

---

## Tahap 2 — Redis: papan bintang lintas perangkat + Live quiz

**Tanpa tahap ini:** papan bintang cuma tersimpan di perangkat masing-masing, jadi
anak tidak bisa saling lihat skor. Tombol **🎮 Main bareng (Live)** menolak jalan.

**Dengan tahap ini:** papan bintang tersinkron antar perangkat, dan Live quiz aktif.

Aplikasi butuh dua variabel: **`KV_REST_API_URL`** dan **`KV_REST_API_TOKEN`**.
Keduanya menunjuk ke Redis dengan REST API. Ada dua cara mendapatkannya.

### Cara A — lewat Marketplace Vercel (paling mudah)

1. Vercel → pilih project → tab **Storage**
2. Klik **Create Database** / **Browse Marketplace**
3. Pilih penyedia Redis (**Upstash** adalah yang paling umum) → **Connect**
4. Pilih project kamu → simpan

Vercel biasanya menambahkan env var-nya **otomatis**. Lanjut ke [2.1](#21-pastikan-nama-variabelnya-benar).

> **Kalau tampilan Vercel berbeda dari langkah di atas:** menu Storage Vercel pernah
> berubah beberapa kali (dulu ada produk bernama "Vercel KV", lalu dipindah ke
> Marketplace). Yang penting **bukan** nama menunya, tapi hasil akhirnya: kamu dapat
> **URL REST** + **token** untuk sebuah database Redis. Kalau menunya tak ketemu,
> pakai Cara B — hasilnya sama persis.

### Cara B — langsung dari Upstash

1. Daftar di [upstash.com](https://upstash.com) (ada paket gratis)
2. **Create Database** → pilih region terdekat (mis. Singapore) → **Create**
3. Di halaman database, buka bagian **REST API**
4. Salin dua nilai ini:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
5. Vercel → project → **Settings** → **Environment Variables** → tambahkan:

   | Name | Value |
   |---|---|
   | `KV_REST_API_URL` | tempel `UPSTASH_REDIS_REST_URL` |
   | `KV_REST_API_TOKEN` | tempel `UPSTASH_REDIS_REST_TOKEN` |

   Centang ketiga environment (**Production**, **Preview**, **Development**).

### 2.1 Pastikan nama variabelnya benar

Ini kesalahan paling sering. Kode ini **hanya** membaca dua nama berikut
([`api/_lib.js`](api/_lib.js)):

```
KV_REST_API_URL
KV_REST_API_TOKEN
```

Kalau penyedia/integrasi memberi nama lain (`UPSTASH_REDIS_REST_URL`,
`REDIS_URL`, `KV_URL`, dsb.), **tambahkan sendiri** dua nama di atas dan tempel
nilainya. Nama yang tidak persis = aplikasi tetap menganggap server mati.

> ⚠️ **`REDIS_URL` tidak bisa dipakai.** Bentuk `redis://…` itu protokol Redis biasa,
> bukan REST. Kode ini memanggil Redis lewat **HTTP REST**, jadi URL-nya harus yang
> berawalan `https://`.

### 2.2 Redeploy — jangan dilewat

Env var **baru terbaca setelah deploy ulang**. Menambah variabel saja tidak cukup.

Vercel → tab **Deployments** → deployment teratas → menu **⋯** → **Redeploy**.

### 2.3 Cek hasilnya

Buka `/api/health` lagi:

```json
{ "ok": true, "server": true, "admin": false, "tts": false }
```

`"server": true` ✅ Berhasil. Di menu utama, catatan mode berubah jadi
**● Mode server**, dan tombol **🎮 Main bareng (Live)** sudah bisa dipakai.

Masih `false`? Lihat [Mengatasi masalah](#mengatasi-masalah).

---

## Tahap 3 — Suara native Bahasa Indonesia (Gemini TTS)

**Tanpa tahap ini:** game "Dengar & Pilih" dan tombol 🔊 tetap jalan, tapi memakai
suara bawaan browser (`id-ID`) yang kualitasnya bergantung perangkat.

**Dengan tahap ini:** suaranya natural Bahasa Indonesia dari Gemini.

1. Buat API key di [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Vercel → **Settings** → **Environment Variables** → tambah:

   | Name | Wajib? | Keterangan |
   |---|---|---|
   | `GEMINI_API_KEY` | ✅ | API key dari AI Studio |
   | `GEMINI_VOICE` | — | Nama suara: `Kore`, `Aoede`, `Puck`, `Leda`. Kosong = default |
   | `GEMINI_TTS_MODEL` | — | Default `gemini-2.5-flash-preview-tts` |

3. **Redeploy** (lihat [2.2](#22-redeploy--jangan-dilewat))
4. Cek `/api/health` → `"tts": true`

**Soal biaya:** tiap kata unik cuma dipanggil ke Gemini **sekali**, hasilnya
di-cache. Kalau tahap 2 (Redis) aktif, cache-nya dipakai bersama semua pengguna
sehingga jauh lebih hemat. Key-nya **tidak pernah dikirim ke browser** — hanya
dibaca di serverless function `/api/tts`.

---

## Tahap 4 — Simpan soal ke server + dashboard

**Tanpa tahap ini:** admin tetap bisa mengedit soal, tapi hanya tersimpan **di
perangkat itu saja**. Dashboard tidak aktif.

**Dengan tahap ini:** soal yang diedit berlaku untuk **semua pemain**, dan dashboard
(total game dimainkan + jumlah pemain unik) terbuka.

> Butuh tahap 2 (Redis) aktif lebih dulu.

1. Vercel → **Settings** → **Environment Variables** → tambah:

   | Name | Value |
   |---|---|
   | `ADMIN_KEY` | kunci rahasia karanganmu sendiri, mis. `kunci-rahasia-kelas4b-2026` |

2. **Redeploy**
3. Buka **`https://<url-kamu>/admin`** (atau footer game → **⚙️ Admin**) → password
   (bawaan `admin123`)
4. Tab **Merek** → isi kolom **"Kunci server admin"** dengan nilai `ADMIN_KEY`
   yang sama persis → **Simpan**

Sekarang tombol **Simpan ke server** dan **Dashboard** aktif.

> **Cara cepat memastikan:** panel admin punya kotak **"Status server"** di paling
> bawah. Ia menampilkan Redis / `ADMIN_KEY` / Gemini TTS aktif atau tidak — jadi
> kalau ada tombol yang nonaktif, di situ alasannya terlihat.

### Soal keamanan — baca ini

Ada **dua** pengaman berbeda, dan bedanya penting:

| | Password admin (`admin123`) | `ADMIN_KEY` |
|---|---|---|
| Diperiksa di | **Browser** | **Server** |
| Melindungi | Tampilan panel admin | Penulisan data ke server |
| Kekuatan | Lemah — cuma penghalang praktis | Kuat |

Password admin **diverifikasi di sisi klien**, jadi siapa pun yang paham
membaca kode halaman bisa melewatinya. Itu bukan pengaman sungguhan — fungsinya
sekadar agar anak tidak asal masuk. **Ganti dari `admin123`** lewat panel admin,
tapi jangan menganggapnya rahasia.

Halaman `/admin` juga **bisa dibuka siapa saja** — memisahkannya dari game tidak
membuatnya lebih aman, hanya lebih rapi. Halaman itu diberi `noindex,nofollow`
supaya tidak terindeks mesin pencari, tapi itu menghindari penemuan tak sengaja,
bukan pengaman. Kalau kamu butuh panel admin yang benar-benar terkunci, satu-satunya
cara adalah memindahkan pemeriksaan password ke server — saat ini tidak begitu.

Yang benar-benar mengamankan data adalah **`ADMIN_KEY`**: ia tidak ada di dalam
kode, admin mengetiknya sendiri di panel, dan dikirim lewat header `x-admin-key`
untuk diperiksa di server. Kalau `ADMIN_KEY` tidak diset, **semua penulisan ke
server ditolak** — bukan dibiarkan terbuka. Jaga kunci ini seperti password asli.

---

## Mengatasi masalah

### `/api/health` tetap `"server": false`

Urutkan dari yang paling sering:

1. **Belum redeploy.** Ini penyebab nomor satu. Env var tidak berlaku sampai deploy
   ulang. → [2.2](#22-redeploy--jangan-dilewat)
2. **Nama variabel tidak persis.** Harus `KV_REST_API_URL` dan `KV_REST_API_TOKEN`.
   Bukan `UPSTASH_…`, bukan `KV_URL`. → [2.1](#21-pastikan-nama-variabelnya-benar)
3. **Salah salin URL.** Harus yang `https://…`, bukan `redis://…`.
4. **Environment tidak dicentang.** Pastikan **Production** ikut tercentang, bukan
   cuma Preview/Development.
5. **Ada spasi ikut tersalin.** Periksa awal/akhir nilainya.

### Tombol Live tidak bisa diklik / "butuh mode server"

Live quiz memang perlu tahap 2. Cek `/api/health` dulu — kalau `"server": false`,
selesaikan itu lebih dulu.

### "Simpan ke server" gagal / Dashboard kosong

Butuh **dua**-duanya: tahap 2 (Redis) **dan** tahap 4 (`ADMIN_KEY`). Pastikan juga
kunci yang kamu ketik di panel admin **sama persis** dengan nilai `ADMIN_KEY` di
Vercel — beda satu huruf pun ditolak.

### Suara masih terdengar seperti robot

Berarti masih memakai TTS bawaan browser. Cek `/api/health` → kalau `"tts": false`,
`GEMINI_API_KEY` belum terbaca (lupa redeploy?). Kalau `true` tapi suaranya tetap
begitu, kemungkinan API key-nya ditolak Google — cek **Logs** di Vercel.

### Soal yang saya edit hilang setelah ganti perangkat

Kalau disimpan **lokal**, memang hanya tersimpan di perangkat itu. Untuk berlaku ke
semua pemain, pakai **Simpan ke server** (butuh tahap 2 + 4).

### Cara melihat error

Vercel → project → tab **Logs**. Semua error serverless function muncul di situ.

---

## Kenapa Redis, bukan Supabase?

Aplikasi ini menyimpan data lewat **Redis REST API** ([`api/_lib.js`](api/_lib.js)),
bukan Postgres/Supabase. Alasannya cocok dengan bentuk datanya:

- **Papan bintang** = sorted set — Redis mengurutkan peringkat secara native.
- **Live quiz anti-curang** = kunci atomik (`HSETNX`, `HINCRBY`). Jawaban benar
  dikunci sekali secara atomik, jadi dua pemain yang menjawab bersamaan tidak bisa
  saling menimpa skor. Ini yang membuat skor live dihitung **di server**, bukan
  dipercayakan ke browser.
- **Cache TTS & rate limit** = key dengan masa berlaku (`EX`) — kedaluwarsa sendiri.

Supabase **bisa saja** dipakai, tapi bukan sekadar ganti pengaturan: seluruh
`api/_lib.js` dan 6 endpoint harus ditulis ulang, dan logika kunci atomik live quiz
harus dirancang ulang memakai constraint atau RPC Postgres. Itu pekerjaan porting,
bukan konfigurasi.

Satu-satunya kaitan Supabase yang disebut di proyek ini adalah **Supabase Realtime**
sebagai *kemungkinan di masa depan* untuk menurunkan latensi Live quiz — lihat
catatan di [README](README.md). Saat ini Live quiz memakai **timeline deterministik +
polling (~1,3 detik)**: semua klien menghitung soal aktif dari waktu mulai, jadi soal
tetap tersinkron tanpa koneksi persisten. Ini bukan WebSocket.

---

## Pengembangan di komputer sendiri

**Cepat (tanpa server):** buka `index.html` langsung di browser. API akan 404 dan
aplikasi otomatis jatuh ke mode lokal — aman. Service worker tidak aktif di `file://`.

**Lengkap (dengan API):**

```bash
npm i -g vercel
vercel dev
```

Buat file `.env.local` di folder proyek:

```
KV_REST_API_URL=https://xxx.upstash.io
KV_REST_API_TOKEN=xxxxx
ADMIN_KEY=kunci-rahasia
GEMINI_API_KEY=xxxxx
```

> Jangan pernah commit `.env.local` ke Git.

---

## Yang belum diuji

Jujur soal batas pengujian: fungsi API **belum diuji terhadap Redis hidup** (tidak
tersedia di mesin pengembangan). Logika dan sintaksnya sudah divalidasi, dan seluruh
frontend sudah diuji di browser. Setelah tahap 2 selesai, tolong uji manual:

- [ ] Buat room Live di 2 tab berbeda, pastikan soalnya sama & serentak
- [ ] Kirim skor, cek muncul di papan bintang
- [ ] Simpan konten global lewat panel admin, buka dari perangkat lain
- [ ] Buka dashboard
