# 💼 Generator Modul Layanan BK - SMAN 1 Cigalontang

Aplikasi web untuk membuat modul layanan bimbingan dan konseling terstruktur berbasis **11 Tugas Perkembangan** siswa.

## ✨ Fitur Khusus BK

- **11 Tugas Perkembangan**: Berdasarkan teori perkembangan yang komprehensif
- **Pendekatan Konseling Beragam**: Humanistik, Kognitif-Behavioural, Psikodinamik, dll.
- **Struktur Layanan Terorganisir**: Pembukaan, eksplorasi, intervensi, penutup
- **Format DOCX Profesional**: Siap cetak dan arsip
- **Indikator Keberhasilan**: Terukur dan terstruktur

## 🎯 11 Tugas Perkembangan yang Didukung

1. **Menerima Keadaan Fisik** - Perubahan fisik dan penerimaan diri
2. **Menerima Peran Seks** - Pemahaman peran gender
3. **Mengembangkan Keterampilan Intelektual** - Berpikir kritis dan problem-solving
4. **Bergaul dengan Teman Sebaya** - Hubungan sosial yang sehat
5. **Kemandirian Emosional** - Independence dari orang tua/dewasa
6. **Persiapan Karir** - Eksplorasi pilihan pekerjaan
7. **Persiapan Pernikahan & Keluarga** - Kesiapan kehidupan keluarga
8. **Mengembangkan Nilai & Moral** - Penguatan nilai-nilai positif
9. **Tanggung Jawab Sosial** - Perilaku bertanggung jawab sosial
10. **Tanggung Jawab Warga Negara** - Hak dan kewajiban sebagai warga negara
11. **Kemandirian Pribadi** - Kemandirian dalam pengambilan keputusan

## 🚀 Cara Mulai

### Prasyarat
- Node.js versi 14 atau lebih baru
- npm

### Instalasi & Jalankan

```bash
cd BK-Cigalontang
npm install
npm start
```

Kemudian buka browser ke: **http://localhost:3000**

## 📝 Cara Menggunakan

### 1. Informasi Konselor & Sekolah
- Nama lengkap konselor/guru BK
- NIP
- Nama kepala sekolah

### 2. Sasaran & Waktu Layanan
- Kelas sasaran (7-12 atau lintas kelas)
- Semester
- Durasi total (jam)
- Jumlah sesi

### 3. Pilih Tugas Perkembangan
Pilih salah satu dari 11 tugas perkembangan yang relevan dengan kebutuhan siswa.

### 4. Isi Isi & Pendekatan Layanan
- **Tujuan Layanan BK**: Apa yang ingin dicapai?
- **Isu/Topik**: Apa topik spesifik yang akan dibahas?
- **Pendekatan Konseling**: Pilih pendekatan yang sesuai

### 5. Klik "Buat Modul BK"
Sistem akan membuat dokumen DOCX terstruktur yang siap digunakan.

## 📄 Struktur Dokumen yang Dihasilkan

```
1. HALAMAN JUDUL
   - Judul modul layanan BK
   - Tugas perkembangan yang diangkat
   - Identitas konselor dan sekolah

2. TUJUAN LAYANAN
   - Tujuan spesifik layanan
   - Sasaran yang ingin dicapai

3. ISU/TOPIK YANG DIANGKAT
   - Topik-topik spesifik yang akan dibahas
   - Relevansi dengan perkembangan siswa

4. PENDEKATAN & TEKNIK KONSELING
   - Pendekatan utama yang digunakan
   - Teknik-teknik konseling yang diterapkan

5. RENCANA SESI (per sesi/pertemuan)
   A. Tujuan Sesi
   B. Rancangan Aktivitas Layanan (tabel: pembukaan, eksplorasi, intervensi, penutup)
   C. Indikator Keberhasilan

6. CATATAN KONSELOR
   - Ruang untuk refleksi dan follow-up
   - Hambatan yang dihadapi
   - Rencana tindak lanjut
```

## 🎯 Pendekatan Konseling yang Didukung

- **Konseling Humanistik** - Fokus pada pengembangan potensi diri
- **Konseling Kognitif-Behavioural** - Pendekatan pikiran-tindakan
- **Konseling Psikodinamik** - Eksplorasi kedalaman psikis
- **Konseling Realitas** - Fokus pada tanggung jawab dan pilihan
- **Konseling Naratif** - Pendekatan bercerita dan re-authoring
- **Pendekatan Kelompok Supportif** - Mutual support dan peer learning
- **Konseling Berbasis Kekuatan** - Fokus pada kekuatan dan resiliensi

## 🔧 Teknologi yang Digunakan

- **Backend**: Node.js + Express.js
- **DOCX Generation**: docx library
- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript

## 📊 Contoh Input

| Field | Contoh |
|-------|--------|
| Nama Konselor | Hadi Hasanuddin |
| Tugas Perkembangan | 4. Bergaul dengan Teman Sebaya |
| Kelas Sasaran | Kelas 10 |
| Durasi | 4 jam |
| Jumlah Sesi | 2 |
| Pendekatan | Konseling Humanistik |
| Tujuan | Membantu siswa membangun hubungan sosial yang sehat |

## 🔒 Data & Privasi

✅ Aplikasi berjalan **100% lokal** di server Anda  
✅ **Tidak ada data** yang dikirim ke server eksternal  
✅ Semua dokumen dibuat di sisi server  
✅ **Rahasia sesuai etika konseling**  
✅ Dapat diakses hanya dari institusi  

## 💡 Tips Penggunaan

1. **Jelas dalam Tujuan**: Tujuan layanan harus SMART (Specific, Measurable, Achievable, Realistic, Time-bound)

2. **Pilih Topik Tepat**: Topik harus relevan dengan perkembangan siswa pada fase mereka

3. **Sesuaikan Pendekatan**: Pilih pendekatan yang sudah Anda kuasai atau sesuai dengan filosofi BK Anda

4. **Dokumentasi Lengkap**: Catatan konselor sangat penting untuk evaluasi dan follow-up

5. **Fleksibilitas**: Modul ini adalah panduan—Anda dapat menyesuaikan aktivitas sesuai respons siswa

## 📈 Kasus Penggunaan

### Kasus 1: Penerimaan Fisik (TP-1)
- Kelas 7-8 mengalami pubertas
- Topik: Pemahaman perubahan fisik & body image
- Pendekatan: Humanistik

### Kasus 2: Persiapan Karir (TP-6)
- Kelas 11-12 sedang memilih program peminatan
- Topik: Eksplorasi karir, keterampilan, minat
- Pendekatan: Konseling Berbasis Kekuatan

### Kasus 3: Tanggung Jawab Sosial (TP-9)
- Lintas kelas dalam program service learning
- Topik: Kepedulian sosial, etika lingkungan
- Pendekatan: Kelompok Supportif

## 🆘 Troubleshooting

**Port 3000 sudah digunakan?**
```bash
npm start -- --port 3001
```

**DOCX tidak bisa dibuka?**
- Pastikan Microsoft Word atau LibreOffice terinstall
- Update aplikasi ke versi terbaru

**Font tidak tampil dengan benar?**
- Gunakan viewer DOCX yang kompatibel
- Coba convert ke PDF untuk presentasi

## 🚀 Pengembangan Selanjutnya

- [ ] Database untuk penyimpanan riwayat modul
- [ ] Template aktivitas per tugas perkembangan
- [ ] Integration dengan data siswa individual
- [ ] Evaluasi output/efektivitas layanan
- [ ] Fitur kolaborasi dengan guru atau BK lain
- [ ] Export ke format lain (PDF, ODT)
- [ ] Mobile app untuk portabilitas

## 📚 Referensi Teori

- Havighurst, R. J. (1972). Developmental Tasks and Education
- Super, D. E. (1990). A Life-Span, Life-Space Approach to Career Development
- Santrock, J. W. (2014). Adolescence (15th ed.)

## 📧 Support & Feedback

Untuk pertanyaan atau saran:
- Email: hadi.hasanuddin18@gmail.com
- WhatsApp: Hubungi langsung

## 📜 Catatan Etika

Modul layanan BK harus:
- ✅ Menghormati privasi dan rahasia siswa
- ✅ Menggunakan pendekatan yang sesuai dengan usia perkembangan
- ✅ Melibatkan informed consent dari siswa/wali
- ✅ Didokumentasikan dengan baik untuk continuity of care
- ✅ Dievaluasi untuk efektivitas berkelanjutan

---

**Semoga modul ini bermanfaat untuk layanan BK yang lebih terstruktur! 🌱**

*Generator Modul BK v1.0 - SMAN 1 Cigalontang*
