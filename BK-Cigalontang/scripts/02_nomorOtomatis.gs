/**
 * SISTEM BK — SMA Negeri 1 Cigalontang
 * File: 02_nomorOtomatis.gs
 *
 * FUNGSI:
 * - Generate nomor/ID unik otomatis saat baris baru diisi
 * - Auto-isi kolom Nama Siswa & Kelas dari NIS yang diketik
 * - Trigger onEdit: berjalan otomatis setiap ada perubahan
 *
 * CARA PASANG TRIGGER:
 * 1. Di Apps Script editor, klik ikon jam (Triggers) di sidebar kiri
 * 2. Klik "+ Add Trigger" (pojok kanan bawah)
 * 3. Isi:
 *    - Function: onEditBK
 *    - Event source: From spreadsheet
 *    - Event type: On edit
 * 4. Klik Save
 */

// ============================================================
// TRIGGER UTAMA — dipanggil otomatis setiap ada edit
// ============================================================
function onEditBK(e) {
  if (!e || !e.range) return;

  const sheet = e.range.getSheet();
  const namaSheet = sheet.getName();
  const kolom = e.range.getColumn();
  const baris = e.range.getRow();

  // Lewati baris header
  if (baris <= 1) return;

  try {
    switch (namaSheet) {
      case 'Buku Kasus':
        if (kolom === 2) generateIdKasus(sheet, baris);      // Tanggal diisi → buat ID
        if (kolom === 3) autoIsiDataSiswa(sheet, baris, 3, 4, 5); // NIS → Nama, Kelas
        break;

      case 'Konseling Individu':
        if (kolom === 2) generateIdKonseling(sheet, baris);
        if (kolom === 4) autoIsiDataSiswa(sheet, baris, 4, 5, 6);
        break;

      case 'Konseling Kelompok':
        if (kolom === 2) generateIdKelompok(sheet, baris);
        break;

      case 'Kunjungan Rumah':
        if (kolom === 2) generateIdKunjungan(sheet, baris);
        if (kolom === 3) autoIsiDataSiswa(sheet, baris, 3, 4, 5);
        break;

      case 'Presensi Bimbingan':
        if (kolom === 2) generateIdPresensi(sheet, baris);
        if (kolom === 5) autoIsiNamaSiswa(sheet, baris, 5, 6);
        break;
    }
  } catch (err) {
    console.error('onEditBK error di sheet ' + namaSheet + ': ' + err.message);
  }
}

// ============================================================
// HELPER — Ambil counter dari Settings dan naikkan
// ============================================================
function ambilDanNaikkanCounter(namaCounter) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settings = ss.getSheetByName('Settings');
  if (!settings) throw new Error('Sheet Settings tidak ditemukan.');

  // Cari baris counter berdasarkan label
  const dataSettings = settings.getRange('A1:B20').getValues();
  for (let i = 0; i < dataSettings.length; i++) {
    if (dataSettings[i][0] === namaCounter) {
      const nilaiLama = parseInt(dataSettings[i][1]) || 1;
      settings.getRange(i + 1, 2).setValue(nilaiLama + 1);
      return nilaiLama;
    }
  }
  throw new Error('Counter "' + namaCounter + '" tidak ditemukan di Settings.');
}

function formatNomor(angka) {
  return String(angka).padStart(3, '0'); // 1 → "001"
}

function buatPrefixTanggal() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  return yyyy + '-' + mm;
}

// ============================================================
// GENERATOR ID PER SHEET
// ============================================================
function generateIdKasus(sheet, baris) {
  if (sheet.getRange(baris, 1).getValue() !== '') return; // sudah ada ID
  const no = ambilDanNaikkanCounter('Counter Kasus');
  const id = 'KS-' + buatPrefixTanggal() + '-' + formatNomor(no);
  sheet.getRange(baris, 1).setValue(id);
}

function generateIdKonseling(sheet, baris) {
  if (sheet.getRange(baris, 1).getValue() !== '') return;
  const no = ambilDanNaikkanCounter('Counter Konseling');
  const id = 'KN-' + buatPrefixTanggal() + '-' + formatNomor(no);
  sheet.getRange(baris, 1).setValue(id);
}

function generateIdKelompok(sheet, baris) {
  if (sheet.getRange(baris, 1).getValue() !== '') return;
  const no = ambilDanNaikkanCounter('Counter Kelompok');
  const id = 'KL-' + buatPrefixTanggal() + '-' + formatNomor(no);
  sheet.getRange(baris, 1).setValue(id);
}

function generateIdKunjungan(sheet, baris) {
  if (sheet.getRange(baris, 1).getValue() !== '') return;
  const no = ambilDanNaikkanCounter('Counter Kunjungan');
  const id = 'KR-' + buatPrefixTanggal() + '-' + formatNomor(no);
  sheet.getRange(baris, 1).setValue(id);
}

function generateIdPresensi(sheet, baris) {
  if (sheet.getRange(baris, 1).getValue() !== '') return;
  const no = ambilDanNaikkanCounter('Counter Presensi');
  const id = 'PR-' + buatPrefixTanggal() + '-' + formatNomor(no);
  sheet.getRange(baris, 1).setValue(id);
}

// ============================================================
// AUTO-ISI DATA SISWA dari NIS
// Membaca sheet Data Siswa, mencocokkan NIS,
// lalu mengisi kolom Nama dan Kelas secara otomatis
// ============================================================
function ambilDataSiswa() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetSiswa = ss.getSheetByName('Data Siswa');
  if (!sheetSiswa) return {};

  const data = sheetSiswa.getDataRange().getValues();
  const index = {};

  // Kolom: No(0) NIS(1) NISN(2) Nama(3) Kelas(4) JK(5) ...
  for (let i = 1; i < data.length; i++) {
    const nis = String(data[i][1]).trim();
    if (nis === '' || nis === 'NIS *') continue;
    index[nis] = {
      nama  : data[i][3],
      kelas : data[i][4],
    };
  }
  return index;
}

/**
 * Auto-isi Nama Siswa dan Kelas berdasarkan NIS yang diketik.
 * @param {Sheet}  sheet        - sheet aktif
 * @param {number} baris        - nomor baris yang diedit
 * @param {number} kolomNIS     - kolom tempat NIS diketik
 * @param {number} kolomNama    - kolom yang akan diisi nama
 * @param {number} kolomKelas   - kolom yang akan diisi kelas
 */
function autoIsiDataSiswa(sheet, baris, kolomNIS, kolomNama, kolomKelas) {
  const nis = String(sheet.getRange(baris, kolomNIS).getValue()).trim();
  if (nis === '') return;

  const dataSiswa = ambilDataSiswa();
  const siswa = dataSiswa[nis];

  if (siswa) {
    sheet.getRange(baris, kolomNama).setValue(siswa.nama);
    sheet.getRange(baris, kolomKelas).setValue(siswa.kelas);
  } else {
    // NIS tidak ditemukan — beri tanda merah
    sheet.getRange(baris, kolomNIS)
      .setBackground('#FADBD8')
      .setNote('⚠️ NIS tidak ditemukan di sheet Data Siswa. Periksa kembali.');
  }
}

/**
 * Auto-isi hanya Nama (tanpa Kelas) — untuk Presensi
 */
function autoIsiNamaSiswa(sheet, baris, kolomNIS, kolomNama) {
  const nis = String(sheet.getRange(baris, kolomNIS).getValue()).trim();
  if (nis === '') return;

  const dataSiswa = ambilDataSiswa();
  const siswa = dataSiswa[nis];

  if (siswa) {
    sheet.getRange(baris, kolomNama).setValue(siswa.nama);
    sheet.getRange(baris, kolomNIS).setBackground(null).clearNote();
  } else {
    sheet.getRange(baris, kolomNIS)
      .setBackground('#FADBD8')
      .setNote('⚠️ NIS tidak ditemukan di sheet Data Siswa.');
  }
}

// ============================================================
// UTILITAS — Bisa dijalankan manual dari editor jika perlu
// ============================================================

/**
 * Reset semua counter ke 1 (gunakan di awal tahun pelajaran baru)
 */
function resetSemuaCounter() {
  const ui = SpreadsheetApp.getUi();
  const konfirmasi = ui.alert(
    'Reset Counter',
    'Semua nomor urut ID akan direset ke 1.\n' +
    'Lakukan ini hanya di awal tahun pelajaran baru.\n\n' +
    'Lanjutkan?',
    ui.ButtonSet.YES_NO
  );

  if (konfirmasi !== ui.Button.YES) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settings = ss.getSheetByName('Settings');
  const data = settings.getRange('A1:B20').getValues();

  const counterList = [
    'Counter Kasus',
    'Counter Konseling',
    'Counter Kelompok',
    'Counter Kunjungan',
    'Counter Presensi',
  ];

  for (let i = 0; i < data.length; i++) {
    if (counterList.includes(data[i][0])) {
      settings.getRange(i + 1, 2).setValue(1);
    }
  }

  ui.alert('✅ Semua counter berhasil direset ke 1.');
}

/**
 * Isi ulang Nama & Kelas di seluruh sheet Buku Kasus (jika data siswa diperbarui)
 */
function sinkronDataSiswaKeBukuKasus() {
  const ss   = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Buku Kasus');
  if (!sheet) return;

  const dataSiswa = ambilDataSiswa();
  const data = sheet.getDataRange().getValues();

  // Kumpulkan perubahan, tulis sekaligus (efisien)
  const updateNama  = [];
  const updateKelas = [];
  const barisUpdate = [];

  for (let i = 1; i < data.length; i++) {
    const nis = String(data[i][2]).trim(); // kolom C = NIS
    if (nis === '') continue;
    const siswa = dataSiswa[nis];
    if (siswa) {
      barisUpdate.push(i + 1);
      updateNama.push([siswa.nama]);
      updateKelas.push([siswa.kelas]);
    }
  }

  barisUpdate.forEach((baris, idx) => {
    sheet.getRange(baris, 4).setValue(updateNama[idx][0]);  // kolom D = Nama
    sheet.getRange(baris, 5).setValue(updateKelas[idx][0]); // kolom E = Kelas
  });

  SpreadsheetApp.getActiveSpreadsheet().toast(
    barisUpdate.length + ' baris diperbarui.',
    'Sinkronisasi Selesai', 4
  );
}
