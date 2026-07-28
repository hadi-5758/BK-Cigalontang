/**
 * SISTEM BK — SMA Negeri 1 Cigalontang
 * File: 04_formPelanggaran.gs
 *
 * FUNGSI:
 * - Buat Google Form pelaporan pelanggaran dengan cabang per kelas
 * - Pelapor pilih kelas → muncul dropdown nama siswa kelas itu saja
 * - NISN otomatis terbaca dari pilihan nama (format: "Nama (NISN: xxxxxx)")
 * - Respons masuk otomatis ke sheet Buku Kasus
 * - Perbarui daftar siswa tanpa buat ulang form dari awal
 */

// ============================================================
// BUAT FORM LENGKAP (jalankan 1x saat pertama setup)
// ============================================================
function buatFormPelanggaran() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Cek apakah form sudah ada
  const idLama = ambilSetting('ID Form Pelanggaran');
  if (idLama) {
    const konfirmasi = ui.alert(
      'Form Sudah Ada',
      'Form pelanggaran sudah pernah dibuat.\n\n' +
      'Membuat ulang akan mengganti form lama (link berubah).\n' +
      'Untuk memperbarui daftar siswa tanpa ganti link,\n' +
      'gunakan menu "Perbarui Daftar Siswa di Form".\n\n' +
      'Tetap buat form baru?',
      ui.ButtonSet.YES_NO
    );
    if (konfirmasi !== ui.Button.YES) return;
  }

  try {
    ss.toast('Membaca data siswa...', 'Proses', -1);
    const siswaPerKelas = kelompokkanSiswaPerKelas();
    const kelasList     = Object.keys(siswaPerKelas).sort();

    if (kelasList.length === 0) {
      ss.toast('', '', 1);
      ui.alert('❌ Data Kelas / Siswa belum diisi.\nIsi sheet "Data Kelas" dan "Data Siswa" terlebih dahulu.');
      return;
    }

    ss.toast('Membangun form...', 'Proses', -1);
    const form = FormApp.create(
      'Form Pelaporan Pelanggaran Siswa — ' + ambilSetting('Nama Sekolah')
    );

    form.setDescription(
      'Gunakan form ini untuk melaporkan pelanggaran atau kasus siswa kepada Guru BK.\n' +
      'Pilih kelas terlebih dahulu, kemudian pilih nama siswa dari daftar.'
    );
    form.setCollectEmail(false);
    form.setAllowResponseEdits(false);
    form.setConfirmationMessage(
      'Laporan berhasil dikirim. Terima kasih.\nGuru BK akan segera menindaklanjuti.'
    );
    form.setIsQuiz(false);
    form.setShuffleQuestions(false);

    // ── SEKSI 1: Identitas Pelapor + Pilih Kelas ─────────────
    form.addSectionHeaderItem()
      .setTitle('Identitas Pelapor')
      .setHelpText('Isi data Anda sebagai pelapor');

    form.addTextItem()
      .setTitle('Nama Pelapor *')
      .setHelpText('Contoh: Budi Santoso')
      .setRequired(true);

    form.addListItem()
      .setTitle('Jabatan Pelapor *')
      .setChoiceValues(['Wali Kelas', 'Guru Mata Pelajaran', 'Guru Piket', 'Staf TU', 'Kepala Sekolah', 'Lainnya'])
      .setRequired(true);

    form.addTextItem()
      .setTitle('Tanggal Kejadian *')
      .setHelpText('Format: DD/MM/YYYY — contoh: 14/04/2026')
      .setRequired(true);

    // Dropdown kelas — bercabang ke seksi siswa masing-masing kelas
    const itemKelas = form.addListItem()
      .setTitle('Pilih Kelas Siswa *')
      .setRequired(true);

    // ── SEKSI per KELAS (siswa) ───────────────────────────────
    // Buat semua seksi kelas dulu, simpan referensinya
    const seksiKelas = {}; // { namaKelas: PageBreakItem }

    kelasList.forEach(kelas => {
      const seksi = form.addPageBreakItem()
        .setTitle('Siswa Kelas ' + kelas)
        .setHelpText('Pilih nama siswa yang akan dilaporkan');
      seksiKelas[kelas] = seksi;
    });

    // ── SEKSI DETAIL — dibuat setelah semua seksi kelas ──────
    const seksiDetail = form.addPageBreakItem()
      .setTitle('Detail Pelanggaran')
      .setHelpText('Isi informasi lengkap mengenai pelanggaran yang terjadi');

    // Atur navigasi: setiap seksi kelas → lanjut ke seksi detail
    kelasList.forEach(kelas => {
      seksiKelas[kelas].setGoToPage(seksiDetail);
    });

    // Pasang choices kelas dengan branching
    itemKelas.setChoices(
      kelasList.map(kelas =>
        itemKelas.createChoice(kelas, seksiKelas[kelas])
      )
    );

    // ── ISI SEKSI per KELAS: dropdown nama siswa ──────────────
    kelasList.forEach(kelas => {
      const siswaDiKelas = siswaPerKelas[kelas];

      // Aktifkan seksi ini agar item bisa ditambahkan
      // (Items ditambahkan ke form secara berurutan — pastikan seksi sudah ada)
      if (siswaDiKelas.length === 0) {
        form.addTextItem()
          .setTitle('Pilih Nama Siswa *')
          .setHelpText('(Belum ada data siswa untuk kelas ini — ketik manual)')
          .setRequired(true);
      } else {
        form.addListItem()
          .setTitle('Pilih Nama Siswa *')
          .setHelpText('Format: Nama Lengkap (NISN: xxxxxxxxxx)')
          .setChoiceValues(siswaDiKelas.map(s => s.tampilan))
          .setRequired(true);
      }
    });

    // ── ISI SEKSI DETAIL ──────────────────────────────────────
    form.addListItem()
      .setTitle('Jenis Pelanggaran *')
      .setHelpText('Pilih jenis pelanggaran yang sesuai. Poin akan dihitung otomatis.')
      .setChoiceValues(daftarPelanggaranUntukForm())
      .setRequired(true);

    form.addTextItem()
      .setTitle('Lokasi Kejadian')
      .setHelpText('Contoh: Kelas XII-1, Kantin, Lapangan');

    form.addListItem()
      .setTitle('Sudah Ditangani di Tingkat Kelas?')
      .setChoiceValues(['Sudah', 'Belum', 'Sebagian']);

    form.addParagraphTextItem()
      .setTitle('Tindakan yang Sudah Dilakukan')
      .setHelpText('Kosongkan jika belum ada tindakan');

    form.addListItem()
      .setTitle('Tingkat Urgensi *')
      .setChoiceValues([
        '🔴 Tinggi — perlu ditangani hari ini',
        '🟡 Sedang — perlu ditangani minggu ini',
        '🟢 Rendah — bisa dijadwalkan',
      ])
      .setRequired(true);

    form.addParagraphTextItem()
      .setTitle('Keterangan Tambahan')
      .setHelpText('Kronologi atau informasi lain yang perlu diketahui guru BK');

    // ── Hubungkan ke Spreadsheet ──────────────────────────────
    form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

    // Simpan ID & URL ke Settings
    simpanSetting('ID Form Pelanggaran',       form.getId());
    simpanSetting('URL Form Pelanggaran',      form.getPublishedUrl());
    simpanSetting('URL Edit Form Pelanggaran', form.getEditUrl());

    // Pasang trigger
    pasangTriggerFormPelanggaran(ss, form);

    ss.toast('', '', 1);
    ui.alert(
      '✅ Form Berhasil Dibuat!',
      'Jumlah kelas  : ' + kelasList.length + '\n' +
      'Total siswa   : ' + Object.values(siswaPerKelas).reduce((s, a) => s + a.length, 0) + '\n\n' +
      'Link untuk dibagikan ke guru/wali kelas:\n' +
      form.getPublishedUrl() + '\n\n' +
      'Link tersimpan di sheet Settings.',
      ui.ButtonSet.OK
    );

  } catch (err) {
    SpreadsheetApp.getActiveSpreadsheet().toast('', '', 1);
    ui.alert('❌ Gagal membuat form: ' + err.message);
    console.error(err);
  }
}

// ============================================================
// PERBARUI DAFTAR SISWA DI FORM (tanpa buat ulang form)
// Jalankan ini setiap ada siswa baru masuk / pindah kelas
// ============================================================
function perbaruiDaftarSiswaForm() {
  const ui     = SpreadsheetApp.getUi();
  const formId = ambilSetting('ID Form Pelanggaran');

  if (!formId) {
    ui.alert('Form belum dibuat.\nJalankan "Buat Form Pelaporan Pelanggaran" terlebih dahulu.');
    return;
  }

  try {
    SpreadsheetApp.getActiveSpreadsheet().toast('Membaca data siswa...', 'Proses', -1);
    const siswaPerKelas = kelompokkanSiswaPerKelas();
    const form          = FormApp.openById(formId);
    const items         = form.getItems();

    let kelasSaatIni = null;
    let jumlahDiupdate = 0;

    items.forEach(item => {
      // Deteksi seksi kelas dari judul PageBreak
      if (item.getType() === FormApp.ItemType.PAGE_BREAK) {
        const judul = item.getTitle();
        kelasSaatIni = judul.startsWith('Siswa Kelas ')
          ? judul.replace('Siswa Kelas ', '').trim()
          : null;
        return;
      }

      // Update dropdown siswa pada seksi yang tepat
      if (
        item.getType() === FormApp.ItemType.LIST &&
        item.getTitle() === 'Pilih Nama Siswa *' &&
        kelasSaatIni
      ) {
        const siswaBaru = siswaPerKelas[kelasSaatIni] || [];
        if (siswaBaru.length > 0) {
          item.asListItem().setChoiceValues(siswaBaru.map(s => s.tampilan));
          jumlahDiupdate++;
        }
      }
    });

    SpreadsheetApp.getActiveSpreadsheet().toast('', '', 1);
    ui.alert(
      '✅ Daftar Siswa Diperbarui',
      jumlahDiupdate + ' kelas berhasil diperbarui.\n\n' +
      'Link form tidak berubah — tidak perlu bagikan ulang ke guru.',
      ui.ButtonSet.OK
    );

  } catch (err) {
    SpreadsheetApp.getActiveSpreadsheet().toast('', '', 1);
    ui.alert('❌ Gagal memperbarui: ' + err.message);
    console.error(err);
  }
}

// ============================================================
// KELOMPOKKAN SISWA PER KELAS dari sheet Data Siswa
// Output: { 'X-1': [ {tampilan, nisn, nama}, ... ], ... }
// Maksimal 40 siswa per kelas (diambil berdasarkan urutan abjad)
// ============================================================
const MAKS_SISWA_PER_KELAS = 40;

function kelompokkanSiswaPerKelas() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Data Siswa');
  if (!sheet) return {};

  const data = sheet.getDataRange().getValues();
  const hasil = {};

  // Kolom: No(0) NIS(1) NISN(2) Nama(3) Kelas(4) ...
  for (let i = 1; i < data.length; i++) {
    const baris = data[i];
    if (baris.every(sel => sel === '')) continue;

    const nisn  = String(baris[2]).trim(); // kolom NISN (index 2)
    const nama  = String(baris[3]).trim();
    const kelas = String(baris[4]).trim();

    if (!nisn || !nama || !kelas) continue;
    if (nisn === 'NISN' || nama === 'Nama Lengkap *') continue;

    if (!hasil[kelas]) hasil[kelas] = [];

    hasil[kelas].push({
      nisn,
      nama,
      // Format tampilan di form: "Nama Lengkap (NISN: 1234567890)"
      tampilan: nama + ' (NISN: ' + nisn + ')',
    });
  }

  // Urutkan A-Z lalu batasi maksimal 40 siswa per kelas
  Object.keys(hasil).forEach(k => {
    hasil[k].sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
    if (hasil[k].length > MAKS_SISWA_PER_KELAS) {
      hasil[k] = hasil[k].slice(0, MAKS_SISWA_PER_KELAS);
    }
  });

  return hasil;
}

// ============================================================
// PARSE NISN dari string "Nama Lengkap (NISN: 1234567890)"
// ============================================================
function parseNISNDariPilihan(teks) {
  if (!teks) return '';
  const cocok = teks.match(/\(NISN:\s*(\d+)\)/);
  return cocok ? cocok[1] : '';
}

function parseNamaDariPilihan(teks) {
  if (!teks) return '';
  return teks.replace(/\s*\(NISN:.*\)$/, '').trim();
}

// ============================================================
// PROSES RESPONS FORM — dipanggil otomatis saat form diisi
// ============================================================
function onFormSubmitPelanggaran(e) {
  try {
    const ss         = SpreadsheetApp.getActiveSpreadsheet();
    const sheetKasus = ss.getSheetByName('Buku Kasus');
    if (!sheetKasus) throw new Error('Sheet "Buku Kasus" tidak ditemukan.');

    // Kumpulkan semua jawaban
    const jawaban = {};
    e.response.getItemResponses().forEach(r => {
      jawaban[r.getItem().getTitle()] = r.getResponse();
    });

    // Data siswa
    const pilihanSiswa    = jawaban['Pilih Nama Siswa *'] || '';
    const nisn            = parseNISNDariPilihan(pilihanSiswa);
    const namaSiswa       = parseNamaDariPilihan(pilihanSiswa) || pilihanSiswa;
    const kelas           = jawaban['Pilih Kelas Siswa *'] || '';

    // Data pelanggaran
    const pilihanJenis    = jawaban['Jenis Pelanggaran *'] || '';
    const kodePelanggaran = parseKodePelanggaran(pilihanJenis);
    const jenisPelanggaran = pilihanJenis.replace(/^\[[^\]]+\]\s*/, '').trim();

    // Data pelapor & lainnya
    const idKasus   = generateIdKasusLangsung();
    const tanggal   = jawaban['Tanggal Kejadian *'] ||
                      Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy');
    const pelapor   = (jawaban['Nama Pelapor *'] || '') +
                      ' (' + (jawaban['Jabatan Pelapor *'] || '') + ')';
    const tindakan  = jawaban['Tindakan yang Sudah Dilakukan'] || '';
    const catatan   = 'Lokasi: ' + (jawaban['Lokasi Kejadian'] || '-') +
                      ' | Urgensi: ' + (jawaban['Tingkat Urgensi *'] || '-');
    const keterangan = jawaban['Keterangan Tambahan'] || '';

    // ── Hitung poin SEBELUM appendRow ────────────────────────
    const dataKasus   = sheetKasus.getDataRange().getValues();
    const { poin, ke } = hitungPoinKasus(nisn, kodePelanggaran, dataKasus);
    const totalLama   = hitungTotalPoinDariData(nisn, dataKasus);
    const totalBaru   = totalLama + poin;
    const levelSP     = tentukanLevelSP(totalBaru);

    // ── Tulis ke Buku Kasus (18 kolom) ───────────────────────
    sheetKasus.appendRow([
      idKasus,           // A  ID Kasus
      tanggal,           // B  Tanggal
      nisn,              // C  NISN
      namaSiswa,         // D  Nama Siswa
      kelas,             // E  Kelas
      jenisPelanggaran,  // F  Jenis Pelanggaran
      keterangan,        // G  Keterangan Tambahan
      pelapor,           // H  Pelapor
      '',                // I  Tindakan BK
      tindakan,          // J  Tindak Lanjut
      'Baru',            // K  Status Kasus
      '',                // L  Tanggal Selesai
      catatan,           // M  Catatan
      kodePelanggaran,   // N  Kode Pelanggaran  ← otomatis
      poin,              // O  Poin Kasus         ← otomatis
      ke,                // P  Pelanggaran ke-    ← otomatis
      totalBaru,         // Q  Total Poin Siswa   ← otomatis
      levelSP,           // R  Status SP          ← otomatis
    ]);
    SpreadsheetApp.flush();

    // ── Perbarui sheet Poin Siswa ─────────────────────────────
    perbaruiPoinSiswa(nisn, namaSiswa, kelas, totalBaru, levelSP);

    // ── Buat SP otomatis jika level naik ─────────────────────
    const levelLama = tentukanLevelSP(totalLama);
    if (levelSP !== '-' && levelSP !== levelLama) {
      try {
        const urlSP = buatSuratPeringatan(nisn, namaSiswa, kelas, levelSP, totalBaru);
        kirimNotifikasiSP(nisn, namaSiswa, kelas, levelSP, totalBaru, urlSP);
        console.log('SP dibuat: ' + levelSP + ' untuk ' + namaSiswa);
      } catch (errSP) {
        console.error('Gagal buat SP: ' + errSP.message);
      }
    }

    console.log('Kasus masuk: ' + idKasus + ' | ' + namaSiswa + ' | ' + kodePelanggaran + ' | +' + poin + ' poin (total: ' + totalBaru + ')');

  } catch (err) {
    console.error('onFormSubmitPelanggaran error: ' + err.message);
  }
}

// ============================================================
// PASANG TRIGGER onFormSubmit
// ============================================================
function pasangTriggerFormPelanggaran(ss, form) {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'onFormSubmitPelanggaran') {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('onFormSubmitPelanggaran')
    .forForm(form)
    .onFormSubmit()
    .create();
}

// ============================================================
// TAMPILKAN LINK FORM
// ============================================================
function tampilkanLinkForm() {
  const url = ambilSetting('URL Form Pelanggaran');
  if (!url) {
    SpreadsheetApp.getUi().alert(
      'Form belum dibuat.\nJalankan menu "Buat Form Pelaporan Pelanggaran" terlebih dahulu.'
    );
    return;
  }
  SpreadsheetApp.getUi().alert(
    'Link Form Pelaporan Pelanggaran',
    'Bagikan link ini ke guru dan wali kelas:\n\n' + url + '\n\n' +
    'Link tidak berubah meskipun daftar siswa diperbarui.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

// ============================================================
// HELPER — Generate ID Kasus langsung (tanpa trigger onEdit)
// ============================================================
function generateIdKasusLangsung() {
  const ss       = SpreadsheetApp.getActiveSpreadsheet();
  const settings = ss.getSheetByName('Settings');
  const data     = settings.getRange('A1:B20').getValues();

  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === 'Counter Kasus') {
      const no   = parseInt(data[i][1]) || 1;
      const yyyy = new Date().getFullYear();
      const mm   = String(new Date().getMonth() + 1).padStart(2, '0');
      const id   = 'KS-' + yyyy + '-' + mm + '-' + String(no).padStart(3, '0');
      settings.getRange(i + 1, 2).setValue(no + 1);
      return id;
    }
  }
  return 'KS-ERROR-' + Date.now();
}

// ============================================================
// HELPER — Baca / Tulis Settings (sama seperti file lain)
// ============================================================
function ambilSetting(kunci) {
  const ss       = SpreadsheetApp.getActiveSpreadsheet();
  const settings = ss.getSheetByName('Settings');
  if (!settings) return '';
  const data = settings.getRange('A1:B30').getValues();
  for (const row of data) {
    if (row[0] === kunci) return String(row[1]);
  }
  return '';
}

function simpanSetting(kunci, nilai) {
  const ss       = SpreadsheetApp.getActiveSpreadsheet();
  const settings = ss.getSheetByName('Settings');
  if (!settings) return;
  const data = settings.getRange('A1:B30').getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === kunci) {
      settings.getRange(i + 1, 2).setValue(nilai);
      return;
    }
  }
  // Tambah baris baru jika belum ada
  const barisBaru = data.findIndex(r => r[0] === '') + 1;
  settings.getRange(barisBaru > 0 ? barisBaru : data.length + 1, 1, 1, 2)
    .setValues([[kunci, nilai]]);
}
