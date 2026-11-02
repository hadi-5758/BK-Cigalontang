/**
 * Database SQLite bawaan Node (node:sqlite) — tanpa instalasi tambahan.
 * File database: data/bk.db
 *
 * Aturan: data tidak dihapus. Siswa/layanan yang tidak dipakai diberi status 'Arsip'.
 */
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { DIR_DATA } = require('./keamanan');

const db = new DatabaseSync(process.env.DB_PATH || path.join(DIR_DATA, 'bk.db'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS pengaturan (
  kunci TEXT PRIMARY KEY,
  nilai TEXT
);

CREATE TABLE IF NOT EXISTS pengguna (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  nip TEXT,
  peran TEXT NOT NULL CHECK (peran IN ('koordinator','guru_bk')),
  hash_password TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Aktif',
  dibuat TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS kelas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL UNIQUE COLLATE NOCASE,
  tingkat TEXT,
  wali_kelas TEXT,
  guru_bk_id INTEGER REFERENCES pengguna(id)
);

CREATE TABLE IF NOT EXISTS siswa (
  nis TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  jk TEXT CHECK (jk IN ('L','P')),
  kelas_id INTEGER REFERENCES kelas(id),
  kontak_ortu_enc TEXT,
  status TEXT NOT NULL DEFAULT 'Aktif',
  dibuat TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS layanan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kode TEXT NOT NULL UNIQUE,
  jenis TEXT NOT NULL,
  tanggal TEXT NOT NULL,
  bidang TEXT,
  topik TEXT,
  kelas_id INTEGER REFERENCES kelas(id),
  kategori_kasus TEXT,
  catatan_enc TEXT,
  tindak_lanjut TEXT,
  status TEXT NOT NULL DEFAULT 'Selesai',
  pengguna_id INTEGER NOT NULL REFERENCES pengguna(id),
  dibuat TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS layanan_siswa (
  layanan_id INTEGER NOT NULL REFERENCES layanan(id),
  nis TEXT NOT NULL REFERENCES siswa(nis),
  PRIMARY KEY (layanan_id, nis)
);

CREATE TABLE IF NOT EXISTS asesmen (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  instrumen TEXT NOT NULL,
  kelas_id INTEGER NOT NULL REFERENCES kelas(id),
  token TEXT NOT NULL UNIQUE,
  tenggat TEXT,
  aktif INTEGER NOT NULL DEFAULT 1,
  pengguna_id INTEGER NOT NULL REFERENCES pengguna(id),
  dibuat TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS jawaban_asesmen (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asesmen_id INTEGER NOT NULL REFERENCES asesmen(id),
  nis TEXT NOT NULL REFERENCES siswa(nis),
  jawaban TEXT NOT NULL,
  hasil TEXT NOT NULL,
  setuju_dibagikan INTEGER NOT NULL DEFAULT 0,
  dikirim TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  UNIQUE (asesmen_id, nis)
);

CREATE TABLE IF NOT EXISTS jejak_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pengguna_id INTEGER,
  aksi TEXT NOT NULL,
  objek TEXT,
  waktu TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE INDEX IF NOT EXISTS idx_layanan_tanggal ON layanan(tanggal);
CREATE INDEX IF NOT EXISTS idx_siswa_kelas ON siswa(kelas_id);
`);

// Migrasi ringan: tambah kolom baru pada database lama tanpa menghapus data
function tambahKolom(tabel, kolom, definisi) {
  const ada = db.prepare(`PRAGMA table_info(${tabel})`).all().some(k => k.name === kolom);
  if (!ada) db.exec(`ALTER TABLE ${tabel} ADD COLUMN ${kolom} ${definisi}`);
}
tambahKolom('siswa', 'keterangan', 'TEXT');                         // alasan arsip: Lulus / Mutasi keluar / dll.
tambahKolom('kelas', 'status', "TEXT NOT NULL DEFAULT 'Aktif'");    // 'Arsip' setelah digabung
tambahKolom('pengguna', 'akses_bebas', 'INTEGER NOT NULL DEFAULT 0'); // 1 = Guru BK boleh akses semua kelas
tambahKolom('layanan', 'skala_pra', 'INTEGER');                     // evaluasi kondisi 1–5 sebelum layanan
tambahKolom('layanan', 'skala_pasca', 'INTEGER');                   // evaluasi kondisi 1–5 sesudah layanan
tambahKolom('layanan', 'intake_enc', 'TEXT');                       // intake & anamnesis (terenkripsi)
tambahKolom('layanan', 'prognosis_enc', 'TEXT');                    // prognosis (terenkripsi)
tambahKolom('layanan', 'teknik', 'TEXT');                           // pendekatan/teknik konseling
tambahKolom('layanan', 'materi', 'TEXT');                           // materi bimbingan klasikal
tambahKolom('layanan', 'tipe_klasikal', 'TEXT');
tambahKolom('layanan', 'capaian', 'TEXT');                          // capaian / SKKPD

db.exec(`
CREATE TABLE IF NOT EXISTS catatan_perkembangan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nis TEXT NOT NULL REFERENCES siswa(nis),
  tanggal TEXT NOT NULL,
  jenis TEXT NOT NULL CHECK (jenis IN ('Apresiasi','Pembinaan')),
  poin INTEGER NOT NULL CHECK (poin > 0),
  kategori TEXT,
  keterangan TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Aktif',
  pengguna_id INTEGER NOT NULL REFERENCES pengguna(id),
  dibuat TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS catatan_anekdot (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nis TEXT NOT NULL REFERENCES siswa(nis),
  tanggal TEXT NOT NULL,
  waktu TEXT,
  tempat TEXT,
  deskripsi_enc TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Aktif',
  pengguna_id INTEGER NOT NULL REFERENCES pengguna(id),
  dibuat TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
`);

const PENGATURAN_AWAL = {
  nama_sekolah: 'SMA Negeri 1 Cigalontang',
  alamat_sekolah: 'Kec. Cigalontang, Kab. Tasikmalaya, Jawa Barat',
  kepala_sekolah: '',
  nip_kepala_sekolah: '',
  tahun_pelajaran: '2026/2027',
  semester: 'Ganjil',
};
const sisip = db.prepare('INSERT OR IGNORE INTO pengaturan (kunci, nilai) VALUES (?, ?)');
for (const [k, v] of Object.entries(PENGATURAN_AWAL)) sisip.run(k, v);

function ambilPengaturan() {
  return Object.fromEntries(db.prepare('SELECT kunci, nilai FROM pengaturan').all().map(r => [r.kunci, r.nilai]));
}

function catatAudit(penggunaId, aksi, objek = null) {
  db.prepare('INSERT INTO jejak_audit (pengguna_id, aksi, objek) VALUES (?, ?, ?)').run(penggunaId ?? null, aksi, objek);
}

/** Jalankan fungsi dalam satu transaksi. */
function transaksi(fn) {
  db.exec('BEGIN');
  try {
    const hasil = fn();
    db.exec('COMMIT');
    return hasil;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

module.exports = { db, ambilPengaturan, catatAudit, transaksi };
