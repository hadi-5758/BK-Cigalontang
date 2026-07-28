# Sistem Pelaporan BK — SMA Negeri 1 Cigalontang

## Konteks Proyek

Sistem administrasi dan pelaporan Bimbingan Konseling (BK) berbasis Google Sheets dan Google Apps Script untuk SMA Negeri 1 Cigalontang. Tujuan utama: menggantikan pencatatan manual di buku fisik dengan sistem digital yang terstruktur, mudah diakses, dan menghasilkan laporan otomatis.

**Pengguna utama:** Guru BK SMA Negeri 1 Cigalontang  
**Platform:** Google Workspace (Sheets, Forms, Apps Script, Drive)  
**Bahasa antarmuka:** Bahasa Indonesia

---

## Arsitektur Sistem

### Google Sheets (Database & Tampilan)
```
BK-Cigalontang/
├── Master Data/
│   ├── Data Siswa          — NIS, nama, kelas, wali kelas, kontak ortu
│   ├── Data Kelas          — daftar kelas aktif, wali kelas
│   └── Kalender BK         — jadwal konseling, kegiatan bimbingan
├── Pencatatan/
│   ├── Buku Kasus          — laporan pelanggaran & kasus siswa
│   ├── Konseling Individu  — catatan sesi konseling 1-on-1
│   ├── Konseling Kelompok  — catatan sesi kelompok
│   ├── Kunjungan Rumah     — laporan home visit
│   └── Presensi Bimbingan  — kehadiran sesi bimbingan klasikal
├── Laporan/
│   ├── Rekap Bulanan       — dihasilkan otomatis via Apps Script
│   ├── Laporan Kasus       — summary per siswa / per kelas
│   └── Laporan Kepala Sekolah — format formal untuk dilaporkan
└── Konfigurasi/
    └── Settings            — nama sekolah, tahun pelajaran, dsb.
```

### Google Forms (Input Data)
- Form Pelaporan Pelanggaran — diisi guru/wali kelas
- Form Catatan Konseling — diisi guru BK setelah sesi
- Form Kunjungan Rumah — dokumentasi home visit

### Google Apps Script (Otomasi)
- Auto-generate nomor kasus
- Kirim notifikasi email ke wali kelas / ortu
- Generate laporan PDF bulanan
- Validasi dan sinkronisasi data antar sheet

---

## Konvensi Penamaan

### Sheet
- Gunakan nama deskriptif dalam Bahasa Indonesia
- Format: `[Kategori] - [Nama Sheet]` (misal: `Pencatatan - Buku Kasus`)
- Hindari spasi berlebih dan karakter khusus selain tanda hubung

### Kolom
- Header kolom: **Title Case**, Bahasa Indonesia
- Kolom ID/kode: huruf kapital semua (misal: `NIS`, `ID_KASUS`)
- Tanggal: format `DD/MM/YYYY`
- Waktu: format `HH:MM`

### Kode & Nomor
| Jenis | Format | Contoh |
|-------|--------|--------|
| Nomor Kasus | `KS-YYYY-MM-XXX` | `KS-2026-04-001` |
| ID Konseling | `KN-YYYY-MM-XXX` | `KN-2026-04-001` |
| ID Kunjungan Rumah | `KR-YYYY-MM-XXX` | `KR-2026-04-001` |

### Apps Script
- Nama fungsi: camelCase Bahasa Indonesia (misal: `buatLaporanBulanan()`)
- Konstanta: UPPER_SNAKE_CASE (misal: `NAMA_SEKOLAH`, `TAHUN_PELAJARAN`)
- Komentar: Bahasa Indonesia
- Satu file `.gs` per modul fungsional

---

## Data Sensitif & Privasi

- **Jangan** menyimpan detail kasus di nama file atau judul sheet
- Data konseling bersifat **rahasia** — akses dibatasi hanya guru BK
- Data kontak orangtua disimpan terenkripsi atau di sheet terproteksi
- Gunakan NIS (bukan nama lengkap) sebagai primary key di semua relasi
- Log akses diaktifkan untuk sheet yang berisi data sensitif

---

## Aturan Pengembangan

### Prioritas
1. **Keandalan data** — validasi input ketat, hindari data ganda
2. **Kemudahan penggunaan** — guru BK bukan programmer; UI harus intuitif
3. **Kecepatan** — operasi umum (input kasus, cari siswa) harus < 3 detik
4. **Keterbacaan laporan** — format laporan siap cetak tanpa modifikasi

### Apps Script
- Selalu gunakan `try/catch` dengan pesan error dalam Bahasa Indonesia
- Batasi eksekusi trigger timed maksimal 1x per hari untuk laporan berat
- Gunakan `SpreadsheetApp.flush()` setelah batch write
- Hindari loop yang memanggil `getRange()` berulang — baca data sekaligus

```javascript
// Contoh pola yang benar — baca batch, proses, tulis batch
function contohPola() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Buku Kasus');
  const data = sheet.getDataRange().getValues(); // satu kali baca
  
  const hasil = data.map(baris => prosesData(baris));
  
  sheet.getRange(1, 1, hasil.length, hasil[0].length).setValues(hasil); // satu kali tulis
}
```

### Validasi Data
- NIS harus 10 digit angka
- Tanggal tidak boleh di masa depan (untuk entri kasus/konseling)
- Kolom wajib: tandai dengan header berakhiran `*`
- Dropdown/pilihan terbatas via Data Validation — jangan input bebas untuk kategori

---

## Kategori Standar BK

### Jenis Kasus / Pelanggaran
- `A` — Kehadiran (alpa, terlambat, bolos)
- `B` — Perilaku (perkelahian, bullying, tidak sopan)
- `C` — Akademik (tidak mengerjakan tugas, menyontek)
- `D` — Atribut & Seragam
- `E` — Narkoba & Zat Berbahaya
- `F` — Lainnya

### Jenis Layanan BK
- Bimbingan Klasikal
- Konseling Individu
- Konseling Kelompok
- Bimbingan Kelompok
- Kunjungan Rumah
- Konferensi Kasus
- Alih Tangan Kasus

### Status Kasus
- `Baru` — baru dilaporkan, belum ditangani
- `Proses` — sedang dalam penanganan
- `Tindak Lanjut` — menunggu tindak lanjut pihak terkait
- `Selesai` — kasus tuntas
- `Arsip` — kasus lama, diarsipkan

---

## Laporan yang Dihasilkan

| Laporan | Frekuensi | Penerima |
|---------|-----------|----------|
| Rekap Kasus Mingguan | Mingguan | Guru BK |
| Laporan Bulanan BK | Bulanan | Kepala Sekolah |
| Rekap Siswa Bermasalah | Per semester | Wali Kelas |
| Laporan Kunjungan Rumah | Per kegiatan | Kepala Sekolah |
| Statistik Jenis Kasus | Per semester | Kepala Sekolah |

---

## Lingkungan & Tools

- **Google Workspace**: akun sekolah (`@smancigalontang.sch.id` atau sejenisnya)
- **Apps Script IDE**: script.google.com
- **Tes**: selalu gunakan data dummy sebelum deploy ke data nyata
- **Backup**: ekspor ke Excel bulanan, simpan di Google Drive folder `Arsip BK`
- **Version control**: simpan snapshot Apps Script di folder `_backup` dengan tanggal

---

## Hal yang Harus Dihindari

- Jangan hapus data; gunakan kolom `Status = Arsip` atau sheet arsip terpisah
- Jangan merge cell di area data — hanya di header laporan yang dicetak
- Jangan gunakan formula VLOOKUP untuk dataset > 1000 baris — gunakan INDEX/MATCH atau Apps Script
- Jangan simpan password/token API langsung di script — gunakan PropertiesService
- Jangan buat sheet baru untuk setiap bulan — gunakan filter/query dari satu sheet master
