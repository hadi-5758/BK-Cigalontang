/**
 * SISTEM BK — SMA Negeri 1 Cigalontang
 * File: 03_menuBK.gs
 *
 * FUNGSI:
 * - Menambahkan menu "BK" khusus di toolbar Google Sheets
 * - Menu muncul otomatis setiap spreadsheet dibuka
 */

// ============================================================
// TRIGGER — Jalankan saat spreadsheet dibuka
// ============================================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🏫 Menu BK')
    .addItem('📋 Cari Siswa', 'cariSiswa')
    .addItem('📊 Rekap Kasus per Siswa', 'rekapKasusSiswa')
    .addSeparator()
    .addSubMenu(SpreadsheetApp.getUi().createMenu('📝 Google Form')
      .addItem('Buat Form Pelaporan Pelanggaran', 'buatFormPelanggaran')
      .addItem('Perbarui Daftar Siswa di Form', 'perbaruiDaftarSiswaForm')
      .addItem('Tampilkan Link Form Pelanggaran', 'tampilkanLinkForm'))
    .addSubMenu(SpreadsheetApp.getUi().createMenu('🚨 Poin & Surat Peringatan')
      .addItem('Lihat Poin Siswa', 'lihatPoinSiswa')
      .addItem('Buat SP Manual', 'buatSPManual')
      .addItem('Rekap Poin Semua Siswa', 'rekapPoinSemuaSiswa'))
    .addSubMenu(SpreadsheetApp.getUi().createMenu('📄 Laporan PDF')
      .addItem('Generate Laporan Bulanan', 'generateLaporanBulanan')
      .addItem('Aktifkan Laporan Otomatis (tgl 28)', 'pasangTriggerLaporanBulanan'))
    .addSeparator()
    .addItem('🔄 Sinkron Data Siswa → Buku Kasus', 'sinkronDataSiswaKeBukuKasus')
    .addItem('🔁 Reset Counter (Awal Tahun Pelajaran)', 'resetSemuaCounter')
    .addSeparator()
    .addItem('ℹ️ Tentang Sistem BK', 'tentangSistem')
    .addToUi();
}

// ============================================================
// MENU: Cari Siswa
// Tampilkan semua kasus & konseling milik 1 siswa
// ============================================================
function cariSiswa() {
  const ui = SpreadsheetApp.getUi();
  const input = ui.prompt(
    'Cari Siswa',
    'Masukkan NIS siswa:',
    ui.ButtonSet.OK_CANCEL
  );

  if (input.getSelectedButton() !== ui.Button.OK) return;

  const nis = input.getResponseText().trim();
  if (nis === '') {
    ui.alert('NIS tidak boleh kosong.');
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Cari di Data Siswa
  const sheetSiswa = ss.getSheetByName('Data Siswa');
  const dataSiswa  = sheetSiswa.getDataRange().getValues();
  let infoSiswa    = null;

  for (let i = 1; i < dataSiswa.length; i++) {
    if (String(dataSiswa[i][1]).trim() === nis) {
      infoSiswa = dataSiswa[i];
      break;
    }
  }

  if (!infoSiswa) {
    ui.alert('NIS ' + nis + ' tidak ditemukan di Data Siswa.');
    return;
  }

  // Hitung kasus
  const sheetKasus = ss.getSheetByName('Buku Kasus');
  const dataKasus  = sheetKasus.getDataRange().getValues();
  let jumlahKasus  = 0;
  let kasusAktif   = 0;

  for (let i = 1; i < dataKasus.length; i++) {
    if (String(dataKasus[i][2]).trim() === nis) {
      jumlahKasus++;
      const status = dataKasus[i][10];
      if (status === 'Baru' || status === 'Proses' || status === 'Tindak Lanjut') kasusAktif++;
    }
  }

  // Hitung konseling
  const sheetKonseling = ss.getSheetByName('Konseling Individu');
  const dataKonseling  = sheetKonseling.getDataRange().getValues();
  let jumlahKonseling  = 0;

  for (let i = 1; i < dataKonseling.length; i++) {
    if (String(dataKonseling[i][3]).trim() === nis) jumlahKonseling++;
  }

  // Tampilkan hasil
  const pesan =
    '━━━━━━━━━━━━━━━━━━━━━━\n' +
    'DATA SISWA\n' +
    '━━━━━━━━━━━━━━━━━━━━━━\n' +
    'NIS      : ' + infoSiswa[1] + '\n' +
    'Nama     : ' + infoSiswa[3] + '\n' +
    'Kelas    : ' + infoSiswa[4] + '\n' +
    'No HP Ortu: ' + infoSiswa[10] + '\n\n' +
    '━━━━━━━━━━━━━━━━━━━━━━\n' +
    'RIWAYAT BK\n' +
    '━━━━━━━━━━━━━━━━━━━━━━\n' +
    'Total Kasus      : ' + jumlahKasus + '\n' +
    'Kasus Aktif      : ' + kasusAktif + '\n' +
    'Sesi Konseling   : ' + jumlahKonseling + '\n\n' +
    'Buka sheet "Buku Kasus" dan filter kolom NIS\nuntuk melihat detail kasus.';

  ui.alert('Hasil Pencarian — NIS ' + nis, pesan, ui.ButtonSet.OK);
}

// ============================================================
// MENU: Rekap Kasus per Siswa
// Buat sheet sementara berisi ringkasan jumlah kasus tiap siswa
// ============================================================
function rekapKasusSiswa() {
  const ss   = SpreadsheetApp.getActiveSpreadsheet();
  const ui   = SpreadsheetApp.getUi();

  const sheetKasus = ss.getSheetByName('Buku Kasus');
  const dataKasus  = sheetKasus.getDataRange().getValues();

  // Hitung per NIS
  const rekap = {}; // { nis: { nama, kelas, total, aktif, selesai } }

  for (let i = 1; i < dataKasus.length; i++) {
    const baris = dataKasus[i];
    const nis   = String(baris[2]).trim();
    if (nis === '') continue;

    if (!rekap[nis]) {
      rekap[nis] = { nama: baris[3], kelas: baris[4], total: 0, aktif: 0, selesai: 0 };
    }

    rekap[nis].total++;
    const status = baris[10];
    if (status === 'Selesai' || status === 'Arsip') {
      rekap[nis].selesai++;
    } else {
      rekap[nis].aktif++;
    }
  }

  if (Object.keys(rekap).length === 0) {
    ui.alert('Belum ada data kasus di Buku Kasus.');
    return;
  }

  // Buat / timpa sheet Rekap Kasus
  let sheetRekap = ss.getSheetByName('_Rekap Kasus Siswa');
  if (sheetRekap) ss.deleteSheet(sheetRekap);
  sheetRekap = ss.insertSheet('_Rekap Kasus Siswa');

  // Header
  const headers = ['No', 'NIS', 'Nama Siswa', 'Kelas', 'Total Kasus', 'Kasus Aktif', 'Kasus Selesai'];
  sheetRekap.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground('#1B4F72').setFontColor('#FFFFFF').setFontWeight('bold');

  // Data
  const baris = Object.entries(rekap)
    .sort((a, b) => b[1].aktif - a[1].aktif) // urutkan: kasus aktif terbanyak di atas
    .map(([nis, d], idx) => [idx + 1, nis, d.nama, d.kelas, d.total, d.aktif, d.selesai]);

  sheetRekap.getRange(2, 1, baris.length, headers.length).setValues(baris);

  // Warnai baris dengan kasus aktif > 2 (perlu perhatian)
  baris.forEach((row, idx) => {
    if (row[5] > 2) {
      sheetRekap.getRange(idx + 2, 1, 1, headers.length).setBackground('#FADBD8');
    }
  });

  sheetRekap.setFrozenRows(1);
  sheetRekap.setColumnWidths(1, headers.length, 130);

  ss.setActiveSheet(sheetRekap);
  ss.toast('Rekap selesai. Baris merah = siswa dengan > 2 kasus aktif.', 'Rekap Kasus', 5);
}

// ============================================================
// MENU: Tentang
// ============================================================
function tentangSistem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settings = ss.getSheetByName('Settings');
  const data = settings ? settings.getRange('A1:B20').getValues() : [];

  let namaSekolah = 'SMA Negeri 1 Cigalontang';
  let tahunPel    = '-';
  let namaGuru    = '-';

  data.forEach(row => {
    if (row[0] === 'Nama Sekolah')    namaSekolah = row[1];
    if (row[0] === 'Tahun Pelajaran') tahunPel    = row[1];
    if (row[0] === 'Nama Guru BK')    namaGuru    = row[1];
  });

  SpreadsheetApp.getUi().alert(
    'Tentang Sistem BK',
    'Sistem Administrasi & Pelaporan BK\n\n' +
    'Sekolah       : ' + namaSekolah + '\n' +
    'Tahun Pelajaran: ' + tahunPel + '\n' +
    'Guru BK       : ' + namaGuru + '\n\n' +
    'Sheet yang tersedia:\n' +
    '• Data Siswa & Data Kelas\n' +
    '• Buku Kasus\n' +
    '• Konseling Individu & Kelompok\n' +
    '• Kunjungan Rumah\n' +
    '• Presensi Bimbingan\n' +
    '• Rekap Bulanan',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}
