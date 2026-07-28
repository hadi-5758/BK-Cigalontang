/**
 * SISTEM BK — SMA Negeri 1 Cigalontang
 * File: 01_setupStruktur.gs
 *
 * CARA PAKAI:
 * 1. Buka Google Sheets kosong yang sudah diberi nama (misal: "Sistem BK Cigalontang")
 * 2. Klik menu Extensions > Apps Script
 * 3. Hapus semua kode yang ada, lalu paste seluruh kode ini
 * 4. Klik tombol Run (segitiga ▶) pada fungsi setupSemua
 * 5. Izinkan akses saat diminta (klik Allow)
 * 6. Tunggu hingga selesai — semua sheet akan terbentuk otomatis
 */

// ============================================================
// KONFIGURASI — Sesuaikan bagian ini sebelum menjalankan
// ============================================================
const KONFIGURASI = {
  namaSekolah   : 'SMA Negeri 1 Cigalontang',
  namaGuruBK    : 'Nama Guru BK',          // ganti dengan nama Anda
  nip           : '197XXXXXXXXX',           // ganti dengan NIP Anda
  tahunPelajaran: '2025/2026',
  semester      : 'Genap',
};

// ============================================================
// WARNA TEMA
// ============================================================
const WARNA = {
  headerUtama    : '#1B4F72',  // biru tua — header utama
  headerSekunder : '#2E86C1',  // biru sedang
  headerAksen    : '#1A5276',  // biru gelap untuk sub-header
  teksHeader     : '#FFFFFF',  // putih
  barisGanjil    : '#EBF5FB',  // biru sangat muda
  barisSetting   : '#F0F3F4',  // abu muda
  wajib          : '#FADBD8',  // merah muda — kolom wajib isi
};

// ============================================================
// FUNGSI UTAMA — Jalankan fungsi ini
// ============================================================
function setupSemua() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    buatSheetSettings(ss);
    buatSheetDataSiswa(ss);
    buatSheetDataKelas(ss);
    buatSheetTabelPelanggaran(ss);
    buatSheetPoinSiswa(ss);
    buatSheetBukuKasus(ss);
    buatSheetKonselingIndividu(ss);
    buatSheetKonselingKelompok(ss);
    buatSheetKunjunganRumah(ss);
    buatSheetPresensi(ss);
    buatSheetRekapBulanan(ss);
    buatSheetPanduan(ss);

    // Aktifkan sheet Panduan di depan
    ss.setActiveSheet(ss.getSheetByName('Panduan'));

    SpreadsheetApp.getUi().alert(
      '✅ Setup Selesai!\n\n' +
      'Semua sheet berhasil dibuat.\n' +
      'Mulailah dengan mengisi sheet "Data Kelas" dan "Data Siswa".'
    );

  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ Error: ' + e.message);
    console.error(e);
  }
}

// ============================================================
// HELPER — Buat header dengan format
// ============================================================
function buatHeader(sheet, headers, baris, warnaBg) {
  const range = sheet.getRange(baris, 1, 1, headers.length);
  range.setValues([headers]);
  range.setBackground(warnaBg || WARNA.headerUtama);
  range.setFontColor(WARNA.teksHeader);
  range.setFontWeight('bold');
  range.setHorizontalAlignment('center');
  range.setVerticalAlignment('middle');
  sheet.setRowHeight(baris, 30);
}

function formatSheet(sheet) {
  sheet.setFrozenRows(1);
  sheet.getRange('A1:Z1').setFontFamily('Arial');
}

function lebarKolom(sheet, lebarArr) {
  lebarArr.forEach(([col, lebar]) => sheet.setColumnWidth(col, lebar));
}

function tambahValidasiDropdown(sheet, kolom, barisMulai, barisAkhir, pilihanArr) {
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(pilihanArr, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(barisMulai, kolom, barisAkhir - barisMulai + 1, 1).setDataValidation(rule);
}

function hapusSheetJikaAda(ss, nama) {
  const existing = ss.getSheetByName(nama);
  if (existing) ss.deleteSheet(existing);
}

// ============================================================
// SHEET: Settings
// ============================================================
function buatSheetSettings(ss) {
  hapusSheetJikaAda(ss, 'Settings');
  const sheet = ss.insertSheet('Settings');

  const data = [
    ['KONFIGURASI SISTEM BK', ''],
    ['', ''],
    ['Nama Sekolah',     KONFIGURASI.namaSekolah],
    ['Nama Guru BK',     KONFIGURASI.namaGuruBK],
    ['NIP',              KONFIGURASI.nip],
    ['Tahun Pelajaran',  KONFIGURASI.tahunPelajaran],
    ['Semester',         KONFIGURASI.semester],
    ['', ''],
    ['NOMOR URUT OTOMATIS (jangan diubah manual)', ''],
    ['Counter Kasus',       1],
    ['Counter Konseling',   1],
    ['Counter Kelompok',    1],
    ['Counter Kunjungan',   1],
    ['Counter Presensi',    1],
  ];

  sheet.getRange(1, 1, data.length, 2).setValues(data);

  // Format judul
  sheet.getRange('A1:B1').merge()
    .setBackground(WARNA.headerUtama)
    .setFontColor(WARNA.teksHeader)
    .setFontWeight('bold')
    .setFontSize(13)
    .setHorizontalAlignment('center');

  sheet.getRange('A9:B9')
    .setBackground(WARNA.headerSekunder)
    .setFontColor(WARNA.teksHeader)
    .setFontWeight('bold');

  // Warnai baris konfigurasi
  for (let i = 3; i <= 7; i++) {
    sheet.getRange(i, 1, 1, 2).setBackground(WARNA.barisSetting);
  }

  sheet.setColumnWidth(1, 260);
  sheet.setColumnWidth(2, 280);
  sheet.setTabColor('#1B4F72');
}

// ============================================================
// SHEET: Data Kelas
// ============================================================
function buatSheetDataKelas(ss) {
  hapusSheetJikaAda(ss, 'Data Kelas');
  const sheet = ss.insertSheet('Data Kelas');

  const headers = ['No', 'Kelas *', 'Program *', 'Wali Kelas *', 'NIP Wali Kelas', 'Email Wali Kelas', 'Jumlah Siswa', 'Keterangan'];
  buatHeader(sheet, headers, 1, WARNA.headerUtama);

  // Contoh data
  const contoh = [
    [1, 'X-1',   'IPA', 'Nama Wali Kelas', '', '', 36, ''],
    [2, 'X-2',   'IPA', 'Nama Wali Kelas', '', '', 36, ''],
    [3, 'XI-1',  'IPA', 'Nama Wali Kelas', '', '', 35, ''],
    [4, 'XII-1', 'IPA', 'Nama Wali Kelas', '', '', 34, ''],
  ];
  sheet.getRange(2, 1, contoh.length, contoh[0].length).setValues(contoh);

  // Validasi Program
  tambahValidasiDropdown(sheet, 3, 2, 100, ['IPA', 'IPS', 'Bahasa', 'Umum']);

  // Warnai kolom wajib
  sheet.getRange('B1:D1').setBackground(WARNA.wajib).setFontColor('#000000');

  lebarKolom(sheet, [[1,45],[2,70],[3,80],[4,200],[5,160],[6,220],[7,120],[8,180]]);
  formatSheet(sheet);
  sheet.setTabColor('#2874A6');
}

// ============================================================
// SHEET: Data Siswa
// ============================================================
function buatSheetDataSiswa(ss) {
  hapusSheetJikaAda(ss, 'Data Siswa');
  const sheet = ss.insertSheet('Data Siswa');

  const headers = [
    'No', 'NIS *', 'NISN', 'Nama Lengkap *', 'Kelas *',
    'Jenis Kelamin *', 'Tempat Lahir', 'Tanggal Lahir',
    'Nama Ayah', 'Nama Ibu', 'No HP Ortu *',
    'Alamat', 'Email Siswa', 'Keterangan'
  ];
  buatHeader(sheet, headers, 1, WARNA.headerUtama);

  // Warnai kolom wajib
  [2, 4, 5, 6, 11].forEach(col => {
    sheet.getRange(1, col).setBackground(WARNA.wajib).setFontColor('#000000');
  });

  // Validasi
  tambahValidasiDropdown(sheet, 6, 2, 500, ['L', 'P']);

  // Format kolom tanggal
  sheet.getRange('H2:H500').setNumberFormat('DD/MM/YYYY');

  // Format NIS sebagai teks (hindari notasi ilmiah)
  sheet.getRange('B2:B500').setNumberFormat('@');
  sheet.getRange('C2:C500').setNumberFormat('@');
  sheet.getRange('K2:K500').setNumberFormat('@');

  lebarKolom(sheet, [[1,45],[2,100],[3,110],[4,220],[5,75],[6,120],[7,130],[8,120],[9,180],[10,180],[11,140],[12,250],[13,200],[14,180]]);
  formatSheet(sheet);
  sheet.setTabColor('#2874A6');
}

// ============================================================
// SHEET: Buku Kasus
// Kolom 1-13 = data utama | 14-18 = data poin (diisi otomatis)
// ============================================================
function buatSheetBukuKasus(ss) {
  hapusSheetJikaAda(ss, 'Buku Kasus');
  const sheet = ss.insertSheet('Buku Kasus');

  const headers = [
    'ID Kasus',        // A  0
    'Tanggal *',       // B  1
    'NISN *',          // C  2
    'Nama Siswa',      // D  3
    'Kelas',           // E  4
    'Jenis Pelanggaran *', // F  5
    'Keterangan Tambahan', // G  6
    'Pelapor',         // H  7
    'Tindakan BK',     // I  8
    'Tindak Lanjut',   // J  9
    'Status *',        // K  10
    'Tanggal Selesai', // L  11
    'Catatan',         // M  12
    'Kode Pelanggaran',// N  13  ← diisi otomatis
    'Poin Kasus',      // O  14  ← diisi otomatis
    'Pelanggaran ke-', // P  15  ← diisi otomatis
    'Total Poin Siswa',// Q  16  ← diisi otomatis
    'Status SP',       // R  17  ← diisi otomatis
  ];
  buatHeader(sheet, headers, 1, WARNA.headerUtama);

  // Warnai kolom wajib
  [2, 3, 6, 11].forEach(col => {
    sheet.getRange(1, col).setBackground(WARNA.wajib).setFontColor('#000000');
  });

  // Warnai kolom otomatis (abu)
  [14, 15, 16, 17, 18].forEach(col => {
    sheet.getRange(1, col).setBackground('#D5D8DC').setFontColor('#000000');
  });

  tambahValidasiDropdown(sheet, 11, 2, 1000, ['Baru', 'Proses', 'Tindak Lanjut', 'Selesai', 'Arsip']);

  sheet.getRange('B2:B1000').setNumberFormat('DD/MM/YYYY');
  sheet.getRange('L2:L1000').setNumberFormat('DD/MM/YYYY');
  sheet.getRange('C2:C1000').setNumberFormat('@');

  lebarKolom(sheet, [
    [1,130],[2,100],[3,100],[4,200],[5,75],[6,250],[7,180],
    [8,180],[9,200],[10,200],[11,110],[12,110],[13,180],
    [14,130],[15,80],[16,100],[17,120],[18,90],
  ]);
  formatSheet(sheet);
  sheet.setTabColor('#C0392B');
}

// ============================================================
// SHEET: Tabel Pelanggaran (referensi, tidak diedit manual)
// ============================================================
function buatSheetTabelPelanggaran(ss) {
  hapusSheetJikaAda(ss, 'Tabel Pelanggaran');
  const sheet = ss.insertSheet('Tabel Pelanggaran');

  const headers = ['Kode Induk', 'Kode Rinci', 'Kategori', 'Deskripsi Pelanggaran', 'Poin ke-1', 'Poin ke-2', 'Poin ke-3'];
  buatHeader(sheet, headers, 1, WARNA.headerUtama);

  // Isi dari DATA_PELANGGARAN (didefinisikan di 06_poinDanSP.gs)
  const baris = DATA_PELANGGARAN.map(p => [p[0], p[1], p[2], p[3], p[4], p[5], p[6]]);
  sheet.getRange(2, 1, baris.length, 7).setValues(baris);

  // Warnai per kategori
  const warnakategori = { P1: '#D6EAF8', P2: '#D5F5E3', P3: '#FDEBD0', P4: '#F9EBEA', P5: '#F5EEF8' };
  baris.forEach((row, idx) => {
    const bg = warnakategori[row[0]] || '#FFFFFF';
    sheet.getRange(idx + 2, 1, 1, 7).setBackground(bg);
  });

  lebarKolom(sheet, [[1,80],[2,90],[3,170],[4,420],[5,80],[6,80],[7,80]]);
  formatSheet(sheet);
  sheet.setTabColor('#884EA0');

  // Proteksi — hanya bisa dibaca, tidak bisa diedit sembarangan
  sheet.getRange('A1:G200').protect().setDescription('Tabel Pelanggaran — jangan diubah manual').setWarningOnly(true);
}

// ============================================================
// SHEET: Poin Siswa (diisi otomatis, jangan diedit manual)
// ============================================================
function buatSheetPoinSiswa(ss) {
  hapusSheetJikaAda(ss, 'Poin Siswa');
  const sheet = ss.insertSheet('Poin Siswa');

  const headers = ['NISN', 'Nama Siswa', 'Kelas', 'Total Poin', 'Status SP', 'Tanggal SP', 'Catatan'];
  buatHeader(sheet, headers, 1, WARNA.headerUtama);

  sheet.getRange('A2:A500').setNumberFormat('@');
  sheet.getRange('D2:D500').setNumberFormat('0');

  lebarKolom(sheet, [[1,110],[2,220],[3,75],[4,100],[5,90],[6,120],[7,250]]);
  formatSheet(sheet);
  sheet.setTabColor('#E74C3C');

  sheet.getRange('A1:G1').setNote('Sheet ini diisi otomatis dari Buku Kasus. Gunakan menu BK → Poin & SP → Rekap Poin untuk refresh.');
}

// ============================================================
// SHEET: Konseling Individu
// ============================================================
function buatSheetKonselingIndividu(ss) {
  hapusSheetJikaAda(ss, 'Konseling Individu');
  const sheet = ss.insertSheet('Konseling Individu');

  const headers = [
    'ID Konseling', 'Tanggal *', 'Waktu', 'NIS *', 'Nama Siswa', 'Kelas',
    'Jenis Masalah *', 'Uraian Masalah *',
    'Teknik Konseling', 'Rencana Tindak Lanjut',
    'Perlu Ortu Dihubungi?', 'Status *', 'Catatan Rahasia'
  ];
  buatHeader(sheet, headers, 1, WARNA.headerSekunder);

  [2, 4, 7, 8, 12].forEach(col => {
    sheet.getRange(1, col).setBackground(WARNA.wajib).setFontColor('#000000');
  });

  tambahValidasiDropdown(sheet, 7, 2, 500, [
    'Pribadi',
    'Sosial',
    'Akademik / Belajar',
    'Karir',
    'Keluarga',
    'Lainnya'
  ]);
  tambahValidasiDropdown(sheet, 11, 2, 500, ['Ya', 'Tidak']);
  tambahValidasiDropdown(sheet, 12, 2, 500, ['Berlangsung', 'Tindak Lanjut', 'Selesai']);

  // Catatan Rahasia — kunci kolom
  sheet.getRange('M1').setNote('Kolom ini hanya untuk guru BK. Pertimbangkan untuk melindungi kolom ini.');

  sheet.getRange('B2:B500').setNumberFormat('DD/MM/YYYY');
  sheet.getRange('C2:C500').setNumberFormat('HH:MM');
  sheet.getRange('D2:D500').setNumberFormat('@');

  lebarKolom(sheet, [[1,130],[2,100],[3,70],[4,100],[5,200],[6,75],[7,150],[8,300],[9,180],[10,250],[11,160],[12,110],[13,300]]);
  formatSheet(sheet);
  sheet.setTabColor('#27AE60');
}

// ============================================================
// SHEET: Konseling Kelompok
// ============================================================
function buatSheetKonselingKelompok(ss) {
  hapusSheetJikaAda(ss, 'Konseling Kelompok');
  const sheet = ss.insertSheet('Konseling Kelompok');

  const headers = [
    'ID Kelompok', 'Tanggal *', 'Waktu', 'Tema / Topik *',
    'Jenis Layanan *', 'Anggota (NIS dipisah koma) *',
    'Nama Anggota', 'Jumlah Peserta',
    'Uraian Kegiatan *', 'Hasil / Kesimpulan', 'Tindak Lanjut', 'Status'
  ];
  buatHeader(sheet, headers, 1, WARNA.headerSekunder);

  [2, 4, 5, 6, 9].forEach(col => {
    sheet.getRange(1, col).setBackground(WARNA.wajib).setFontColor('#000000');
  });

  tambahValidasiDropdown(sheet, 5, 2, 300, [
    'Bimbingan Kelompok',
    'Konseling Kelompok',
    'Bimbingan Klasikal'
  ]);
  tambahValidasiDropdown(sheet, 12, 2, 300, ['Berlangsung', 'Selesai']);

  sheet.getRange('B2:B300').setNumberFormat('DD/MM/YYYY');
  sheet.getRange('C2:C300').setNumberFormat('HH:MM');

  lebarKolom(sheet, [[1,130],[2,100],[3,70],[4,200],[5,180],[6,250],[7,250],[8,120],[9,300],[10,250],[11,250],[12,110]]);
  formatSheet(sheet);
  sheet.setTabColor('#27AE60');
}

// ============================================================
// SHEET: Kunjungan Rumah
// ============================================================
function buatSheetKunjunganRumah(ss) {
  hapusSheetJikaAda(ss, 'Kunjungan Rumah');
  const sheet = ss.insertSheet('Kunjungan Rumah');

  const headers = [
    'ID Kunjungan', 'Tanggal *', 'NIS *', 'Nama Siswa', 'Kelas',
    'Alamat Kunjungan *', 'Tujuan Kunjungan *',
    'Yang Ditemui', 'Hasil Kunjungan *',
    'Kesepakatan / Tindak Lanjut', 'Dokumentasi (link foto)', 'Status'
  ];
  buatHeader(sheet, headers, 1, WARNA.headerAksen);

  [2, 3, 6, 7, 9].forEach(col => {
    sheet.getRange(1, col).setBackground(WARNA.wajib).setFontColor('#000000');
  });

  tambahValidasiDropdown(sheet, 12, 2, 200, ['Selesai', 'Terjadwal', 'Batal']);

  sheet.getRange('B2:B200').setNumberFormat('DD/MM/YYYY');
  sheet.getRange('C2:C200').setNumberFormat('@');

  lebarKolom(sheet, [[1,130],[2,100],[3,100],[4,200],[5,75],[6,250],[7,250],[8,200],[9,300],[10,300],[11,250],[12,100]]);
  formatSheet(sheet);
  sheet.setTabColor('#8E44AD');
}

// ============================================================
// SHEET: Presensi Bimbingan
// ============================================================
function buatSheetPresensi(ss) {
  hapusSheetJikaAda(ss, 'Presensi Bimbingan');
  const sheet = ss.insertSheet('Presensi Bimbingan');

  const headers = [
    'ID Presensi', 'Tanggal *', 'Kelas *', 'Materi *',
    'NIS', 'Nama Siswa', 'Kehadiran *', 'Keterangan'
  ];
  buatHeader(sheet, headers, 1, WARNA.headerAksen);

  [2, 3, 4, 7].forEach(col => {
    sheet.getRange(1, col).setBackground(WARNA.wajib).setFontColor('#000000');
  });

  tambahValidasiDropdown(sheet, 7, 2, 2000, ['Hadir', 'Sakit', 'Izin', 'Alpa']);

  sheet.getRange('B2:B2000').setNumberFormat('DD/MM/YYYY');
  sheet.getRange('E2:E2000').setNumberFormat('@');

  lebarKolom(sheet, [[1,130],[2,100],[3,80],[4,250],[5,100],[6,200],[7,90],[8,200]]);
  formatSheet(sheet);
  sheet.setTabColor('#F39C12');
}

// ============================================================
// SHEET: Rekap Bulanan (template — diisi Apps Script lain)
// ============================================================
function buatSheetRekapBulanan(ss) {
  hapusSheetJikaAda(ss, 'Rekap Bulanan');
  const sheet = ss.insertSheet('Rekap Bulanan');

  // Judul
  sheet.getRange('A1:F1').merge()
    .setValue('REKAP BULANAN BK — ' + KONFIGURASI.namaSekolah.toUpperCase())
    .setBackground(WARNA.headerUtama)
    .setFontColor(WARNA.teksHeader)
    .setFontWeight('bold')
    .setFontSize(13)
    .setHorizontalAlignment('center');

  sheet.getRange('A2:F2').merge()
    .setValue('Sheet ini diisi otomatis. Gunakan menu BK > Generate Rekap Bulanan')
    .setBackground('#F8F9FA')
    .setFontColor('#7F8C8D')
    .setFontStyle('italic')
    .setHorizontalAlignment('center');

  // Placeholder tabel
  const headers = ['Bulan', 'Kasus Baru', 'Konseling Individu', 'Konseling Kelompok', 'Kunjungan Rumah', 'Keterangan'];
  buatHeader(sheet, headers, 4, WARNA.headerSekunder);

  const bulanList = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  bulanList.forEach((bln, i) => {
    sheet.getRange(5 + i, 1).setValue(bln);
    sheet.getRange(5 + i, 1, 1, 6).setBackground(i % 2 === 0 ? WARNA.barisGanjil : '#FFFFFF');
  });

  lebarKolom(sheet, [[1,120],[2,130],[3,180],[4,180],[5,150],[6,200]]);
  sheet.setFrozenRows(4);
  sheet.setTabColor('#E74C3C');
}

// ============================================================
// SHEET: Panduan
// ============================================================
function buatSheetPanduan(ss) {
  hapusSheetJikaAda(ss, 'Panduan');
  const sheet = ss.insertSheet('Panduan');

  const isi = [
    ['PANDUAN SISTEM BK — SMA NEGERI 1 CIGALONTANG', ''],
    ['', ''],
    ['URUTAN PENGISIAN DATA', ''],
    ['1.', 'Settings → Isi nama sekolah, nama guru BK, tahun pelajaran'],
    ['2.', 'Data Kelas → Isi semua kelas dan nama wali kelas'],
    ['3.', 'Data Siswa → Isi data semua siswa (NIS wajib unik)'],
    ['4.', 'Buku Kasus → Input setiap ada kasus/pelanggaran'],
    ['5.', 'Konseling Individu → Catat setelah setiap sesi konseling'],
    ['6.', 'Konseling Kelompok → Catat setelah bimbingan kelompok/klasikal'],
    ['7.', 'Kunjungan Rumah → Dokumentasikan setiap home visit'],
    ['', ''],
    ['KETERANGAN WARNA HEADER', ''],
    ['Merah muda', 'Kolom wajib diisi — tidak boleh kosong'],
    ['Biru tua', 'Header biasa'],
    ['', ''],
    ['KODE KASUS', ''],
    ['Format ID Kasus', 'KS-YYYY-MM-XXX (contoh: KS-2026-04-001)'],
    ['Format ID Konseling', 'KN-YYYY-MM-XXX'],
    ['Format ID Kelompok', 'KL-YYYY-MM-XXX'],
    ['Format ID Kunjungan', 'KR-YYYY-MM-XXX'],
    ['', ''],
    ['KATEGORI KASUS', ''],
    ['A — Kehadiran', 'Alpa, terlambat, bolos'],
    ['B — Perilaku', 'Perkelahian, bullying, tidak sopan'],
    ['C — Akademik', 'Tidak mengerjakan tugas, menyontek'],
    ['D — Atribut', 'Seragam tidak sesuai aturan'],
    ['E — Narkoba', 'Narkoba dan zat berbahaya lainnya'],
    ['F — Lainnya', 'Kasus di luar kategori di atas'],
    ['', ''],
    ['KONTAK PENGEMBANG SISTEM', ''],
    ['Dibuat untuk', KONFIGURASI.namaSekolah],
    ['Tahun', '2026'],
  ];

  sheet.getRange(1, 1, isi.length, 2).setValues(isi);

  // Format judul
  sheet.getRange('A1:B1').merge()
    .setBackground(WARNA.headerUtama)
    .setFontColor(WARNA.teksHeader)
    .setFontWeight('bold')
    .setFontSize(14)
    .setHorizontalAlignment('center');

  // Format sub-judul
  [3, 13, 17, 22, 30].forEach(r => {
    sheet.getRange(r, 1, 1, 2)
      .setBackground(WARNA.headerSekunder)
      .setFontColor(WARNA.teksHeader)
      .setFontWeight('bold');
  });

  sheet.setColumnWidth(1, 220);
  sheet.setColumnWidth(2, 500);
  sheet.setTabColor('#27AE60');
}
