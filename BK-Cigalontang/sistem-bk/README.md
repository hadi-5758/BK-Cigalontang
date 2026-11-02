# Sistem BK — SMA Negeri 1 Cigalontang

Aplikasi web layanan Bimbingan dan Konseling: data siswa, pencatatan layanan
(catatan konseling **terenkripsi**), asesmen siswa lewat tautan, dan laporan
bulanan PDF siap tanda tangan.

## Menjalankan

Butuh **Node.js 22.5 atau lebih baru** (database memakai SQLite bawaan Node, tanpa instalasi tambahan).

```bash
cd BK-Cigalontang/sistem-bk
npm install
npm start
```

Buka http://localhost:3100. Pada pembukaan pertama, buat akun **Koordinator BK**.

### Uji coba dengan data dummy

```bash
npm run seed
```

Perintah ini mengisi 3 kelas, 36 siswa fiktif, 10 layanan, dan 2 asesmen.
Akun demo ditulis ke `data/akun-demo.txt`. Seed menolak berjalan jika database
sudah berisi siswa. Untuk mulai bersih, hentikan server lalu hapus `data/bk.db*`.

## Fitur

| Menu | Isi |
|------|-----|
| Beranda | Ringkasan bulan berjalan, layanan per bidang, kasus yang masih terbuka |
| Catatan Layanan | 8 jenis layanan (Buku Kasus, Konseling Individu/Kelompok, Bimbingan Kelompok/Klasikal, Kunjungan Rumah, Konferensi Kasus, Alih Tangan Kasus). Nomor otomatis `KS/KN/KR/BL/BG/KF/AT-YYYY-MM-XXX` |
| Data Siswa | Impor Excel (template tersedia), tambah manual, riwayat layanan & asesmen per siswa, arsip (tidak ada hapus) |
| Kelas & Penugasan | Wali kelas, penugasan guru BK per kelas, beban siswa binaan (acuan ABKIN 1:150) |
| Pusat Asesmen | 6 instrumen: AKPD (40 butir), DCM versi sekolah (55 butir, 11 bidang), Sosiometri (5 konteks, sosiogram), Gaya Perilaku 4 tipe, Minat Karier RIASEC (36 butir), Peminatan Eskul. Tab Ringkasan / Hasil siswa / Kelola, saran tindak lanjut (kelas-kelompok-pribadi), laporan per kelas. Siswa mengisi lewat tautan (NIS + nama depan) atau lewat kertas: cetak soal → template Excel per kelas → unggah |
| Lead Karier | Hasil RIASEC siswa yang memberi izin: statistik, filter tipe/status/kelas, status tindak lanjut, ekspor CSV |
| Laporan Bulanan | Rekap per jenis, bidang, kategori kasus, daftar bimbingan klasikal → PDF berkop dengan kolom tanda tangan |
| Pengaturan | Identitas sekolah untuk kop, tim BK, ganti password, unduh cadangan Excel |

## Keamanan & etika data

- **Catatan layanan dan kontak orang tua** dienkripsi AES-256-GCM sebelum disimpan.
  Hanya pencatat dan Koordinator yang dapat membuka isi catatan.
- **Guru BK** hanya melihat siswa di kelas yang ditugaskan kepadanya.
- **Laporan bulanan** hanya memuat angka rekap dan topik klasikal, bukan isi catatan rahasia.
- **Jejak audit** mencatat login, membuka catatan, melihat data siswa, dan unduhan.
- **Data tidak dihapus**: siswa dan layanan diarsipkan (`Status = Arsip`).
- **Asesmen**: siswa memilih sendiri apakah hasilnya boleh dipakai untuk diskusi
  lanjutan. Hasil asesmen adalah bahan bimbingan, bukan diagnosis.
- Butir instrumen disusun khusus untuk aplikasi ini dan boleh disesuaikan di `lib/instrumen.js`.

### ⚠️ Cadangkan folder `data/`

`data/bk.db` adalah database dan `data/kunci.json` adalah kunci enkripsi.
**Tanpa `kunci.json`, catatan terenkripsi tidak bisa dibuka lagi.** Simpan salinan
keduanya di tempat aman (bukan di folder publik atau repositori Git).

Untuk server produksi, set kunci lewat environment:

```bash
ENCRYPTION_KEY=<64 karakter hex>   # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_SECRET=<string acak panjang>
NODE_ENV=production                 # cookie hanya lewat HTTPS
PORT=3100
```

## Struktur

```
sistem-bk/
├── server.js          — rute API & halaman
├── lib/
│   ├── db.js          — skema SQLite, pengaturan, jejak audit
│   ├── keamanan.js    — hash password, sesi, enkripsi field
│   ├── referensi.js   — jenis layanan, bidang, kategori kasus, status, pola NIS
│   ├── instrumen.js   — butir & penilaian AKPD / RIASEC
│   └── laporan.js     — rekap & PDF laporan bulanan
├── public/            — antarmuka guru BK (app.js) & halaman tes siswa (tes.js)
└── scripts/seed.js    — data dummy
```

## Catatan validasi

NIS divalidasi **10 digit angka** sesuai aturan di `CLAUDE.md`. Jika format NIS
sekolah berbeda, ubah `POLA_NIS` di `lib/referensi.js`.
