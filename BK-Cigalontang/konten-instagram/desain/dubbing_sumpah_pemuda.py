"""
Klip dubbing ElevenLabs (narasi) untuk Reels "Sumpah Pemuda Versi Anak Muda Digital".
Memakai pengunduh & suara yang sama dengan dubbing_hari_pertama.py.

Pemakaian:
  python3 dubbing_sumpah_pemuda.py <folder_keluaran> [nomor_baris ...]
"""
import sys

import dubbing_hari_pertama as d

# Bu Guru BK di Reels ini: Lani Eleonora (lebih rendah & hangat; Salsa terdengar terlalu cempreng di narasi ini)
d.SUARA["Guru BK Lani"] = "WwYTGZjDYP0WzvTp4vRz"

# urutan sama dengan DIALOG di audio_sumpah_pemuda.py
BARIS = [
    (1, "Siswi", "[warmly] Sembilan puluh delapan tahun lalu, para pemuda bersatu lewat satu janji."),
    (2, "Siswa", "[warmly] Dulu, mereka berkumpul dan berikrar."),
    (3, "Siswi", "[cheerful] Sekarang, kita berkumpul di grup chat, kolom komentar, dan F Y P."),
    (4, "Siswa", "[cheerful] Jadi, ini tiga janji kita di ruang digital."),
    (5, "Siswa", "[confident] Janji pertama: satu ruang digital, tanpa perundungan."),
    (6, "Siswi", "[serious] Kalau ada teman diejek di grup, jangan ikut react."),
    (7, "Siswi", "[warmly] Japri dia. Tanya, kamu oke?"),
    (8, "Siswi", "[confident] Janji kedua: satu bahasa, santun di kolom komentar."),
    (9, "Siswa", "[warmly] Sebelum kirim, cek dulu. Benar? Perlu? Baik?"),
    (10, "Siswa", "[cheerful] Kalau nggak, ganti jadi kata-kata yang mendukung."),
    (11, "Siswa", "[confident] Janji ketiga: satu tekad, bersatu dalam beda."),
    (12, "Siswi", "[warmly] Kita satu, walau nggak sama. Nggak setuju? Bantah idenya, bukan orangnya."),
    (13, "Guru BK Lani", "[warmly] Mulai dari jempol sendiri. Bisukan, laporkan, dukung, japri, dan cek fakta."),
    (14, "Guru BK Lani", "[warmly] Tulis janji digital-mu di kolom komentar. Kalau kamu sedang dirundung, kamu nggak sendiri. Ruang BK selalu terbuka."),
    (15, "Siswa", "[cheerful] Selamat Hari Sumpah Pemuda!"),
]

if __name__ == "__main__":
    d.BARIS = BARIS
    sys.exit(d.main())
