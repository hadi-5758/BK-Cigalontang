# Panduan Pasang: Kas Revitalisasi Sekolah (Google Sheets)

Aplikasi pencatatan kas Revitalisasi Sekolah yang datanya tersimpan di **Google Sheets milik Anda sendiri**.
Aplikasinya dibuka lewat satu link di HP dan laptop, sedangkan Sheet-nya bisa dibuka, dicek, dan dibagikan seperti file Drive biasa.

Pemasangan cukup **sekali**, sekitar 10–15 menit, sebaiknya dari **laptop**.

Isi folder ini:

| File | Fungsi |
|---|---|
| `Code.gs` | Kode server: membaca/menulis Sheet dan menyimpan file ke Drive |
| `Index.html` | Aplikasinya (form input, buku kas, rekap, kasbon, laporan) |
| `appsscript.json` | Pengaturan zona waktu (Asia/Jakarta) dan aplikasi web |

> Nama menu di Google bisa sedikit berbeda tergantung bahasa akun. Nama bahasa Inggrisnya ditulis dalam kurung.

---

## Langkah 1 — Buat spreadsheet

1. Buka **drive.google.com**, lalu pilih **Baru → Google Spreadsheet** (*New → Google Sheets*).
2. Ganti judulnya menjadi **Kas Revitalisasi Sekolah**.

## Langkah 2 — Tempel kode

1. Di spreadsheet itu, buka menu **Ekstensi → Apps Script** (*Extensions → Apps Script*). Editor kode akan terbuka di tab baru.
2. Di file **Code.gs**, hapus semua isinya lalu tempel seluruh isi `Code.gs` dari folder ini.
3. Klik ikon **+** di samping "File", pilih **HTML**, lalu beri nama **`Index`** (tanpa `.html`). Hapus isinya, lalu tempel seluruh isi `Index.html`.
4. Klik ikon **Setelan proyek** ⚙ (*Project Settings*) di kiri:
   - Centang **Tampilkan file manifes "appsscript.json" di editor** (*Show "appsscript.json" manifest file in editor*).
   - Kembali ke **Editor** (ikon `< >`), buka `appsscript.json`, lalu ganti isinya dengan isi `appsscript.json` dari folder ini.
5. Klik **Simpan** (ikon disket, atau Ctrl+S).

## Langkah 3 — Jalankan `setup` sekali

1. Di bagian atas editor, pilih fungsi **`setup`** dari daftar lalu klik **Jalankan** (*Run*).
2. Google akan meminta izin:
   - Klik **Tinjau izin** (*Review permissions*), lalu pilih akun Google Anda.
   - Akan muncul peringatan "Google belum memverifikasi aplikasi ini". **Ini wajar**, karena kodenya buatan Anda sendiri dan bukan aplikasi publik. Klik **Lanjutan** (*Advanced*), lalu **Buka Kas Revitalisasi (tidak aman)** (*Go to … (unsafe)*), lalu **Izinkan** (*Allow*).
   - Izin yang diminta: mengelola spreadsheet ini, dan membuat file di Drive untuk folder arsip laporan.
3. Kembali ke tab spreadsheet. Sekarang sudah ada tab **Ringkasan, Dana Salur, Tarik Tunai, Pengeluaran, Cicilan Kasbon, Pengaturan**.

## Langkah 4 — Terbitkan sebagai aplikasi web

1. Di editor Apps Script, klik **Terapkan → Deployment baru** (*Deploy → New deployment*).
2. Klik ikon ⚙ di samping "Pilih jenis", lalu pilih **Aplikasi web** (*Web app*).
3. Isi:
   - **Deskripsi:** `Kas Revitalisasi`
   - **Jalankan sebagai** (*Execute as*): **Saya** (*Me*)
   - **Yang memiliki akses** (*Who has access*): **Hanya saya sendiri** (*Only myself*)
4. Klik **Terapkan** (*Deploy*), lalu **salin URL aplikasi web**. Bentuknya seperti `https://script.google.com/macros/s/…/exec`.

## Langkah 5 — Buka di laptop dan HP

- **Laptop:** buka URL tadi, lalu simpan sebagai bookmark.
- **HP:** kirim URL itu ke diri sendiri (misalnya lewat WhatsApp), buka di **Chrome**, lalu pilih menu ⋮ → **Tambahkan ke layar utama**.
- Pastikan Chrome di HP login dengan **akun Google yang sama** dengan pemilik spreadsheet.

Di kanan atas aplikasi akan muncul tanda **"Google Sheets"** kalau sudah tersambung. Ketuk tanda itu kapan saja untuk memuat ulang data terbaru.

## Langkah 6 — Pindahkan data lama (kalau ada)

Kalau Anda sudah sempat mencatat di versi sebelumnya (file HTML atau link claude.ai):

1. Di versi lama, buka ⚙ **Pengaturan → Unduh Backup**.
2. Di aplikasi baru, buka ⚙ **Pengaturan → Pulihkan dari Backup**, lalu pilih file backup tadi.

---

## Pemakaian sehari-hari

- **Isi identitas sekolah** di ⚙ Pengaturan (nama sekolah, Kepala Sekolah, Ketua Panitia, Bendahara). Data ini dipakai di kop dan tanda tangan laporan.
- **Laporan PDF / Excel / backup** disimpan ke folder **Kas Revitalisasi - Arsip** di Google Drive Anda. Setelah tersimpan, muncul tombol **Buka file**.
- **Tab Ringkasan** di Sheet menghitung saldo bank, saldo kas, biaya per kategori, dan sisa kasbon dengan rumus. Isinya tetap benar walaupun data diubah langsung di Sheet.
- **Membagikan ke Kepala Sekolah / Panitia:** di spreadsheet, klik **Bagikan** lalu tambahkan email beliau dengan akses **Pelihat** (*Viewer*). Beliau bisa membuka tab Ringkasan dan semua rincian tanpa memasang apa pun. Link aplikasi tidak perlu dibagikan.
- **Riwayat perubahan:** di Sheet, buka **File → Histori versi** untuk melihat atau mengembalikan versi sebelumnya.

### Boleh mengubah data langsung di Sheet?

Boleh, misalnya untuk memperbaiki salah ketik. Aturannya:
- **Jangan ubah judul kolom** (baris 1) dan **jangan isi/ubah kolom ID** (kolom tersembunyi).
- Untuk transaksi **baru**, sebaiknya catat lewat aplikasi supaya ID-nya terbentuk.
- Kolom tambahan milik Anda sendiri boleh ditambahkan di sebelah kanan; aplikasi tidak akan menimpanya.

---

## Kalau ada masalah

| Masalah | Penyebab & solusi |
|---|---|
| Muncul *"Maaf, file tidak dapat dibuka saat ini"* (*Sorry, unable to open the file at this time*) | Browser login dengan **beberapa akun Google** sekaligus. Buka link di jendela Incognito lalu login hanya dengan akun pemilik, atau gunakan profil Chrome yang hanya berisi akun itu. |
| Tanda di kanan atas menunjukkan **"Gagal memuat"** | Periksa koneksi internet, lalu ketuk tanda itu untuk mencoba lagi. |
| Data dari HP belum muncul di laptop | Ketuk tanda **Google Sheets** di kanan atas untuk memuat ulang. Aplikasi juga memuat ulang otomatis saat dibuka kembali. |
| Ingin memperbarui kode di kemudian hari | Tempel kode baru, lalu **Terapkan → Kelola deployment → ✏️ Edit → Versi: Versi baru → Terapkan**. URL aplikasi **tidak berubah**. |
