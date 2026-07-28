/**
 * SISTEM BK — SMA Negeri 1 Cigalontang
 * File: 05_laporanBulanan.gs
 *
 * FUNGSI:
 * - Generate laporan bulanan BK dalam format sheet siap cetak
 * - Export laporan ke PDF dan simpan ke Google Drive
 * - Kirim PDF ke email Kepala Sekolah secara otomatis
 * - Bisa dijalankan manual atau via trigger terjadwal (tiap akhir bulan)
 *
 * CARA PAKAI:
 * 1. Pastikan semua data bulan sudah lengkap di sheet Buku Kasus,
 *    Konseling Individu, Konseling Kelompok, dan Kunjungan Rumah
 * 2. Jalankan fungsi generateLaporanBulanan() dari menu BK
 * 3. PDF tersimpan di Google Drive folder "Laporan BK"
 */

// ============================================================
// KONFIGURASI LAPORAN
// ============================================================
const CFG_LAPORAN = {
  emailKepsek    : 'kepsek@smancigalontang.sch.id', // ganti email kepala sekolah
  namaDrivFolder : 'Laporan BK',                     // nama folder di Google Drive
  kirimEmail     : true,                             // false = tidak kirim email
};

// ============================================================
// FUNGSI UTAMA — Jalankan dari menu BK
// ============================================================
function generateLaporanBulanan() {
  const ui = SpreadsheetApp.getUi();

  // Pilih bulan & tahun
  const inputBulan = ui.prompt(
    'Generate Laporan Bulanan',
    'Masukkan bulan dan tahun laporan\n(format: MM/YYYY — contoh: 04/2026):',
    ui.ButtonSet.OK_CANCEL
  );
  if (inputBulan.getSelectedButton() !== ui.Button.OK) return;

  const teks = inputBulan.getResponseText().trim();
  if (!/^\d{2}\/\d{4}$/.test(teks)) {
    ui.alert('Format salah. Gunakan MM/YYYY — contoh: 04/2026');
    return;
  }

  const [bulanStr, tahunStr] = teks.split('/');
  const bulan = parseInt(bulanStr);
  const tahun = parseInt(tahunStr);

  if (bulan < 1 || bulan > 12) {
    ui.alert('Bulan tidak valid (harus 01–12).');
    return;
  }

  try {
    SpreadsheetApp.getActiveSpreadsheet().toast('Sedang membuat laporan...', 'Proses', -1);

    const data    = kumpulkanDataBulan(bulan, tahun);
    const sheetLaporan = buatSheetLaporan(data, bulan, tahun);

    SpreadsheetApp.flush();
    Utilities.sleep(1500); // beri waktu render

    const pdfBlob = exportSheetKePDF(sheetLaporan);
    const fileUrl = simpanPDFKeDrive(pdfBlob, bulan, tahun);

    if (CFG_LAPORAN.kirimEmail) {
      kirimEmailLaporan(pdfBlob, data, bulan, tahun);
    }

    SpreadsheetApp.getActiveSpreadsheet().toast('', '', 1);

    ui.alert(
      '✅ Laporan Berhasil Dibuat',
      'Laporan Bulanan BK — ' + namaBulan(bulan) + ' ' + tahun + '\n\n' +
      '📄 PDF tersimpan di Google Drive\n' +
      '   Folder: ' + CFG_LAPORAN.namaDrivFolder + '\n\n' +
      (CFG_LAPORAN.kirimEmail
        ? '📧 Email terkirim ke: ' + CFG_LAPORAN.emailKepsek
        : '📧 Pengiriman email dinonaktifkan.') + '\n\n' +
      'Buka sheet "Laporan ' + namaBulan(bulan) + ' ' + tahun + '" untuk pratinjau.',
      ui.ButtonSet.OK
    );

  } catch (err) {
    SpreadsheetApp.getActiveSpreadsheet().toast('', '', 1);
    ui.alert('❌ Gagal membuat laporan: ' + err.message);
    console.error(err);
  }
}

// ============================================================
// KUMPULKAN DATA DARI SEMUA SHEET UNTUK SATU BULAN
// ============================================================
function kumpulkanDataBulan(bulan, tahun) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  return {
    kasus       : filterDataBulan(ss, 'Buku Kasus',          1, bulan, tahun),
    konseling   : filterDataBulan(ss, 'Konseling Individu',  1, bulan, tahun),
    kelompok    : filterDataBulan(ss, 'Konseling Kelompok',  1, bulan, tahun),
    kunjungan   : filterDataBulan(ss, 'Kunjungan Rumah',     1, bulan, tahun),
    namaSekolah : ambilSetting('Nama Sekolah'),
    namaGuruBK  : ambilSetting('Nama Guru BK'),
    nip         : ambilSetting('NIP'),
    tahunPel    : ambilSetting('Tahun Pelajaran'),
    semester    : ambilSetting('Semester'),
  };
}

/**
 * Filter baris berdasarkan bulan & tahun pada kolom tanggal tertentu
 * @param {Spreadsheet} ss
 * @param {string}      namaSheet
 * @param {number}      kolomTanggal - index kolom (0-based)
 * @param {number}      bulan
 * @param {number}      tahun
 */
function filterDataBulan(ss, namaSheet, kolomTanggal, bulan, tahun) {
  const sheet = ss.getSheetByName(namaSheet);
  if (!sheet) return [];

  const data  = sheet.getDataRange().getValues();
  const hasil = [];

  for (let i = 1; i < data.length; i++) {
    const baris = data[i];
    if (baris.every(sel => sel === '')) continue; // skip baris kosong

    const tgl = parseTanggal(baris[kolomTanggal]);
    if (!tgl) continue;
    if (tgl.getMonth() + 1 === bulan && tgl.getFullYear() === tahun) {
      hasil.push(baris);
    }
  }
  return hasil;
}

function parseTanggal(nilai) {
  if (nilai instanceof Date) return nilai;
  if (typeof nilai === 'string') {
    // Coba DD/MM/YYYY
    const parts = nilai.split('/');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      if (!isNaN(d)) return d;
    }
  }
  return null;
}

// ============================================================
// BUAT SHEET LAPORAN SIAP CETAK
// ============================================================
function buatSheetLaporan(data, bulan, tahun) {
  const ss        = SpreadsheetApp.getActiveSpreadsheet();
  const namaSheet = 'Laporan ' + namaBulan(bulan) + ' ' + tahun;

  // Hapus jika sudah ada
  const existing = ss.getSheetByName(namaSheet);
  if (existing) ss.deleteSheet(existing);

  const sheet = ss.insertSheet(namaSheet);
  let baris   = 1;

  // ── KOP LAPORAN ────────────────────────────────────────────
  baris = tulisKopLaporan(sheet, data, bulan, tahun, baris);

  // ── RINGKASAN EKSEKUTIF ────────────────────────────────────
  baris = tulisRingkasan(sheet, data, baris);

  // ── TABEL 1: Rekap Kasus ───────────────────────────────────
  baris = tulisTabelKasus(sheet, data.kasus, baris);

  // ── TABEL 2: Rekap Konseling Individu ─────────────────────
  baris = tulisTabelKonseling(sheet, data.konseling, baris);

  // ── TABEL 3: Rekap Konseling Kelompok ─────────────────────
  baris = tulisTabelKelompok(sheet, data.kelompok, baris);

  // ── TABEL 4: Rekap Kunjungan Rumah ────────────────────────
  baris = tulisTabelKunjungan(sheet, data.kunjungan, baris);

  // ── STATISTIK KATEGORI KASUS ───────────────────────────────
  baris = tulisStatistikKategori(sheet, data.kasus, baris);

  // ── TANDA TANGAN ──────────────────────────────────────────
  tulisTandaTangan(sheet, data, bulan, tahun, baris + 1);

  // Format halaman
  sheet.setColumnWidth(1, 30);
  sheet.setColumnWidth(2, 120);
  sheet.setColumnWidth(3, 110);
  sheet.setColumnWidth(4, 200);
  sheet.setColumnWidth(5, 140);
  sheet.setColumnWidth(6, 140);
  sheet.setColumnWidth(7, 140);
  sheet.setColumnWidth(8, 140);

  ss.setActiveSheet(sheet);
  return sheet;
}

// ── KOP ─────────────────────────────────────────────────────
function tulisKopLaporan(sheet, data, bulan, tahun, baris) {
  const judul = [
    ['LAPORAN BULANAN BIMBINGAN DAN KONSELING'],
    [data.namaSekolah.toUpperCase()],
    [namaBulan(bulan).toUpperCase() + ' ' + tahun +
     ' | Tahun Pelajaran ' + data.tahunPel + ' | Semester ' + data.semester],
  ];

  judul.forEach((teks, i) => {
    sheet.getRange(baris + i, 1, 1, 8).merge().setValue(teks[0])
      .setHorizontalAlignment('center')
      .setFontWeight(i === 0 ? 'bold' : 'normal')
      .setFontSize(i === 0 ? 14 : i === 1 ? 12 : 11);
  });

  sheet.getRange(baris, 1, 3, 8).setBackground('#1B4F72').setFontColor('#FFFFFF');

  // Garis bawah kop
  sheet.getRange(baris + 3, 1, 1, 8)
    .setBorder(false, false, true, false, false, false, '#1B4F72', SpreadsheetApp.BorderStyle.SOLID_THICK);

  return baris + 5;
}

// ── RINGKASAN ────────────────────────────────────────────────
function tulisRingkasan(sheet, data, baris) {
  // Judul seksi
  sheet.getRange(baris, 1, 1, 8).merge().setValue('A. RINGKASAN KEGIATAN BK')
    .setBackground('#2E86C1').setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(11);
  baris++;

  const ringkasan = [
    ['Jumlah Kasus Masuk',         data.kasus.length],
    ['Kasus Selesai',              data.kasus.filter(r => r[10] === 'Selesai').length],
    ['Kasus Masih Proses',         data.kasus.filter(r => r[10] === 'Proses' || r[10] === 'Tindak Lanjut').length],
    ['Sesi Konseling Individu',    data.konseling.length],
    ['Sesi Bimbingan Kelompok',    data.kelompok.length],
    ['Kunjungan Rumah',            data.kunjungan.length],
  ];

  ringkasan.forEach(([label, nilai], i) => {
    const bg = i % 2 === 0 ? '#EBF5FB' : '#FFFFFF';
    sheet.getRange(baris, 2, 1, 3).merge().setValue(label).setBackground(bg);
    sheet.getRange(baris, 5).setValue(nilai).setBackground(bg).setHorizontalAlignment('center').setFontWeight('bold');
    sheet.getRange(baris, 6, 1, 3).setBackground(bg);
    baris++;
  });

  return baris + 1;
}

// ── TABEL KASUS ──────────────────────────────────────────────
function tulisTabelKasus(sheet, kasus, baris) {
  sheet.getRange(baris, 1, 1, 8).merge().setValue('B. DAFTAR KASUS BULAN INI')
    .setBackground('#2E86C1').setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(11);
  baris++;

  if (kasus.length === 0) {
    sheet.getRange(baris, 1, 1, 8).merge().setValue('Tidak ada kasus pada bulan ini.')
      .setFontStyle('italic').setHorizontalAlignment('center').setBackground('#F8F9FA');
    return baris + 2;
  }

  const headers = ['No', 'ID Kasus', 'Tanggal', 'Nama Siswa', 'Kelas', 'Kategori', 'Status', 'Tindak Lanjut'];
  sheet.getRange(baris, 1, 1, headers.length).setValues([headers])
    .setBackground('#1B4F72').setFontColor('#FFFFFF').setFontWeight('bold')
    .setHorizontalAlignment('center');
  baris++;

  kasus.forEach((row, i) => {
    const bg = i % 2 === 0 ? '#EBF5FB' : '#FFFFFF';
    const tglFmt = row[1] instanceof Date
      ? Utilities.formatDate(row[1], 'Asia/Jakarta', 'dd/MM/yyyy')
      : row[1];
    sheet.getRange(baris, 1, 1, 8).setValues([[
      i + 1, row[0], tglFmt, row[3], row[4], row[5], row[10], row[9]
    ]]).setBackground(bg);
    baris++;
  });

  return baris + 1;
}

// ── TABEL KONSELING INDIVIDU ─────────────────────────────────
function tulisTabelKonseling(sheet, konseling, baris) {
  sheet.getRange(baris, 1, 1, 8).merge().setValue('C. DAFTAR KONSELING INDIVIDU')
    .setBackground('#2E86C1').setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(11);
  baris++;

  if (konseling.length === 0) {
    sheet.getRange(baris, 1, 1, 8).merge().setValue('Tidak ada sesi konseling individu pada bulan ini.')
      .setFontStyle('italic').setHorizontalAlignment('center').setBackground('#F8F9FA');
    return baris + 2;
  }

  const headers = ['No', 'ID', 'Tanggal', 'Nama Siswa', 'Kelas', 'Jenis Masalah', 'Status', 'Tindak Lanjut'];
  sheet.getRange(baris, 1, 1, headers.length).setValues([headers])
    .setBackground('#1B4F72').setFontColor('#FFFFFF').setFontWeight('bold')
    .setHorizontalAlignment('center');
  baris++;

  konseling.forEach((row, i) => {
    const bg  = i % 2 === 0 ? '#EAFAF1' : '#FFFFFF';
    const tgl = row[1] instanceof Date
      ? Utilities.formatDate(row[1], 'Asia/Jakarta', 'dd/MM/yyyy')
      : row[1];
    sheet.getRange(baris, 1, 1, 8).setValues([[
      i + 1, row[0], tgl, row[4], row[5], row[6], row[11], row[9]
    ]]).setBackground(bg);
    baris++;
  });

  return baris + 1;
}

// ── TABEL KONSELING KELOMPOK ─────────────────────────────────
function tulisTabelKelompok(sheet, kelompok, baris) {
  sheet.getRange(baris, 1, 1, 8).merge().setValue('D. DAFTAR BIMBINGAN / KONSELING KELOMPOK')
    .setBackground('#2E86C1').setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(11);
  baris++;

  if (kelompok.length === 0) {
    sheet.getRange(baris, 1, 1, 8).merge().setValue('Tidak ada sesi kelompok pada bulan ini.')
      .setFontStyle('italic').setHorizontalAlignment('center').setBackground('#F8F9FA');
    return baris + 2;
  }

  const headers = ['No', 'ID', 'Tanggal', 'Tema / Topik', 'Jenis Layanan', 'Jumlah Peserta', 'Status', ''];
  sheet.getRange(baris, 1, 1, headers.length).setValues([headers])
    .setBackground('#1B4F72').setFontColor('#FFFFFF').setFontWeight('bold')
    .setHorizontalAlignment('center');
  baris++;

  kelompok.forEach((row, i) => {
    const bg  = i % 2 === 0 ? '#EAFAF1' : '#FFFFFF';
    const tgl = row[1] instanceof Date
      ? Utilities.formatDate(row[1], 'Asia/Jakarta', 'dd/MM/yyyy')
      : row[1];
    sheet.getRange(baris, 1, 1, 8).setValues([[
      i + 1, row[0], tgl, row[3], row[4], row[7], row[11], ''
    ]]).setBackground(bg);
    baris++;
  });

  return baris + 1;
}

// ── TABEL KUNJUNGAN RUMAH ────────────────────────────────────
function tulisTabelKunjungan(sheet, kunjungan, baris) {
  sheet.getRange(baris, 1, 1, 8).merge().setValue('E. DAFTAR KUNJUNGAN RUMAH')
    .setBackground('#2E86C1').setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(11);
  baris++;

  if (kunjungan.length === 0) {
    sheet.getRange(baris, 1, 1, 8).merge().setValue('Tidak ada kunjungan rumah pada bulan ini.')
      .setFontStyle('italic').setHorizontalAlignment('center').setBackground('#F8F9FA');
    return baris + 2;
  }

  const headers = ['No', 'ID', 'Tanggal', 'Nama Siswa', 'Kelas', 'Tujuan Kunjungan', 'Status', ''];
  sheet.getRange(baris, 1, 1, headers.length).setValues([headers])
    .setBackground('#1B4F72').setFontColor('#FFFFFF').setFontWeight('bold')
    .setHorizontalAlignment('center');
  baris++;

  kunjungan.forEach((row, i) => {
    const bg  = i % 2 === 0 ? '#F5EEF8' : '#FFFFFF';
    const tgl = row[1] instanceof Date
      ? Utilities.formatDate(row[1], 'Asia/Jakarta', 'dd/MM/yyyy')
      : row[1];
    sheet.getRange(baris, 1, 1, 8).setValues([[
      i + 1, row[0], tgl, row[3], row[4], row[6], row[11], ''
    ]]).setBackground(bg);
    baris++;
  });

  return baris + 1;
}

// ── STATISTIK KATEGORI ───────────────────────────────────────
function tulisStatistikKategori(sheet, kasus, baris) {
  sheet.getRange(baris, 1, 1, 8).merge().setValue('F. STATISTIK KASUS PER KATEGORI')
    .setBackground('#2E86C1').setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(11);
  baris++;

  const kategoriList = [
    'A - Kehadiran (alpa, terlambat, bolos)',
    'B - Perilaku (perkelahian, bullying, tidak sopan)',
    'C - Akademik (tidak mengerjakan tugas, menyontek)',
    'D - Atribut & Seragam',
    'E - Narkoba & Zat Berbahaya',
    'F - Lainnya',
  ];

  const hitungan = {};
  kasus.forEach(row => {
    const kat = String(row[5]);
    const cocok = kategoriList.find(k => kat.startsWith(k.charAt(0)));
    const kunci = cocok || 'F - Lainnya';
    hitungan[kunci] = (hitungan[kunci] || 0) + 1;
  });

  const headers = ['No', 'Kategori', '', '', '', 'Jumlah Kasus', 'Persentase', ''];
  sheet.getRange(baris, 1, 1, 8).setValues([headers])
    .setBackground('#1B4F72').setFontColor('#FFFFFF').setFontWeight('bold')
    .setHorizontalAlignment('center');
  baris++;

  const total = kasus.length || 1;
  kategoriList.forEach((kat, i) => {
    const jml  = hitungan[kat] || 0;
    const pct  = ((jml / total) * 100).toFixed(1) + '%';
    const bg   = i % 2 === 0 ? '#FEF9E7' : '#FFFFFF';
    sheet.getRange(baris, 1, 1, 8).setValues([[
      i + 1, kat, '', '', '', jml, pct, ''
    ]]).setBackground(bg);
    sheet.getRange(baris, 2, 1, 4).merge();
    baris++;
  });

  // Total
  sheet.getRange(baris, 1, 1, 8).setValues([['', 'TOTAL', '', '', '', kasus.length, '100%', '']])
    .setFontWeight('bold').setBackground('#D5D8DC');
  sheet.getRange(baris, 2, 1, 4).merge();

  return baris + 2;
}

// ── TANDA TANGAN ─────────────────────────────────────────────
function tulisTandaTangan(sheet, data, bulan, tahun, baris) {
  const tglHari = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd MMMM yyyy');

  sheet.getRange(baris, 1, 1, 8).setBorder(
    true, false, false, false, false, false, '#BDC3C7', SpreadsheetApp.BorderStyle.SOLID
  );
  baris++;

  // Kiri: Guru BK | Kanan: Kepala Sekolah
  sheet.getRange(baris, 2, 1, 3).merge().setValue('Mengetahui,').setHorizontalAlignment('center');
  sheet.getRange(baris, 6, 1, 3).merge().setValue('Cigalontang, ' + tglHari).setHorizontalAlignment('center');
  baris++;

  sheet.getRange(baris, 2, 1, 3).merge().setValue('Kepala Sekolah').setHorizontalAlignment('center').setFontWeight('bold');
  sheet.getRange(baris, 6, 1, 3).merge().setValue('Guru Bimbingan Konseling').setHorizontalAlignment('center').setFontWeight('bold');
  baris++;

  // Spasi tanda tangan
  for (let s = 0; s < 4; s++) {
    sheet.setRowHeight(baris, 25);
    baris++;
  }

  sheet.getRange(baris, 2, 1, 3).merge().setValue('_______________________').setHorizontalAlignment('center');
  sheet.getRange(baris, 6, 1, 3).merge().setValue(data.namaGuruBK || '_______________________').setHorizontalAlignment('center').setFontWeight('bold');
  baris++;

  sheet.getRange(baris, 2, 1, 3).merge().setValue('NIP. ___________________').setHorizontalAlignment('center');
  sheet.getRange(baris, 6, 1, 3).merge().setValue('NIP. ' + (data.nip || '___________________')).setHorizontalAlignment('center');
}

// ============================================================
// EXPORT SHEET KE PDF
// ============================================================
function exportSheetKePDF(sheet) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const ssId  = ss.getId();
  const gid   = sheet.getSheetId();

  const url =
    'https://docs.google.com/spreadsheets/d/' + ssId +
    '/export?format=pdf' +
    '&gid=' + gid +
    '&size=A4' +
    '&portrait=true' +
    '&fitw=true' +
    '&sheetnames=false' +
    '&printtitle=false' +
    '&pagenumbers=true' +
    '&gridlines=false' +
    '&fzr=false';

  const token    = ScriptApp.getOAuthToken();
  const response = UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true,
  });

  if (response.getResponseCode() !== 200) {
    throw new Error('Gagal export PDF (kode: ' + response.getResponseCode() + ')');
  }

  return response.getBlob().setName(
    'Laporan_BK_' + sheet.getName().replace(/ /g, '_') + '.pdf'
  );
}

// ============================================================
// SIMPAN PDF KE GOOGLE DRIVE
// ============================================================
function simpanPDFKeDrive(blob, bulan, tahun) {
  let folder;
  const folders = DriveApp.getFoldersByName(CFG_LAPORAN.namaDrivFolder);

  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder(CFG_LAPORAN.namaDrivFolder);
  }

  // Sub-folder per tahun
  const subNama    = String(tahun);
  const subFolders = folder.getFoldersByName(subNama);
  const subFolder  = subFolders.hasNext() ? subFolders.next() : folder.createFolder(subNama);

  const file = subFolder.createFile(blob);
  return file.getUrl();
}

// ============================================================
// KIRIM EMAIL KE KEPALA SEKOLAH
// ============================================================
function kirimEmailLaporan(blob, data, bulan, tahun) {
  if (!CFG_LAPORAN.emailKepsek || CFG_LAPORAN.emailKepsek.includes('smancigalontang')) {
    // Email masih default / belum dikonfigurasi — skip tanpa error
    console.log('Email kepsek belum dikonfigurasi, skip pengiriman.');
    return;
  }

  const subjek =
    'Laporan Bulanan BK — ' + namaBulan(bulan) + ' ' + tahun +
    ' | ' + data.namaSekolah;

  const isi =
    'Yth. Kepala ' + data.namaSekolah + ',\n\n' +
    'Bersama email ini kami lampirkan Laporan Bulanan Bimbingan dan Konseling\n' +
    'bulan ' + namaBulan(bulan) + ' ' + tahun + '.\n\n' +
    'Ringkasan:\n' +
    '• Jumlah Kasus    : ' + data.kasus.length + '\n' +
    '• Konseling Individu : ' + data.konseling.length + ' sesi\n' +
    '• Bimbingan Kelompok : ' + data.kelompok.length + ' sesi\n' +
    '• Kunjungan Rumah : ' + data.kunjungan.length + '\n\n' +
    'Hormat kami,\n' +
    data.namaGuruBK + '\n' +
    'Guru BK — ' + data.namaSekolah;

  GmailApp.sendEmail(CFG_LAPORAN.emailKepsek, subjek, isi, {
    attachments : [blob],
    name        : 'Sistem BK ' + data.namaSekolah,
  });
}

// ============================================================
// TRIGGER TERJADWAL — Jalankan otomatis tiap akhir bulan
// Pasang sekali dari menu BK → Pengaturan Trigger Laporan
// ============================================================
function pasangTriggerLaporanBulanan() {
  // Hapus trigger lama agar tidak duplikat
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'autoLaporanAkhirBulan') {
      ScriptApp.deleteTrigger(t);
    }
  });

  // Jadwalkan tiap tanggal 28 jam 06.00 (mencakup semua bulan)
  ScriptApp.newTrigger('autoLaporanAkhirBulan')
    .timeBased()
    .onMonthDay(28)
    .atHour(6)
    .create();

  SpreadsheetApp.getUi().alert(
    '✅ Trigger terpasang!\n\n' +
    'Laporan akan digenerate otomatis setiap tanggal 28\n' +
    'dan dikirim ke email kepala sekolah.'
  );
}

function autoLaporanAkhirBulan() {
  const now   = new Date();
  const bulan = now.getMonth() + 1;
  const tahun = now.getFullYear();

  try {
    const data         = kumpulkanDataBulan(bulan, tahun);
    const sheetLaporan = buatSheetLaporan(data, bulan, tahun);
    SpreadsheetApp.flush();
    Utilities.sleep(2000);

    const pdfBlob = exportSheetKePDF(sheetLaporan);
    simpanPDFKeDrive(pdfBlob, bulan, tahun);

    if (CFG_LAPORAN.kirimEmail) {
      kirimEmailLaporan(pdfBlob, data, bulan, tahun);
    }

    console.log('Laporan bulanan otomatis berhasil: ' + namaBulan(bulan) + ' ' + tahun);
  } catch (err) {
    console.error('autoLaporanAkhirBulan error: ' + err.message);
    // Kirim notifikasi error ke guru BK
    GmailApp.sendEmail(
      Session.getEffectiveUser().getEmail(),
      '⚠️ Gagal Generate Laporan BK Otomatis',
      'Terjadi error saat generate laporan bulan ' + namaBulan(bulan) + ' ' + tahun + ':\n\n' + err.message
    );
  }
}

// ============================================================
// HELPER — Nama bulan Bahasa Indonesia
// ============================================================
function namaBulan(n) {
  return ['', 'Januari','Februari','Maret','April','Mei','Juni',
          'Juli','Agustus','September','Oktober','November','Desember'][n];
}
