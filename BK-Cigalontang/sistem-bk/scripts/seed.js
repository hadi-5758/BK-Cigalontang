/**
 * Isi database dengan DATA DUMMY (nama fiktif) untuk uji coba.
 * Jangan jalankan pada database berisi data siswa asli.
 *
 *   npm run seed
 *
 * Akun demo ditulis ke data/akun-demo.txt.
 */
const fs = require('fs');
const path = require('path');
const { db, transaksi } = require('../lib/db');
const keamanan = require('../lib/keamanan');
const { INSTRUMEN, nilai } = require('../lib/instrumen');

if (db.prepare('SELECT COUNT(*) AS n FROM siswa').get().n > 0) {
  console.error('Database sudah berisi siswa. Seed dibatalkan agar data tidak tercampur.');
  process.exit(1);
}

const NAMA_DEPAN_L = ['Raka', 'Dimas', 'Fajar', 'Galih', 'Ilham', 'Rizki', 'Bayu', 'Yusuf', 'Asep', 'Dede', 'Rendi', 'Taufik'];
const NAMA_DEPAN_P = ['Ayu', 'Citra', 'Dewi', 'Fitri', 'Intan', 'Lestari', 'Nadia', 'Putri', 'Rina', 'Siti', 'Wulan', 'Yuni'];
const NAMA_BELAKANG = ['Pratama', 'Saputra', 'Rahmawati', 'Hidayat', 'Nurhaliza', 'Permana', 'Kurniawan', 'Maulana', 'Septiani', 'Ramadhan'];

let acak = 42;
const rnd = () => ((acak = (acak * 1103515245 + 12345) % 2147483648) / 2147483648);
const pilih = arr => arr[Math.floor(rnd() * arr.length)];

const emailDemo = 'koordinator@demo.test';
const passwordDemo = keamanan.tokenAcak(9);

transaksi(() => {
  let koordinator = db.prepare(`SELECT id FROM pengguna WHERE peran = 'koordinator' LIMIT 1`).get();
  if (!koordinator) {
    const r = db.prepare(`INSERT INTO pengguna (nama, email, nip, peran, hash_password) VALUES (?, ?, ?, 'koordinator', ?)`)
      .run('Koordinator Demo', emailDemo, '000000000000000000', keamanan.hashPassword(passwordDemo));
    koordinator = { id: Number(r.lastInsertRowid) };
    fs.writeFileSync(path.join(keamanan.DIR_DATA, 'akun-demo.txt'), `Email: ${emailDemo}\nPassword: ${passwordDemo}\n`, { mode: 0o600 });
  }
  const guru = db.prepare(`INSERT INTO pengguna (nama, email, peran, hash_password) VALUES (?, ?, 'guru_bk', ?)`)
    .run('Guru BK Demo', 'gurubk@demo.test', keamanan.hashPassword(passwordDemo));

  const kelasIds = ['X-1', 'X-2', 'XI-1'].map((nama, i) => Number(db.prepare('INSERT INTO kelas (nama, tingkat, wali_kelas, guru_bk_id) VALUES (?, ?, ?, ?)')
    .run(nama, nama.split('-')[0], `Wali Kelas ${nama}`, i < 2 ? koordinator.id : Number(guru.lastInsertRowid)).lastInsertRowid));

  const siswa = [];
  let urut = 1;
  for (const kelasId of kelasIds) {
    for (let i = 0; i < 12; i++) {
      const jk = i % 2 ? 'P' : 'L';
      const nama = `${pilih(jk === 'L' ? NAMA_DEPAN_L : NAMA_DEPAN_P)} ${pilih(NAMA_BELAKANG)}`;
      const nis = String(2026000000 + urut++);
      db.prepare('INSERT INTO siswa (nis, nama, jk, kelas_id, kontak_ortu_enc) VALUES (?, ?, ?, ?, ?)')
        .run(nis, nama, jk, kelasId, keamanan.enkripsi('08' + String(1000000000 + urut)));
      siswa.push({ nis, kelasId });
    }
  }

  const layanan = [
    ['bimbingan_klasikal', '2026-10-06', 'Belajar', 'Strategi belajar efektif', kelasIds[0]],
    ['bimbingan_klasikal', '2026-10-08', 'Pribadi', 'Mengenal dan mengelola emosi', kelasIds[1]],
    ['bimbingan_klasikal', '2026-10-15', 'Karier', 'Mengenal minat dan jurusan kuliah', kelasIds[2]],
    ['konseling_individu', '2026-10-09', 'Belajar', 'Motivasi belajar menurun', null, [siswa[3].nis]],
    ['konseling_individu', '2026-10-20', 'Pribadi', 'Kecemasan menghadapi ujian', null, [siswa[14].nis]],
    ['konseling_kelompok', '2026-10-22', 'Sosial', 'Penyesuaian diri dengan teman baru', null, [siswa[1].nis, siswa[5].nis, siswa[7].nis]],
    ['kasus', '2026-10-13', 'Sosial', 'Perselisihan antarsiswa', null, [siswa[9].nis], 'B', 'Proses'],
    ['kasus', '2026-10-27', 'Belajar', 'Sering terlambat masuk kelas', null, [siswa[16].nis], 'A', 'Baru'],
    ['kunjungan_rumah', '2026-10-29', 'Pribadi', 'Kehadiran siswa', null, [siswa[16].nis]],
    ['bimbingan_klasikal', '2026-11-02', 'Sosial', 'Mencegah perundungan', kelasIds[0]],
  ];
  const urutKode = {};
  for (const [jenis, tanggal, bidang, topik, kelasId, nisList = [], kategori = null, status = 'Selesai'] of layanan) {
    const awalan = { kasus: 'KS', konseling_individu: 'KN', konseling_kelompok: 'KN', bimbingan_klasikal: 'BL', kunjungan_rumah: 'KR' }[jenis];
    const prefiks = `${awalan}-${tanggal.slice(0, 4)}-${tanggal.slice(5, 7)}-`;
    urutKode[prefiks] = (urutKode[prefiks] || 0) + 1;
    const dievaluasi = ['konseling_individu', 'konseling_kelompok', 'bimbingan_klasikal'].includes(jenis);
    const pra = dievaluasi ? 2 + Math.floor(rnd() * 2) : null;
    const r = db.prepare(`INSERT INTO layanan (kode, jenis, tanggal, bidang, topik, kelas_id, kategori_kasus, catatan_enc, status, pengguna_id, skala_pra, skala_pasca)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(prefiks + String(urutKode[prefiks]).padStart(3, '0'), jenis, tanggal, bidang, topik, kelasId,
      kategori, keamanan.enkripsi('Catatan contoh (data dummy).'), status, koordinator.id, pra, pra && pra + 1);
    nisList.forEach(n => db.prepare('INSERT INTO layanan_siswa (layanan_id, nis) VALUES (?, ?)').run(r.lastInsertRowid, n));
  }

  // Catatan perkembangan & anekdot contoh
  const sisipPerkembangan = db.prepare(`INSERT INTO catatan_perkembangan (nis, tanggal, jenis, poin, kategori, keterangan, pengguna_id) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  [[0, '2026-10-07', 'Apresiasi', 10, 'Akademik', 'Juara 2 lomba cerdas cermat sekolah'],
   [2, '2026-10-14', 'Apresiasi', 5, 'Sosial', 'Membantu teman yang kesulitan memahami tugas kelompok'],
   [16, '2026-10-27', 'Pembinaan', 5, 'Kedisiplinan', 'Terlambat masuk kelas tiga kali dalam satu minggu'],
   [9, '2026-10-13', 'Pembinaan', 10, 'Sosial', 'Terlibat perselisihan dengan teman sekelas'],
   [9, '2026-10-30', 'Apresiasi', 5, 'Sosial', 'Menyampaikan permintaan maaf dan berdamai dengan teman']]
    .forEach(([i, tanggal, jenis, poin, kategori, ket]) => sisipPerkembangan.run(siswa[i].nis, tanggal, jenis, poin, kategori, ket, koordinator.id));
  db.prepare(`INSERT INTO catatan_anekdot (nis, tanggal, waktu, tempat, deskripsi_enc, pengguna_id) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(siswa[16].nis, '2026-10-27', '07:20', 'Gerbang sekolah', keamanan.enkripsi('Siswa tiba pukul 07.20 setelah gerbang ditutup, berjalan sambil membawa kantong plastik berisi sarapan.'), koordinator.id);

  // Asesmen: AKPD kelas X-1, RIASEC kelas XI-1 (sebagian siswa sudah mengisi)
  const buatAsesmen = (instrumen, kelasId) => Number(db.prepare('INSERT INTO asesmen (instrumen, kelas_id, token, pengguna_id) VALUES (?, ?, ?, ?)')
    .run(instrumen, kelasId, keamanan.tokenAcak(), koordinator.id).lastInsertRowid);
  const akpd = buatAsesmen('akpd', kelasIds[0]);
  const riasec = buatAsesmen('riasec', kelasIds[2]);
  const simpanJawaban = (asesmenId, instrumen, nis, jawaban) => db.prepare('INSERT INTO jawaban_asesmen (asesmen_id, nis, jawaban, hasil, setuju_dibagikan) VALUES (?, ?, ?, ?, ?)')
    .run(asesmenId, nis, JSON.stringify(jawaban), JSON.stringify(nilai(instrumen, jawaban)), rnd() > 0.3 ? 1 : 0);
  siswa.filter(s => s.kelasId === kelasIds[0]).slice(0, 9).forEach(s =>
    simpanJawaban(akpd, 'akpd', s.nis, INSTRUMEN.akpd.butir.filter(() => rnd() < 0.25).map(b => b.no)));
  siswa.filter(s => s.kelasId === kelasIds[2]).slice(0, 8).forEach(s =>
    simpanJawaban(riasec, 'riasec', s.nis, Object.fromEntries(INSTRUMEN.riasec.butir.map(b => [b.no, 1 + Math.floor(rnd() * 3)]))));
});

console.log('✅ Data dummy dibuat: 3 kelas, 36 siswa fiktif, 10 layanan, 2 asesmen.');
console.log('   Akun demo tersimpan di data/akun-demo.txt');
