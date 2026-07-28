# 📚 Generator Modul Ajar - SMAN 1 Cigalontang

Aplikasi web untuk membuat modul ajar terstruktur sesuai Kurikulum Merdeka.

## ✨ Fitur

- **Interface User-Friendly**: Form yang intuitif untuk input data
- **Multi-Pertemuan**: Buat modul dengan struktur per pertemuan otomatis
- **Format Profesional**: Dokumen DOCX siap cetak dengan struktur lengkap
- **Fleksibel**: Mendukung berbagai metode pembelajaran dan fase kelas
- **Cepat**: Generate dokumen dalam hitungan detik

## 🚀 Cara Mulai

### Prasyarat
- Node.js (versi 14 atau lebih baru)
- npm

### Instalasi & Jalankan

1. Masuk ke direktori project:
```bash
cd BK-Cigalontang
```

2. Jalankan server:
```bash
npm start
```

3. Buka browser dan akses:
```
http://localhost:3000
```

## 📝 Cara Menggunakan

1. **Isi Informasi Pengajar & Sekolah**
   - Nama pengajar
   - NIP pengajar
   - Nama kepala sekolah

2. **Tentukan Kelas & Mata Pelajaran**
   - Pilih fase pembelajaran (A-F)
   - Masukkan mata pelajaran
   - Pilih semester

3. **Rincian Pembelajaran**
   - Topik/materi pokok
   - Durasi total pembelajaran (jam)
   - Jumlah pertemuan
   - Metode pembelajaran
   - Capaian pembelajaran (CP)

4. **Klik "Buat Modul Ajar"**
   - Sistem akan membuat dokumen DOCX
   - File otomatis diunduh

## 📄 Struktur Dokumen yang Dihasilkan

Dokumen modul ajar mencakup:

```
1. Halaman Judul
   - Identitas mata pelajaran
   - Data pengajar dan sekolah

2. Capaian Pembelajaran
   - Deskripsi CP sesuai input

3. Rencana Pembelajaran Per Pertemuan
   - Tujuan pembelajaran
   - Aktivitas pembelajaran (tabel: tahap, kegiatan, waktu)
   - Penilaian (pengetahuan, keterampilan, sikap)

4. Catatan Guru
   - Ruang untuk refleksi dan perbaikan
```

## 🎯 Metode Pembelajaran yang Didukung

- Problem-Based Learning (PBL)
- Project-Based Learning (PjBL)
- Inquiry Learning
- Discovery Learning
- Cooperative Learning

## 🔧 Teknologi yang Digunakan

- **Backend**: Node.js + Express.js
- **DOCX Generation**: docx library
- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript

## 📊 Contoh Input

| Field | Contoh |
|-------|--------|
| Nama Pengajar | Budi Santoso |
| NIP | 197501011999031005 |
| Mata Pelajaran | Matematika |
| Fase | Fase F (Kelas 10-12) |
| Topik | Bilangan Bulat dan Operasinya |
| Durasi | 8 jam pelajaran |
| Jumlah Pertemuan | 4 |
| Metode | Problem-Based Learning (PBL) |

## 🔒 Data & Privasi

- Aplikasi ini berjalan lokal di server Anda
- Tidak ada data yang dikirim ke server eksternal
- Semua dokumen dibuat di sisi server sebelum dikirim ke browser
- Data tidak disimpan di database

## 🆘 Troubleshooting

**Port 3000 sudah digunakan?**
```bash
npm start -- --port 3001
```

**Error "Module not found"?**
```bash
npm install
```

**DOCX tidak bisa dibuka?**
- Pastikan Microsoft Word atau LibreOffice terinstall
- Coba buka file dengan aplikasi lain yang support DOCX

## 🚀 Pengembangan Selanjutnya

- [ ] Upload template custom
- [ ] Integrasi dengan data siswa
- [ ] Preview dokumen sebelum download
- [ ] Multiple output format (PDF, ODT)
- [ ] Penyimpanan riwayat modul
- [ ] Fitur kolaborasi real-time

## 📧 Support & Feedback

Untuk pertanyaan atau saran pengembangan, hubungi:
- Email: hadi.hasanuddin18@gmail.com
- Lokasi: SMAN 1 Cigalontang, Tasikmalaya

## 📜 Lisensi

Aplikasi ini dikembangkan untuk keperluan internal SMAN 1 Cigalontang.

---

**Selamat menggunakan! 🎓**
