/**
 * SISTEM BK — SMA Negeri 1 Cigalontang
 * File: 06_poinDanSP.gs
 *
 * FUNGSI:
 * - Tabel pelanggaran lengkap beserta poin (sesuai dokumen resmi sekolah)
 * - Hitung akumulasi poin per siswa
 * - Deteksi level SP dan buat Surat Peringatan otomatis (Google Docs)
 */

// ============================================================
// TABEL PELANGGARAN
// Format tiap baris: [kodeInduk, kodeRinci, kategori, deskripsi, poin1, poin2, poin3]
// poin1 = pelanggaran ke-1, poin2 = ke-2, poin3 = ke-3 dan seterusnya
// ============================================================
const DATA_PELANGGARAN = [
  // ── P1: TERLAMBAT ─────────────────────────────────────────
  ['P1','1.1','Terlambat','Kurang dari 10 menit',1,2,3],
  ['P1','1.2','Terlambat','Lebih dari 10 menit',3,4,5],
  ['P1','1.3','Terlambat','Lebih dari 30 menit',5,6,7],
  // ── P2: KEHADIRAN ─────────────────────────────────────────
  ['P2','2.1','Kehadiran','Izin tanpa surat keterangan / telepon ke piket sekolah',1,2,3],
  ['P2','2.2','Kehadiran','Sakit tanpa surat keterangan dari dokter / orang tua / wali',1,2,3],
  ['P2','2.3','Kehadiran','Alpa, tanpa ada keterangan apapun',2,3,4],
  ['P2','2.4','Kehadiran','Tidak kembali setelah izin dari sekolah',3,4,5],
  ['P2','2.4b','Kehadiran','Kembali melebihi waktu yang ditentukan tanpa pemberitahuan',3,4,5],
  ['P2','2.5','Kehadiran','Keluar lingkungan sekolah saat pembelajaran berlangsung tanpa izin',4,5,6],
  ['P2','2.6','Kehadiran','Berada di kantin saat pembelajaran berlangsung tanpa izin',4,5,6],
  ['P2','2.7','Kehadiran','Tidak masuk selama 2 hari berturut-turut tanpa keterangan',4,5,6],
  ['P2','2.8','Kehadiran','Memalsukan surat keterangan dokter atau surat dari orang tua',4,5,6],
  // ── P3: SERAGAM ───────────────────────────────────────────
  ['P3','3.1','Seragam','Baju tidak dimasukan ke dalam celana atau rok',1,2,3],
  ['P3','3.2','Seragam','Menggunakan rok pendek bagi putri',1,2,3],
  ['P3','3.3','Seragam','Menggunakan kerudung selain berwarna putih polos',1,2,3],
  ['P3','3.4','Seragam','Menggunakan atribut tidak lengkap (badge OSIS, badge sekolah, nama, lokasi)',1,2,3],
  ['P3','3.5','Seragam','Nama peserta didik tidak ditempel di dada depan sebelah kanan',1,2,3],
  ['P3','3.6','Seragam','Lokasi sekolah tidak ditempel di tangan sebelah kanan',1,2,3],
  ['P3','3.7','Seragam','Badge OSIS tidak ditempel di dada depan sebelah kiri',1,2,3],
  ['P3','3.8','Seragam','Badge sekolah tidak ditempel di tangan sebelah kiri',1,2,3],
  ['P3','3.9','Seragam','Topi sekolah tidak sesuai dengan ketentuan',1,2,3],
  ['P3','3.10','Seragam','Tidak menggunakan sabuk berwarna hitam',1,2,3],
  ['P3','3.11','Seragam','Tidak menggunakan sepatu hitam atau tidak menggunakan kaos kaki',1,2,3],
  ['P3','3.12','Seragam','Menggunakan perhiasan atau aksesoris yang berlebihan',1,2,3],
  ['P3','3.13','Seragam','Menggunakan rompi, jaket, atau sweater selama di sekolah',1,2,3],
  ['P3','3.14','Seragam','Mencoret, menggambar, atau mewarnai seragam di luar ketentuan',3,4,5],
  // ── P4: KERAPIHAN DAN PENAMPILAN ──────────────────────────
  ['P4','4.1','Kerapihan & Penampilan','Berkuku panjang dan dicat atau kutek',1,2,3],
  ['P4','4.2','Kerapihan & Penampilan','Bertato / menggambari kulit tubuh dengan apapun',8,9,10],
  ['P4','4.3','Kerapihan & Penampilan','Bercukur gundul atau plontos',1,2,3],
  ['P4','4.4','Kerapihan & Penampilan','Mewarnai rambut',5,6,7],
  ['P4','4.5','Kerapihan & Penampilan','Berambut panjang dan berkuncir bagi peserta didik laki-laki',1,2,3],
  ['P4','4.6','Kerapihan & Penampilan','Menata rambut dengan model yang tidak sesuai sebagai pelajar',1,2,3],
  ['P4','4.7','Kerapihan & Penampilan','Merias wajah secara berlebihan',2,3,4],
  ['P4','4.8','Kerapihan & Penampilan','Memakai softlens kecuali softlens kesehatan',2,3,4],
  ['P4','4.9','Kerapihan & Penampilan','Membawa alat make up',2,3,4],
  // ── P5: KEDISIPLINAN ──────────────────────────────────────
  ['P5','5.1','Kedisiplinan','Menggunakan gawai tanpa sepengetahuan dan arahan dari guru',3,4,5],
  ['P5','5.2','Kedisiplinan','Makan dan minum saat pembelajaran berlangsung tanpa izin',1,2,3],
  ['P5','5.3','Kedisiplinan','Meminjam barang, PIN, atau password orang lain tanpa izin',3,4,5],
  ['P5','5.4','Kedisiplinan','Terlambat pengumpulan tugas',2,3,4],
  ['P5','5.5','Kedisiplinan','Menyontek / melakukan kecurangan saat ujian',5,6,7],
  ['P5','5.6','Kedisiplinan','Menyebarkan rumor atau informasi bohong (hoaks)',10,15,20],
  ['P5','5.7','Kedisiplinan','Membawa dan merokok di lingkungan sekolah',5,10,15],
  ['P5','5.8','Kedisiplinan','Mengkonsumsi minuman beralkohol / memakai / mengedarkan narkotika & zat adiktif',25,50,75],
  ['P5','5.9','Kedisiplinan','Pergaulan bebas dan berperilaku menyimpang',25,50,75],
  ['P5','5.10','Kedisiplinan','Berkelahi atau melakukan tawuran',10,15,20],
  ['P5','5.11','Kedisiplinan','Membuang sampah sembarangan dan merusak lingkungan',5,10,15],
  ['P5','5.12','Kedisiplinan','Melakukan perbuatan vandalisme',10,15,20],
  ['P5','5.13','Kedisiplinan','Melakukan perundungan fisik, verbal, dan digital',10,15,20],
  ['P5','5.14','Kedisiplinan','Membawa barang terlarang / membahayakan / mengancam keselamatan',25,50,75],
  ['P5','5.15','Kedisiplinan','Membawa alat-alat untuk bermain judi',10,15,20],
  ['P5','5.16','Kedisiplinan','Mengambil dan menyimpan barang milik orang lain tanpa izin',10,15,20],
  ['P5','5.17','Kedisiplinan','Melanggar norma dan hukum yang berlaku di sekolah, masyarakat, dan negara',10,15,20],
];

// Ambang batas SP
const SP_BATAS = { SP1: 25, SP2: 51, SP3: 76 };

// ============================================================
// HELPER — Cari data pelanggaran berdasarkan kode rinci
// ============================================================
function cariPelanggaran(kode) {
  return DATA_PELANGGARAN.find(p => p[1] === kode) || null;
}

// Format daftar untuk dropdown Google Form
function daftarPelanggaranUntukForm() {
  return DATA_PELANGGARAN.map(p => '[' + p[1] + '] ' + p[2] + ': ' + p[3]);
}

// Parse kode dari string "[1.1] Terlambat: ..."
function parseKodePelanggaran(teks) {
  if (!teks) return '';
  const cocok = teks.match(/^\[([^\]]+)\]/);
  return cocok ? cocok[1] : '';
}

// ============================================================
// HITUNG POIN SATU KASUS
// Menentukan ini pelanggaran ke berapa → ambil poin yang sesuai
// ============================================================
function hitungPoinKasus(nisn, kode, dataKasus) {
  // Hitung berapa kali siswa ini melanggar aturan yang SAMA sebelumnya
  // dataKasus adalah array getValue() dari Buku Kasus (belum termasuk baris baru)
  let jumlahSebelumnya = 0;
  for (let i = 1; i < dataKasus.length; i++) {
    if (
      String(dataKasus[i][2]).trim() === String(nisn).trim() &&  // NISN (col C)
      String(dataKasus[i][13]).trim() === String(kode).trim()    // Kode (col N)
    ) {
      jumlahSebelumnya++;
    }
  }

  const ke          = jumlahSebelumnya + 1;
  const pelanggaran = cariPelanggaran(kode);
  if (!pelanggaran) return { poin: 0, ke };

  const poin = ke === 1 ? pelanggaran[4] : ke === 2 ? pelanggaran[5] : pelanggaran[6];
  return { poin, ke };
}

// Hitung total poin siswa dari array data Buku Kasus
function hitungTotalPoinDariData(nisn, dataKasus) {
  let total = 0;
  for (let i = 1; i < dataKasus.length; i++) {
    if (String(dataKasus[i][2]).trim() !== String(nisn).trim()) continue;
    total += parseFloat(dataKasus[i][14]) || 0; // col O = Poin Kasus
  }
  return total;
}

// Hitung total poin langsung dari sheet (untuk query manual)
function hitungTotalPoinSiswa(nisn) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Buku Kasus');
  if (!sheet) return 0;
  return hitungTotalPoinDariData(nisn, sheet.getDataRange().getValues());
}

// ============================================================
// TENTUKAN LEVEL SP
// ============================================================
function tentukanLevelSP(totalPoin) {
  if (totalPoin >= SP_BATAS.SP3) return 'SP3';
  if (totalPoin >= SP_BATAS.SP2) return 'SP2';
  if (totalPoin >= SP_BATAS.SP1) return 'SP1';
  return '-';
}

// ============================================================
// PERBARUI SHEET POIN SISWA
// ============================================================
function perbaruiPoinSiswa(nisn, namaSiswa, kelas, totalPoin, levelSP) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Poin Siswa');
  if (!sheet) return;

  const data    = sheet.getDataRange().getValues();
  const tglHari = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy');

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(nisn).trim()) {
      const spLama = data[i][4];
      sheet.getRange(i + 1, 4).setValue(totalPoin);
      sheet.getRange(i + 1, 5).setValue(levelSP);
      if (levelSP !== '-' && levelSP !== spLama) {
        sheet.getRange(i + 1, 6).setValue(tglHari);
      }
      warnaiBarisPoiSiswa(sheet, i + 1, levelSP);
      return;
    }
  }

  // Belum ada — tambah baris baru
  const barisBaru = sheet.getLastRow() + 1;
  sheet.getRange(barisBaru, 1, 1, 7).setValues([[
    nisn, namaSiswa, kelas, totalPoin, levelSP,
    levelSP !== '-' ? tglHari : '', '',
  ]]);
  warnaiBarisPoiSiswa(sheet, barisBaru, levelSP);
}

function warnaiBarisPoiSiswa(sheet, baris, levelSP) {
  const warna = { SP3: '#F1948A', SP2: '#FAD7A0', SP1: '#FCF3CF', '-': '#FFFFFF' };
  sheet.getRange(baris, 1, 1, 7).setBackground(warna[levelSP] || '#FFFFFF');
}

// ============================================================
// BUAT SURAT PERINGATAN (Google Docs) — A4, satu halaman
// Penandatangan: Kepala Sekolah + Wakasek Kesiswaan
//
// LOGO: isi "URL Logo Sekolah" di sheet Settings dengan URL
// gambar yang dapat diakses publik (misal: link Drive "Anyone
// with link can view", atau URL langsung dari website sekolah).
// Jika kosong, kolom logo dibiarkan kosong namun layout tetap rapi.
// ============================================================
function buatSuratPeringatan(nisn, namaSiswa, kelas, spLevel, totalPoin) {
  var tahunPel = ambilSetting('Tahun Pelajaran');
  var tglHari  = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd MMMM yyyy');
  var nomorSP  = buatNomorSP(spLevel);
  var urlLogo  = ambilSetting('URL Logo Sekolah');

  var doc  = DocumentApp.create(spLevel + ' \u2014 ' + namaSiswa + ' \u2014 ' + tglHari);
  var body = doc.getBody();
  body.setMarginTop(51).setMarginBottom(51).setMarginLeft(85).setMarginRight(57);

  var F = 'Arial';

  function attr(bold, size, sa) {
    var o = {};
    o[DocumentApp.Attribute.BOLD]           = bold;
    o[DocumentApp.Attribute.FONT_SIZE]      = size;
    o[DocumentApp.Attribute.FONT_FAMILY]    = F;
    o[DocumentApp.Attribute.SPACING_BEFORE] = 0;
    o[DocumentApp.Attribute.SPACING_AFTER]  = sa !== undefined ? sa : 0;
    o[DocumentApp.Attribute.LINE_SPACING]   = 1.0;
    return o;
  }

  // ── KOP SURAT (tabel: logo kiri | teks kanan) ─────────────
  var kopTbl  = body.appendTable([['', '']]);
  kopTbl.setBorderWidth(0);

  var logoCell = kopTbl.getRow(0).getCell(0);
  var textCell = kopTbl.getRow(0).getCell(1);
  logoCell.setPaddingTop(0).setPaddingBottom(0).setPaddingLeft(0).setPaddingRight(6);
  textCell.setPaddingTop(0).setPaddingBottom(0).setPaddingLeft(0).setPaddingRight(0);

  // Sisipkan logo (atau spacer transparan agar lebar kolom tetap 60pt)
  var logoBlob = null;
  if (urlLogo) {
    try { logoBlob = UrlFetchApp.fetch(urlLogo).getBlob(); }
    catch (eImg) { console.warn('Logo gagal dimuat: ' + eImg.message); }
  }
  if (!logoBlob) {
    // GIF transparan 1×1 — hanya menjaga lebar kolom; tidak tampak di cetakan
    var spacerB64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    logoBlob = Utilities.newBlob(Utilities.base64Decode(spacerB64), 'image/gif', 'spacer.gif');
  }
  var logoPara = logoCell.getChild(0).asParagraph();
  logoPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER)
          .setAttributes(attr(false, 10, 0));
  logoPara.appendInlineImage(logoBlob).setWidth(60).setHeight(72);

  // Teks kop di kolom kanan
  var kopData = [
    ['PEMERINTAH DAERAH PROVINSI JAWA BARAT', true,  10],
    ['DINAS PENDIDIKAN',                       true,  10],
    ['SMA NEGERI 1 CIGALONTANG',               true,  14],
    ['Akreditasi : \u201CA\u201D (Amat Baik)', false,  9],
    ['SK Nomor : 02.00/112/BAP-SM/SK/X/2015', false,  9],
    ['Jln. Raya Cigalontang Telepon (0265)7540797 Kabupaten Tasikmalaya 46463', false, 9],
    ['E-mail : smancigalontang@gmail.com    Website : http://www.sman1cigalontang.sch.id', false, 9],
  ];
  var p0 = textCell.getChild(0).asParagraph();
  p0.appendText(kopData[0][0]);
  p0.setAlignment(DocumentApp.HorizontalAlignment.CENTER)
    .setAttributes(attr(kopData[0][1], kopData[0][2], 0));
  for (var ki = 1; ki < kopData.length; ki++) {
    textCell.appendParagraph(kopData[ki][0])
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
      .setAttributes(attr(kopData[ki][1], kopData[ki][2], 0));
  }

  body.appendHorizontalRule();

  // ── NOMOR & PERIHAL ──────────────────────────────────────────
  body.appendParagraph('Nomor  : ' + nomorSP).setAttributes(attr(false, 10, 2));
  body.appendParagraph('Perihal : SURAT PERINGATAN ' + spLevel.replace('SP','') + ' (' + spLevel + ')')
      .setAttributes(attr(true, 10, 6));

  // ── PEMBUKA ──────────────────────────────────────────────────
  body.appendParagraph(
    'Yang bertanda tangan di bawah ini, Wakil Kepala Sekolah Bidang Kesiswaan ' +
    'SMA Negeri 1 Cigalontang, menyatakan bahwa siswa berikut:'
  ).setAttributes(attr(false, 10, 2));

  // Identitas siswa — padding minimal per cell agar tidak berlebihan
  var idTbl = body.appendTable([
    ['Nama Siswa',      ':', namaSiswa],
    ['NISN',            ':', nisn],
    ['Kelas',           ':', kelas],
    ['Tahun Pelajaran', ':', tahunPel],
  ]);
  idTbl.setBorderWidth(0);
  for (var ri = 0; ri < idTbl.getNumRows(); ri++) {
    for (var ci = 0; ci < idTbl.getRow(ri).getNumCells(); ci++) {
      var idCell = idTbl.getRow(ri).getCell(ci);
      idCell.setPaddingTop(1).setPaddingBottom(1)
            .setPaddingLeft(ci === 0 ? 8 : 2).setPaddingRight(2);
      idCell.getChild(0).asParagraph().setAttributes(attr(false, 10, 0));
    }
  }

  // ── ISI SURAT ────────────────────────────────────────────────
  var konsekuensi = {
    SP1: 'diberikan bimbingan intensif dan orang tua/wali dipanggil ke sekolah.',
    SP2: 'diberikan bimbingan intensif lanjutan, orang tua/wali dipanggil ke sekolah, serta wajib membuat surat pernyataan.',
    SP3: 'diberikan sanksi berat sesuai peraturan sekolah, termasuk kemungkinan dikembalikan kepada orang tua/wali.',
  };
  var rentangPoin = { SP1: '25 \u2013 50', SP2: '51 \u2013 75', SP3: '\u2265 76' };

  body.appendParagraph(
    'telah mencapai akumulasi poin pelanggaran sebesar ' + totalPoin + ' poin ' +
    '(batas ' + spLevel + ' = ' + rentangPoin[spLevel] + ' poin). ' +
    'Oleh karena itu, siswa yang bersangkutan ' + konsekuensi[spLevel]
  ).setAttributes(attr(false, 10, 2));

  body.appendParagraph(
    'Surat Peringatan ini merupakan peringatan resmi dari sekolah. Apabila pelanggaran terus ' +
    'berulang, sanksi yang lebih berat akan diberikan sesuai peraturan yang berlaku. ' +
    'Demikian Surat Peringatan ini dibuat untuk diketahui semua pihak yang berkepentingan.'
  ).setAttributes(attr(false, 10, 6));

  // ── TANDA TANGAN ─────────────────────────────────────────────
  body.appendParagraph('Cigalontang, ' + tglHari)
      .setAlignment(DocumentApp.HorizontalAlignment.RIGHT)
      .setAttributes(attr(false, 10, 2));

  var ttdTbl = body.appendTable([[
    'Mengetahui,\nKepala Sekolah,\n\n\n\n______________________________\nAri Wawan Darmawan, S.Pd., M.Pd.\nNIP. 198609152011011002',
    'Wakil Kepala Sekolah\nBidang Kesiswaan,\n\n\n\n______________________________\nFirda Faizal, S.Pd.\nNIP. 199002192020121008',
  ]]);
  ttdTbl.setBorderWidth(0);
  for (var rt = 0; rt < ttdTbl.getNumRows(); rt++) {
    for (var ct = 0; ct < ttdTbl.getRow(rt).getNumCells(); ct++) {
      ttdTbl.getRow(rt).getCell(ct)
        .setPaddingTop(2).setPaddingBottom(0).setPaddingLeft(0).setPaddingRight(4);
    }
  }

  // ── PENERIMA SURAT ───────────────────────────────────────────
  body.appendParagraph('Yang menerima Surat Peringatan ini:').setAttributes(attr(false, 10, 2));
  var terimaTbl = body.appendTable([[
    'Siswa,\n\n\n\n______________________________\n' + namaSiswa,
    'Orang Tua / Wali,\n\n\n\n______________________________\n(                                    )',
    'Wali Kelas,\n\n\n\n______________________________\n(                                    )',
  ]]);
  terimaTbl.setBorderWidth(0);
  for (var rr = 0; rr < terimaTbl.getNumRows(); rr++) {
    for (var cr = 0; cr < terimaTbl.getRow(rr).getNumCells(); cr++) {
      terimaTbl.getRow(rr).getCell(cr)
        .setPaddingTop(2).setPaddingBottom(0).setPaddingLeft(0).setPaddingRight(4);
    }
  }

  doc.saveAndClose();
  pindahkanFileKeFolder(doc.getId(), 'Surat Peringatan BK/' + spLevel);
  return doc.getUrl();
}

// ============================================================
// NOMOR SP OTOMATIS — format: 1/SP1/BK/IV/2026
// ============================================================
function buatNomorSP(spLevel) {
  const bulanRomawi = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
  const now    = new Date();
  const kunci  = 'Counter ' + spLevel;
  const no     = parseInt(ambilSetting(kunci) || '0') + 1;
  simpanSetting(kunci, String(no));
  return no + '/' + spLevel + '/BK/' + bulanRomawi[now.getMonth()] + '/' + now.getFullYear();
}

// ============================================================
// PINDAHKAN FILE KE FOLDER DRIVE (buat folder jika belum ada)
// ============================================================
function pindahkanFileKeFolder(fileId, jalurFolder) {
  try {
    const file   = DriveApp.getFileById(fileId);
    const bagian = jalurFolder.split('/');
    let folder   = DriveApp.getRootFolder();

    bagian.forEach(nama => {
      const cari = folder.getFoldersByName(nama);
      folder = cari.hasNext() ? cari.next() : folder.createFolder(nama);
    });

    folder.addFile(file);
    DriveApp.getRootFolder().removeFile(file);
  } catch (err) {
    console.error('pindahkanFileKeFolder error: ' + err.message);
  }
}

// ============================================================
// KIRIM NOTIFIKASI EMAIL KE GURU BK
// ============================================================
function kirimNotifikasiSP(nisn, namaSiswa, kelas, spLevel, totalPoin, urlSP) {
  try {
    const emailGuru   = Session.getEffectiveUser().getEmail();
    const namaSekolah = ambilSetting('Nama Sekolah');
    GmailApp.sendEmail(
      emailGuru,
      '⚠️ ' + spLevel + ' Terbit — ' + namaSiswa + ' (' + kelas + ')',
      namaSekolah + '\n\n' +
      'Surat Peringatan ' + spLevel + ' telah otomatis diterbitkan:\n\n' +
      'Nama   : ' + namaSiswa + '\n' +
      'NISN   : ' + nisn + '\n' +
      'Kelas  : ' + kelas + '\n' +
      'Total Poin: ' + totalPoin + '\n\n' +
      'Buka dokumen SP: ' + urlSP + '\n\n' +
      'Harap segera tindaklanjuti dan hubungi orang tua siswa.'
    );
  } catch (err) {
    console.error('kirimNotifikasiSP error: ' + err.message);
  }
}

// ============================================================
// MENU: LIHAT POIN SISWA
// ============================================================
function lihatPoinSiswa() {
  const ui    = SpreadsheetApp.getUi();
  const input = ui.prompt('Lihat Poin Siswa', 'Masukkan NISN siswa:', ui.ButtonSet.OK_CANCEL);
  if (input.getSelectedButton() !== ui.Button.OK) return;

  const nisn = input.getResponseText().trim();
  if (!nisn) { ui.alert('NISN tidak boleh kosong.'); return; }

  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Poin Siswa');
  let nama = '-', kelas = '-', total = 0, levelSP = '-';

  if (sheet) {
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === nisn) {
        nama    = data[i][1];
        kelas   = data[i][2];
        total   = data[i][3];
        levelSP = data[i][4];
        break;
      }
    }
  }

  ui.alert(
    'Poin Pelanggaran — ' + (nama !== '-' ? nama : 'NISN ' + nisn),
    'NISN       : ' + nisn + '\n' +
    'Nama       : ' + nama + '\n' +
    'Kelas      : ' + kelas + '\n\n' +
    'Total Poin : ' + total + '\n' +
    'Status SP  : ' + levelSP + '\n\n' +
    'Batas: SP1 = 25 | SP2 = 51 | SP3 ≥ 76',
    ui.ButtonSet.OK
  );
}

// ============================================================
// MENU: BUAT SP MANUAL
// ============================================================
function buatSPManual() {
  const ui    = SpreadsheetApp.getUi();
  const input = ui.prompt('Buat Surat Peringatan Manual', 'Masukkan NISN siswa:', ui.ButtonSet.OK_CANCEL);
  if (input.getSelectedButton() !== ui.Button.OK) return;

  const nisn  = input.getResponseText().trim();
  const total = hitungTotalPoinSiswa(nisn);
  const level = tentukanLevelSP(total);

  if (level === '-') {
    ui.alert('Total poin siswa ini = ' + total + '.\nBelum mencapai batas SP (minimum 25 poin).');
    return;
  }

  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Poin Siswa');
  let nama = '-', kelas = '-';
  if (sheet) {
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === nisn) { nama = data[i][1]; kelas = data[i][2]; break; }
    }
  }

  const ok = ui.alert(
    'Konfirmasi',
    'Siswa : ' + nama + ' (' + kelas + ')\nTotal Poin: ' + total + '\nLevel: ' + level + '\n\nBuat ' + level + '?',
    ui.ButtonSet.YES_NO
  );
  if (ok !== ui.Button.YES) return;

  try {
    const url = buatSuratPeringatan(nisn, nama, kelas, level, total);
    ui.alert('✅ ' + level + ' berhasil dibuat.\n\nLink: ' + url);
  } catch (err) {
    ui.alert('❌ Gagal: ' + err.message);
  }
}

// ============================================================
// MENU: REKAP POIN SEMUA SISWA (hitung ulang dari Buku Kasus)
// ============================================================
function rekapPoinSemuaSiswa() {
  const ss         = SpreadsheetApp.getActiveSpreadsheet();
  const sheetKasus = ss.getSheetByName('Buku Kasus');
  const sheetPoin  = ss.getSheetByName('Poin Siswa');
  if (!sheetKasus || !sheetPoin) {
    SpreadsheetApp.getUi().alert('Sheet "Buku Kasus" atau "Poin Siswa" tidak ditemukan.');
    return;
  }

  ss.toast('Menghitung ulang semua poin...', 'Proses', -1);

  const dataKasus     = sheetKasus.getDataRange().getValues();
  const poinPerSiswa  = {};
  const infoSiswa     = {};

  for (let i = 1; i < dataKasus.length; i++) {
    const baris = dataKasus[i];
    if (baris.every(sel => sel === '')) continue;
    const nisn = String(baris[2]).trim();
    if (!nisn) continue;
    const poin = parseFloat(baris[14]) || 0;
    poinPerSiswa[nisn] = (poinPerSiswa[nisn] || 0) + poin;
    infoSiswa[nisn] = infoSiswa[nisn] || { nama: baris[3], kelas: baris[4] };
  }

  // Tulis ulang sheet Poin Siswa
  const lastRow = sheetPoin.getLastRow();
  if (lastRow > 1) sheetPoin.getRange(2, 1, lastRow - 1, 7).clearContent().setBackground('#FFFFFF');

  const hasil = Object.entries(poinPerSiswa)
    .map(([nisn, total]) => [nisn, infoSiswa[nisn].nama, infoSiswa[nisn].kelas, total, tentukanLevelSP(total), '', ''])
    .sort((a, b) => b[3] - a[3]);

  if (hasil.length > 0) {
    sheetPoin.getRange(2, 1, hasil.length, 7).setValues(hasil);
    hasil.forEach((row, idx) => warnaiBarisPoiSiswa(sheetPoin, idx + 2, row[4]));
  }

  ss.toast('', '', 1);
  SpreadsheetApp.getUi().alert(
    '✅ Rekap selesai.\n' + hasil.length + ' siswa diperbarui.\n\n' +
    'Buka sheet "Poin Siswa" untuk melihat hasilnya.'
  );
}
