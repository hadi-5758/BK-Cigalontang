/**
 * Daftar baku (dropdown) sesuai Kategori Standar BK di CLAUDE.md.
 */

// kode → awalan nomor layanan, apakah terikat ke kelas atau ke siswa
const JENIS_LAYANAN = {
  kasus:              { label: 'Buku Kasus',          awalan: 'KS', sasaran: 'siswa' },
  konseling_individu: { label: 'Konseling Individu',  awalan: 'KN', sasaran: 'siswa' },
  konseling_kelompok: { label: 'Konseling Kelompok',  awalan: 'KN', sasaran: 'siswa' },
  bimbingan_kelompok: { label: 'Bimbingan Kelompok',  awalan: 'BG', sasaran: 'siswa' },
  bimbingan_klasikal: { label: 'Bimbingan Klasikal',  awalan: 'BL', sasaran: 'kelas' },
  kunjungan_rumah:    { label: 'Kunjungan Rumah',     awalan: 'KR', sasaran: 'siswa' },
  konferensi_kasus:   { label: 'Konferensi Kasus',    awalan: 'KF', sasaran: 'siswa' },
  alih_tangan_kasus:  { label: 'Alih Tangan Kasus',   awalan: 'AT', sasaran: 'siswa' },
};

const BIDANG = ['Pribadi', 'Sosial', 'Belajar', 'Karier'];

const KATEGORI_KASUS = {
  A: 'Kehadiran (alpa, terlambat, bolos)',
  B: 'Perilaku (perkelahian, bullying, tidak sopan)',
  C: 'Akademik (tidak mengerjakan tugas, menyontek)',
  D: 'Atribut & Seragam',
  E: 'Narkoba & Zat Berbahaya',
  F: 'Lainnya',
};

const STATUS = ['Baru', 'Proses', 'Tindak Lanjut', 'Selesai', 'Arsip'];

// Sesuai CLAUDE.md: NIS 10 digit angka. Ubah pola ini jika format NIS sekolah berbeda.
const POLA_NIS = /^\d{10}$/;

module.exports = { JENIS_LAYANAN, BIDANG, KATEGORI_KASUS, STATUS, POLA_NIS };
