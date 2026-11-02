/**
 * Laporan Bulanan BK (PDF) untuk Kepala Sekolah.
 * Hanya memuat angka rekap dan topik layanan klasikal — isi catatan konseling
 * yang rahasia TIDAK pernah dicetak di laporan ini.
 */
const PDFDocument = require('pdfkit');
const { db, ambilPengaturan } = require('./db');
const { JENIS_LAYANAN, BIDANG, KATEGORI_KASUS } = require('./referensi');

const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const formatTanggal = iso => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '');

/** Kumpulkan data rekap satu bulan (format bulan: YYYY-MM). */
function rekapBulanan(bulan) {
  const pola = `${bulan}-%`;
  const layanan = db.prepare(`SELECT * FROM layanan WHERE tanggal LIKE ? AND status != 'Arsip'`).all(pola);

  const perJenis = Object.fromEntries(Object.keys(JENIS_LAYANAN).map(k => [k, 0]));
  const perBidang = Object.fromEntries(BIDANG.map(b => [b, 0]));
  const kasusPerKategori = Object.fromEntries(Object.keys(KATEGORI_KASUS).map(k => [k, 0]));
  const kasusPerStatus = {};
  for (const l of layanan) {
    perJenis[l.jenis] = (perJenis[l.jenis] || 0) + 1;
    if (l.bidang) perBidang[l.bidang] = (perBidang[l.bidang] || 0) + 1;
    if (l.jenis === 'kasus') {
      if (l.kategori_kasus) kasusPerKategori[l.kategori_kasus]++;
      kasusPerStatus[l.status] = (kasusPerStatus[l.status] || 0) + 1;
    }
  }

  const klasikal = db.prepare(`
    SELECT l.tanggal, l.topik, l.bidang, k.nama AS kelas
    FROM layanan l LEFT JOIN kelas k ON k.id = l.kelas_id
    WHERE l.jenis = 'bimbingan_klasikal' AND l.tanggal LIKE ? AND l.status != 'Arsip'
    ORDER BY l.tanggal`).all(pola);

  const siswaTerlayani = db.prepare(`
    SELECT COUNT(DISTINCT ls.nis) AS n FROM layanan_siswa ls
    JOIN layanan l ON l.id = ls.layanan_id
    WHERE l.tanggal LIKE ? AND l.status != 'Arsip'`).get(pola).n;

  const asesmen = db.prepare(`
    SELECT a.instrumen, COUNT(j.id) AS n FROM jawaban_asesmen j
    JOIN asesmen a ON a.id = j.asesmen_id
    WHERE j.dikirim LIKE ? GROUP BY a.instrumen`).all(pola);

  return { bulan, total: layanan.length, perJenis, perBidang, kasusPerKategori, kasusPerStatus, klasikal, siswaTerlayani, asesmen };
}

function buatPdfLaporanBulanan(bulan, pembuat, aliran) {
  const p = ambilPengaturan();
  const r = rekapBulanan(bulan);
  const [th, bl] = bulan.split('-').map(Number);
  const judulPeriode = `${NAMA_BULAN[bl - 1]} ${th}`;

  const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: `Laporan Bulanan BK ${judulPeriode}` } });
  doc.pipe(aliran);
  const lebar = doc.page.width - 100;

  // Kop
  doc.font('Helvetica-Bold').fontSize(14).text(p.nama_sekolah.toUpperCase(), { align: 'center' });
  doc.font('Helvetica').fontSize(9).text(p.alamat_sekolah, { align: 'center' });
  doc.moveDown(0.3);
  doc.moveTo(50, doc.y).lineTo(50 + lebar, doc.y).lineWidth(1.5).stroke();
  doc.moveDown(0.8);

  doc.font('Helvetica-Bold').fontSize(12).text('LAPORAN BULANAN LAYANAN BIMBINGAN DAN KONSELING', { align: 'center' });
  doc.font('Helvetica').fontSize(10).text(`Bulan ${judulPeriode} · Tahun Pelajaran ${p.tahun_pelajaran} · Semester ${p.semester}`, { align: 'center' });
  doc.moveDown(1);

  const subjudul = t => { doc.moveDown(0.6); doc.font('Helvetica-Bold').fontSize(11).text(t); doc.moveDown(0.3); doc.font('Helvetica').fontSize(10); };

  function tabel(kolom, baris, lebarKolom) {
    const tinggi = 16;
    let y = doc.y;
    const gambarBaris = (sel, tebal) => {
      if (y + tinggi > doc.page.height - 60) { doc.addPage(); y = 50; }
      let x = 50;
      sel.forEach((isi, i) => {
        doc.rect(x, y, lebarKolom[i], tinggi).lineWidth(0.5).stroke();
        doc.font(tebal ? 'Helvetica-Bold' : 'Helvetica').fontSize(9)
          .text(String(isi), x + 4, y + 4, { width: lebarKolom[i] - 8, height: tinggi - 4, ellipsis: true });
        x += lebarKolom[i];
      });
      y += tinggi;
    };
    gambarBaris(kolom, true);
    if (!baris.length) gambarBaris([ 'Tidak ada data', ...kolom.slice(1).map(() => '') ], false);
    baris.forEach(b => gambarBaris(b, false));
    doc.x = 50; doc.y = y + 4;
  }

  subjudul('A. Ringkasan');
  doc.text(`Jumlah layanan tercatat: ${r.total}`);
  doc.text(`Jumlah siswa yang dilayani secara individual/kelompok: ${r.siswaTerlayani}`);
  doc.text(`Jumlah asesmen yang diisi siswa: ${r.asesmen.reduce((s, a) => s + a.n, 0)}`);

  subjudul('B. Layanan per Jenis');
  tabel(['No', 'Jenis Layanan', 'Jumlah'],
    Object.entries(JENIS_LAYANAN).map(([k, v], i) => [i + 1, v.label, r.perJenis[k] || 0]),
    [40, lebar - 120, 80]);

  subjudul('C. Layanan per Bidang');
  tabel(['Bidang', 'Jumlah'], BIDANG.map(b => [b, r.perBidang[b] || 0]), [lebar - 80, 80]);

  subjudul('D. Bimbingan Klasikal');
  tabel(['Tanggal', 'Kelas', 'Bidang', 'Topik'],
    r.klasikal.map(k => [formatTanggal(k.tanggal), k.kelas || '-', k.bidang || '-', k.topik || '-']),
    [70, 70, 70, lebar - 210]);

  subjudul('E. Buku Kasus per Kategori');
  tabel(['Kode', 'Kategori', 'Jumlah'],
    Object.entries(KATEGORI_KASUS).map(([k, v]) => [k, v, r.kasusPerKategori[k] || 0]),
    [40, lebar - 120, 80]);
  if (Object.keys(r.kasusPerStatus).length) {
    doc.text('Status kasus: ' + Object.entries(r.kasusPerStatus).map(([s, n]) => `${s} ${n}`).join(' · '));
  }

  doc.moveDown(0.6);
  doc.fontSize(8).fillColor('#555')
    .text('Catatan: isi catatan konseling bersifat rahasia dan tidak dimuat dalam laporan ini sesuai kode etik bimbingan dan konseling.', { width: lebar });
  doc.fillColor('black');

  // Tanda tangan
  if (doc.y > doc.page.height - 170) doc.addPage();
  doc.moveDown(1.5);
  const yTtd = doc.y;
  const kolomTtd = (x, jabatan, nama, nip) => {
    doc.fontSize(10).text(jabatan, x, yTtd, { width: 200, align: 'center' });
    doc.text(nama || '(.................................)', x, yTtd + 70, { width: 200, align: 'center', underline: !!nama });
    doc.text(`NIP. ${nip || '-'}`, x, yTtd + 84, { width: 200, align: 'center' });
  };
  const hariIni = new Date();
  doc.fontSize(10).text(`Cigalontang, ${hariIni.getDate()} ${NAMA_BULAN[hariIni.getMonth()]} ${hariIni.getFullYear()}`, 50 + lebar - 200, yTtd - 16, { width: 200, align: 'center' });
  kolomTtd(50, 'Mengetahui,\nKepala Sekolah', p.kepala_sekolah, p.nip_kepala_sekolah);
  kolomTtd(50 + lebar - 200, '\nKoordinator BK', pembuat.nama, pembuat.nip);

  doc.end();
}

module.exports = { rekapBulanan, buatPdfLaporanBulanan, NAMA_BULAN };
