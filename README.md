# 📶 WiFi-ID: Sistem Manajemen Tagihan & Pembayaran WiFi (Tema Serabi)

Aplikasi pencatatan pembayaran WiFi pelanggan bulanan berbasis full-stack modern menggunakan **Next.js 16 (App Router)** dan **Supabase** (Database & Auth). Aplikasi ini dirancang dengan estetika visual **Amber/Orange** yang hangat dan interaktif (terinspirasi dari Serabi Pasar Turi), serta memiliki optimasi seluler (HP) yang sangat responsif.

Aplikasi ini dilengkapi dengan **Mode Mandiri Lokal (Local Fallback Mode)** yang memungkinkan Anda menjalankannya secara offline 100% menggunakan browser local storage sebelum menghubungkannya ke Supabase online.

---

## 🚀 Fitur Utama

1. **Dashboard Statistik Real-Time**:
   * Menampilkan jumlah pelanggan aktif, total pendapatan bulan terpilih, dan total tunggakan akumulatif.
   * Daftar tunggakan pelanggan terkini lengkap dengan tombol bayar instan.
2. **Manajemen Pelanggan (CRUD)**:
   * Tambah, edit, dan hapus data pelanggan (Nama, Alamat, No. WhatsApp, Tarif Bulanan, Tanggal Gabung, Status).
   * Tombol reset untuk membersihkan riwayat pembayaran pelanggan secara instan.
   * Pencarian cepat berdasarkan nama atau alamat.
3. **Matriks Rekapitulasi Pembayaran**:
   * Grid visual 12 bulan (Januari - Desember) untuk memantau status pembayaran setiap pelanggan secara terpusat.
   * Indikator status visual: Centang Hijau (Lunas), Tanda Seru Kuning (Kurang Bayar), Silang Merah (Belum Bayar), dan Garis Abu-abu (N/A).
   * Pop-up form detail transaksi pembayaran (Jumlah bayar, metode bayar, tanggal transfer, memo tambahan).
4. **Faktur Tagihan Pelanggan Publik (`/bill/[customer_id]`)**:
   * Halaman tagihan khusus per pelanggan yang dapat diakses publik tanpa login.
   * **Cetak Struk (Print Invoice)**: Dilengkapi optimasi print stylesheet (`@media print`) sehingga saat disimpan ke PDF atau dicetak ke kertas, struk terlihat bersih dan profesional (menyembunyikan tombol navigasi, footer, tombol WA, dll).
   * Tombol konfirmasi transfer otomatis via WhatsApp ke nomor admin.
5. **Autentikasi Keamanan Admin**:
   * Dilindungi oleh **Next.js 16 Proxy Middleware** untuk membatasi akses dasbor admin.

---

## 🛠️ Stack Teknologi

* **Frontend**: Next.js 16 (React, App Router, Lucide Icons)
* **Styling**: Tailwind CSS v4 (Vanilla CSS dengan theme variables)
* **Backend & Auth**: Supabase Auth & SSR Cookie Handler
* **Database**: Supabase PostgreSQL (dengan Row Level Security/RLS Policies)
* **Local Mode**: LocalStorage API & Cookie-based mock session

---

## 💻 Panduan Menjalankan Secara Lokal (Offline Mode)

Aplikasi secara otomatis berjalan dalam **Mode Lokal** jika variabel kredensial Supabase di `.env.local` masih berisi nilai placeholder dummy.

1. **Clone/Buka Folder Proyek**:
   Buka folder proyek ini di text editor Anda.
2. **Siapkan Konfigurasi Lingkungan**:
   Salin berkas `.env.local.example` menjadi `.env.local` (berkas `.env.local` default sudah terbuat secara otomatis saat inisialisasi).
3. **Jalankan Aplikasi**:
   Jalankan perintah berikut di terminal Anda:
   ```bash
   npm run dev
   ```
4. **Buka Browser**:
   Buka alamat [http://localhost:3000](http://localhost:3000). Anda akan otomatis diarahkan ke halaman `/login`.
5. **Gunakan Akun Demo Lokal**:
   * **Email Admin**: `arif.setiawan2209@gmail.com`
   * **Password**: `palamana`
   
   *Seluruh data yang Anda buat, ubah, atau hapus di Mode Lokal akan disimpan dengan aman di memori browser Anda (`localStorage`).*

---

## ☁️ Integrasi Supabase Database & Auth (Online Mode)

Bila Anda siap untuk mempublikasikan data secara online agar dapat diakses dari mana saja, ikuti langkah berikut:

### 1. Setup Database di Supabase
1. Masuk ke [Supabase Console](https://supabase.com) dan buat proyek PostgreSQL baru.
2. Buka menu **SQL Editor** di panel kiri dasbor Supabase Anda.
3. Klik **New Query**, lalu salin dan tempelkan seluruh kode DDL dari berkas [schema.sql](file:///d:/Project/aplikasi%20tagih%2520wifi/schema.sql).
4. Klik **Run**. Langkah ini akan membuat tabel `customers` & `payments`, mengonfigurasi Row Level Security (RLS) agar database aman, serta mendaftarkan akun admin `arif.setiawan2209@gmail.com` (password: `palamana`) dan data awal 9 pelanggan.

### 2. Hubungkan Next.js ke Supabase
Ganti isi berkas `.env.local` Anda dengan kredensial API asli dari dasbor Supabase Anda (**Settings** > **API**):
```env
NEXT_PUBLIC_SUPABASE_URL=https://[id-proyek-supabase-anda].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key-public-milik-anda]
```
Setelah disimpan, jalankan ulang `npm run dev`. Aplikasi sekarang sepenuhnya terhubung secara langsung ke Supabase cloud!

---

## 🚀 Panduan Mendeploy ke Vercel

1. Unggah seluruh folder proyek Anda ke repositori **GitHub** (kecuali folder `node_modules`, `.next`, dan berkas `.env.local` yang sudah ter-exclude otomatis di `.gitignore`).
2. Masuk ke [Vercel](https://vercel.com) dan impor repositori GitHub proyek ini.
3. Di kolom **Environment Variables** sebelum deploy, masukkan kedua variabel berikut beserta nilainya:
   * `NEXT_PUBLIC_SUPABASE_URL`
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Klik **Deploy**. Selesai! Vercel akan memberikan domain publik gratis (contoh: `https://wifi-billing.vercel.app`) untuk Anda dan pelanggan Anda gunakan.

---

## 📄 Lisensi & Pembuat

Sistem dikembangkan khusus untuk mempermudah pencatatan administrasi jaringan WiFi bulanan milik **Ibu Murtinem**. Hak cipta &copy; 2026.
