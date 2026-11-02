/**
 * Keamanan: hash password (scrypt), sesi bertanda tangan (HMAC),
 * dan enkripsi field sensitif (AES-256-GCM).
 *
 * Kunci dibaca dari environment (ENCRYPTION_KEY, SESSION_SECRET).
 * Jika belum ada, kunci dibuat sekali dan disimpan di data/kunci.json.
 * File itu WAJIB dicadangkan — tanpa kunci, catatan terenkripsi tidak bisa dibaca.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DIR_DATA = path.join(__dirname, '..', 'data');
const FILE_KUNCI = path.join(DIR_DATA, 'kunci.json');

function muatKunci() {
  fs.mkdirSync(DIR_DATA, { recursive: true });
  let simpanan = {};
  if (fs.existsSync(FILE_KUNCI)) simpanan = JSON.parse(fs.readFileSync(FILE_KUNCI, 'utf8'));
  let berubah = false;
  if (!process.env.ENCRYPTION_KEY && !simpanan.encryptionKey) {
    simpanan.encryptionKey = crypto.randomBytes(32).toString('hex');
    berubah = true;
  }
  if (!process.env.SESSION_SECRET && !simpanan.sessionSecret) {
    simpanan.sessionSecret = crypto.randomBytes(32).toString('hex');
    berubah = true;
  }
  if (berubah) {
    fs.writeFileSync(FILE_KUNCI, JSON.stringify(simpanan, null, 2), { mode: 0o600 });
    console.warn('⚠️  Kunci baru dibuat di data/kunci.json — cadangkan file ini di tempat aman.');
  }
  const kunciEnkripsi = Buffer.from(process.env.ENCRYPTION_KEY || simpanan.encryptionKey, 'hex');
  if (kunciEnkripsi.length !== 32) throw new Error('ENCRYPTION_KEY harus 64 karakter hex (32 byte).');
  return { kunciEnkripsi, rahasiaSesi: process.env.SESSION_SECRET || simpanan.sessionSecret };
}

const { kunciEnkripsi, rahasiaSesi } = muatKunci();

// ---------- Enkripsi field ----------
function enkripsi(teks) {
  if (teks === null || teks === undefined || teks === '') return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', kunciEnkripsi, iv);
  const isi = Buffer.concat([cipher.update(String(teks), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return 'v1:' + Buffer.concat([iv, tag, isi]).toString('base64');
}

function dekripsi(sandi) {
  if (!sandi) return '';
  try {
    const buf = Buffer.from(sandi.slice(3), 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', kunciEnkripsi, buf.subarray(0, 12));
    decipher.setAuthTag(buf.subarray(12, 28));
    return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString('utf8');
  } catch {
    return '[gagal membuka catatan — periksa kunci enkripsi]';
  }
}

// ---------- Password ----------
function hashPassword(password) {
  const garam = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, garam, 64);
  return `scrypt:${garam.toString('hex')}:${hash.toString('hex')}`;
}

function cocokPassword(password, simpanan) {
  const [, garamHex, hashHex] = String(simpanan).split(':');
  if (!garamHex || !hashHex) return false;
  const hash = crypto.scryptSync(password, Buffer.from(garamHex, 'hex'), 64);
  return crypto.timingSafeEqual(hash, Buffer.from(hashHex, 'hex'));
}

// ---------- Sesi (cookie bertanda tangan) ----------
const LAMA_SESI_MS = 8 * 60 * 60 * 1000; // 8 jam

function tandaTangan(data) {
  return crypto.createHmac('sha256', rahasiaSesi).update(data).digest('base64url');
}

function buatTokenSesi(userId) {
  const muatan = Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + LAMA_SESI_MS })).toString('base64url');
  return `${muatan}.${tandaTangan(muatan)}`;
}

function bacaTokenSesi(token) {
  if (!token || !token.includes('.')) return null;
  const [muatan, ttd] = token.split('.');
  const harapan = tandaTangan(muatan);
  if (ttd.length !== harapan.length || !crypto.timingSafeEqual(Buffer.from(ttd), Buffer.from(harapan))) return null;
  const data = JSON.parse(Buffer.from(muatan, 'base64url').toString('utf8'));
  return data.exp > Date.now() ? data : null;
}

function tokenAcak(byte = 9) {
  return crypto.randomBytes(byte).toString('base64url');
}

module.exports = {
  enkripsi, dekripsi, hashPassword, cocokPassword,
  buatTokenSesi, bacaTokenSesi, tokenAcak, LAMA_SESI_MS, DIR_DATA,
};
