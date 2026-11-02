/**
 * Sistem BK — SMA Negeri 1 Cigalontang
 * Server web: Express + SQLite bawaan Node.
 *
 * Jalankan: npm install && npm start  →  http://localhost:3100
 */
const path = require('path');
const express = require('express');
const ExcelJS = require('exceljs');

const { db, ambilPengaturan, catatAudit, transaksi } = require('./lib/db');
const keamanan = require('./lib/keamanan');
const { JENIS_LAYANAN, BIDANG, KATEGORI_KASUS, STATUS, POLA_NIS, TIPE_KLASIKAL, JENIS_PERKEMBANGAN, KATEGORI_PERKEMBANGAN, TEKNIK_KONSELING } = require('./lib/referensi');
const { INSTRUMEN, TIPE_RIASEC, nilai } = require('./lib/instrumen');
const { rekapBulanan, buatPdfLaporanBulanan } = require('./lib/laporan');

const PORT = process.env.PORT || 3100;
const NAMA_COOKIE = 'sesi_bk';
const app = express();

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'same-origin',
    'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'",
  });
  next();
});
app.use(express.json({ limit: '1mb' }));

// ============================================================
// Utilitas
// ============================================================
class GalatPengguna extends Error {
  constructor(pesan, kode = 400) { super(pesan); this.kode = kode; }
}

/** Bungkus handler agar galat dikirim sebagai JSON berbahasa Indonesia. */
const rute = fn => (req, res) => {
  try {
    const hasil = fn(req, res);
    if (hasil !== undefined && !res.headersSent) res.json(hasil);
  } catch (e) {
    if (e instanceof GalatPengguna) return res.status(e.kode).json({ galat: e.message });
    console.error(e);
    res.status(500).json({ galat: 'Terjadi kesalahan di server. Silakan coba lagi.' });
  }
};

function wajib(obj, kolom) {
  for (const k of kolom) {
    if (obj[k] === undefined || obj[k] === null || String(obj[k]).trim() === '') throw new GalatPengguna(`Kolom "${k}" wajib diisi.`);
  }
}

const hariIniIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function validasiTanggal(tanggal) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal || '')) throw new GalatPengguna('Format tanggal tidak valid.');
  if (tanggal > hariIniIso()) throw new GalatPengguna('Tanggal tidak boleh di masa depan.');
}

function bacaCookie(req, nama) {
  const isi = req.headers.cookie || '';
  const cocok = isi.split(';').map(s => s.trim()).find(s => s.startsWith(nama + '='));
  return cocok ? decodeURIComponent(cocok.slice(nama.length + 1)) : null;
}

function pasangCookieSesi(res, token, umurMs) {
  const aman = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.set('Set-Cookie', `${NAMA_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(umurMs / 1000)}${aman}`);
}

// Pembatas percobaan sederhana (per IP) untuk login dan pengisian tes
const percobaan = new Map();
function batasiPercobaan(kunci, maks = 10, jendelaMs = 15 * 60 * 1000) {
  const kini = Date.now();
  const catatan = (percobaan.get(kunci) || []).filter(t => kini - t < jendelaMs);
  if (catatan.length >= maks) throw new GalatPengguna('Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.', 429);
  catatan.push(kini);
  percobaan.set(kunci, catatan);
}

// ============================================================
// Autentikasi & hak akses
// ============================================================
function muatPengguna(req, res, next) {
  const sesi = keamanan.bacaTokenSesi(bacaCookie(req, NAMA_COOKIE));
  if (sesi) {
    req.pengguna = db.prepare(`SELECT id, nama, email, nip, peran, akses_bebas FROM pengguna WHERE id = ? AND status = 'Aktif'`).get(sesi.uid);
  }
  next();
}
app.use(muatPengguna);

function perluMasuk(req, res, next) {
  if (!req.pengguna) return res.status(401).json({ galat: 'Sesi berakhir. Silakan masuk kembali.' });
  next();
}
function perluKoordinator(req, res, next) {
  if (req.pengguna?.peran !== 'koordinator') return res.status(403).json({ galat: 'Hanya Koordinator BK yang dapat melakukan ini.' });
  next();
}

/**
 * Batas akses kelas: Koordinator dan Guru BK dengan mode "Bebas Kelas" melihat semua kelas,
 * Guru BK lain hanya kelas yang ditugaskan kepadanya.
 */
const aksesSemuaKelas = pengguna => pengguna.peran === 'koordinator' || !!pengguna.akses_bebas;

function filterKelas(pengguna, alias = 'k') {
  return aksesSemuaKelas(pengguna) ? { sql: '1=1', arg: [] } : { sql: `${alias}.guru_bk_id = ?`, arg: [pengguna.id] };
}

function pastikanAksesSiswa(pengguna, nis) {
  const s = db.prepare('SELECT s.nis, k.guru_bk_id FROM siswa s LEFT JOIN kelas k ON k.id = s.kelas_id WHERE s.nis = ?').get(nis);
  if (!s) throw new GalatPengguna(`Siswa dengan NIS ${nis} tidak ditemukan.`, 404);
  if (!aksesSemuaKelas(pengguna) && s.guru_bk_id !== pengguna.id) throw new GalatPengguna('Siswa ini bukan binaan Anda.', 403);
}

app.get('/api/status', rute(req => ({
  perluSetup: db.prepare('SELECT COUNT(*) AS n FROM pengguna').get().n === 0,
  pengguna: req.pengguna || null,
  sekolah: ambilPengaturan().nama_sekolah,
})));

app.post('/api/setup', rute((req, res) => {
  if (db.prepare('SELECT COUNT(*) AS n FROM pengguna').get().n > 0) throw new GalatPengguna('Akun koordinator sudah dibuat.', 409);
  const { nama, email, nip, password } = req.body;
  wajib(req.body, ['nama', 'email', 'password']);
  if (String(password).length < 8) throw new GalatPengguna('Password minimal 8 karakter.');
  const { lastInsertRowid } = db.prepare(`INSERT INTO pengguna (nama, email, nip, peran, hash_password) VALUES (?, ?, ?, 'koordinator', ?)`)
    .run(nama.trim(), email.trim(), nip || null, keamanan.hashPassword(password));
  catatAudit(lastInsertRowid, 'setup_koordinator');
  pasangCookieSesi(res, keamanan.buatTokenSesi(Number(lastInsertRowid)), keamanan.LAMA_SESI_MS);
  return { ok: true };
}));

app.post('/api/masuk', rute((req, res) => {
  batasiPercobaan('masuk:' + req.ip);
  const { email, password } = req.body;
  const u = db.prepare(`SELECT * FROM pengguna WHERE email = ? AND status = 'Aktif'`).get(String(email || '').trim());
  if (!u || !keamanan.cocokPassword(String(password || ''), u.hash_password)) {
    throw new GalatPengguna('Email atau password salah.', 401);
  }
  catatAudit(u.id, 'masuk');
  pasangCookieSesi(res, keamanan.buatTokenSesi(u.id), keamanan.LAMA_SESI_MS);
  return { ok: true };
}));

app.post('/api/keluar', rute((req, res) => {
  pasangCookieSesi(res, '', 0);
  return { ok: true };
}));

// Semua rute /api di bawah ini wajib masuk, kecuali /api/tes (pengisian oleh siswa)
app.use('/api', (req, res, next) => (req.path.startsWith('/tes/') ? next() : perluMasuk(req, res, next)));

app.put('/api/password', rute(req => {
  const { lama, baru } = req.body;
  const u = db.prepare('SELECT hash_password FROM pengguna WHERE id = ?').get(req.pengguna.id);
  if (!keamanan.cocokPassword(String(lama || ''), u.hash_password)) throw new GalatPengguna('Password lama salah.');
  if (String(baru || '').length < 8) throw new GalatPengguna('Password baru minimal 8 karakter.');
  db.prepare('UPDATE pengguna SET hash_password = ? WHERE id = ?').run(keamanan.hashPassword(baru), req.pengguna.id);
  catatAudit(req.pengguna.id, 'ganti_password');
  return { ok: true };
}));

// ============================================================
// Pengguna (tim BK) & pengaturan
// ============================================================
app.get('/api/pengguna', rute(() =>
  db.prepare(`SELECT p.id, p.nama, p.email, p.nip, p.peran, p.status, p.akses_bebas,
      (SELECT COUNT(*) FROM kelas k WHERE k.guru_bk_id = p.id) AS jumlah_kelas
    FROM pengguna p ORDER BY p.peran, p.nama`).all()));

app.post('/api/pengguna', perluKoordinator, rute(req => {
  wajib(req.body, ['nama', 'email', 'password']);
  const { nama, email, nip, password } = req.body;
  if (String(password).length < 8) throw new GalatPengguna('Password awal minimal 8 karakter.');
  if (db.prepare('SELECT 1 FROM pengguna WHERE email = ?').get(email.trim())) throw new GalatPengguna('Email sudah terdaftar.');
  const { lastInsertRowid } = db.prepare(`INSERT INTO pengguna (nama, email, nip, peran, hash_password) VALUES (?, ?, ?, 'guru_bk', ?)`)
    .run(nama.trim(), email.trim(), nip || null, keamanan.hashPassword(password));
  catatAudit(req.pengguna.id, 'tambah_pengguna', String(lastInsertRowid));
  return { id: Number(lastInsertRowid) };
}));

app.get('/api/pengaturan', rute(() => ambilPengaturan()));

app.put('/api/pengaturan', perluKoordinator, rute(req => {
  const boleh = ['nama_sekolah', 'alamat_sekolah', 'kepala_sekolah', 'nip_kepala_sekolah', 'tahun_pelajaran', 'semester'];
  const ubah = db.prepare('INSERT INTO pengaturan (kunci, nilai) VALUES (?, ?) ON CONFLICT(kunci) DO UPDATE SET nilai = excluded.nilai');
  transaksi(() => { for (const k of boleh) if (req.body[k] !== undefined) ubah.run(k, String(req.body[k]).trim()); });
  catatAudit(req.pengguna.id, 'ubah_pengaturan');
  return ambilPengaturan();
}));

app.get('/api/referensi', rute(() => ({
  jenisLayanan: JENIS_LAYANAN, bidang: BIDANG, kategoriKasus: KATEGORI_KASUS, status: STATUS, tipeKlasikal: TIPE_KLASIKAL, jenisPerkembangan: JENIS_PERKEMBANGAN, kategoriPerkembangan: KATEGORI_PERKEMBANGAN, teknikKonseling: TEKNIK_KONSELING,
  instrumen: Object.fromEntries(Object.entries(INSTRUMEN).map(([k, v]) => [k, v.nama])),
  tipeRiasec: TIPE_RIASEC,
})));

// ============================================================
// Kelas
// ============================================================
app.get('/api/kelas', rute(req => {
  const f = filterKelas(req.pengguna);
  return db.prepare(`SELECT k.*, p.nama AS guru_bk,
      (SELECT COUNT(*) FROM siswa s WHERE s.kelas_id = k.id AND s.status = 'Aktif') AS jumlah_siswa,
      (SELECT COUNT(*) FROM siswa s WHERE s.kelas_id = k.id AND s.status = 'Aktif' AND s.jk = 'L') AS jumlah_l,
      (SELECT COUNT(*) FROM siswa s WHERE s.kelas_id = k.id AND s.status = 'Aktif' AND s.jk = 'P') AS jumlah_p
    FROM kelas k LEFT JOIN pengguna p ON p.id = k.guru_bk_id
    WHERE k.status = 'Aktif' AND ${f.sql} ORDER BY k.nama`).all(...f.arg);
}));

const rapikanNamaKelas = nama => String(nama || '').trim().replace(/\s+/g, ' ');

function pastikanKelas(nama) {
  const bersih = rapikanNamaKelas(nama);
  if (!bersih) throw new GalatPengguna('Nama kelas wajib diisi.');
  const ada = db.prepare('SELECT id, status FROM kelas WHERE nama = ?').get(bersih);
  if (ada) {
    if (ada.status !== 'Aktif') db.prepare(`UPDATE kelas SET status = 'Aktif' WHERE id = ?`).run(ada.id);
    return ada.id;
  }
  const tingkat = (bersih.match(/^(X{1,2}I{0,2}|\d{1,2})/) || [])[0] || null;
  return Number(db.prepare('INSERT INTO kelas (nama, tingkat) VALUES (?, ?)').run(bersih, tingkat).lastInsertRowid);
}

app.post('/api/kelas', perluKoordinator, rute(req => {
  const id = pastikanKelas(req.body.nama);
  catatAudit(req.pengguna.id, 'tambah_kelas', String(id));
  return { id };
}));

app.put('/api/kelas/:id', perluKoordinator, rute(req => {
  const { nama, wali_kelas, guru_bk_id } = req.body;
  const k = db.prepare('SELECT * FROM kelas WHERE id = ?').get(req.params.id);
  if (!k) throw new GalatPengguna('Kelas tidak ditemukan.', 404);
  const namaBaru = nama !== undefined ? rapikanNamaKelas(nama) : k.nama;
  if (!namaBaru) throw new GalatPengguna('Nama kelas wajib diisi.');
  const bentrok = db.prepare('SELECT id FROM kelas WHERE nama = ? AND id != ?').get(namaBaru, k.id);
  if (bentrok) throw new GalatPengguna(`Kelas "${namaBaru}" sudah ada. Gunakan "Gabungkan" untuk menyatukan dua kelas.`);
  db.prepare('UPDATE kelas SET nama = ?, wali_kelas = ?, guru_bk_id = ? WHERE id = ?')
    .run(namaBaru, wali_kelas ?? k.wali_kelas, guru_bk_id === '' ? null : (guru_bk_id ?? k.guru_bk_id), k.id);
  catatAudit(req.pengguna.id, namaBaru !== k.nama ? 'ganti_nama_kelas' : 'ubah_kelas', `${k.nama} → ${namaBaru}`);
  return { ok: true };
}));

// Gabungkan kelas: semua siswa & asesmen pindah ke kelas tujuan, kelas asal diarsipkan (tidak dihapus)
app.post('/api/kelas/:id/gabung', perluKoordinator, rute(req => {
  const asal = db.prepare(`SELECT * FROM kelas WHERE id = ? AND status = 'Aktif'`).get(req.params.id);
  const tujuan = db.prepare(`SELECT * FROM kelas WHERE id = ? AND status = 'Aktif'`).get(req.body.ke_id);
  if (!asal || !tujuan) throw new GalatPengguna('Kelas asal atau tujuan tidak ditemukan.', 404);
  if (asal.id === tujuan.id) throw new GalatPengguna('Pilih kelas tujuan yang berbeda.');
  const pindah = transaksi(() => {
    const n = db.prepare('UPDATE siswa SET kelas_id = ? WHERE kelas_id = ?').run(tujuan.id, asal.id).changes;
    db.prepare('UPDATE asesmen SET kelas_id = ? WHERE kelas_id = ?').run(tujuan.id, asal.id);
    db.prepare(`UPDATE kelas SET status = 'Arsip', guru_bk_id = NULL WHERE id = ?`).run(asal.id);
    return n;
  });
  catatAudit(req.pengguna.id, 'gabung_kelas', `${asal.nama} → ${tujuan.nama}`);
  return { siswaDipindah: Number(pindah) };
}));

// Penugasan: tetapkan daftar kelas binaan seorang guru BK sekaligus
app.put('/api/penugasan/:penggunaId', perluKoordinator, rute(req => {
  const guru = db.prepare(`SELECT id, nama FROM pengguna WHERE id = ? AND status = 'Aktif'`).get(req.params.penggunaId);
  if (!guru) throw new GalatPengguna('Guru BK tidak ditemukan.', 404);
  const ids = Array.isArray(req.body.kelas_ids) ? req.body.kelas_ids.map(Number) : [];
  transaksi(() => {
    db.prepare('UPDATE kelas SET guru_bk_id = NULL WHERE guru_bk_id = ?').run(guru.id);
    const tetapkan = db.prepare(`UPDATE kelas SET guru_bk_id = ? WHERE id = ? AND status = 'Aktif'`);
    ids.forEach(id => tetapkan.run(guru.id, id));
  });
  if (req.body.akses_bebas !== undefined) {
    db.prepare('UPDATE pengguna SET akses_bebas = ? WHERE id = ?').run(req.body.akses_bebas ? 1 : 0, guru.id);
  }
  catatAudit(req.pengguna.id, 'ubah_penugasan', `${guru.nama}: ${ids.length} kelas`);
  return { ok: true };
}));

// ============================================================
// Siswa
// ============================================================
app.get('/api/siswa', rute(req => {
  const f = filterKelas(req.pengguna);
  const syarat = [f.sql];
  const arg = [...f.arg];
  if (req.query.kelas_id) { syarat.push('s.kelas_id = ?'); arg.push(req.query.kelas_id); }
  syarat.push('s.status = ?'); arg.push(req.query.status || 'Aktif');
  if (req.query.q) { syarat.push('(s.nama LIKE ? OR s.nis LIKE ?)'); arg.push(`%${req.query.q}%`, `%${req.query.q}%`); }
  return db.prepare(`SELECT s.nis, s.nama, s.jk, s.status, s.keterangan, s.kelas_id, k.nama AS kelas
    FROM siswa s LEFT JOIN kelas k ON k.id = s.kelas_id
    WHERE ${syarat.join(' AND ')} ORDER BY k.nama, s.nama LIMIT 2000`).all(...arg);
}));

app.get('/api/siswa-statistik', rute(req => {
  const f = filterKelas(req.pengguna);
  const syarat = [f.sql];
  const arg = [...f.arg];
  if (req.query.kelas_id) { syarat.push('s.kelas_id = ?'); arg.push(req.query.kelas_id); }
  return db.prepare(`SELECT COUNT(*) AS total,
      SUM(s.status = 'Aktif' AND s.jk = 'L') AS laki,
      SUM(s.status = 'Aktif' AND s.jk = 'P') AS perempuan,
      SUM(s.status = 'Aktif') AS aktif,
      SUM(s.status = 'Arsip') AS arsip
    FROM siswa s LEFT JOIN kelas k ON k.id = s.kelas_id WHERE ${syarat.join(' AND ')}`).get(...arg);
}));

// Kenaikan kelas & mutasi untuk banyak siswa sekaligus
const KETERANGAN_ARSIP = ['Lulus', 'Mutasi keluar', 'Mengundurkan diri', 'Lainnya'];

app.post('/api/siswa/massal', perluKoordinator, rute(req => {
  const { aksi, kelas, keterangan } = req.body;
  const daftar = Array.isArray(req.body.nis) ? [...new Set(req.body.nis.map(String))] : [];
  if (!daftar.length) throw new GalatPengguna('Pilih minimal satu siswa.');
  const n = transaksi(() => {
    if (aksi === 'pindah') {
      const kelasId = pastikanKelas(kelas);
      const ubah = db.prepare(`UPDATE siswa SET kelas_id = ?, status = 'Aktif', keterangan = NULL WHERE nis = ?`);
      return daftar.reduce((s, nis) => s + Number(ubah.run(kelasId, nis).changes), 0);
    }
    if (aksi === 'arsip') {
      if (!KETERANGAN_ARSIP.includes(keterangan)) throw new GalatPengguna('Pilih alasan: ' + KETERANGAN_ARSIP.join(', ') + '.');
      const ubah = db.prepare(`UPDATE siswa SET status = 'Arsip', keterangan = ? WHERE nis = ?`);
      return daftar.reduce((s, nis) => s + Number(ubah.run(keterangan, nis).changes), 0);
    }
    if (aksi === 'aktifkan') {
      const ubah = db.prepare(`UPDATE siswa SET status = 'Aktif', keterangan = NULL WHERE nis = ?`);
      return daftar.reduce((s, nis) => s + Number(ubah.run(nis).changes), 0);
    }
    throw new GalatPengguna('Aksi tidak dikenal.');
  });
  catatAudit(req.pengguna.id, 'siswa_massal_' + aksi, `${n} siswa${kelas ? ' → ' + kelas : ''}${keterangan ? ' (' + keterangan + ')' : ''}`);
  return { diubah: n };
}));

function simpanSiswa({ nis, nama, jk, kelas, kontak_ortu }, penggunaId) {
  nis = String(nis || '').trim();
  if (!POLA_NIS.test(nis)) throw new GalatPengguna(`NIS "${nis}" tidak valid (harus 10 digit angka).`);
  if (!String(nama || '').trim()) throw new GalatPengguna(`Nama siswa NIS ${nis} wajib diisi.`);
  jk = String(jk || '').trim().toUpperCase().charAt(0);
  if (!['L', 'P'].includes(jk)) throw new GalatPengguna(`Jenis kelamin NIS ${nis} harus L atau P.`);
  const kelasId = pastikanKelas(kelas);
  const ada = db.prepare('SELECT nis FROM siswa WHERE nis = ?').get(nis);
  const kontak = kontak_ortu ? keamanan.enkripsi(String(kontak_ortu).trim()) : null;
  if (ada) {
    db.prepare(`UPDATE siswa SET nama = ?, jk = ?, kelas_id = ?, kontak_ortu_enc = COALESCE(?, kontak_ortu_enc), status = 'Aktif' WHERE nis = ?`)
      .run(String(nama).trim(), jk, kelasId, kontak, nis);
  } else {
    db.prepare('INSERT INTO siswa (nis, nama, jk, kelas_id, kontak_ortu_enc) VALUES (?, ?, ?, ?, ?)')
      .run(nis, String(nama).trim(), jk, kelasId, kontak);
  }
  catatAudit(penggunaId, ada ? 'ubah_siswa' : 'tambah_siswa', nis);
  return ada ? 'diperbarui' : 'ditambah';
}

app.post('/api/siswa', perluKoordinator, rute(req => ({ hasil: simpanSiswa(req.body, req.pengguna.id) })));

app.get('/api/siswa/:nis', rute(req => {
  pastikanAksesSiswa(req.pengguna, req.params.nis);
  const s = db.prepare(`SELECT s.*, k.nama AS kelas, k.wali_kelas FROM siswa s LEFT JOIN kelas k ON k.id = s.kelas_id WHERE s.nis = ?`).get(req.params.nis);
  const kontak = keamanan.dekripsi(s.kontak_ortu_enc);
  delete s.kontak_ortu_enc;
  const layanan = db.prepare(`SELECT l.id, l.kode, l.jenis, l.tanggal, l.bidang, l.topik, l.status
    FROM layanan l JOIN layanan_siswa ls ON ls.layanan_id = l.id WHERE ls.nis = ? ORDER BY l.tanggal DESC`).all(s.nis);
  const asesmen = db.prepare(`SELECT a.instrumen, j.hasil, j.dikirim, j.setuju_dibagikan FROM jawaban_asesmen j
    JOIN asesmen a ON a.id = j.asesmen_id WHERE j.nis = ? ORDER BY j.dikirim DESC`).all(s.nis)
    .map(r => ({ ...r, hasil: JSON.parse(r.hasil) }));
  const perkembangan = db.prepare(`SELECT id, tanggal, jenis, poin, kategori, keterangan FROM catatan_perkembangan
    WHERE nis = ? AND status = 'Aktif' ORDER BY tanggal DESC`).all(s.nis);
  const anekdot = db.prepare(`SELECT id, tanggal, waktu, tempat, deskripsi_enc FROM catatan_anekdot
    WHERE nis = ? AND status = 'Aktif' ORDER BY tanggal DESC`).all(s.nis)
    .map(({ deskripsi_enc, ...r }) => ({ ...r, deskripsi: keamanan.dekripsi(deskripsi_enc) }));
  catatAudit(req.pengguna.id, 'lihat_siswa', s.nis);
  return { ...s, kontak_ortu: kontak, layanan, asesmen, perkembangan, anekdot };
}));

app.put('/api/siswa/:nis/status', perluKoordinator, rute(req => {
  const status = req.body.status === 'Arsip' ? 'Arsip' : 'Aktif';
  db.prepare('UPDATE siswa SET status = ? WHERE nis = ?').run(status, req.params.nis);
  catatAudit(req.pengguna.id, 'status_siswa_' + status, req.params.nis);
  return { ok: true };
}));

const KOLOM_IMPOR = ['NIS*', 'Nama Lengkap*', 'JK (L/P)*', 'Kelas*', 'Kontak Orang Tua'];

app.get('/api/siswa-template.xlsx', rute((req, res) => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Data Siswa');
  ws.addRow(KOLOM_IMPOR);
  ws.addRow(['0012345678', 'Contoh Nama Siswa', 'L', 'X-1', '081234567890']);
  ws.getRow(1).font = { bold: true };
  ws.columns.forEach((c, i) => { c.width = [14, 30, 10, 10, 20][i]; });
  ws.getColumn(1).numFmt = '@';
  res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="template-data-siswa.xlsx"' });
  wb.xlsx.write(res).then(() => res.end());
}));

app.post('/api/siswa/impor', perluKoordinator, express.raw({ type: () => true, limit: '10mb' }), async (req, res) => {
  try {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(req.body);
    const ws = wb.worksheets[0];
    if (!ws) throw new GalatPengguna('Berkas Excel kosong.');
    const teksSel = v => (v && typeof v === 'object' ? (v.text ?? v.result ?? '') : (v ?? '')).toString().trim();
    const baris = [];
    ws.eachRow((row, no) => {
      if (no === 1) return;
      const [nis, nama, jk, kelas, kontak] = [1, 2, 3, 4, 5].map(i => teksSel(row.getCell(i).value));
      // Sel angka kehilangan nol di depan (mis. 0012345678 → 12345678); kembalikan hanya untuk sel bertipe angka
      const nisAngka = typeof row.getCell(1).value === 'number' && nis.length >= 8;
      if (nis || nama) baris.push({ no, nis: nisAngka ? nis.padStart(10, '0') : nis, nama, jk, kelas, kontak_ortu: kontak });
    });
    const ringkas = { ditambah: 0, diperbarui: 0, galat: [] };
    // Validasi semua baris dulu; simpan hanya jika tidak ada galat (hindari data setengah masuk)
    const nisTerlihat = new Set();
    for (const b of baris) {
      if (nisTerlihat.has(b.nis)) ringkas.galat.push(`Baris ${b.no}: NIS ${b.nis} ganda di berkas.`);
      nisTerlihat.add(b.nis);
      if (!POLA_NIS.test(b.nis)) ringkas.galat.push(`Baris ${b.no}: NIS "${b.nis}" harus 10 digit angka.`);
      if (!b.nama) ringkas.galat.push(`Baris ${b.no}: nama kosong.`);
      if (!['L', 'P'].includes(b.jk.toUpperCase().charAt(0))) ringkas.galat.push(`Baris ${b.no}: JK harus L atau P.`);
      if (!b.kelas) ringkas.galat.push(`Baris ${b.no}: kelas kosong.`);
    }
    if (!baris.length) ringkas.galat.push('Tidak ada baris data di bawah judul kolom.');
    if (ringkas.galat.length) return res.status(400).json({ galat: 'Data belum bisa diimpor. Perbaiki baris berikut lalu unggah ulang.', rincian: ringkas.galat.slice(0, 50) });
    transaksi(() => { for (const b of baris) ringkas[simpanSiswa(b, req.pengguna.id)]++; });
    catatAudit(req.pengguna.id, 'impor_siswa', `${baris.length} baris`);
    res.json(ringkas);
  } catch (e) {
    if (e instanceof GalatPengguna) return res.status(e.kode).json({ galat: e.message });
    console.error(e);
    res.status(400).json({ galat: 'Berkas tidak bisa dibaca. Pastikan memakai template .xlsx dari aplikasi.' });
  }
});

// ============================================================
// Layanan BK
// ============================================================
/** Skala evaluasi kondisi 1–5 (opsional). */
function bacaSkala(nilai) {
  if (nilai === undefined || nilai === null || nilai === '') return null;
  const n = Number(nilai);
  if (!Number.isInteger(n) || n < 1 || n > 5) throw new GalatPengguna('Skala evaluasi harus angka 1–5.');
  return n;
}

function buatKode(jenis, tanggal) {
  const awalan = `${JENIS_LAYANAN[jenis].awalan}-${tanggal.slice(0, 4)}-${tanggal.slice(5, 7)}-`;
  const terakhir = db.prepare('SELECT kode FROM layanan WHERE kode LIKE ? ORDER BY kode DESC LIMIT 1').get(awalan + '%');
  const urut = terakhir ? Number(terakhir.kode.slice(-3)) + 1 : 1;
  return awalan + String(urut).padStart(3, '0');
}

app.get('/api/layanan', rute(req => {
  const syarat = ['1=1'];
  const arg = [];
  if (req.query.jenis) { syarat.push('l.jenis = ?'); arg.push(req.query.jenis); }
  if (req.query.bulan) { syarat.push('l.tanggal LIKE ?'); arg.push(`${req.query.bulan}-%`); }
  if (req.query.kelas_id) { syarat.push('l.kelas_id = ?'); arg.push(req.query.kelas_id); }
  if (req.query.bidang) { syarat.push('l.bidang = ?'); arg.push(req.query.bidang); }
  if (req.query.q) {
    syarat.push(`(l.topik LIKE ? OR EXISTS (SELECT 1 FROM layanan_siswa ls JOIN siswa s ON s.nis = ls.nis WHERE ls.layanan_id = l.id AND (s.nama LIKE ? OR s.nis LIKE ?)))`);
    arg.push(`%${req.query.q}%`, `%${req.query.q}%`, `%${req.query.q}%`);
  }
  if (req.query.status) { syarat.push('l.status = ?'); arg.push(req.query.status); } else syarat.push(`l.status != 'Arsip'`);
  if (req.pengguna.peran !== 'koordinator') { syarat.push('l.pengguna_id = ?'); arg.push(req.pengguna.id); }
  return db.prepare(`SELECT l.id, l.kode, l.jenis, l.tanggal, l.bidang, l.topik, l.kategori_kasus, l.status, l.tindak_lanjut,
      l.skala_pra, l.skala_pasca, l.materi, l.tipe_klasikal, l.capaian, l.teknik, l.kelas_id,
      k.nama AS kelas, p.nama AS pencatat,
      (SELECT GROUP_CONCAT(s.nama, ', ') FROM layanan_siswa ls JOIN siswa s ON s.nis = ls.nis WHERE ls.layanan_id = l.id) AS siswa,
      (SELECT COUNT(*) FROM layanan_siswa ls WHERE ls.layanan_id = l.id) AS jumlah_siswa
    FROM layanan l LEFT JOIN kelas k ON k.id = l.kelas_id JOIN pengguna p ON p.id = l.pengguna_id
    WHERE ${syarat.join(' AND ')} ORDER BY l.tanggal DESC, l.id DESC LIMIT 500`).all(...arg);
}));

const teksAtauNull = v => (v === undefined || v === null || String(v).trim() === '' ? null : String(v).trim());

app.post('/api/layanan', rute(req => {
  const b = req.body;
  wajib(b, ['jenis', 'tanggal', 'bidang', 'topik']);
  const ref = JENIS_LAYANAN[b.jenis];
  if (!ref) throw new GalatPengguna('Jenis layanan tidak dikenal.');
  if (!BIDANG.includes(b.bidang)) throw new GalatPengguna('Bidang layanan tidak valid.');
  validasiTanggal(b.tanggal);
  const status = b.status || (b.jenis === 'kasus' ? 'Baru' : 'Selesai');
  if (!STATUS.includes(status)) throw new GalatPengguna('Status tidak valid.');
  if (b.jenis === 'kasus' && !KATEGORI_KASUS[b.kategori_kasus]) throw new GalatPengguna('Pilih kategori kasus (A–F).');
  if (b.tipe_klasikal && !TIPE_KLASIKAL.includes(b.tipe_klasikal)) throw new GalatPengguna('Tipe layanan klasikal tidak valid.');

  let kelasId = null;
  const daftarNis = Array.isArray(b.nis) ? [...new Set(b.nis.map(String))] : [];
  if (ref.sasaran === 'kelas') {
    wajib(b, ['kelas_id']);
    kelasId = Number(b.kelas_id);
  } else {
    if (!daftarNis.length) throw new GalatPengguna('Pilih minimal satu siswa.');
    if (b.jenis === 'konseling_individu' && daftarNis.length > 1) throw new GalatPengguna('Konseling individu hanya untuk satu siswa.');
    daftarNis.forEach(n => pastikanAksesSiswa(req.pengguna, n));
  }

  const pra = bacaSkala(b.skala_pra);
  const pasca = bacaSkala(b.skala_pasca);
  const id = transaksi(() => {
    const kode = buatKode(b.jenis, b.tanggal);
    const { lastInsertRowid } = db.prepare(`INSERT INTO layanan
      (kode, jenis, tanggal, bidang, topik, kelas_id, kategori_kasus, catatan_enc, tindak_lanjut, status, pengguna_id,
       skala_pra, skala_pasca, intake_enc, prognosis_enc, teknik, materi, tipe_klasikal, capaian)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      kode, b.jenis, b.tanggal, b.bidang, String(b.topik).trim(), kelasId,
      b.jenis === 'kasus' ? b.kategori_kasus : null,
      keamanan.enkripsi(b.catatan), teksAtauNull(b.tindak_lanjut), status, req.pengguna.id, pra, pasca,
      keamanan.enkripsi(b.intake), keamanan.enkripsi(b.prognosis), teksAtauNull(b.teknik),
      teksAtauNull(b.materi), teksAtauNull(b.tipe_klasikal), teksAtauNull(b.capaian));
    const sisip = db.prepare('INSERT INTO layanan_siswa (layanan_id, nis) VALUES (?, ?)');
    daftarNis.forEach(n => sisip.run(lastInsertRowid, n));
    return Number(lastInsertRowid);
  });
  catatAudit(req.pengguna.id, 'catat_layanan', String(id));
  return { id, kode: db.prepare('SELECT kode FROM layanan WHERE id = ?').get(id).kode };
}));

function ambilLayananBerhak(pengguna, id) {
  const l = db.prepare('SELECT * FROM layanan WHERE id = ?').get(id);
  if (!l) throw new GalatPengguna('Catatan layanan tidak ditemukan.', 404);
  // Isi catatan rahasia: hanya pencatat dan koordinator
  if (pengguna.peran !== 'koordinator' && l.pengguna_id !== pengguna.id) throw new GalatPengguna('Catatan ini bukan milik Anda.', 403);
  return l;
}

app.get('/api/layanan/:id', rute(req => {
  const l = ambilLayananBerhak(req.pengguna, req.params.id);
  const siswa = db.prepare('SELECT s.nis, s.nama FROM layanan_siswa ls JOIN siswa s ON s.nis = ls.nis WHERE ls.layanan_id = ?').all(l.id);
  const kelas = l.kelas_id ? db.prepare('SELECT nama FROM kelas WHERE id = ?').get(l.kelas_id)?.nama : null;
  catatAudit(req.pengguna.id, 'buka_catatan', l.kode);
  const { catatan_enc, intake_enc, prognosis_enc, ...sisa } = l;
  return {
    ...sisa, kelas, siswa,
    catatan: keamanan.dekripsi(catatan_enc), intake: keamanan.dekripsi(intake_enc), prognosis: keamanan.dekripsi(prognosis_enc),
  };
}));

app.put('/api/layanan/:id', rute(req => {
  const l = ambilLayananBerhak(req.pengguna, req.params.id);
  const b = req.body;
  if (b.status && !STATUS.includes(b.status)) throw new GalatPengguna('Status tidak valid.');
  if (b.tipe_klasikal && !TIPE_KLASIKAL.includes(b.tipe_klasikal)) throw new GalatPengguna('Tipe layanan klasikal tidak valid.');
  const pilih = (kolom, ubah = v => v) => (b[kolom] !== undefined ? ubah(b[kolom]) : l[kolom]);
  const sandi = (kolom, kolomEnc) => (b[kolom] !== undefined ? keamanan.enkripsi(b[kolom]) : l[kolomEnc]);
  db.prepare(`UPDATE layanan SET status = ?, tindak_lanjut = ?, catatan_enc = ?, skala_pra = ?, skala_pasca = ?,
      intake_enc = ?, prognosis_enc = ?, teknik = ?, materi = ?, tipe_klasikal = ?, capaian = ? WHERE id = ?`).run(
    b.status || l.status, pilih('tindak_lanjut', teksAtauNull), sandi('catatan', 'catatan_enc'),
    pilih('skala_pra', bacaSkala), pilih('skala_pasca', bacaSkala),
    sandi('intake', 'intake_enc'), sandi('prognosis', 'prognosis_enc'),
    pilih('teknik', teksAtauNull), pilih('materi', teksAtauNull), pilih('tipe_klasikal', teksAtauNull), pilih('capaian', teksAtauNull), l.id);
  catatAudit(req.pengguna.id, b.status === 'Arsip' ? 'arsip_layanan' : 'ubah_layanan', l.kode);
  return { ok: true };
}));

// ============================================================
// Catatan Perkembangan (poin apresiasi / pembinaan)
// ============================================================
/** Syarat & argumen untuk membatasi catatan per siswa sesuai akses kelas. */
function lingkupSiswa(req, aliasSiswa = 's') {
  const f = filterKelas(req.pengguna);
  const syarat = [f.sql];
  const arg = [...f.arg];
  if (req.query.nis) { syarat.push(`${aliasSiswa}.nis = ?`); arg.push(req.query.nis); }
  if (req.query.kelas_id) { syarat.push(`${aliasSiswa}.kelas_id = ?`); arg.push(req.query.kelas_id); }
  return { syarat, arg };
}

app.get('/api/perkembangan', rute(req => {
  const { syarat, arg } = lingkupSiswa(req);
  syarat.push(`c.status = 'Aktif'`);
  if (req.query.jenis) { syarat.push('c.jenis = ?'); arg.push(req.query.jenis); }
  const sumber = `FROM catatan_perkembangan c JOIN siswa s ON s.nis = c.nis JOIN kelas k ON k.id = s.kelas_id WHERE ${syarat.join(' AND ')}`;
  const daftar = db.prepare(`SELECT c.*, s.nama, k.nama AS kelas, p.nama AS pencatat ${sumber.replace('WHERE', 'JOIN pengguna p ON p.id = c.pengguna_id WHERE')}
    ORDER BY c.tanggal DESC, c.id DESC LIMIT 500`).all(...arg);
  const ringkas = db.prepare(`SELECT COALESCE(SUM(CASE WHEN c.jenis = 'Apresiasi' THEN c.poin END), 0) AS apresiasi,
      COALESCE(SUM(CASE WHEN c.jenis = 'Pembinaan' THEN c.poin END), 0) AS pembinaan, COUNT(*) AS jumlah ${sumber}`).get(...arg);
  const perSiswa = db.prepare(`SELECT s.nis, s.nama, k.nama AS kelas,
      SUM(CASE WHEN c.jenis = 'Apresiasi' THEN c.poin ELSE -c.poin END) AS net, COUNT(*) AS jumlah
    ${sumber} GROUP BY s.nis ORDER BY net DESC`).all(...arg);
  return { daftar, ringkas, perSiswa };
}));

app.post('/api/perkembangan', rute(req => {
  const b = req.body;
  wajib(b, ['tanggal', 'nis', 'jenis', 'poin', 'keterangan']);
  validasiTanggal(b.tanggal);
  pastikanAksesSiswa(req.pengguna, String(b.nis));
  if (!JENIS_PERKEMBANGAN.includes(b.jenis)) throw new GalatPengguna('Jenis catatan harus Apresiasi atau Pembinaan.');
  const poin = Number(b.poin);
  if (!Number.isInteger(poin) || poin < 1 || poin > 100) throw new GalatPengguna('Poin harus bilangan bulat 1–100.');
  if (b.kategori && !KATEGORI_PERKEMBANGAN.includes(b.kategori)) throw new GalatPengguna('Kategori tidak valid.');
  const { lastInsertRowid } = db.prepare(`INSERT INTO catatan_perkembangan (nis, tanggal, jenis, poin, kategori, keterangan, pengguna_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(String(b.nis), b.tanggal, b.jenis, poin, b.kategori || null, String(b.keterangan).trim(), req.pengguna.id);
  catatAudit(req.pengguna.id, 'catat_perkembangan', String(lastInsertRowid));
  return { id: Number(lastInsertRowid) };
}));

// ============================================================
// Catatan Anekdot (fakta perilaku, tanpa penafsiran)
// ============================================================
app.get('/api/anekdot', rute(req => {
  const { syarat, arg } = lingkupSiswa(req);
  syarat.push(`a.status = 'Aktif'`);
  const daftar = db.prepare(`SELECT a.id, a.nis, a.tanggal, a.waktu, a.tempat, a.deskripsi_enc, a.pengguna_id, s.nama, k.nama AS kelas, p.nama AS pencatat
    FROM catatan_anekdot a JOIN siswa s ON s.nis = a.nis JOIN kelas k ON k.id = s.kelas_id JOIN pengguna p ON p.id = a.pengguna_id
    WHERE ${syarat.join(' AND ')} ORDER BY a.tanggal DESC, a.waktu DESC, a.id DESC LIMIT 300`).all(...arg)
    .map(({ deskripsi_enc, ...r }) => ({ ...r, deskripsi: keamanan.dekripsi(deskripsi_enc) }));
  catatAudit(req.pengguna.id, 'lihat_anekdot', req.query.nis || 'daftar');
  return daftar;
}));

app.post('/api/anekdot', rute(req => {
  const b = req.body;
  wajib(b, ['tanggal', 'nis', 'deskripsi']);
  validasiTanggal(b.tanggal);
  pastikanAksesSiswa(req.pengguna, String(b.nis));
  if (b.waktu && !/^\d{2}:\d{2}$/.test(b.waktu)) throw new GalatPengguna('Format waktu harus HH:MM.');
  const { lastInsertRowid } = db.prepare(`INSERT INTO catatan_anekdot (nis, tanggal, waktu, tempat, deskripsi_enc, pengguna_id)
    VALUES (?, ?, ?, ?, ?, ?)`).run(String(b.nis), b.tanggal, b.waktu || null, teksAtauNull(b.tempat), keamanan.enkripsi(String(b.deskripsi).trim()), req.pengguna.id);
  catatAudit(req.pengguna.id, 'catat_anekdot', String(lastInsertRowid));
  return { id: Number(lastInsertRowid) };
}));

// Arsipkan catatan perkembangan/anekdot (tidak dihapus) — hanya pencatat atau koordinator
for (const [jalur, tabel] of [['perkembangan', 'catatan_perkembangan'], ['anekdot', 'catatan_anekdot']]) {
  app.put(`/api/${jalur}/:id/arsip`, rute(req => {
    const c = db.prepare(`SELECT id, pengguna_id FROM ${tabel} WHERE id = ?`).get(req.params.id);
    if (!c) throw new GalatPengguna('Catatan tidak ditemukan.', 404);
    if (req.pengguna.peran !== 'koordinator' && c.pengguna_id !== req.pengguna.id) throw new GalatPengguna('Catatan ini bukan milik Anda.', 403);
    db.prepare(`UPDATE ${tabel} SET status = 'Arsip' WHERE id = ?`).run(c.id);
    catatAudit(req.pengguna.id, `arsip_${jalur}`, String(c.id));
    return { ok: true };
  }));
}

// ============================================================
// Asesmen
// ============================================================
app.get('/api/asesmen', rute(req => {
  const f = filterKelas(req.pengguna);
  return db.prepare(`SELECT a.id, a.instrumen, a.token, a.tenggat, a.aktif, a.dibuat, k.nama AS kelas,
      (SELECT COUNT(*) FROM siswa s WHERE s.kelas_id = a.kelas_id AND s.status = 'Aktif') AS jumlah_siswa,
      (SELECT COUNT(*) FROM jawaban_asesmen j WHERE j.asesmen_id = a.id) AS jumlah_jawaban
    FROM asesmen a JOIN kelas k ON k.id = a.kelas_id WHERE ${f.sql} ORDER BY a.dibuat DESC`).all(...f.arg);
}));

app.post('/api/asesmen', rute(req => {
  wajib(req.body, ['instrumen', 'kelas_id']);
  if (!INSTRUMEN[req.body.instrumen]) throw new GalatPengguna('Instrumen tidak dikenal.');
  const f = filterKelas(req.pengguna);
  if (!db.prepare(`SELECT 1 FROM kelas k WHERE k.id = ? AND ${f.sql}`).get(req.body.kelas_id, ...f.arg)) {
    throw new GalatPengguna('Kelas tidak ditemukan atau bukan binaan Anda.', 403);
  }
  const token = keamanan.tokenAcak();
  const { lastInsertRowid } = db.prepare('INSERT INTO asesmen (instrumen, kelas_id, token, tenggat, pengguna_id) VALUES (?, ?, ?, ?, ?)')
    .run(req.body.instrumen, req.body.kelas_id, token, req.body.tenggat || null, req.pengguna.id);
  catatAudit(req.pengguna.id, 'buat_asesmen', String(lastInsertRowid));
  return { id: Number(lastInsertRowid), token };
}));

app.put('/api/asesmen/:id', rute(req => {
  db.prepare('UPDATE asesmen SET aktif = ? WHERE id = ?').run(req.body.aktif ? 1 : 0, req.params.id);
  return { ok: true };
}));

app.get('/api/asesmen/:id/hasil', rute(req => {
  const a = db.prepare('SELECT a.*, k.nama AS kelas, k.guru_bk_id FROM asesmen a JOIN kelas k ON k.id = a.kelas_id WHERE a.id = ?').get(req.params.id);
  if (!a) throw new GalatPengguna('Asesmen tidak ditemukan.', 404);
  if (req.pengguna.peran !== 'koordinator' && a.guru_bk_id !== req.pengguna.id) throw new GalatPengguna('Kelas ini bukan binaan Anda.', 403);
  const jawaban = db.prepare(`SELECT j.nis, s.nama, j.hasil, j.setuju_dibagikan, j.dikirim FROM jawaban_asesmen j
    JOIN siswa s ON s.nis = j.nis WHERE j.asesmen_id = ? ORDER BY s.nama`).all(a.id).map(r => ({ ...r, hasil: JSON.parse(r.hasil) }));
  const belum = db.prepare(`SELECT nis, nama FROM siswa WHERE kelas_id = ? AND status = 'Aktif'
    AND nis NOT IN (SELECT nis FROM jawaban_asesmen WHERE asesmen_id = ?) ORDER BY nama`).all(a.kelas_id, a.id);

  // Rekap kelas
  let rekap = {};
  if (a.instrumen === 'akpd') {
    const perBidang = Object.fromEntries(BIDANG.map(b => [b, 0]));
    const frekuensiButir = {};
    for (const j of jawaban) {
      for (const b of BIDANG) perBidang[b] += j.hasil.perBidang[b]?.persen || 0;
      for (const no of j.hasil.butir) frekuensiButir[no] = (frekuensiButir[no] || 0) + 1;
    }
    for (const b of BIDANG) perBidang[b] = jawaban.length ? Math.round(perBidang[b] / jawaban.length) : 0;
    const butirTeratas = Object.entries(frekuensiButir).sort((x, y) => y[1] - x[1]).slice(0, 10).map(([no, n]) => {
      const butir = INSTRUMEN.akpd.butir[Number(no) - 1];
      return { no: Number(no), teks: butir.teks, bidang: butir.bidang, jumlah: n, persen: Math.round((n / jawaban.length) * 100) };
    });
    rekap = { perBidang, butirTeratas };
  } else {
    const dominan = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    jawaban.forEach(j => dominan[j.hasil.dominan]++);
    rekap = { dominan };
  }
  catatAudit(req.pengguna.id, 'lihat_hasil_asesmen', String(a.id));
  return { asesmen: { id: a.id, instrumen: a.instrumen, kelas: a.kelas, token: a.token, aktif: a.aktif, tenggat: a.tenggat }, jawaban, belum, rekap };
}));

// ---------- Pengisian tes oleh siswa (tanpa login) ----------
function ambilAsesmenAktif(token) {
  const a = db.prepare('SELECT a.*, k.nama AS kelas FROM asesmen a JOIN kelas k ON k.id = a.kelas_id WHERE a.token = ?').get(token);
  if (!a) throw new GalatPengguna('Tautan tes tidak ditemukan. Tanyakan tautan yang benar kepada guru BK.', 404);
  if (!a.aktif) throw new GalatPengguna('Tes ini sudah ditutup oleh guru BK.', 410);
  if (a.tenggat && a.tenggat < hariIniIso()) throw new GalatPengguna('Batas waktu pengisian tes sudah lewat.', 410);
  return a;
}

app.get('/api/tes/:token', rute(req => {
  const a = ambilAsesmenAktif(req.params.token);
  const ins = INSTRUMEN[a.instrumen];
  return { sekolah: ambilPengaturan().nama_sekolah, kelas: a.kelas, tenggat: a.tenggat, instrumen: { kode: ins.kode, nama: ins.nama, petunjuk: ins.petunjuk, skala: ins.skala, butir: ins.butir.map(({ no, teks }) => ({ no, teks })) } };
}));

app.post('/api/tes/:token', rute(req => {
  batasiPercobaan('tes:' + req.ip, 30);
  const a = ambilAsesmenAktif(req.params.token);
  const nis = String(req.body.nis || '').trim();
  const namaDepan = String(req.body.nama_depan || '').trim().toLowerCase();
  const s = db.prepare(`SELECT nis, nama FROM siswa WHERE nis = ? AND kelas_id = ? AND status = 'Aktif'`).get(nis, a.kelas_id);
  // Verifikasi sederhana: NIS terdaftar di kelas ini + nama depan cocok
  if (!s || s.nama.trim().split(/\s+/)[0].toLowerCase() !== namaDepan) {
    throw new GalatPengguna(`NIS dan nama depan tidak cocok dengan data siswa kelas ${a.kelas}. Periksa kembali atau hubungi guru BK.`);
  }
  if (db.prepare('SELECT 1 FROM jawaban_asesmen WHERE asesmen_id = ? AND nis = ?').get(a.id, nis)) {
    throw new GalatPengguna('Kamu sudah mengisi tes ini. Terima kasih!', 409);
  }
  let hasil;
  try { hasil = nilai(a.instrumen, req.body.jawaban); } catch (e) { throw new GalatPengguna(e.message); }
  db.prepare('INSERT INTO jawaban_asesmen (asesmen_id, nis, jawaban, hasil, setuju_dibagikan) VALUES (?, ?, ?, ?, ?)')
    .run(a.id, nis, JSON.stringify(req.body.jawaban), JSON.stringify(hasil), req.body.setuju_dibagikan ? 1 : 0);
  if (a.instrumen === 'riasec') {
    return { hasil: { kodeHolland: hasil.kodeHolland, tipe: hasil.kodeHolland.split('').map(t => ({ kode: t, ...TIPE_RIASEC[t] })) } };
  }
  return { hasil: { selesai: true } };
}));

// ============================================================
// Beranda & laporan
// ============================================================
function bulanSebelum(bulan) {
  const [th, bl] = bulan.split('-').map(Number);
  return bl === 1 ? `${th - 1}-12` : `${th}-${String(bl - 1).padStart(2, '0')}`;
}

app.get('/api/beranda', rute(req => {
  const u = req.pengguna;
  const koor = u.peran === 'koordinator';
  const hariIni = hariIniIso();
  const bulan = hariIni.slice(0, 7);
  const bulanLalu = bulanSebelum(bulan);
  const r = rekapBulanan(bulan);
  const rLalu = rekapBulanan(bulanLalu);
  const fk = filterKelas(u);
  const satu = (sql, ...arg) => db.prepare(sql).get(...arg).n;
  const milikSaya = koor ? '' : `AND l.pengguna_id = ${Number(u.id)}`;

  // Cakupan (Koordinator: seluruh sekolah, Guru BK: kelas binaannya)
  const siswaTotal = satu(`SELECT COUNT(*) AS n FROM siswa s JOIN kelas k ON k.id = s.kelas_id WHERE s.status = 'Aktif' AND ${fk.sql}`, ...fk.arg);
  const kelasTotal = satu(`SELECT COUNT(*) AS n FROM kelas k WHERE k.status = 'Aktif' AND ${fk.sql}`, ...fk.arg);
  const kelasKlasikal = satu(`SELECT COUNT(DISTINCT l.kelas_id) AS n FROM layanan l JOIN kelas k ON k.id = l.kelas_id
    WHERE l.jenis = 'bimbingan_klasikal' AND l.tanggal LIKE ? AND l.status != 'Arsip' AND ${fk.sql}`, `${bulan}-%`, ...fk.arg);
  const siswaTerlayani = satu(`SELECT COUNT(DISTINCT ls.nis) AS n FROM layanan_siswa ls JOIN layanan l ON l.id = ls.layanan_id
    JOIN siswa s ON s.nis = ls.nis JOIN kelas k ON k.id = s.kelas_id
    WHERE l.tanggal LIKE ? AND l.status != 'Arsip' AND ${fk.sql}`, `${bulan}-%`, ...fk.arg);
  const siswaAsesmen = satu(`SELECT COUNT(DISTINCT j.nis) AS n FROM jawaban_asesmen j JOIN siswa s ON s.nis = j.nis
    JOIN kelas k ON k.id = s.kelas_id WHERE s.status = 'Aktif' AND ${fk.sql}`, ...fk.arg);

  const tindakLanjut = db.prepare(`SELECT l.id, l.kode, l.jenis, l.tanggal, l.topik, l.status, l.tindak_lanjut,
      (SELECT GROUP_CONCAT(s.nama, ', ') FROM layanan_siswa ls JOIN siswa s ON s.nis = ls.nis WHERE ls.layanan_id = l.id) AS siswa
    FROM layanan l WHERE l.status IN ('Baru','Proses','Tindak Lanjut') ${milikSaya}
    ORDER BY CASE l.status WHEN 'Baru' THEN 0 WHEN 'Proses' THEN 1 ELSE 2 END, l.tanggal LIMIT 8`).all();

  const aksesSiswa = db.prepare(`SELECT a.id, a.instrumen, a.token, a.tenggat, k.nama AS kelas,
      (SELECT COUNT(*) FROM siswa s WHERE s.kelas_id = a.kelas_id AND s.status = 'Aktif') AS jumlah_siswa,
      (SELECT COUNT(*) FROM jawaban_asesmen j WHERE j.asesmen_id = a.id) AS jumlah_jawaban
    FROM asesmen a JOIN kelas k ON k.id = a.kelas_id WHERE a.aktif = 1 AND ${fk.sql} ORDER BY a.dibuat DESC LIMIT 5`).all(...fk.arg);

  const tim = koor ? db.prepare(`SELECT p.id, p.nama, p.peran,
      (SELECT COUNT(*) FROM kelas k WHERE k.guru_bk_id = p.id) AS kelas,
      (SELECT COUNT(*) FROM siswa s JOIN kelas k ON k.id = s.kelas_id WHERE k.guru_bk_id = p.id AND s.status = 'Aktif') AS siswa,
      (SELECT COUNT(*) FROM layanan l WHERE l.pengguna_id = p.id AND l.tanggal LIKE ? AND l.status != 'Arsip') AS layanan
    FROM pengguna p WHERE p.status = 'Aktif' ORDER BY p.peran, p.nama`).all(`${bulan}-%`) : [];

  // Daftar "perlu tindakan" — dihitung dari kondisi data, bukan diisi manual
  const perluTindakan = [];
  const tambah = (teks, href, tingkat = 'sedang') => perluTindakan.push({ teks, href, tingkat });
  if (siswaTotal === 0) {
    tambah(koor ? 'Belum ada data siswa. Impor dari Excel untuk mulai.' : 'Belum ada kelas binaan. Minta Koordinator menugaskan kelas.', koor ? '#siswa' : '#penugasan', 'tinggi');
  }
  if (koor && !ambilPengaturan().kepala_sekolah) tambah('Nama kepala sekolah belum diisi untuk tanda tangan laporan.', '#pengaturan');
  if (koor) {
    const tanpaGuru = satu(`SELECT COUNT(*) AS n FROM kelas WHERE guru_bk_id IS NULL AND status = 'Aktif'`);
    if (tanpaGuru) tambah(`${tanpaGuru} kelas belum punya guru BK.`, '#penugasan');
  }
  if (siswaTotal > 0 && rLalu.total === 0) tambah(`Belum ada layanan tercatat di bulan lalu — laporan ${bulanLalu} akan kosong.`, `#laporan/${bulanLalu}`, 'tinggi');
  const kasusLama = satu(`SELECT COUNT(*) AS n FROM layanan l WHERE l.jenis = 'kasus' AND l.status = 'Baru' AND l.tanggal <= date(?, '-7 days') ${milikSaya}`, hariIni);
  if (kasusLama) tambah(`${kasusLama} kasus berstatus Baru lebih dari 7 hari.`, '#layanan', 'tinggi');
  const lewatTenggat = satu(`SELECT COUNT(*) AS n FROM asesmen a JOIN kelas k ON k.id = a.kelas_id WHERE a.aktif = 1 AND a.tenggat < ? AND ${fk.sql}`, hariIni, ...fk.arg);
  if (lewatTenggat) tambah(`${lewatTenggat} asesmen sudah lewat tenggat tetapi masih terbuka.`, '#asesmen');
  if (kelasTotal > kelasKlasikal && siswaTotal > 0) tambah(`${kelasTotal - kelasKlasikal} kelas belum mendapat bimbingan klasikal bulan ini.`, '#layanan/baru');

  return {
    bulan, bulanLalu, hariIni,
    sekolah: ambilPengaturan().nama_sekolah,
    perluTindakan,
    cakupan: { siswaTotal, siswaTerlayani, kelasTotal, kelasKlasikal, siswaAsesmen },
    perBidang: r.perBidang,
    laporan: { bulanIni: r.total, bulanLalu: rLalu.total },
    tindakLanjut,
    aksesSiswa,
    tim,
  };
}));

// ============================================================
// Analitik siswa
// ============================================================
app.get('/api/analitik', rute(req => {
  const f = filterKelas(req.pengguna);
  const q = (sql, ...arg) => db.prepare(sql).all(...f.arg, ...arg);
  const sumber = `FROM siswa s JOIN kelas k ON k.id = s.kelas_id WHERE s.status = 'Aktif' AND k.status = 'Aktif' AND ${f.sql}`;
  const KONSELING = `('konseling_individu','konseling_kelompok')`;
  // Layanan yang menyentuh siswa dalam lingkup akses
  const layananLingkup = `FROM layanan l JOIN layanan_siswa ls ON ls.layanan_id = l.id JOIN siswa s ON s.nis = ls.nis
    JOIN kelas k ON k.id = s.kelas_id WHERE l.status != 'Arsip' AND ${f.sql}`;

  const perKelas = q(`SELECT k.nama AS kelas, COUNT(*) AS siswa, SUM(s.jk = 'L') AS l, SUM(s.jk = 'P') AS p ${sumber} GROUP BY k.id ORDER BY k.nama`);
  const gender = db.prepare(`SELECT SUM(s.jk = 'L') AS l, SUM(s.jk = 'P') AS p ${sumber}`).get(...f.arg);

  // AKPD: bidang prioritas per siswa (jawaban terbaru)
  const akpd = q(`SELECT j.hasil FROM jawaban_asesmen j JOIN asesmen a ON a.id = j.asesmen_id
    JOIN siswa s ON s.nis = j.nis JOIN kelas k ON k.id = s.kelas_id
    WHERE a.instrumen = 'akpd' AND ${f.sql}
    AND j.id = (SELECT MAX(j2.id) FROM jawaban_asesmen j2 JOIN asesmen a2 ON a2.id = j2.asesmen_id WHERE j2.nis = j.nis AND a2.instrumen = 'akpd')`);
  const kategoriAkpd = Object.fromEntries(BIDANG.map(b => [b, 0]));
  akpd.forEach(r => { kategoriAkpd[JSON.parse(r.hasil).bidangPrioritas]++; });

  const topik = q(`SELECT l.topik, COUNT(DISTINCT l.id) AS n ${layananLingkup} AND l.jenis IN ${KONSELING}
    GROUP BY lower(l.topik) ORDER BY n DESC LIMIT 8`);

  // Tren 6 bulan terakhir
  const bulan = [];
  let b = hariIniIso().slice(0, 7);
  for (let i = 0; i < 6; i++) { bulan.unshift(b); b = bulanSebelum(b); }
  const tren = bulan.map(bl => ({
    bulan: bl,
    n: db.prepare(`SELECT COUNT(DISTINCT l.id) AS n ${layananLingkup} AND l.jenis IN ${KONSELING} AND l.tanggal LIKE ?`).get(...f.arg, `${bl}-%`).n,
  }));

  // Evaluasi pra/pasca per jenis layanan (klasikal dihitung lewat kelas)
  const evaluasi = db.prepare(`SELECT l.jenis, COUNT(*) AS n, ROUND(AVG(l.skala_pra), 2) AS pra, ROUND(AVG(l.skala_pasca), 2) AS pasca
    FROM layanan l LEFT JOIN kelas k ON k.id = l.kelas_id
    WHERE l.status != 'Arsip' AND l.skala_pra IS NOT NULL AND l.skala_pasca IS NOT NULL
    AND (l.kelas_id IS NULL OR ${f.sql})
    ${aksesSemuaKelas(req.pengguna) ? '' : 'AND l.pengguna_id = ' + Number(req.pengguna.id)}
    GROUP BY l.jenis`).all(...f.arg);

  const ringkasKelas = q(`SELECT k.id, k.nama AS kelas, p.nama AS guru_bk,
      (SELECT COUNT(*) FROM siswa s WHERE s.kelas_id = k.id AND s.status = 'Aktif') AS siswa,
      (SELECT COUNT(DISTINCT ls.layanan_id) FROM layanan_siswa ls JOIN siswa s ON s.nis = ls.nis JOIN layanan l ON l.id = ls.layanan_id
         WHERE s.kelas_id = k.id AND l.status != 'Arsip') AS layanan_individu,
      (SELECT COUNT(*) FROM layanan l WHERE l.kelas_id = k.id AND l.jenis = 'bimbingan_klasikal' AND l.status != 'Arsip') AS klasikal,
      (SELECT COUNT(DISTINCT j.nis) FROM jawaban_asesmen j JOIN siswa s ON s.nis = j.nis WHERE s.kelas_id = k.id) AS sudah_asesmen
    FROM kelas k LEFT JOIN pengguna p ON p.id = k.guru_bk_id WHERE k.status = 'Aktif' AND ${f.sql} ORDER BY k.nama`);

  return {
    totalSiswa: (gender.l || 0) + (gender.p || 0),
    jumlahKelas: ringkasKelas.length,
    sesiKonseling: db.prepare(`SELECT COUNT(DISTINCT l.id) AS n ${layananLingkup} AND l.jenis IN ${KONSELING}`).get(...f.arg).n,
    asesmenAkpd: akpd.length,
    perKelas, gender: { L: gender.l || 0, P: gender.p || 0 }, kategoriAkpd, topik, tren, evaluasi, ringkasKelas,
  };
}));

app.get('/api/laporan/:bulan', rute(req => {
  if (!/^\d{4}-\d{2}$/.test(req.params.bulan)) throw new GalatPengguna('Format bulan harus YYYY-MM.');
  return rekapBulanan(req.params.bulan);
}));

app.get('/api/laporan/:bulan/pdf', (req, res) => {
  if (!/^\d{4}-\d{2}$/.test(req.params.bulan)) return res.status(400).json({ galat: 'Format bulan harus YYYY-MM.' });
  catatAudit(req.pengguna.id, 'unduh_laporan', req.params.bulan);
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="Laporan-BK-${req.params.bulan}.pdf"` });
  buatPdfLaporanBulanan(req.params.bulan, req.pengguna, res);
});

// Cadangan Excel (tanpa isi catatan rahasia & tanpa kontak orang tua)
app.get('/api/cadangan.xlsx', perluKoordinator, async (req, res) => {
  const wb = new ExcelJS.Workbook();
  const tambah = (nama, baris) => {
    const ws = wb.addWorksheet(nama);
    if (!baris.length) return;
    ws.addRow(Object.keys(baris[0]));
    ws.getRow(1).font = { bold: true };
    baris.forEach(b => ws.addRow(Object.values(b)));
  };
  tambah('Data Siswa', db.prepare(`SELECT s.nis AS NIS, s.nama AS Nama, s.jk AS JK, k.nama AS Kelas, s.status AS Status FROM siswa s LEFT JOIN kelas k ON k.id = s.kelas_id ORDER BY k.nama, s.nama`).all());
  tambah('Layanan', db.prepare(`SELECT l.kode AS KODE, l.jenis AS Jenis, l.tanggal AS Tanggal, l.bidang AS Bidang, l.topik AS Topik, l.kategori_kasus AS Kategori, l.status AS Status FROM layanan l ORDER BY l.tanggal`).all());
  catatAudit(req.pengguna.id, 'unduh_cadangan');
  res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="cadangan-bk-${hariIniIso()}.xlsx"` });
  await wb.xlsx.write(res);
  res.end();
});

// ============================================================
// Halaman
// ============================================================
app.get('/tes/:token', (req, res) => res.sendFile(path.join(__dirname, 'public', 'tes.html')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', (req, res) => res.status(404).json({ galat: 'Alamat API tidak ditemukan.' }));

if (require.main === module) {
  app.listen(PORT, () => console.log(`✅ Sistem BK berjalan di http://localhost:${PORT}`));
}

module.exports = app;
