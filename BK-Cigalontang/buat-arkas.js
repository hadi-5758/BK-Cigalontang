/**
 * Generator Aplikasi Rancangan Anggaran ARKAS
 * SMAN 1 Cigalontang — Provinsi Jawa Barat
 * Versi 2 — Lengkap dengan Realisasi, Laporan KS, Kontrol Batas BOSP, BOPD Jabar
 *
 * Jalankan : node buat-arkas.js
 * Output   : ARKAS_Rancangan_Anggaran.xlsx
 */

const ExcelJS = require('exceljs');
const path    = require('path');

// ─────────────────────────────────────────────────────────────
// KONSTANTA GLOBAL
// ─────────────────────────────────────────────────────────────
const JUMLAH_BARIS = 150;          // baris data input
const DATA_MULAI   = 6;            // baris data pertama di sheet Rancangan
const DATA_AKHIR   = DATA_MULAI + JUMLAH_BARIS - 1;

// ─────────────────────────────────────────────────────────────
// DATA REFERENSI — KODE KEGIATAN
// ─────────────────────────────────────────────────────────────
const KODE_KEGIATAN = [
  { kode:'1',  nama:'Penerimaan Peserta Didik Baru',                      ket:'PPDB, seleksi, orientasi siswa baru' },
  { kode:'2',  nama:'Pengembangan Perpustakaan',                          ket:'Buku teks, buku pengayaan, langganan jurnal/e-book' },
  { kode:'3',  nama:'Kegiatan Pembelajaran dan Ekstrakurikuler',          ket:'Praktek, lab, KBM, ekskul, OSIS, Pramuka, PMR' },
  { kode:'4',  nama:'Asesmen/Evaluasi Pembelajaran dan Rapor',            ket:'PH, PTS, PAS, ANBK, SKL, rapor digital' },
  { kode:'5',  nama:'Administrasi Sekolah dan Pengelolaan',               ket:'ATK, pengelolaan keuangan, asuransi, pelaporan' },
  { kode:'6',  nama:'Pengembangan Profesi GTK',                           ket:'Diklat, seminar, workshop, MGMP, IHT, magang' },
  { kode:'7',  nama:'Langganan Daya dan Jasa',                            ket:'Listrik, air, telepon, internet, pajak' },
  { kode:'8',  nama:'Pemeliharaan Sarana dan Prasarana',                  ket:'Perbaikan gedung, peralatan, mebeler, kendaraan' },
  { kode:'9',  nama:'Penyediaan Alat Multi Media Pembelajaran',           ket:'Laptop, proyektor, printer, speaker, kamera' },
  { kode:'10', nama:'Pembayaran Honor',                                   ket:'Honor GTT, PTT, dan tenaga non-ASN lainnya' },
  { kode:'11', nama:'Kegiatan Peningkatan Kompetensi Keahlian',           ket:'Khusus SMK: prakerin, teaching factory, BKK' },
  { kode:'12', nama:'Layanan Bantuan Siswa (Afirmasi)',                   ket:'Beasiswa prestasi, siswa kurang mampu, inklusi' },
  { kode:'13', nama:'Pemberdayaan Masyarakat Sekitar Sekolah',            ket:'Komite, sosialisasi, kemitraan komunitas' },
];

// ─────────────────────────────────────────────────────────────
// DATA REFERENSI — KODE REKENING (BAS / ARKAS Nasional)
// ─────────────────────────────────────────────────────────────
const KODE_REKENING = [
  // Barang Habis Pakai
  { kode:'5.1.02.01.0001', nama:'Belanja Alat Tulis Kantor',                        kel:'Barang Habis Pakai' },
  { kode:'5.1.02.01.0002', nama:'Belanja Alat Listrik dan Elektronik',              kel:'Barang Habis Pakai' },
  { kode:'5.1.02.01.0003', nama:'Belanja Perangko, Materai dan Benda Pos',          kel:'Barang Habis Pakai' },
  { kode:'5.1.02.01.0004', nama:'Belanja Peralatan Kebersihan dan Bahan Pembersih', kel:'Barang Habis Pakai' },
  { kode:'5.1.02.01.0005', nama:'Belanja Bahan Bakar Minyak/Gas',                  kel:'Barang Habis Pakai' },
  { kode:'5.1.02.01.0006', nama:'Belanja Barang Pakai Habis Lainnya',              kel:'Barang Habis Pakai' },
  // Bahan/Material
  { kode:'5.1.02.02.0001', nama:'Belanja Buku Teks Pelajaran',                     kel:'Bahan/Material' },
  { kode:'5.1.02.02.0002', nama:'Belanja Buku Pengayaan / Referensi',              kel:'Bahan/Material' },
  { kode:'5.1.02.02.0003', nama:'Belanja Bahan Praktik / Laboratorium',            kel:'Bahan/Material' },
  { kode:'5.1.02.02.0004', nama:'Belanja Bahan Bangunan / Material Pemeliharaan',  kel:'Bahan/Material' },
  { kode:'5.1.02.02.0005', nama:'Belanja Bahan Lainnya',                           kel:'Bahan/Material' },
  // Jasa Kantor
  { kode:'5.1.02.03.0001', nama:'Belanja Jasa Listrik',                            kel:'Jasa Kantor' },
  { kode:'5.1.02.03.0002', nama:'Belanja Jasa Air / PDAM',                         kel:'Jasa Kantor' },
  { kode:'5.1.02.03.0003', nama:'Belanja Jasa Telepon',                            kel:'Jasa Kantor' },
  { kode:'5.1.02.03.0004', nama:'Belanja Jasa Internet / Bandwidth',               kel:'Jasa Kantor' },
  { kode:'5.1.02.03.0005', nama:'Belanja Jasa Kebersihan / Keamanan',              kel:'Jasa Kantor' },
  { kode:'5.1.02.03.0006', nama:'Belanja Jasa Kantor Lainnya',                     kel:'Jasa Kantor' },
  // Cetak & Penggandaan
  { kode:'5.1.02.06.0001', nama:'Belanja Cetak',                                   kel:'Cetak & Penggandaan' },
  { kode:'5.1.02.06.0002', nama:'Belanja Penggandaan / Fotokopi',                  kel:'Cetak & Penggandaan' },
  // Sewa
  { kode:'5.1.02.07.0001', nama:'Belanja Sewa Gedung / Aula / Ruangan',            kel:'Sewa' },
  { kode:'5.1.02.08.0001', nama:'Belanja Sewa Kendaraan',                          kel:'Sewa' },
  { kode:'5.1.02.10.0001', nama:'Belanja Sewa Peralatan / Perlengkapan',           kel:'Sewa' },
  // Makan & Minum
  { kode:'5.1.02.11.0001', nama:'Belanja Makan dan Minum Rapat',                   kel:'Makan & Minum' },
  { kode:'5.1.02.11.0002', nama:'Belanja Makan dan Minum Kegiatan',                kel:'Makan & Minum' },
  { kode:'5.1.02.11.0003', nama:'Belanja Makan dan Minum Tamu',                    kel:'Makan & Minum' },
  // Pakaian
  { kode:'5.1.02.14.0001', nama:'Belanja Pakaian Batik Tradisional',               kel:'Pakaian' },
  { kode:'5.1.02.14.0002', nama:'Belanja Pakaian Olahraga',                        kel:'Pakaian' },
  { kode:'5.1.02.14.0003', nama:'Belanja Pakaian Kegiatan Khusus',                 kel:'Pakaian' },
  // Perjalanan Dinas
  { kode:'5.1.02.15.0001', nama:'Belanja Perjalanan Dinas Dalam Daerah',           kel:'Perjalanan Dinas' },
  { kode:'5.1.02.15.0002', nama:'Belanja Perjalanan Dinas Luar Daerah',            kel:'Perjalanan Dinas' },
  // Pelatihan
  { kode:'5.1.02.17.0001', nama:'Belanja Kursus / Pelatihan / Bimtek',             kel:'Pelatihan' },
  { kode:'5.1.02.17.0002', nama:'Belanja Sosialisasi / Workshop / Seminar',        kel:'Pelatihan' },
  // Honorarium
  { kode:'5.1.02.18.0001', nama:'Belanja Honorarium Narasumber / Instruktur',      kel:'Honorarium' },
  { kode:'5.1.02.18.0002', nama:'Belanja Honorarium Panitia Kegiatan',             kel:'Honorarium' },
  { kode:'5.1.02.18.0003', nama:'Belanja Honorarium GTT / PTT Non-ASN',            kel:'Honorarium' },
  { kode:'5.1.02.18.0004', nama:'Belanja Honorarium Pengawas Ujian',               kel:'Honorarium' },
  { kode:'5.1.02.18.0005', nama:'Belanja Honorarium Lainnya',                      kel:'Honorarium' },
  // Pemeliharaan
  { kode:'5.1.02.20.0001', nama:'Belanja Pemeliharaan Gedung / Ruang Kelas',       kel:'Pemeliharaan' },
  { kode:'5.1.02.20.0002', nama:'Belanja Pemeliharaan Peralatan dan Mesin',        kel:'Pemeliharaan' },
  { kode:'5.1.02.20.0003', nama:'Belanja Pemeliharaan Kendaraan Bermotor',         kel:'Pemeliharaan' },
  { kode:'5.1.02.20.0004', nama:'Belanja Pemeliharaan Mebeler',                    kel:'Pemeliharaan' },
  { kode:'5.1.02.20.0005', nama:'Belanja Pemeliharaan Jaringan Listrik/Air/IT',    kel:'Pemeliharaan' },
  // Jasa Konsultansi
  { kode:'5.1.02.21.0001', nama:'Belanja Jasa Konsultansi / Tenaga Ahli',          kel:'Jasa Konsultansi' },
  // Belanja Modal
  { kode:'5.2.02.0001', nama:'Belanja Modal Komputer / Laptop / Tablet',           kel:'Belanja Modal' },
  { kode:'5.2.02.0002', nama:'Belanja Modal Proyektor / LCD / LED',                kel:'Belanja Modal' },
  { kode:'5.2.02.0003', nama:'Belanja Modal Printer / Scanner / Mesin Fotokopi',   kel:'Belanja Modal' },
  { kode:'5.2.02.0004', nama:'Belanja Modal Peralatan Lab IPA/Komputer/Bahasa',    kel:'Belanja Modal' },
  { kode:'5.2.02.0005', nama:'Belanja Modal Mebeler (Meja, Kursi, Lemari)',        kel:'Belanja Modal' },
  { kode:'5.2.02.0006', nama:'Belanja Modal Peralatan Olahraga / Seni',            kel:'Belanja Modal' },
  { kode:'5.2.02.0007', nama:'Belanja Modal Peralatan Lainnya',                    kel:'Belanja Modal' },
  { kode:'5.2.03.0001', nama:'Belanja Modal Gedung dan Bangunan',                  kel:'Belanja Modal' },
  { kode:'5.2.05.0001', nama:'Belanja Modal Buku Perpustakaan',                    kel:'Belanja Modal' },
];

// ─────────────────────────────────────────────────────────────
// DATA REFERENSI — KODE REKENING BOPD JAWA BARAT
// Berdasarkan Pergub Jabar & SIPD Provinsi Jawa Barat
// ─────────────────────────────────────────────────────────────
const KODE_REKENING_BOPD = [
  // Belanja Pegawai (khusus BOPD — GTT/PTT/Honorer Daerah)
  { kode:'5.1.01.01.0001', nama:'Belanja Gaji / Honorarium GTT (Guru Tidak Tetap)',        kel:'Belanja Pegawai BOPD' },
  { kode:'5.1.01.01.0002', nama:'Belanja Gaji / Honorarium PTT (Pegawai Tidak Tetap)',     kel:'Belanja Pegawai BOPD' },
  { kode:'5.1.01.01.0003', nama:'Belanja Honorarium Tenaga Kependidikan Non-ASN',          kel:'Belanja Pegawai BOPD' },
  { kode:'5.1.01.02.0001', nama:'Belanja Tambahan Penghasilan (Tunjangan Daerah)',         kel:'Belanja Pegawai BOPD' },
  // Belanja Barang & Jasa BOPD
  { kode:'5.1.02.01.0011', nama:'Belanja ATK (BOPD)',                                      kel:'Barang Habis Pakai BOPD' },
  { kode:'5.1.02.01.0012', nama:'Belanja Bahan Praktik Siswa (BOPD)',                      kel:'Barang Habis Pakai BOPD' },
  { kode:'5.1.02.01.0013', nama:'Belanja Bahan Kebersihan Lingkungan Sekolah (BOPD)',      kel:'Barang Habis Pakai BOPD' },
  { kode:'5.1.02.02.0011', nama:'Belanja Buku Pegangan Guru (BOPD)',                       kel:'Bahan/Material BOPD' },
  { kode:'5.1.02.02.0012', nama:'Belanja Modul/LKS Siswa (BOPD)',                          kel:'Bahan/Material BOPD' },
  { kode:'5.1.02.03.0011', nama:'Belanja Langganan Listrik (BOPD)',                        kel:'Jasa Kantor BOPD' },
  { kode:'5.1.02.03.0012', nama:'Belanja Langganan Air (BOPD)',                            kel:'Jasa Kantor BOPD' },
  { kode:'5.1.02.03.0013', nama:'Belanja Langganan Internet / Speedy (BOPD)',              kel:'Jasa Kantor BOPD' },
  { kode:'5.1.02.06.0011', nama:'Belanja Cetak Formulir / Administrasi (BOPD)',            kel:'Cetak & Penggandaan BOPD' },
  { kode:'5.1.02.06.0012', nama:'Belanja Penggandaan Soal Ulangan (BOPD)',                 kel:'Cetak & Penggandaan BOPD' },
  { kode:'5.1.02.11.0011', nama:'Belanja Makan dan Minum Rapat Dinas (BOPD)',              kel:'Makan & Minum BOPD' },
  { kode:'5.1.02.11.0012', nama:'Belanja Makan dan Minum Kegiatan MPLS/PPDB (BOPD)',       kel:'Makan & Minum BOPD' },
  { kode:'5.1.02.15.0011', nama:'Belanja Perjalanan Dinas Dalam Provinsi (BOPD)',          kel:'Perjalanan Dinas BOPD' },
  { kode:'5.1.02.17.0011', nama:'Belanja Pelatihan / Workshop / IHT Guru (BOPD)',         kel:'Pelatihan BOPD' },
  { kode:'5.1.02.17.0012', nama:'Belanja MGMP / KKG / MKKS Tingkat Kab/Kota (BOPD)',      kel:'Pelatihan BOPD' },
  // Pemeliharaan BOPD
  { kode:'5.1.02.20.0011', nama:'Belanja Rehab Ringan Gedung / Ruang Kelas (BOPD)',        kel:'Pemeliharaan BOPD' },
  { kode:'5.1.02.20.0012', nama:'Belanja Pemeliharaan Sanitasi / Toilet Sekolah (BOPD)',   kel:'Pemeliharaan BOPD' },
  { kode:'5.1.02.20.0013', nama:'Belanja Pemeliharaan Sarana TIK (BOPD)',                  kel:'Pemeliharaan BOPD' },
  { kode:'5.1.02.20.0014', nama:'Belanja Cat / Pengecatan Gedung Sekolah (BOPD)',          kel:'Pemeliharaan BOPD' },
  // Kegiatan Khusus BOPD Jabar
  { kode:'5.1.02.99.0001', nama:'Belanja Kegiatan PDBK / Inklusi (BOPD)',                  kel:'Kegiatan Khusus BOPD Jabar' },
  { kode:'5.1.02.99.0002', nama:'Belanja Kegiatan Penguatan Profil Pelajar Pancasila (BOPD)',kel:'Kegiatan Khusus BOPD Jabar' },
  { kode:'5.1.02.99.0003', nama:'Belanja Kegiatan Pencegahan Perundungan/Narkoba (BOPD)',  kel:'Kegiatan Khusus BOPD Jabar' },
  { kode:'5.1.02.99.0004', nama:'Belanja Penyusunan Dokumen Kurikulum Operasional (BOPD)', kel:'Kegiatan Khusus BOPD Jabar' },
  { kode:'5.1.02.99.0005', nama:'Belanja Kegiatan Akreditasi Sekolah (BOPD)',              kel:'Kegiatan Khusus BOPD Jabar' },
  // Belanja Modal BOPD
  { kode:'5.2.02.0011', nama:'Belanja Modal Peralatan Laboratorium (BOPD)',                kel:'Belanja Modal BOPD' },
  { kode:'5.2.02.0012', nama:'Belanja Modal Mebeler Ruang Kelas (BOPD)',                   kel:'Belanja Modal BOPD' },
  { kode:'5.2.02.0013', nama:'Belanja Modal Peralatan TIK / Komputer (BOPD)',              kel:'Belanja Modal BOPD' },
];

// ─────────────────────────────────────────────────────────────
// ATURAN BATAS BOSP (Permendikbudristek No. 2/2022 & 63/2022)
// ─────────────────────────────────────────────────────────────
const BATAS_BOSP = [
  {
    id: 'honor',
    kodeKegiatan: '10',
    label: 'Pembayaran Honor (Kode 10)',
    jenisLimit: 'MAKSIMUM',
    persen: 0.50,
    dasar: 'Total Alokasi BOSP',
    regulasi: 'Permendikbudristek No. 2/2022 Pasal 9 ayat (2)',
    penjelasan: 'Honor GTT/PTT tidak boleh melebihi 50% dari total BOSP yang diterima dalam satu tahun anggaran.',
    warnaOk: 'FF70AD47',
    warnaMelanggar: 'FFFF0000',
  },
  {
    id: 'buku',
    kodeKegiatan: '2',
    label: 'Pengembangan Perpustakaan / Buku (Kode 2)',
    jenisLimit: 'MINIMUM',
    persen: 0.05,
    dasar: 'Total Alokasi BOSP',
    regulasi: 'Permendikbudristek No. 2/2022 Lampiran I',
    penjelasan: 'Sekolah dianjurkan mengalokasikan minimal 5% BOSP untuk pengadaan buku guna memenuhi rasio 1 buku per siswa per mata pelajaran.',
    warnaOk: 'FF70AD47',
    warnaMelanggar: 'FFED7D31',
  },
  {
    id: 'pemeliharaan',
    kodeKegiatan: '8',
    label: 'Pemeliharaan Sarana dan Prasarana (Kode 8)',
    jenisLimit: 'MAKSIMUM',
    persen: 0.20,
    dasar: 'Total Alokasi BOSP',
    regulasi: 'Permendikbudristek No. 2/2022 Lampiran I + Juknis BOSP 2024',
    penjelasan: 'Pemeliharaan sapras disarankan tidak melebihi 20% BOSP. Jika perlu rehab berat, gunakan sumber dana BOPD atau DAK Fisik.',
    warnaOk: 'FF70AD47',
    warnaMelanggar: 'FFED7D31',
  },
  {
    id: 'pembelajaran',
    kodeKegiatan: '3',
    label: 'Pembelajaran & Ekstrakurikuler (Kode 3)',
    jenisLimit: 'MINIMUM',
    persen: 0.10,
    dasar: 'Total Alokasi BOSP',
    regulasi: 'Permendikbudristek No. 2/2022 Lampiran I',
    penjelasan: 'Kegiatan pembelajaran adalah inti penggunaan BOSP. Disarankan minimal 10% dialokasikan untuk komponen ini.',
    warnaOk: 'FF70AD47',
    warnaMelanggar: 'FFED7D31',
  },
];

// ─────────────────────────────────────────────────────────────
// DROPDOWN VALUES
// ─────────────────────────────────────────────────────────────
const SUMBER_DANA = ['BOSP','BOPD','BOSP + BOPD','Komite','Hibah','Lainnya'];
const SEMESTER    = ['Semester 1','Semester 2','Semester 1 & 2'];
const STATUS_RENCANA = ['Rencana','Disetujui','Revisi','Terealisasi'];
const STATUS_REALISASI = ['Belum Direalisasi','Sebagian','Selesai'];

// ─────────────────────────────────────────────────────────────
// FUNGSI STYLE HELPER
// ─────────────────────────────────────────────────────────────
const W = {
  biru1:    { argb:'FF1F4E79' },
  biru2:    { argb:'FF2E75B6' },
  birumuda: { argb:'FFD6E4F0' },
  biruverylight: { argb:'FFF5F9FF' },
  hijau1:   { argb:'FF375623' },
  hijaumuda:{ argb:'FFE2EFD9' },
  merah1:   { argb:'FF7B2C2C' },
  ungu1:    { argb:'FF7030A0' },
  abugelap: { argb:'FF404040' },
  kuning:   { argb:'FFFFF2CC' },
  jingga:   { argb:'FFED7D31' },
  putih:    { argb:'FFFFFFFF' },
  abu1:     { argb:'FFF2F2F2' },
};

function hStyle(bg, fc='FFFFFFFF', sz=11) {
  return {
    font: { bold:true, color:{ argb:fc }, size:sz, name:'Calibri' },
    fill: { type:'pattern', pattern:'solid', fgColor:bg },
    alignment: { horizontal:'center', vertical:'middle', wrapText:true },
    border: { top:{style:'thin'}, bottom:{style:'thin'}, left:{style:'thin'}, right:{style:'thin'} },
  };
}
function dStyle(bg, fc='FF000000', bold=false) {
  return {
    font: { bold, color:{ argb:fc }, size:10, name:'Calibri' },
    fill: { type:'pattern', pattern:'solid', fgColor:bg },
    alignment: { vertical:'middle', wrapText:true },
    border: { top:{style:'thin'}, bottom:{style:'thin'}, left:{style:'thin'}, right:{style:'thin'} },
  };
}
function cStyle(bg, bold=false) {
  return {
    font: { bold, size:10, name:'Calibri' },
    fill: { type:'pattern', pattern:'solid', fgColor:bg },
    alignment: { horizontal:'right', vertical:'middle' },
    numFmt:'#,##0',
    border: { top:{style:'thin'}, bottom:{style:'thin'}, left:{style:'thin'}, right:{style:'thin'} },
  };
}
function pctStyle(bg) {
  return {
    font: { size:10, name:'Calibri' },
    fill: { type:'pattern', pattern:'solid', fgColor:bg },
    alignment: { horizontal:'center', vertical:'middle' },
    numFmt:'0.0%',
    border: { top:{style:'thin'}, bottom:{style:'thin'}, left:{style:'thin'}, right:{style:'thin'} },
  };
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
async function buatWorkbook() {
  const wb = new ExcelJS.Workbook();
  wb.creator  = 'SMAN 1 Cigalontang';
  wb.created  = new Date();
  wb.modified = new Date();

  buatSheetPengaturan(wb);
  buatSheetKodeKegiatan(wb);
  buatSheetKodeRekening(wb);
  buatSheetKodeRekeningBOPD(wb);
  buatSheetRancangan(wb);
  buatSheetKontrolBatas(wb);
  buatSheetRekapBOSP(wb);
  buatSheetRekapBOPD(wb);
  buatSheetRekapGabungan(wb);
  buatSheetLaporanKS(wb);
  buatSheetPetunjuk(wb);

  const out = path.join('c:/BK-Cigalontang','ARKAS_Rancangan_Anggaran.xlsx');
  await wb.xlsx.writeFile(out);
  console.log('✅ File berhasil dibuat:', out);
}

// ═══════════════════════════════════════════════════════════════
// SHEET 1 — PENGATURAN
// ═══════════════════════════════════════════════════════════════
function buatSheetPengaturan(wb) {
  const ws = wb.addWorksheet('⚙ Pengaturan', { properties:{ tabColor:{ argb:'FF404040' } } });
  ws.views = [{ showGridLines:false }];

  ws.mergeCells('B2:G2');
  ws.getCell('B2').value = 'PENGATURAN APLIKASI RANCANGAN ANGGARAN ARKAS';
  ws.getCell('B2').style = hStyle(W.abugelap,'FFFFFFFF',14);
  ws.getRow(2).height = 35;

  ws.mergeCells('B3:G3');
  ws.getCell('B3').value = 'SMA Negeri 1 Cigalontang — Provinsi Jawa Barat';
  ws.getCell('B3').style = { font:{bold:true,size:12,color:{ argb:'FF404040' },name:'Calibri'}, alignment:{horizontal:'center',vertical:'middle'}, fill:{type:'pattern',pattern:'solid',fgColor:W.abu1} };
  ws.getRow(3).height = 25;

  const fields = [
    ['B5:D5',  'E5:G5',  '🏫  Nama Sekolah',              'SMA Negeri 1 Cigalontang'],
    ['B6:D6',  'E6:G6',  '🔢  NPSN',                      '20212066'],
    ['B7:D7',  'E7:G7',  '📍  Alamat',                    'Jl. Cigalontang, Kec. Cigalontang'],
    ['B8:D8',  'E8:G8',  '🗺️  Kabupaten/Kota',            'Kabupaten Tasikmalaya'],
    ['B9:D9',  'E9:G9',  '🗺️  Provinsi',                  'Jawa Barat'],
    ['B10:D10','E10:G10','📅  Tahun Anggaran',             new Date().getFullYear()],
    ['B11:D11','E11:G11','👤  Kepala Sekolah',             ''],
    ['B12:D12','E12:G12','💼  Bendahara BOSP',             ''],
    ['B13:D13','E13:G13','💼  Bendahara BOPD',             ''],
    ['B14:D14','E14:G14','👥  Jumlah Siswa (awal)',        0],
    ['B15:D15','E15:G15','💰  Total Alokasi BOSP (Rp)',    0],
    ['B16:D16','E16:G16','💰  Total Alokasi BOPD (Rp)',    0],
    ['B17:D17','E17:G17','🗓️  Tanggal Dibuat',             new Date()],
  ];

  fields.forEach(([lr, ir, label, val]) => {
    ws.mergeCells(lr); ws.mergeCells(ir);
    const lc = ws.getCell(lr.split(':')[0]);
    lc.value = label;
    lc.style = { font:{bold:true,size:11,name:'Calibri',color:W.biru1}, fill:{type:'pattern',pattern:'solid',fgColor:W.birumuda}, alignment:{horizontal:'left',vertical:'middle'}, border:{top:{style:'thin'},bottom:{style:'thin'},left:{style:'thin'},right:{style:'thin'}} };
    const ic = ws.getCell(ir.split(':')[0]);
    ic.value = val;
    if (label.includes('Alokasi')) ic.numFmt = '"Rp "#,##0';
    if (label.includes('Tanggal')) ic.numFmt = 'DD MMMM YYYY';
    ic.style = { font:{size:11,name:'Calibri'}, fill:{type:'pattern',pattern:'solid',fgColor:W.putih}, alignment:{horizontal:'left',vertical:'middle'}, border:{top:{style:'thin'},bottom:{style:'thin'},left:{style:'thin'},right:{style:'thin'}} };
    ws.getRow(parseInt(lr.match(/\d+/)[0])).height = 22;
  });

  // Catatan penting: link ke sel Alokasi BOSP/BOPD (digunakan sheet Kontrol Batas)
  ws.mergeCells('B19:G19');
  ws.getCell('B19').value = '⚠️  Isi Total Alokasi BOSP (E15) dan BOPD (E16) dengan benar — digunakan untuk perhitungan peringatan batas anggaran di sheet Kontrol Batas.';
  ws.getCell('B19').style = { font:{italic:true,size:10,color:{ argb:'FF7F6000' },name:'Calibri'}, fill:{type:'pattern',pattern:'solid',fgColor:W.kuning}, alignment:{horizontal:'left',vertical:'middle',wrapText:true} };
  ws.getRow(19).height = 30;

  ws.getColumn('A').width = 3;
  ws.getColumn('B').width = 5;
  ws.getColumn('C').width = 25;
  ws.getColumn('D').width = 15;
  ws.getColumn('E').width = 20;
  ws.getColumn('F').width = 20;
  ws.getColumn('G').width = 20;
}

// ═══════════════════════════════════════════════════════════════
// SHEET 2 — KODE KEGIATAN
// ═══════════════════════════════════════════════════════════════
function buatSheetKodeKegiatan(wb) {
  const ws = wb.addWorksheet('📋 Kode Kegiatan', { properties:{ tabColor:{ argb:'FF2E75B6' } } });
  ws.views = [{ showGridLines:false, state:'frozen', ySplit:4 }];

  ws.mergeCells('A1:D1');
  ws.getCell('A1').value = 'REFERENSI KODE KEGIATAN ARKAS';
  ws.getCell('A1').style = hStyle(W.biru1,'FFFFFFFF',13);
  ws.getRow(1).height = 30;

  ws.mergeCells('A2:D2');
  ws.getCell('A2').value = 'Permendikbudristek No. 2 Tahun 2022 tentang BOSP — berlaku untuk BOSP dan BOPD';
  ws.getCell('A2').style = { font:{italic:true,size:10,color:W.biru1,name:'Calibri'}, fill:{type:'pattern',pattern:'solid',fgColor:W.birumuda}, alignment:{horizontal:'center',vertical:'middle'} };
  ws.getRow(2).height = 20;

  ['Kode','Nama Komponen / Kegiatan','Keterangan / Contoh Kegiatan','Sumber Dana'].forEach((h,i) => {
    ws.getCell(4, i+1).value = h;
    ws.getCell(4, i+1).style = hStyle(W.biru2);
  });
  ws.getRow(4).height = 25;

  KODE_KEGIATAN.forEach((item, idx) => {
    const row = ws.getRow(5+idx);
    const bg  = idx%2===0 ? W.putih : W.biruverylight;
    row.height = 22;
    row.getCell(1).value = item.kode;
    row.getCell(1).style = { ...dStyle(bg,'FF000000',true), alignment:{horizontal:'center',vertical:'middle'} };
    row.getCell(2).value = item.nama;
    row.getCell(2).style = dStyle(bg,W.biru1.argb,true);
    row.getCell(3).value = item.ket;
    row.getCell(3).style = dStyle(bg);
    row.getCell(4).value = 'BOSP, BOPD';
    row.getCell(4).style = { ...dStyle(bg), alignment:{horizontal:'center',vertical:'middle'} };
  });

  [8,45,60,20].forEach((w,i) => { ws.getColumn(i+1).width = w; });
}

// ═══════════════════════════════════════════════════════════════
// SHEET 3 — KODE REKENING NASIONAL
// ═══════════════════════════════════════════════════════════════
function buatSheetKodeRekening(wb) {
  const ws = wb.addWorksheet('📂 Kode Rekening', { properties:{ tabColor:{ argb:'FF7B2C2C' } } });
  ws.views = [{ showGridLines:false, state:'frozen', ySplit:4 }];

  ws.mergeCells('A1:D1');
  ws.getCell('A1').value = 'REFERENSI KODE REKENING BELANJA — NASIONAL (BAS / SIPD)';
  ws.getCell('A1').style = hStyle(W.merah1,'FFFFFFFF',13);
  ws.getRow(1).height = 30;
  ws.mergeCells('A2:D2');
  ws.getCell('A2').value = 'Digunakan untuk kegiatan yang dibiayai BOSP — Berlaku di semua provinsi';
  ws.getCell('A2').style = { font:{italic:true,size:10,color:W.merah1,name:'Calibri'}, fill:{type:'pattern',pattern:'solid',fgColor:{ argb:'FFFCE4D6' }}, alignment:{horizontal:'center',vertical:'middle'} };

  ['Kode Rekening','Uraian Rekening','Kelompok Belanja','Keterangan'].forEach((h,i) => {
    ws.getCell(4,i+1).value = h;
    ws.getCell(4,i+1).style = hStyle(W.merah1);
  });
  ws.getRow(4).height = 25;

  let prevKel = '';
  let ri = 5;
  KODE_REKENING.forEach(item => {
    if (item.kel !== prevKel) {
      ws.mergeCells(`A${ri}:D${ri}`);
      ws.getCell(`A${ri}`).value = `▌ ${item.kel.toUpperCase()}`;
      ws.getCell(`A${ri}`).style = hStyle({ argb:'FFFFE0CC' },W.merah1.argb,10);
      ws.getRow(ri).height = 18;
      ri++; prevKel = item.kel;
    }
    const bg = ri%2===0 ? W.putih : { argb:'FFFFF5F5' };
    ws.getRow(ri).height = 20;
    ws.getCell(ri,1).value = item.kode;
    ws.getCell(ri,1).style = { ...dStyle(bg,W.merah1.argb,true), alignment:{horizontal:'center',vertical:'middle'} };
    ws.getCell(ri,2).value = item.nama;
    ws.getCell(ri,2).style = dStyle(bg);
    ws.getCell(ri,3).value = item.kel;
    ws.getCell(ri,3).style = { ...dStyle(bg), alignment:{horizontal:'center',vertical:'middle'} };
    ws.getCell(ri,4).style = dStyle(bg);
    ri++;
  });

  [20,55,25,30].forEach((w,i) => { ws.getColumn(i+1).width = w; });
}

// ═══════════════════════════════════════════════════════════════
// SHEET 4 — KODE REKENING BOPD JAWA BARAT
// ═══════════════════════════════════════════════════════════════
function buatSheetKodeRekeningBOPD(wb) {
  const ws = wb.addWorksheet('📂 Kode Rekening BOPD Jabar', { properties:{ tabColor:{ argb:'FF375623' } } });
  ws.views = [{ showGridLines:false, state:'frozen', ySplit:5 }];

  ws.mergeCells('A1:E1');
  ws.getCell('A1').value = 'REFERENSI KODE REKENING BELANJA — BOPD PROVINSI JAWA BARAT';
  ws.getCell('A1').style = hStyle(W.hijau1,'FFFFFFFF',13);
  ws.getRow(1).height = 30;

  ws.mergeCells('A2:E2');
  ws.getCell('A2').value = 'Berdasarkan Pergub Jabar & SIPD Provinsi Jawa Barat — Khusus Dana BOPD SMA/SMK/SLB Negeri';
  ws.getCell('A2').style = { font:{italic:true,size:10,color:W.hijau1,name:'Calibri'}, fill:{type:'pattern',pattern:'solid',fgColor:W.hijaumuda}, alignment:{horizontal:'center',vertical:'middle'} };

  ws.mergeCells('A3:E3');
  ws.getCell('A3').value = '⚠️  Catatan: Konfirmasi kode rekening final ke operator SIPD/BOPD Dinas Pendidikan Provinsi Jabar sebelum memasukkan ke sistem. Kode sub-rincian dapat berubah setiap tahun anggaran.';
  ws.getCell('A3').style = { font:{italic:true,size:9,color:{ argb:'FF7F6000' },name:'Calibri'}, fill:{type:'pattern',pattern:'solid',fgColor:W.kuning}, alignment:{horizontal:'left',vertical:'middle',wrapText:true} };
  ws.getRow(3).height = 28;

  ['Kode Rekening','Uraian Rekening','Kelompok Belanja','Sumber Dana','Keterangan'].forEach((h,i) => {
    ws.getCell(5,i+1).value = h;
    ws.getCell(5,i+1).style = hStyle(W.hijau1);
  });
  ws.getRow(5).height = 25;

  let prevKel = '';
  let ri = 6;
  KODE_REKENING_BOPD.forEach(item => {
    if (item.kel !== prevKel) {
      ws.mergeCells(`A${ri}:E${ri}`);
      ws.getCell(`A${ri}`).value = `▌ ${item.kel.toUpperCase()}`;
      ws.getCell(`A${ri}`).style = hStyle({ argb:'FFD6E4D0' },W.hijau1.argb,10);
      ws.getRow(ri).height = 18;
      ri++; prevKel = item.kel;
    }
    const bg = ri%2===0 ? W.putih : W.hijaumuda;
    ws.getRow(ri).height = 20;
    ws.getCell(ri,1).value = item.kode;
    ws.getCell(ri,1).style = { ...dStyle(bg,W.hijau1.argb,true), alignment:{horizontal:'center',vertical:'middle'} };
    ws.getCell(ri,2).value = item.nama;
    ws.getCell(ri,2).style = dStyle(bg);
    ws.getCell(ri,3).value = item.kel;
    ws.getCell(ri,3).style = { ...dStyle(bg), alignment:{horizontal:'center',vertical:'middle'} };
    ws.getCell(ri,4).value = 'BOPD';
    ws.getCell(ri,4).style = { ...dStyle(bg,'FF375623',true), alignment:{horizontal:'center',vertical:'middle'} };
    ws.getCell(ri,5).style = dStyle(bg);
    ri++;
  });

  [22,58,28,10,30].forEach((w,i) => { ws.getColumn(i+1).width = w; });
}

// ═══════════════════════════════════════════════════════════════
// SHEET 5 — RANCANGAN ANGGARAN (input utama, 150 baris)
// Kolom: A=No, B=KodeKeg, C=NamaKeg, D=KodeRek, E=UraianRek
//        F=UraianRincian, G=Vol, H=Sat, I=HargaSat
//        J=Jumlah(formula), K=SumberDana, L=AlokasiBosp, M=AlokasiBosp
//        N=Semester, O=Triwulan, P=StatusRencana
//        Q=Realisasi(Rp), R=%Realisasi(formula), S=Sisa(formula), T=StatusRealisasi
//        U=Keterangan
// ═══════════════════════════════════════════════════════════════
function buatSheetRancangan(wb) {
  const ws = wb.addWorksheet('✏️ Rancangan Anggaran', { properties:{ tabColor:{ argb:'FF2E75B6' } } });
  ws.views = [{ showGridLines:false, state:'frozen', ySplit:5 }];
  ws.pageSetup = { paperSize:9, orientation:'landscape', fitToPage:true, fitToWidth:1, fitToHeight:0, margins:{ left:0.5, right:0.5, top:0.75, bottom:0.75 } };

  // ── Baris 1-3: Judul ──────────────────────────────────────
  ws.mergeCells('A1:U1');
  ws.getCell('A1').value = 'RANCANGAN KEGIATAN DAN ANGGARAN SEKOLAH (RKAS)';
  ws.getCell('A1').style = hStyle(W.biru1,'FFFFFFFF',14);
  ws.getRow(1).height = 35;

  ws.mergeCells('A2:U2');
  ws.getCell('A2').value = 'SMA Negeri 1 Cigalontang — Kabupaten Tasikmalaya — Provinsi Jawa Barat';
  ws.getCell('A2').style = { font:{bold:true,size:12,color:W.biru1,name:'Calibri'}, fill:{type:'pattern',pattern:'solid',fgColor:W.birumuda}, alignment:{horizontal:'center',vertical:'middle'} };
  ws.getRow(2).height = 22;

  ws.mergeCells('A3:U3');
  ws.getCell('A3').value = `Tahun Anggaran ${new Date().getFullYear()}  |  Sumber Dana: BOSP & BOPD  |  ${JUMLAH_BARIS} baris tersedia`;
  ws.getCell('A3').style = { font:{italic:true,size:10,color:{ argb:'FF404040' },name:'Calibri'}, fill:{type:'pattern',pattern:'solid',fgColor:W.abu1}, alignment:{horizontal:'center',vertical:'middle'} };
  ws.getRow(3).height = 18;

  // ── Baris 5: Header Kolom ─────────────────────────────────
  // Kelompok header (baris 4 = grup, baris 5 = detail)
  const grupHeader = [
    { label:'',          span:1,  col:1  },
    { label:'KEGIATAN',  span:3,  col:2  },
    { label:'BELANJA',   span:4,  col:5  },
    { label:'ANGGARAN',  span:5,  col:9  },
    { label:'JADWAL & STATUS', span:3, col:14 },
    { label:'REALISASI', span:4,  col:17 },
    { label:'',          span:1,  col:21 },
  ];

  grupHeader.forEach(g => {
    if (!g.label) return;
    const c1 = colLetter(g.col);
    const c2 = colLetter(g.col + g.span - 1);
    ws.mergeCells(`${c1}4:${c2}4`);
    ws.getCell(`${c1}4`).value = g.label;
    const bgMap = { KEGIATAN:W.biru2, BELANJA:W.merah1, ANGGARAN:W.biru1, 'JADWAL & STATUS':W.abugelap, REALISASI:W.hijau1 };
    ws.getCell(`${c1}4`).style = hStyle(bgMap[g.label]||W.abugelap);
  });
  ws.getRow(4).height = 20;

  const hdrs = [
    { lbl:'No',           w:5  },
    { lbl:'Kode\nKeg',    w:8  },
    { lbl:'Nama Kegiatan',w:32 },
    { lbl:'Kode\nRekening',w:18 },
    { lbl:'Uraian\nRekening',w:32 },
    { lbl:'Uraian Rincian\n(detail barang/jasa)',w:42 },
    { lbl:'Vol', w:7  },
    { lbl:'Sat', w:10 },
    { lbl:'Harga\nSatuan (Rp)',w:18 },
    { lbl:'Jumlah\n(Rp)',  w:20 },
    { lbl:'Sumber\nDana',  w:12 },
    { lbl:'Alokasi\nBOSP (Rp)',w:18 },
    { lbl:'Alokasi\nBOPD (Rp)',w:18 },
    { lbl:'Semester',      w:13 },
    { lbl:'Tri-\nwulan',   w:9  },
    { lbl:'Status\nRencana',w:13 },
    { lbl:'Realisasi\n(Rp)',w:20 },
    { lbl:'%\nRealisasi',  w:11 },
    { lbl:'Sisa\nAnggaran (Rp)',w:20 },
    { lbl:'Status\nRealisasi',w:14 },
    { lbl:'Keterangan',    w:30 },
  ];

  hdrs.forEach((h,i) => {
    const cell = ws.getCell(5, i+1);
    cell.value = h.lbl;
    cell.style = hStyle(W.biru2);
    ws.getColumn(i+1).width = h.w;
  });
  ws.getRow(5).height = 35;

  // ── Baris Data ────────────────────────────────────────────
  for (let r = 0; r < JUMLAH_BARIS; r++) {
    const rn  = DATA_MULAI + r;
    const row = ws.getRow(rn);
    row.height = 20;
    const bg  = r%2===0 ? W.putih : W.biruverylight;

    // A: No
    cell(row,1).value = r+1;
    cell(row,1).style = { ...dStyle(bg,'FF000000',false), alignment:{horizontal:'center',vertical:'middle'} };

    // B: Kode Kegiatan (dropdown)
    const bcell = cell(row,2);
    bcell.style = { ...dStyle(bg,W.biru1.argb,true), alignment:{horizontal:'center',vertical:'middle'} };
    bcell.dataValidation = ddList(KODE_KEGIATAN.map(k=>k.kode).join(','), 'Kode Kegiatan Tidak Valid','Pilih kode 1–13');

    // C,D,E,F: isian manual
    [3,4,5,6].forEach(c => { cell(row,c).style = dStyle(bg); });

    // G: Volume, H: Satuan
    cell(row,7).style = { ...dStyle(bg), alignment:{horizontal:'center',vertical:'middle'} };
    cell(row,8).style = { ...dStyle(bg), alignment:{horizontal:'center',vertical:'middle'} };

    // I: Harga Satuan
    cell(row,9).style = cStyle(bg);

    // J: Jumlah = Vol × Harga (formula)
    const jcell = cell(row,10);
    jcell.value  = { formula:`IF(AND(G${rn}<>"",I${rn}<>""),G${rn}*I${rn},0)` };
    jcell.style  = { ...cStyle({ argb:'FFFFFCE7' }), font:{bold:false,size:10,name:'Calibri'} };

    // K: Sumber Dana (dropdown)
    const kcell = cell(row,11);
    kcell.style = { ...dStyle(bg), alignment:{horizontal:'center',vertical:'middle'} };
    kcell.dataValidation = ddList(SUMBER_DANA.join(','),'Sumber Dana Tidak Valid','Pilih: BOSP, BOPD, dll');

    // L: Alokasi BOSP, M: Alokasi BOPD
    cell(row,12).style = cStyle(bg);
    cell(row,13).style = cStyle(bg);

    // N: Semester (dropdown)
    const ncell = cell(row,14);
    ncell.style = { ...dStyle(bg), alignment:{horizontal:'center',vertical:'middle'} };
    ncell.dataValidation = ddList(SEMESTER.join(','));

    // O: Triwulan (dropdown)
    const ocell = cell(row,15);
    ocell.style = { ...dStyle(bg), alignment:{horizontal:'center',vertical:'middle'} };
    ocell.dataValidation = ddList('1,2,3,4,1&2,3&4,1&2&3&4');

    // P: Status Rencana (dropdown)
    const pcell = cell(row,16);
    pcell.style = { ...dStyle(bg), alignment:{horizontal:'center',vertical:'middle'} };
    pcell.dataValidation = ddList(STATUS_RENCANA.join(','));

    // Q: Realisasi (input manual)
    cell(row,17).style = { ...cStyle({ argb:'FFE2EFD9' }) };

    // R: % Realisasi (formula)
    const rcell = cell(row,18);
    rcell.value = { formula:`IF(J${rn}>0,Q${rn}/J${rn},0)` };
    rcell.style = { ...pctStyle({ argb:'FFE2EFD9' }), font:{bold:false,size:10,name:'Calibri'} };

    // S: Sisa Anggaran (formula)
    const scell = cell(row,19);
    scell.value = { formula:`IF(J${rn}>0,J${rn}-Q${rn},0)` };
    scell.style = { ...cStyle({ argb:'FFFFE0CC' }), font:{bold:false,size:10,name:'Calibri'} };

    // T: Status Realisasi (dropdown)
    const tcell = cell(row,20);
    tcell.style = { ...dStyle(bg), alignment:{horizontal:'center',vertical:'middle'} };
    tcell.dataValidation = ddList(STATUS_REALISASI.join(','));

    // U: Keterangan
    cell(row,21).style = dStyle(bg);
  }

  // ── Baris Total ───────────────────────────────────────────
  const tr = DATA_AKHIR + 1;
  ws.mergeCells(`A${tr}:I${tr}`);
  ws.getCell(`A${tr}`).value = 'TOTAL KESELURUHAN';
  ws.getCell(`A${tr}`).style = hStyle(W.biru1,'FFFFFFFF',11);

  const totCols = { J:10, L:12, M:13, Q:17, S:19 };
  Object.entries(totCols).forEach(([col,idx]) => {
    const tc = ws.getCell(`${col}${tr}`);
    tc.value = { formula:`SUM(${col}${DATA_MULAI}:${col}${DATA_AKHIR})` };
    tc.style = { ...cStyle(W.kuning,true), font:{bold:true,size:11,name:'Calibri'} };
  });

  // isian header sisa kolom total
  [11,14,15,16,18,20,21].forEach(c => {
    ws.getCell(tr,c).style = hStyle(W.biru1,'FFFFFFFF',11);
  });
  ws.getRow(tr).height = 28;
}

// ═══════════════════════════════════════════════════════════════
// SHEET 6 — KONTROL BATAS BOSP
// ═══════════════════════════════════════════════════════════════
function buatSheetKontrolBatas(wb) {
  const ws = wb.addWorksheet('⚠️ Kontrol Batas BOSP', { properties:{ tabColor:{ argb:'FFED7D31' } } });
  ws.views = [{ showGridLines:false }];

  ws.mergeCells('A1:H1');
  ws.getCell('A1').value = 'KONTROL BATAS PENGGUNAAN DANA BOSP';
  ws.getCell('A1').style = hStyle({ argb:'FFED7D31' },'FFFFFFFF',13);
  ws.getRow(1).height = 30;

  ws.mergeCells('A2:H2');
  ws.getCell('A2').value = 'Berdasarkan Permendikbudristek No. 2/2022 & Juknis BOSP 2024 — Peringatan otomatis jika anggaran melampaui/tidak mencapai batas';
  ws.getCell('A2').style = { font:{italic:true,size:10,color:{ argb:'FFED7D31' },name:'Calibri'}, fill:{type:'pattern',pattern:'solid',fgColor:{ argb:'FFFCE4D6' }}, alignment:{horizontal:'center',vertical:'middle'} };
  ws.getRow(2).height = 20;

  // Header ringkasan alokasi
  ws.mergeCells('A4:D4');
  ws.getCell('A4').value = '📌 Informasi Alokasi (dari sheet Pengaturan)';
  ws.getCell('A4').style = hStyle({ argb:'FFED7D31' },'FFFFFFFF',11);
  ws.getRow(4).height = 22;

  const infoRows = [
    ['A5:B5','C5:D5','Total Alokasi BOSP (Rp)','=\'⚙ Pengaturan\'!E15'],
    ['A6:B6','C6:D6','Total Alokasi BOPD (Rp)','=\'⚙ Pengaturan\'!E16'],
    ['A7:B7','C7:D7','Total Rencana BOSP (dari Rancangan)','=\'✏️ Rancangan Anggaran\'!L' + (DATA_AKHIR+1)],
    ['A8:B8','C8:D8','Total Rencana BOPD (dari Rancangan)','=\'✏️ Rancangan Anggaran\'!M' + (DATA_AKHIR+1)],
    ['A9:B9','C9:D9','Sisa Alokasi BOSP (Rp)','=C5-C7'],
    ['A10:B10','C10:D10','Sisa Alokasi BOPD (Rp)','=C6-C8'],
  ];

  infoRows.forEach(([lr,ir,label,formula]) => {
    ws.mergeCells(lr); ws.mergeCells(ir);
    const rn = parseInt(lr.match(/\d+/)[0]);
    const lc = ws.getCell(lr.split(':')[0]);
    lc.value = label;
    lc.style = { font:{bold:true,size:10,name:'Calibri'}, fill:{type:'pattern',pattern:'solid',fgColor:{ argb:'FFFCE4D6' }}, alignment:{horizontal:'left',vertical:'middle'}, border:{top:{style:'thin'},bottom:{style:'thin'},left:{style:'thin'},right:{style:'thin'}} };
    const ic = ws.getCell(ir.split(':')[0]);
    ic.value = { formula: formula.replace(/^=/,'') };
    ic.numFmt = '"Rp "#,##0';
    ic.style = { font:{bold:true,size:10,name:'Calibri'}, fill:{type:'pattern',pattern:'solid',fgColor:W.putih}, alignment:{horizontal:'right',vertical:'middle'}, numFmt:'"Rp "#,##0', border:{top:{style:'thin'},bottom:{style:'thin'},left:{style:'thin'},right:{style:'thin'}} };
    ws.getRow(rn).height = 22;
  });

  // ── Tabel Kontrol Batas ────────────────────────────────────
  ws.mergeCells('A12:H12');
  ws.getCell('A12').value = '🚦 Tabel Kontrol Batas Per Komponen Kegiatan';
  ws.getCell('A12').style = hStyle({ argb:'FFED7D31' },'FFFFFFFF',12);
  ws.getRow(12).height = 25;

  const hdrKontrol = ['Komponen','Jenis\nBatas','Batas (%)\nRegulasi','Nilai Batas\n(Rp)','Rencana\n(Rp)','% Rencana\nthd BOSP','Status','Regulasi / Catatan'];
  hdrKontrol.forEach((h,i) => {
    ws.getCell(13,i+1).value = h;
    ws.getCell(13,i+1).style = hStyle({ argb:'FFED7D31' });
  });
  ws.getRow(13).height = 30;

  // Ref: Total BOSP di C5 sheet ini
  const BOSP_REF = "C5";

  BATAS_BOSP.forEach((b, idx) => {
    const rn = 14 + idx;
    const bg = idx%2===0 ? W.putih : { argb:'FFFFF5EE' };
    ws.getRow(rn).height = 28;

    // A: Komponen
    ws.getCell(rn,1).value = b.label;
    ws.getCell(rn,1).style = { ...dStyle(bg,'FF000000',true), alignment:{horizontal:'left',vertical:'middle',wrapText:true} };

    // B: Jenis batas
    ws.getCell(rn,2).value = b.jenisLimit;
    ws.getCell(rn,2).style = {
      ...dStyle(bg, b.jenisLimit==='MAKSIMUM' ? 'FFC00000' : 'FF375623', true),
      alignment:{horizontal:'center',vertical:'middle'}
    };

    // C: Persen batas
    ws.getCell(rn,3).value = b.persen;
    ws.getCell(rn,3).numFmt = '0%';
    ws.getCell(rn,3).style = { ...dStyle(bg,'FF000000',true), alignment:{horizontal:'center',vertical:'middle'}, numFmt:'0%' };

    // D: Nilai batas Rp (formula: persen × total BOSP dari Pengaturan)
    ws.getCell(rn,4).value = { formula:`${b.persen}*${BOSP_REF}` };
    ws.getCell(rn,4).style = { ...cStyle(bg), font:{size:10,name:'Calibri'} };

    // E: Total rencana komponen ini (SUMPRODUCT dari Rancangan — kolom L = BOSP)
    const RAN = "'✏️ Rancangan Anggaran'";
    ws.getCell(rn,5).value = {
      formula:`SUMPRODUCT((${RAN}!B${DATA_MULAI}:B${DATA_AKHIR}="${b.kodeKegiatan}")*(${RAN}!L${DATA_MULAI}:L${DATA_AKHIR}))`
    };
    ws.getCell(rn,5).style = { ...cStyle(bg), font:{size:10,name:'Calibri'} };

    // F: % terhadap total BOSP
    ws.getCell(rn,6).value = { formula:`IF(${BOSP_REF}>0,E${rn}/${BOSP_REF},0)` };
    ws.getCell(rn,6).numFmt = '0.0%';
    ws.getCell(rn,6).style = { ...pctStyle(bg), font:{size:10,name:'Calibri'} };

    // G: Status (formula IF)
    let statusFormula;
    if (b.jenisLimit === 'MAKSIMUM') {
      statusFormula = `IF(E${rn}=0,"— Belum Diisi",IF(E${rn}>D${rn},"⛔ MELEBIHI BATAS","✅ Aman"))`;
    } else {
      statusFormula = `IF(E${rn}=0,"— Belum Diisi",IF(E${rn}<D${rn},"⚠️ DI BAWAH BATAS","✅ Terpenuhi"))`;
    }
    ws.getCell(rn,7).value = { formula: statusFormula };
    ws.getCell(rn,7).style = { ...dStyle(bg,'FF000000',true), alignment:{horizontal:'center',vertical:'middle'} };

    // H: Regulasi & penjelasan
    ws.getCell(rn,8).value = b.penjelasan + '\n[' + b.regulasi + ']';
    ws.getCell(rn,8).style = { ...dStyle(bg), font:{italic:true,size:9,name:'Calibri'}, alignment:{vertical:'middle',wrapText:true,horizontal:'left'} };
  });

  // Larangan penggunaan BOSP
  const lr = 14 + BATAS_BOSP.length + 1;
  ws.mergeCells(`A${lr}:H${lr}`);
  ws.getCell(`A${lr}`).value = '🚫 LARANGAN PENGGUNAAN DANA BOSP (tidak boleh sama sekali)';
  ws.getCell(`A${lr}`).style = hStyle({ argb:'FFC00000' },'FFFFFFFF',11);
  ws.getRow(lr).height = 22;

  const larangan = [
    'Membangun gedung/ruangan baru (kecuali toilet/WC yang belum ada)',
    'Membayar gaji/tunjangan PNS/PPPK yang sudah ditanggung APBN/APBD',
    'Investasi saham atau membayar cicilan/bunga utang',
    'Membeli pakaian/seragam untuk siswa maupun guru',
    'Membayar iuran/dana untuk kepentingan pribadi',
    'Uang transpor untuk siswa reguler (bukan afirmasi)',
    'Membeli aset tetap bernilai di atas Rp 1.500.000 dengan sumber non-modal (harus kode 5.2.xx)',
  ];
  larangan.forEach((l,i) => {
    ws.mergeCells(`A${lr+1+i}:H${lr+1+i}`);
    ws.getCell(`A${lr+1+i}`).value = `  ✗  ${l}`;
    ws.getCell(`A${lr+1+i}`).style = { font:{size:10,name:'Calibri',color:{ argb:'FFC00000' }}, fill:{type:'pattern',pattern:'solid',fgColor:{ argb:'FFFFF0F0' }}, alignment:{horizontal:'left',vertical:'middle'}, border:{bottom:{style:'hair'}} };
    ws.getRow(lr+1+i).height = 20;
  });

  const colW = [40,12,12,20,20,14,18,55];
  colW.forEach((w,i) => { ws.getColumn(i+1).width = w; });
}

// ═══════════════════════════════════════════════════════════════
// SHEET 7 & 8 — REKAP BOSP & BOPD
// ═══════════════════════════════════════════════════════════════
function buatSheetRekapSumber(wb, namaSheet, tabColor, warnaBg, warnaHdr, sumber, kolAngka) {
  const ws = wb.addWorksheet(namaSheet, { properties:{ tabColor:{ argb: tabColor } } });
  ws.views = [{ showGridLines:false, state:'frozen', ySplit:4 }];

  ws.mergeCells('A1:G1');
  ws.getCell('A1').value = `REKAPITULASI ANGGARAN — ${sumber.toUpperCase()}`;
  ws.getCell('A1').style = hStyle({ argb: warnaHdr },'FFFFFFFF',13);
  ws.getRow(1).height = 30;

  ws.mergeCells('A2:G2');
  ws.getCell('A2').value = `SMA Negeri 1 Cigalontang | Tahun Anggaran ${new Date().getFullYear()} | Dana: ${sumber}`;
  ws.getCell('A2').style = { font:{italic:true,size:10,color:{ argb:warnaHdr },name:'Calibri'}, fill:{type:'pattern',pattern:'solid',fgColor:{ argb: warnaBg }}, alignment:{horizontal:'center',vertical:'middle'} };

  ['No','Kode','Nama Kegiatan',`Rencana ${sumber} (Rp)`,`Realisasi ${sumber} (Rp)`,'% Rencana','% Realisasi'].forEach((h,i) => {
    ws.getCell(4,i+1).value = h;
    ws.getCell(4,i+1).style = hStyle({ argb: warnaHdr });
  });
  ws.getRow(4).height = 25;

  const RAN = "'✏️ Rancangan Anggaran'";
  const kolReal = kolAngka === 'L' ? 'Q' : 'Q'; // Realisasi selalu kolom Q

  KODE_KEGIATAN.forEach((item, idx) => {
    const rn  = 5 + idx;
    const bg  = idx%2===0 ? W.putih : { argb: warnaBg };
    ws.getRow(rn).height = 22;

    ws.getCell(rn,1).value = idx+1;
    ws.getCell(rn,1).style = { ...dStyle(bg), alignment:{horizontal:'center',vertical:'middle'} };

    ws.getCell(rn,2).value = item.kode;
    ws.getCell(rn,2).style = { ...dStyle(bg,warnaHdr,true), alignment:{horizontal:'center',vertical:'middle'} };

    ws.getCell(rn,3).value = item.nama;
    ws.getCell(rn,3).style = dStyle(bg);

    // Rencana = SUMPRODUCT kode kegiatan × kolom alokasi
    ws.getCell(rn,4).value = { formula:`SUMPRODUCT((${RAN}!B${DATA_MULAI}:B${DATA_AKHIR}=B${rn})*(${RAN}!${kolAngka}${DATA_MULAI}:${kolAngka}${DATA_AKHIR}))` };
    ws.getCell(rn,4).style = cStyle(bg);

    // Realisasi = SUMPRODUCT kode kegiatan × kolom Q (Realisasi), proporsional sumber dana
    ws.getCell(rn,5).value = {
      formula:`SUMPRODUCT((${RAN}!B${DATA_MULAI}:B${DATA_AKHIR}=B${rn})*(${RAN}!K${DATA_MULAI}:K${DATA_AKHIR}="${sumber}")*(${RAN}!Q${DATA_MULAI}:Q${DATA_AKHIR}))`
    };
    ws.getCell(rn,5).style = cStyle(bg);

    ws.getCell(rn,6).value = { formula:`IF(D${5+KODE_KEGIATAN.length+1}<>0,D${rn}/D${5+KODE_KEGIATAN.length+1},0)` };
    ws.getCell(rn,6).style = pctStyle(bg);

    ws.getCell(rn,7).value = { formula:`IF(D${rn}>0,E${rn}/D${rn},0)` };
    ws.getCell(rn,7).style = pctStyle(bg);
  });

  const tr = 5 + KODE_KEGIATAN.length;
  ws.mergeCells(`A${tr}:C${tr}`);
  ws.getCell(`A${tr}`).value = 'TOTAL';
  ws.getCell(`A${tr}`).style = hStyle({ argb: warnaHdr },'FFFFFFFF',11);

  [4,5].forEach(c => {
    ws.getCell(tr,c).value = { formula:`SUM(${colLetter(c)}5:${colLetter(c)}${tr-1})` };
    ws.getCell(tr,c).style = { ...cStyle(W.kuning,true), font:{bold:true,size:11,name:'Calibri'} };
  });

  ws.getCell(tr,6).value = { formula:`IF(D${tr}>0,E${tr}/D${tr},0)` };
  ws.getCell(tr,6).style = { ...pctStyle(W.kuning), font:{bold:true,size:11,name:'Calibri'} };
  ws.getCell(tr,7).value = '';
  ws.getCell(tr,7).style = hStyle({ argb: warnaHdr },'FFFFFFFF',11);
  ws.getRow(tr).height = 25;

  [6,8,45,22,22,12,12].forEach((w,i) => { ws.getColumn(i+1).width = w; });
}

function buatSheetRekapBOSP(wb) {
  buatSheetRekapSumber(wb, '📊 Rekap BOSP', 'FF2E75B6', 'FFD6E4F0', '1F4E79', 'BOSP', 'L');
}
function buatSheetRekapBOPD(wb) {
  buatSheetRekapSumber(wb, '📊 Rekap BOPD', 'FF375623', 'FFE2EFD9', '375623', 'BOPD', 'M');
}

// ═══════════════════════════════════════════════════════════════
// SHEET 9 — REKAP GABUNGAN
// ═══════════════════════════════════════════════════════════════
function buatSheetRekapGabungan(wb) {
  const ws = wb.addWorksheet('📈 Rekap Gabungan', { properties:{ tabColor:{ argb:'FF7030A0' } } });
  ws.views = [{ showGridLines:false }];

  ws.mergeCells('A1:H1');
  ws.getCell('A1').value = 'REKAPITULASI GABUNGAN ANGGARAN SEKOLAH';
  ws.getCell('A1').style = hStyle(W.ungu1,'FFFFFFFF',13);
  ws.getRow(1).height = 30;

  ws.mergeCells('A2:H2');
  ws.getCell('A2').value = `SMA Negeri 1 Cigalontang | Tahun Anggaran ${new Date().getFullYear()}`;
  ws.getCell('A2').style = { font:{italic:true,size:10,color:W.ungu1,name:'Calibri'}, fill:{type:'pattern',pattern:'solid',fgColor:{ argb:'FFE8D5F5' }}, alignment:{horizontal:'center',vertical:'middle'} };

  // ── Ringkasan Alokasi ─────────────────────────────────────
  ws.mergeCells('A4:C4');
  ws.getCell('A4').value = 'Ringkasan Dana';
  ws.getCell('A4').style = hStyle(W.ungu1,'FFFFFFFF',11);
  ['Alokasi (Rp)','Rencana (Rp)','Realisasi (Rp)','Sisa Rencana (Rp)','% Realisasi'].forEach((h,i) => {
    ws.getCell(4,4+i).value = h;
    ws.getCell(4,4+i).style = hStyle(W.ungu1,'FFFFFFFF',11);
  });
  ws.getRow(4).height = 22;

  const TR_BOSP = 5 + KODE_KEGIATAN.length;
  const TR_BOPD = 5 + KODE_KEGIATAN.length;

  const ringkasan = [
    ['BOSP',  `'⚙ Pengaturan'!E15`,     `'📊 Rekap BOSP'!D${TR_BOSP}`, `'📊 Rekap BOSP'!E${TR_BOSP}`],
    ['BOPD',  `'⚙ Pengaturan'!E16`,     `'📊 Rekap BOPD'!D${TR_BOPD}`, `'📊 Rekap BOPD'!E${TR_BOPD}`],
  ];

  ringkasan.forEach(([label, alokF, renF, realF], i) => {
    const rn = 5+i;
    ws.mergeCells(`A${rn}:C${rn}`);
    ws.getCell(`A${rn}`).value = label;
    ws.getCell(`A${rn}`).style = { font:{bold:true,size:11,name:'Calibri',color:W.ungu1}, fill:{type:'pattern',pattern:'solid',fgColor:{ argb:'FFE8D5F5' }}, alignment:{horizontal:'center',vertical:'middle'}, border:{top:{style:'thin'},bottom:{style:'thin'},left:{style:'thin'},right:{style:'thin'}} };

    ws.getCell(`D${rn}`).value = { formula: alokF };
    ws.getCell(`D${rn}`).style = cStyle(W.putih);
    ws.getCell(`E${rn}`).value = { formula: renF };
    ws.getCell(`E${rn}`).style = cStyle(W.putih);
    ws.getCell(`F${rn}`).value = { formula: realF };
    ws.getCell(`F${rn}`).style = cStyle(W.putih);
    ws.getCell(`G${rn}`).value = { formula: `E${rn}-F${rn}` };
    ws.getCell(`G${rn}`).style = cStyle(W.putih);
    ws.getCell(`H${rn}`).value = { formula: `IF(E${rn}>0,F${rn}/E${rn},0)` };
    ws.getCell(`H${rn}`).numFmt = '0.0%';
    ws.getCell(`H${rn}`).style = pctStyle(W.putih);
    ws.getRow(rn).height = 22;
  });

  // Grand total baris 7
  ws.mergeCells('A7:C7');
  ws.getCell('A7').value = 'GRAND TOTAL';
  ws.getCell('A7').style = hStyle(W.ungu1,'FFFFFFFF',11);
  ['D','E','F','G'].forEach(c => {
    ws.getCell(`${c}7`).value = { formula:`SUM(${c}5:${c}6)` };
    ws.getCell(`${c}7`).style = { ...cStyle(W.kuning,true), font:{bold:true,size:11,name:'Calibri'} };
  });
  ws.getCell('H7').value = { formula:`IF(E7>0,F7/E7,0)` };
  ws.getCell('H7').numFmt = '0.0%';
  ws.getCell('H7').style = { ...pctStyle(W.kuning), font:{bold:true,size:11,name:'Calibri'} };
  ws.getRow(7).height = 25;

  // ── Rekap per Kegiatan ────────────────────────────────────
  ws.mergeCells('A9:H9');
  ws.getCell('A9').value = 'Rekapitulasi per Komponen Kegiatan';
  ws.getCell('A9').style = hStyle(W.ungu1,'FFFFFFFF',12);
  ws.getRow(9).height = 25;

  ['No','Kode','Nama Kegiatan','Rencana BOSP (Rp)','Rencana BOPD (Rp)','Total Rencana (Rp)','Realisasi (Rp)','% Realisasi'].forEach((h,i) => {
    ws.getCell(10,i+1).value = h;
    ws.getCell(10,i+1).style = hStyle(W.ungu1);
  });
  ws.getRow(10).height = 22;

  KODE_KEGIATAN.forEach((item, idx) => {
    const rn = 11+idx;
    const bg = idx%2===0 ? W.putih : { argb:'FFEDE7F6' };
    ws.getRow(rn).height = 20;

    ws.getCell(rn,1).value = idx+1;
    ws.getCell(rn,1).style = { ...dStyle(bg), alignment:{horizontal:'center',vertical:'middle'} };
    ws.getCell(rn,2).value = item.kode;
    ws.getCell(rn,2).style = { ...dStyle(bg,W.ungu1.argb,true), alignment:{horizontal:'center',vertical:'middle'} };
    ws.getCell(rn,3).value = item.nama;
    ws.getCell(rn,3).style = dStyle(bg);

    ws.getCell(rn,4).value = { formula:`'📊 Rekap BOSP'!D${5+idx}` };
    ws.getCell(rn,4).style = cStyle(bg);
    ws.getCell(rn,5).value = { formula:`'📊 Rekap BOPD'!D${5+idx}` };
    ws.getCell(rn,5).style = cStyle(bg);
    ws.getCell(rn,6).value = { formula:`D${rn}+E${rn}` };
    ws.getCell(rn,6).style = { ...cStyle(bg), font:{bold:true,size:10,name:'Calibri'} };
    ws.getCell(rn,7).value = { formula:`'📊 Rekap BOSP'!E${5+idx}+'📊 Rekap BOPD'!E${5+idx}` };
    ws.getCell(rn,7).style = cStyle(bg);
    ws.getCell(rn,8).value = { formula:`IF(F${rn}>0,G${rn}/F${rn},0)` };
    ws.getCell(rn,8).style = pctStyle(bg);
  });

  const tr2 = 11+KODE_KEGIATAN.length;
  ws.mergeCells(`A${tr2}:C${tr2}`);
  ws.getCell(`A${tr2}`).value = 'TOTAL';
  ws.getCell(`A${tr2}`).style = hStyle(W.ungu1,'FFFFFFFF',11);
  [4,5,6,7].forEach(c => {
    ws.getCell(tr2,c).value = { formula:`SUM(${colLetter(c)}11:${colLetter(c)}${tr2-1})` };
    ws.getCell(tr2,c).style = { ...cStyle(W.kuning,true), font:{bold:true,size:11,name:'Calibri'} };
  });
  ws.getCell(tr2,8).value = { formula:`IF(F${tr2}>0,G${tr2}/F${tr2},0)` };
  ws.getCell(tr2,8).style = { ...pctStyle(W.kuning), font:{bold:true,size:11,name:'Calibri'} };
  ws.getRow(tr2).height = 25;

  [6,8,42,22,22,22,22,14].forEach((w,i) => { ws.getColumn(i+1).width = w; });
}

// ═══════════════════════════════════════════════════════════════
// SHEET 10 — LAPORAN KEPALA SEKOLAH (siap cetak)
// ═══════════════════════════════════════════════════════════════
function buatSheetLaporanKS(wb) {
  const ws = wb.addWorksheet('🖨️ Laporan KS', { properties:{ tabColor:{ argb:'FF1F4E79' } } });
  ws.views = [{ showGridLines:false }];
  ws.pageSetup = {
    paperSize: 9, orientation:'portrait',
    fitToPage:true, fitToWidth:1, fitToHeight:0,
    margins:{ left:2.5/2.54, right:2/2.54, top:3/2.54, bottom:2.5/2.54 },
    printTitlesRow: '1:4',
  };
  ws.headerFooter = {
    oddHeader: '&C&"Calibri,Bold"SMA NEGERI 1 CIGALONTANG',
    oddFooter: `&LDicetak: &D &T&C&"Calibri,Italic"Dokumen ini bersifat internal — hanya untuk keperluan pelaporan kepada Kepala Sekolah&RHal. &P dari &N`,
  };

  // ── KOP SURAT ─────────────────────────────────────────────
  ws.mergeCells('A1:G1');
  ws.getCell('A1').value = 'PEMERINTAH PROVINSI JAWA BARAT';
  ws.getCell('A1').style = { font:{bold:true,size:12,name:'Calibri'}, alignment:{horizontal:'center'} };
  ws.getRow(1).height = 18;

  ws.mergeCells('A2:G2');
  ws.getCell('A2').value = 'DINAS PENDIDIKAN';
  ws.getCell('A2').style = { font:{bold:true,size:12,name:'Calibri'}, alignment:{horizontal:'center'} };
  ws.getRow(2).height = 18;

  ws.mergeCells('A3:G3');
  ws.getCell('A3').value = 'SMA NEGERI 1 CIGALONTANG';
  ws.getCell('A3').style = { font:{bold:true,size:14,name:'Calibri'}, alignment:{horizontal:'center'} };
  ws.getRow(3).height = 22;

  ws.mergeCells('A4:G4');
  ws.getCell('A4').value = 'Alamat: Jl. Cigalontang, Kec. Cigalontang, Kab. Tasikmalaya, Jawa Barat';
  ws.getCell('A4').style = { font:{size:10,name:'Calibri'}, alignment:{horizontal:'center'} };

  // Garis bawah kop
  ws.mergeCells('A5:G5');
  ws.getCell('A5').value = '';
  ws.getCell('A5').style = { border:{ bottom:{ style:'double' } } };
  ws.getRow(5).height = 8;

  // ── Judul Laporan ─────────────────────────────────────────
  ws.mergeCells('A7:G7');
  ws.getCell('A7').value = 'LAPORAN RENCANA KEGIATAN DAN ANGGARAN SEKOLAH (RKAS)';
  ws.getCell('A7').style = { font:{bold:true,size:13,name:'Calibri',underline:true}, alignment:{horizontal:'center'} };
  ws.getRow(7).height = 25;

  ws.mergeCells('A8:G8');
  ws.getCell('A8').value = `Tahun Anggaran ${new Date().getFullYear()}`;
  ws.getCell('A8').style = { font:{bold:true,size:12,name:'Calibri'}, alignment:{horizontal:'center'} };
  ws.getRow(8).height = 20;

  // ── Tabel Ringkasan Dana ──────────────────────────────────
  ws.mergeCells('A10:G10');
  ws.getCell('A10').value = 'I. RINGKASAN ALOKASI DAN RENCANA PENGGUNAAN DANA';
  ws.getCell('A10').style = { font:{bold:true,size:11,name:'Calibri',underline:true}, alignment:{horizontal:'left'} };
  ws.getRow(10).height = 20;

  ['No','Sumber Dana','Alokasi (Rp)','Rencana (Rp)','Realisasi (Rp)','Sisa (Rp)','% Realisasi'].forEach((h,i) => {
    ws.getCell(11,i+1).value = h;
    ws.getCell(11,i+1).style = hStyle(W.biru1);
  });
  ws.getRow(11).height = 22;

  const TR_BOSP = 5+KODE_KEGIATAN.length;
  const TR_BOPD = 5+KODE_KEGIATAN.length;

  [['1','BOSP','\'⚙ Pengaturan\'!E15',`'📊 Rekap BOSP'!D${TR_BOSP}`,`'📊 Rekap BOSP'!E${TR_BOSP}`],
   ['2','BOPD','\'⚙ Pengaturan\'!E16',`'📊 Rekap BOPD'!D${TR_BOPD}`,`'📊 Rekap BOPD'!E${TR_BOPD}`]
  ].forEach(([no,label,alokF,renF,realF],i) => {
    const rn = 12+i;
    ws.getCell(rn,1).value = no;
    ws.getCell(rn,1).style = { ...dStyle(W.putih), alignment:{horizontal:'center',vertical:'middle'} };
    ws.getCell(rn,2).value = label;
    ws.getCell(rn,2).style = dStyle(W.putih,'FF000000',true);
    ws.getCell(rn,3).value = { formula: alokF };
    ws.getCell(rn,3).style = cStyle(W.putih);
    ws.getCell(rn,4).value = { formula: renF };
    ws.getCell(rn,4).style = cStyle(W.putih);
    ws.getCell(rn,5).value = { formula: realF };
    ws.getCell(rn,5).style = cStyle(W.putih);
    ws.getCell(rn,6).value = { formula:`D${rn}-E${rn}` };
    ws.getCell(rn,6).style = cStyle(W.putih);
    ws.getCell(rn,7).value = { formula:`IF(D${rn}>0,E${rn}/D${rn},0)` };
    ws.getCell(rn,7).numFmt = '0.0%';
    ws.getCell(rn,7).style = pctStyle(W.putih);
    ws.getRow(rn).height = 22;
  });

  // Baris total
  ws.getCell(14,1).value = '';
  ws.mergeCells('A14:B14');
  ws.getCell('A14').value = 'TOTAL';
  ws.getCell('A14').style = hStyle(W.biru1,'FFFFFFFF',11);
  [3,4,5,6].forEach(c => {
    ws.getCell(14,c).value = { formula:`SUM(${colLetter(c)}12:${colLetter(c)}13)` };
    ws.getCell(14,c).style = { ...cStyle(W.kuning,true), font:{bold:true,size:11,name:'Calibri'} };
  });
  ws.getCell(14,7).value = { formula:`IF(D14>0,E14/D14,0)` };
  ws.getCell(14,7).numFmt = '0.0%';
  ws.getCell(14,7).style = { ...pctStyle(W.kuning), font:{bold:true,size:11,name:'Calibri'} };
  ws.getRow(14).height = 24;

  // ── Tabel Per Komponen ────────────────────────────────────
  ws.mergeCells('A16:G16');
  ws.getCell('A16').value = 'II. RINCIAN RENCANA PER KOMPONEN KEGIATAN';
  ws.getCell('A16').style = { font:{bold:true,size:11,name:'Calibri',underline:true}, alignment:{horizontal:'left'} };
  ws.getRow(16).height = 20;

  ['No','Kode','Komponen Kegiatan','Rencana BOSP','Rencana BOPD','Total Rencana','% dari Total'].forEach((h,i) => {
    ws.getCell(17,i+1).value = h;
    ws.getCell(17,i+1).style = hStyle(W.biru1);
  });
  ws.getRow(17).height = 22;

  const TR2 = 11+KODE_KEGIATAN.length;
  KODE_KEGIATAN.forEach((item, idx) => {
    const rn = 18+idx;
    const bg = idx%2===0 ? W.putih : W.biruverylight;
    ws.getRow(rn).height = 20;

    ws.getCell(rn,1).value = idx+1;
    ws.getCell(rn,1).style = { ...dStyle(bg), alignment:{horizontal:'center',vertical:'middle'} };
    ws.getCell(rn,2).value = item.kode;
    ws.getCell(rn,2).style = { ...dStyle(bg,W.biru1.argb,true), alignment:{horizontal:'center',vertical:'middle'} };
    ws.getCell(rn,3).value = item.nama;
    ws.getCell(rn,3).style = dStyle(bg);

    ws.getCell(rn,4).value = { formula:`'📊 Rekap BOSP'!D${5+idx}` };
    ws.getCell(rn,4).style = cStyle(bg);
    ws.getCell(rn,5).value = { formula:`'📊 Rekap BOPD'!D${5+idx}` };
    ws.getCell(rn,5).style = cStyle(bg);
    ws.getCell(rn,6).value = { formula:`D${rn}+E${rn}` };
    ws.getCell(rn,6).style = { ...cStyle(bg), font:{bold:true,size:10,name:'Calibri'} };
    ws.getCell(rn,7).value = { formula:`IF('📈 Rekap Gabungan'!F${TR2}>0,F${rn}/'📈 Rekap Gabungan'!F${TR2},0)` };
    ws.getCell(rn,7).numFmt = '0.0%';
    ws.getCell(rn,7).style = pctStyle(bg);
  });

  const trKS = 18+KODE_KEGIATAN.length;
  ws.mergeCells(`A${trKS}:C${trKS}`);
  ws.getCell(`A${trKS}`).value = 'TOTAL';
  ws.getCell(`A${trKS}`).style = hStyle(W.biru1,'FFFFFFFF',11);
  [4,5,6].forEach(c => {
    ws.getCell(trKS,c).value = { formula:`SUM(${colLetter(c)}18:${colLetter(c)}${trKS-1})` };
    ws.getCell(trKS,c).style = { ...cStyle(W.kuning,true), font:{bold:true,size:11,name:'Calibri'} };
  });
  ws.getCell(trKS,7).value = '100.0%';
  ws.getCell(trKS,7).style = { ...pctStyle(W.kuning), font:{bold:true,size:11,name:'Calibri'} };
  ws.getRow(trKS).height = 25;

  // ── Blok Tanda Tangan ─────────────────────────────────────
  const ttRow = trKS + 3;
  ws.mergeCells(`E${ttRow}:G${ttRow}`);
  ws.getCell(`E${ttRow}`).value = `Cigalontang, ${new Date().getDate()} ${['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][new Date().getMonth()]} ${new Date().getFullYear()}`;
  ws.getCell(`E${ttRow}`).style = { font:{size:10,name:'Calibri'}, alignment:{horizontal:'center'} };

  ws.mergeCells(`A${ttRow}:C${ttRow}`);
  ws.getCell(`A${ttRow}`).value = 'Bendahara BOSP / BOPD,';
  ws.getCell(`A${ttRow}`).style = { font:{size:10,name:'Calibri'}, alignment:{horizontal:'center'} };

  ws.mergeCells(`E${ttRow+1}:G${ttRow+1}`);
  ws.getCell(`E${ttRow+1}`).value = 'Kepala Sekolah,';
  ws.getCell(`E${ttRow+1}`).style = { font:{size:10,name:'Calibri'}, alignment:{horizontal:'center'} };

  [ttRow+2, ttRow+3, ttRow+4].forEach(r => { ws.getRow(r).height = 18; });

  ws.mergeCells(`A${ttRow+5}:C${ttRow+5}`);
  ws.getCell(`A${ttRow+5}`).value = '(.....................................)';
  ws.getCell(`A${ttRow+5}`).style = { font:{size:10,name:'Calibri'}, alignment:{horizontal:'center'} };

  ws.mergeCells(`E${ttRow+5}:G${ttRow+5}`);
  ws.getCell(`E${ttRow+5}`).value = '(.....................................)';
  ws.getCell(`E${ttRow+5}`).style = { font:{size:10,name:'Calibri'}, alignment:{horizontal:'center'} };

  ws.mergeCells(`A${ttRow+6}:C${ttRow+6}`);
  ws.getCell(`A${ttRow+6}`).value = 'NIP. .............................';
  ws.getCell(`A${ttRow+6}`).style = { font:{size:10,name:'Calibri'}, alignment:{horizontal:'center'} };

  ws.mergeCells(`E${ttRow+6}:G${ttRow+6}`);
  ws.getCell(`E${ttRow+6}`).value = 'NIP. .............................';
  ws.getCell(`E${ttRow+6}`).style = { font:{size:10,name:'Calibri'}, alignment:{horizontal:'center'} };

  [4,8,40,20,20,22,14].forEach((w,i) => { ws.getColumn(i+1).width = w; });
}

// ═══════════════════════════════════════════════════════════════
// SHEET 11 — PETUNJUK PENGGUNAAN
// ═══════════════════════════════════════════════════════════════
function buatSheetPetunjuk(wb) {
  const ws = wb.addWorksheet('ℹ️ Petunjuk', { properties:{ tabColor:{ argb:'FF404040' } } });
  ws.views = [{ showGridLines:false }];

  ws.mergeCells('B2:H2');
  ws.getCell('B2').value = 'PETUNJUK PENGGUNAAN APLIKASI RANCANGAN ANGGARAN ARKAS v2';
  ws.getCell('B2').style = hStyle(W.abugelap,'FFFFFFFF',13);
  ws.getRow(2).height = 32;

  const blok = [
    ['⚙️ 1. PENGATURAN', [
      'Buka sheet "⚙ Pengaturan" — isi data sekolah, nama pejabat, dan paling penting: Total Alokasi BOSP (E15) dan BOPD (E16).',
      'Nilai alokasi ini digunakan secara otomatis oleh sheet Kontrol Batas BOSP untuk menghitung peringatan.',
    ]],
    ['📋 2. REFERENSI KODE', [
      '"📋 Kode Kegiatan" → 13 komponen kegiatan ARKAS (Permendikbudristek No. 2/2022).',
      '"📂 Kode Rekening" → kode BAS nasional untuk belanja BOSP.',
      '"📂 Kode Rekening BOPD Jabar" → kode khusus Provinsi Jawa Barat. Konfirmasi ke operator SIPD Dinas Pendidikan sebelum entri final.',
    ]],
    ['✏️ 3. MENGISI RANCANGAN ANGGARAN (150 baris)', [
      'Pilih Kode Kegiatan dari dropdown (kolom B) → isi Nama Kegiatan (kolom C) sesuai.',
      'Ketik Kode Rekening (kolom D) dari sheet referensi → isi Uraian Rekening (E) dan Uraian Rincian (F).',
      'Isi Volume, Satuan, Harga Satuan → kolom Jumlah terisi OTOMATIS.',
      'Pilih Sumber Dana: BOSP → isi Alokasi BOSP (L); BOPD → isi Alokasi BOPD (M).',
      'Kolom Realisasi (Q): diisi setelah kegiatan terlaksana. Kolom % Realisasi & Sisa terisi OTOMATIS.',
      'Pilih Status Realisasi dari dropdown: Belum Direalisasi / Sebagian / Selesai.',
    ]],
    ['⚠️ 4. KONTROL BATAS BOSP (otomatis)', [
      'Buka sheet "⚠️ Kontrol Batas BOSP" setelah mengisi Rancangan Anggaran.',
      '✅ Hijau "Aman/Terpenuhi" = alokasi sesuai regulasi.',
      '⛔ Merah "MELEBIHI BATAS" = Honor (Kode 10) melebihi 50% total BOSP — harus dikoreksi.',
      '⚠️ Jingga "DI BAWAH BATAS" = komponen penting (Buku/Pembelajaran) di bawah minimum yang disarankan.',
      'Pastikan tidak ada item di tabel LARANGAN yang dianggarkan dari BOSP.',
    ]],
    ['📊 5. REKAP DAN LAPORAN', [
      '"📊 Rekap BOSP" dan "📊 Rekap BOPD" → rekap per komponen, otomatis dari Rancangan.',
      '"📈 Rekap Gabungan" → perbandingan BOSP + BOPD, termasuk persentase realisasi.',
      '"🖨️ Laporan KS" → siap cetak ke Kepala Sekolah. Cetak via File → Print → pilih sheet ini.',
    ]],
    ['💾 6. TIPS UMUM', [
      'Simpan rutin (Ctrl+S). Untuk backup, simpan salinan dengan nama: ARKAS_YYYY_revisi_Bulan.xlsx.',
      'Jangan mengubah nama sheet — formula antar sheet bergantung nama tersebut.',
      'Jumlah baris dapat ditambah dengan mengedit konstanta JUMLAH_BARIS di buat-arkas.js dan jalankan ulang.',
      'File ini hanya alat bantu PERANCANGAN. Entri final tetap di aplikasi ARKAS resmi (arkas.kemdikbud.go.id).',
    ]],
  ];

  let ri = 4;
  blok.forEach(([judul, poin]) => {
    ws.mergeCells(`B${ri}:H${ri}`);
    ws.getCell(`B${ri}`).value = judul;
    ws.getCell(`B${ri}`).style = { font:{bold:true,size:12,color:W.biru1,name:'Calibri'}, fill:{type:'pattern',pattern:'solid',fgColor:W.birumuda}, alignment:{horizontal:'left',vertical:'middle'}, border:{bottom:{style:'medium',color:W.biru1}} };
    ws.getRow(ri).height = 24; ri++;

    poin.forEach(p => {
      ws.mergeCells(`C${ri}:H${ri}`);
      ws.getCell(`B${ri}`).value = '•';
      ws.getCell(`B${ri}`).style = { font:{bold:true,size:11,color:W.biru1}, alignment:{horizontal:'center',vertical:'top'} };
      ws.getCell(`C${ri}`).value = p;
      ws.getCell(`C${ri}`).style = { font:{size:10,name:'Calibri'}, alignment:{vertical:'middle',wrapText:true,horizontal:'left'} };
      ws.getRow(ri).height = 20; ri++;
    });
    ri++;
  });

  ws.getColumn('A').width = 3;
  ws.getColumn('B').width = 5;
  ['C','D','E','F','G','H'].forEach(c => { ws.getColumn(c).width = 20; });
}

// ─────────────────────────────────────────────────────────────
// UTILITAS
// ─────────────────────────────────────────────────────────────
function colLetter(n) {
  let s = '';
  while (n > 0) { s = String.fromCharCode(64 + (n%26||26)) + s; n = Math.floor((n-1)/26); }
  return s;
}
function cell(row, c) { return row.getCell(c); }
function ddList(formulae, errTitle='Input Tidak Valid', errMsg='Pilih dari daftar yang tersedia') {
  return { type:'list', allowBlank:true, formulae:[`"${formulae}"`], showErrorMessage:true, errorTitle:errTitle, error:errMsg };
}

// ─────────────────────────────────────────────────────────────
buatWorkbook().catch(err => {
  console.error('❌ Gagal:', err.message, err.stack);
  process.exit(1);
});
