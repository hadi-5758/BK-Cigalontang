"""
Kalender Konten Instagram BK SMAN 1 Cigalontang — TA 2026/2027.
Jadwal unggah: Senin, Rabu, Jumat (3 konten/minggu), disesuaikan dengan
Kalender Pendidikan SMAN 1 Cigalontang TA 2026/2027.

Menghasilkan:
  - Kalender_Konten_IG_BK_2026-2027.xlsx  (tracker produksi)
  - kalender-konten-2026-2027.md          (versi baca cepat)

Jalankan: python3 build_kalender_konten.py
"""

import datetime as dt
from collections import Counter
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, Border, Side, PatternFill
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

OUT_DIR = Path(__file__).parent
NAMA_SEKOLAH = "SMA Negeri 1 Cigalontang"
TAHUN_PELAJARAN = "2026/2027"

# --- Rubrik harian -------------------------------------------------------
RUBRIK = {
    "Senin": ("#SeninStarter", "Motivasi & tips praktis awal minggu (fokus Belajar/Karier)"),
    "Rabu": ("#RabuRuangAman", "Edukasi mendalam isu Pribadi/Sosial, bahasa hangat & validatif"),
    "Jumat": ("#JumatNgobrolBK", "Konten ringan, relatable, interaktif & kolaborasi (Reels, kuis, Kata Alumni)"),
}
HARI = ["Senin", "Rabu", "Jumat"]
OFFSET_HARI = {"Senin": 0, "Rabu": 2, "Jumat": 4}

BIDANG = {"P": "Pribadi", "S": "Sosial", "B": "Belajar", "K": "Karier"}

BULAN = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli",
         "Agustus", "September", "Oktober", "November", "Desember"]

SEM1 = "Sisa Semester 1 (Bonus)"
SEM2 = "Semester 2"

# --- Data mingguan -------------------------------------------------------
# Tiap post: (format, kode bidang, judul/hook, isi poin, CTA, kolaborasi)
WEEKS = [
    # ===================== SISA SEMESTER 1 (BONUS) =====================
    dict(start="2026-10-19", sem=SEM1, tema="Siap TKA, Siap Mental",
         momen="Menjelang TKA (nasional 26 Okt–8 Nov; sekolah: 26–30 Okt & XII 2–6 Nov); Bulan Kesehatan Mental",
         stories="Polling: 'Mapel pilihan TKA-mu apa?' • Kotak tanya: 'Apa yang paling bikin kamu cemas soal TKA?'",
         posts=[
             ("Carousel", "B", "TKA Itu Apa Sih? 5 Hal yang Wajib Kamu Tahu",
              "Apa itu TKA & tujuannya • Siapa pesertanya • Mapel wajib & pilihan • Manfaat hasil TKA untuk seleksi lanjut • Cara latihan yang efektif",
              "Komen mapel pilihanmu & tag teman satu ruang ujian", "Wakasek Kurikulum / Proktor TKA"),
             ("Reels", "P", "POV: H-5 TKA tapi Otak Nge-freeze",
              "Skit singkat siswa panik → teman ajak teknik grounding 5-4-3-2-1 • Napas kotak 4-4-4-4 • Pesan: cemas itu wajar, bisa dikelola",
              "Save & praktikkan sebelum tidur", "Siswa talent (dengan izin tertulis)"),
             ("Infografis", "B", "Checklist Sebelum TKA — Simpan untuk Hari-H",
              "Kartu peserta & alat tulis • Tidur 7–8 jam • Sarapan • Cek ruang & jadwal • Datang 30 menit lebih awal • Doa & niat jujur",
              "Save, lalu share ke grup kelas", "-"),
         ]),
    dict(start="2026-10-26", sem=SEM1, tema="Pemuda Tangguh, Ujian Tenang",
         momen="Prakiraan TKA (26–30 Okt); Sumpah Pemuda (28 Okt)",
         stories="Stiker 'Add Yours': kirim doa/semangat untuk teman yang TKA • Kuis Sumpah Pemuda",
         posts=[
             ("Single Image", "P", "Kamu Sudah Berusaha. Hasil Bukan Satu-satunya Ukuran Dirimu.",
              "Quote penyemangat hari pertama TKA • Visual hangat warna sekolah • Pengingat: BK siap jadi tempat cerita",
              "Kirim semangat untuk temanmu di kolom komentar", "-"),
             ("Carousel", "S", "Sumpah Pemuda Versi Anak Muda Digital: 3 Janji Kita",
              "Satu ruang digital tanpa perundungan • Satu bahasa: santun di kolom komentar • Satu tekad: bersatu dalam beda (nilai Peace Generation) • Contoh aksi kecil",
              "Tulis 'janji digital'-mu di komentar", "OSIS & MPK"),
             ("Reels", "B", "Habis Ujian, Stop Bahas Jawaban Sampai Overthinking",
              "Kenapa membahas jawaban bikin cemas • 3 cara 'decompress' setelah ujian (jalan, ngobrol hal lain, istirahat) • Fokus ke tes berikutnya",
              "Kamu tim bahas jawaban atau tim langsung lupa? Komen!", "-"),
         ]),
    dict(start="2026-11-02", sem=SEM1, tema="Kelas XII Berjuang, Semua Mendukung",
         momen="Prakiraan TKA Kelas XII (2–6 Nov)",
         stories="Polling: 'Kamu tipe belajar pagi atau malam?' • Q&A 'Tanya BK soal kuliah'",
         posts=[
             ("Carousel", "B", "Strategi Jitu Soal HOTS: Baca – Tandai – Eliminasi",
              "Baca pertanyaan dulu baru teks • Tandai kata kunci • Eliminasi opsi yang jelas salah • Atur waktu per soal • Jangan terpaku di satu soal",
              "Save untuk latihan berikutnya", "Guru mapel (Matematika/B. Indonesia)"),
             ("Carousel", "P", "Cemas Wajar vs Cemas Berlebihan: Kenali Bedanya",
              "Ciri cemas wajar (sementara, memotivasi) • Ciri cemas berlebih (mengganggu tidur, makan, aktivitas) • Cara menolong diri • Kapan perlu ke BK/profesional",
              "Butuh cerita? DM atau datang ke ruang BK", "-"),
             ("Reels", "S", "Pesan Adik Kelas untuk Kakak XII",
              "Kompilasi video singkat siswa X & XI memberi semangat • Ditutup pesan guru BK",
              "Kakak XII, tag dirimu di komentar!", "OSIS / MPK, siswa X–XI"),
         ]),
    dict(start="2026-11-09", sem=SEM1, tema="Jadi Pahlawan Masa Kini: Stop Perundungan",
         momen="Hari Pahlawan (10 Nov); World Kindness Day (13 Nov)",
         stories="Kuis: 'Ini bullying atau bercanda?' • Stiker tantangan #TantanganBaik",
         posts=[
             ("Carousel", "K", "5 Profesi 'Pahlawan Masa Kini' & Jurusan Kuliahnya",
              "Tenaga kesehatan (Keperawatan/Kedokteran) • Guru & Konselor (Kependidikan/BK) • Relawan bencana (Kesmas/Geografi) • Damkar & SAR • Pekerja sosial (Kesejahteraan Sosial)",
              "Profesi mana yang kamu impikan?", "-"),
             ("Carousel", "S", "Kamu Saksi Bullying? Jadi Pahlawan dengan 5D",
              "Distract (alihkan) • Delegate (minta bantuan guru/TPPK) • Document (catat bukti) • Delay (dampingi korban setelahnya) • Direct (tegur jika aman) • Info kanal lapor sekolah",
              "Share agar makin banyak 'pahlawan' di sekolah", "TPPK Sekolah"),
             ("Reels", "S", "#TantanganBaik 7 Hari ala SMANRICI",
              "Ide kebaikan kecil tiap hari: sapa teman baru, puji tulus, bantu piket, dll. • Ajak siswa unggah story & tag akun BK",
              "Ikut tantangan & tag @akunBK", "OSIS & PMR"),
         ]),
    dict(start="2026-11-16", sem=SEM1, tema="Beda Itu Biasa: Toleransi & Hak Anak",
         momen="Hari Toleransi Internasional (16 Nov); Hari Anak Sedunia (20 Nov)",
         stories="Polling: 'Pernah jadi korban candaan soal fisik?' (anonim) • Info SAPA 129",
         posts=[
             ("Reels", "B", "Kerja Kelompok dengan Teman Beda Karakter Tanpa Drama",
              "Sepakati tujuan & tenggat • Bagi peran sesuai kekuatan • Komunikasi rutin di grup • Selesaikan beda pendapat dengan voting/diskusi • Apresiasi kontribusi",
              "Tag teman kelompok terbaikmu", "-"),
             ("Carousel", "S", "Candaan SARA & Body Shaming: Bukan Lucu, Tapi Luka",
              "Contoh candaan yang sering dianggap biasa • Dampaknya pada korban • Stereotip vs fakta • Cara menegur teman dengan santun • Nilai 'menerima perbedaan' (Peace Generation)",
              "Kalau temanmu bercanda kelewatan, apa yang kamu lakukan?", "Trainer Peace Generation (Guru BK)"),
             ("Infografis", "P", "Hak Remaja yang Perlu Kamu Tahu",
              "Hak didengar • Hak aman dari kekerasan • Hak privasi • Hak pendidikan • Ke mana melapor: BK, TPPK, SAPA 129 / WA 08111-129-129",
              "Save & sebarkan", "-"),
         ]),
    dict(start="2026-11-23", sem=SEM1, tema="Terima Kasih, Guru",
         momen="Hari Guru Nasional (25 Nov)",
         stories="Kotak pesan: 'Tulis ucapan untuk guru favoritmu' (direpost anonim)",
         posts=[
             ("Carousel", "B", "Takut Bertanya ke Guru? Ini Template Chat Sopan",
              "Waktu yang tepat mengirim pesan • Salam & perkenalan (nama, kelas) • Sampaikan maksud singkat • Ucapkan terima kasih • Contoh chat benar vs kurang tepat",
              "Save template-nya!", "-"),
             ("Reels", "S", "Selamat Hari Guru: Pesan dari Kami untuk Bapak/Ibu Guru",
              "Siswa membacakan ucapan singkat • Momen guru membaca surat siswa • Musik hangat",
              "Tulis ucapan untuk gurumu di komentar", "OSIS & seluruh guru"),
             ("Carousel", "K", "Mau Jadi Guru? Kenali Jalurnya",
              "S1 Kependidikan (termasuk BK) • Pendidikan Profesi Guru (PPG) • Kampus LPTK di Jawa Barat • Skill yang dibutuhkan • Cerita singkat guru BK",
              "Siapa yang bercita-cita jadi guru? Angkat tangan di komentar ✋", "Guru BK & guru muda"),
         ]),
    dict(start="2026-11-30", sem=SEM1, tema="ASAS Mode: Fokus & Tenang",
         momen="ASAS (30 Nov–4 Des); Hari AIDS Sedunia (1 Des); Hari Disabilitas Internasional (3 Des)",
         stories="Countdown ASAS • Polling jam tidur semalam • Ucapan Hari Disabilitas",
         posts=[
             ("Single Image", "B", "Tidur Cukup > Sistem Kebut Semalam",
              "Fakta: tidur membantu otak menyimpan memori • Rekomendasi tidur remaja 8–10 jam • Pesan singkat semangat ASAS",
              "Kamu tidur jam berapa semalam? Jujur ya 😄", "-"),
             ("Carousel", "P", "Teknik Tenang 3 Menit Sebelum Ujian",
              "Napas 4-7-8 • Relaksasi otot (kepal–lepas) • Self-talk positif ('aku sudah siap') • Fokus pada soal di depan mata",
              "Coba sekarang, lalu ceritakan rasanya", "-"),
             ("Reels", "P", "ASAS Selesai! 5 Cara Recharge yang Sehat",
              "Tidur siang secukupnya • Gerak/olahraga ringan • Ngobrol dengan keluarga • Hobi tanpa layar • Batasi scroll berjam-jam",
              "Cara recharge favoritmu apa?", "-"),
         ]),
    dict(start="2026-12-07", sem=SEM1, tema="Refleksi Semester: Aku yang Bertumbuh",
         momen="Pasca-ASAS / classmeeting; Hari HAM (10 Des)",
         stories="Template story 'Semester ini aku bangga karena…' • Polling lomba classmeeting favorit",
         posts=[
             ("Carousel", "B", "Evaluasi Belajar ala Start–Stop–Continue",
              "Start: kebiasaan baru yang ingin dimulai • Stop: kebiasaan yang menghambat • Continue: yang sudah berhasil • Template untuk ditulis sendiri",
              "Screenshot template & isi di story", "-"),
             ("Reels", "P", "Self-Compassion: Cara Bicara pada Diri Saat Nilai Belum Sesuai Harapan",
              "Kenali kritik batin yang keras • Bicara seperti ke sahabat • Pisahkan nilai dari harga diri • Fokus pada langkah perbaikan",
              "Kalimat apa yang ingin kamu dengar saat gagal?", "-"),
             ("Reels", "S", "Sportif Itu Keren: Classmeeting Tanpa Perundungan",
              "Dokumentasi classmeeting • Momen saling dukung antarkelas • Pesan HAM: hormati semua teman",
              "Kelas mana yang paling sportif? Komen!", "OSIS & Wali Kelas"),
         ]),
    dict(start="2026-12-14", sem=SEM1, tema="Remedial Bukan Aib, Kesempatan Kedua",
         momen="Masa remedial/pengayaan & pengolahan nilai",
         stories="Kuis singkat RIASEC (story quiz) • Q&A 'Bingung jurusan?'",
         posts=[
             ("Single Image", "B", "Remedial = Second Chance, Bukan Label",
              "Quote: 'Remedial bukan berarti kamu bodoh, tapi kamu diberi kesempatan untuk paham' • Tips singkat minta bimbingan guru",
              "Share ke teman yang lagi remedial", "-"),
             ("Carousel", "S", "Cara Jujur ke Orang Tua soal Nilai",
              "Pilih waktu yang tenang • Gunakan 'aku merasa…' (I-message) • Akui & jelaskan tanpa menyalahkan • Bawa rencana perbaikan • Minta dukungan",
              "Pernah deg-degan ngomong soal nilai? Cerita yuk", "-"),
             ("Kuis Interaktif", "K", "Kuis: Kamu Tipe RIASEC yang Mana?",
              "Penjelasan 6 tipe Holland (Realistic, Investigative, Artistic, Social, Enterprising, Conventional) • Contoh jurusan & profesi tiap tipe • Ajak tes lengkap di BK",
              "Komen huruf tipe kamu!", "-"),
         ]),
    dict(start="2026-12-21", sem=SEM1, tema="Rapor & Rumah",
         momen="Hari Ibu (22 Des); Penetapan & Pembagian Rapor (23 Des); Natal (25 Des)",
         stories="Repost ucapan Hari Ibu siswa • Ucapan Natal • Polling 'Rencana liburanmu?'",
         posts=[
             ("Carousel", "S", "5 Cara Sederhana Bilang Sayang ke Ibu (Tanpa Canggung)",
              "Bantu pekerjaan rumah tanpa disuruh • Tulis surat/kartu kecil • Ajak ngobrol & dengarkan • Peluk/salim • Doakan • Catatan untuk yang kehilangan ibu (empatik)",
              "Tag ibumu atau tulis pesan untuknya", "-"),
             ("Carousel", "P", "Rapor Bukan Ramalan Masa Depan",
              "Cara membaca rapor dengan kepala dingin • Lihat tren, bukan angka saja • Kenali kekuatan • Tentukan 2 target semester depan • Pesan untuk orang tua: dampingi, bukan bandingkan",
              "Share ke orang tuamu juga", "Wali Kelas"),
             ("Single Image", "S", "Damai dalam Keberagaman: Selamat Hari Natal",
              "Ucapan Natal bagi yang merayakan • Pesan toleransi & persaudaraan",
              "-", "-"),
         ]),
    dict(start="2026-12-28", sem=SEM1, tema="Liburan Waras: Istirahat Tanpa Rasa Bersalah",
         momen="Libur Semester 1 (28–31 Des); Tahun Baru (1 Jan)",
         stories="Tantangan '1 jam tanpa HP' • Template 'Word of the Year 2027'",
         posts=[
             ("Reels", "P", "Tantangan Digital Detox Ringan: 1 Jam Tanpa HP per Hari",
              "Kenapa otak butuh jeda dari layar • Ide aktivitas pengganti • Cara memulai: matikan notifikasi, taruh HP di ruangan lain",
              "Ikut tantangan & laporan di story", "-"),
             ("Carousel", "B", "7 Ide Liburan Produktif Versi Santai",
              "Kursus online gratis • Baca 1 buku • Belajar skill baru (desain, coding, masak) • Bantu usaha keluarga • Jadi relawan • Olahraga rutin • Istirahat itu juga produktif",
              "Ide mana yang mau kamu coba?", "-"),
             ("Single Image", "P", "Selamat Tahun Baru 2027! Satu Kata untuk Tahunmu?",
              "Visual tahun baru • Ajakan memilih satu kata (contoh: Tumbuh, Berani, Tenang)",
              "Tulis satu kata tahun 2027-mu di komentar", "-"),
         ]),
    dict(start="2027-01-04", sem=SEM1, tema="Siapkan Diri untuk Semester Baru",
         momen="Libur Semester 1 (4–8 Jan); Isra Mi'raj (5 Jan)",
         stories="Polling: 'Siap masuk sekolah?' • Countdown hari pertama semester 2",
         posts=[
             ("Carousel", "P", "Resolusi Sering Gagal? Coba SMART Goal + Kebiasaan Kecil",
              "Kenapa resolusi besar sering gagal • Rumus SMART • Mulai dari kebiasaan 2 menit • Tracking sederhana • Contoh resolusi belajar",
              "Tulis 1 resolusi SMART-mu", "-"),
             ("Single Image", "P", "Isra Mi'raj: Jeda untuk Menenangkan Hati",
              "Ucapan Isra Mi'raj • Refleksi: ibadah sebagai jeda dari kesibukan & sumber ketenangan",
              "-", "Rohis / Guru PAI"),
             ("Infografis", "K", "Kelas XII: Timeline SNPMB 2027 yang Wajib Dipantau",
              "Registrasi akun SNPMB • SNBP (pendaftaran & pengumuman) • UTBK-SNBT • Seleksi mandiri • Catatan: cek tanggal resmi di snpmb.id",
              "Save & aktifkan pengingat", "Tim Info Karier BK"),
         ]),

    # ============================ SEMESTER 2 ============================
    dict(start="2027-01-11", sem=SEM2, tema="Fresh Start Semester Genap",
         momen="Hari pertama Semester 2 (11 Jan)",
         stories="Polling: 'Target utamamu semester ini?' • Info jam layanan BK",
         posts=[
             ("Reels", "B", "Welcome Back! Reset Meja Belajar & Mindset",
              "Before–after merapikan meja belajar • 3 hal yang disiapkan di awal semester • Pesan semangat dari guru BK",
              "Tunjukkan meja belajarmu di story & tag kami", "OSIS"),
             ("Carousel", "B", "Bikin Jadwal Belajar Mingguan dengan Time Blocking",
              "Apa itu time blocking • Tentukan blok wajib (sekolah, ibadah, tidur) • Isi blok belajar & istirahat • Contoh jadwal siswa • Template kosong",
              "Download & isi templatenya", "-"),
             ("Carousel", "S", "Kenalan Lagi: Layanan BK Itu Ngapain Aja?",
              "Konseling individu & kelompok • Bimbingan klasikal • Info karier & kuliah • Kerahasiaan terjaga • Cara membuat janji (jam, lokasi, link form)",
              "Simpan postingan ini sebagai 'kontak darurat cerita'", "-"),
         ]),
    dict(start="2027-01-18", sem=SEM2, tema="Peta Jalan ke Kampus",
         momen="Masa registrasi akun SNPMB & pengisian PDSS (perkiraan)",
         stories="Q&A 'Tanya SNBP' • Polling: 'Sudah punya akun SNPMB?'",
         posts=[
             ("Carousel", "K", "SNBP 101: Syarat, Alur, dan Kesalahan yang Sering Terjadi",
              "Siapa yang eligible • Alur registrasi & pemilihan prodi • Pentingnya PDSS yang benar • Kesalahan umum (salah pilih prodi, telat daftar) • Cek info resmi snpmb.id",
              "Kirim pertanyaanmu di kotak Q&A story", "Operator PDSS / Wakasek Kurikulum"),
             ("Carousel", "P", "Keluar dari Comparison Trap Seangkatan",
              "Kenapa kita suka membandingkan diri • Media sosial menampilkan 'highlight' saja • Bandingkan dengan dirimu kemarin • Batasi akun pemicu • Rayakan progres kecil",
              "Siapa yang perlu baca ini? Tag dia", "-"),
             ("Reels", "K", "Kata Alumni #1: Cerita Masuk PTN Lewat SNBP",
              "Wawancara singkat alumni: persiapan, pilih prodi, tantangan kuliah • Tips untuk adik kelas",
              "Tulis pertanyaan untuk alumni di komentar", "Alumni SMANRICI"),
         ]),
    dict(start="2027-01-25", sem=SEM2, tema="Sehat Fisik, Sehat Mental",
         momen="Hari Gizi Nasional (25 Jan); Hari Pendidikan Internasional (24 Jan)",
         stories="Polling: 'Tadi pagi sarapan?' • Kuis jam tidur ideal remaja",
         posts=[
             ("Infografis", "B", "Sarapan & Konsentrasi Belajar: Isi Piringku untuk Pelajar",
              "Hubungan sarapan & fokus • Komposisi Isi Piringku • Ide sarapan murah & cepat • Minum air cukup • Kurangi minuman tinggi gula",
              "Pamerkan sarapanmu di story!", "PMR / UKS / Puskesmas Cigalontang"),
             ("Carousel", "P", "Begadang Demi Scroll? Kenali Revenge Bedtime Procrastination",
              "Apa itu & kenapa terjadi • Dampak ke mood, fokus, kesehatan mental • 'Brain rot' akibat konten tanpa henti • Tips: jam berhenti layar, mode fokus, ritual tidur",
              "Jam berapa biasanya kamu menaruh HP?", "-"),
             ("Reels", "P", "Peregangan 60 Detik di Sela Belajar",
              "Gerakan leher, bahu, punggung, mata (aturan 20-20-20) • Dipandu guru PJOK/siswa",
              "Ikuti gerakannya & tag teman sebangku", "Guru PJOK"),
         ]),
    dict(start="2027-02-01", sem=SEM2, tema="Pilih Prodi, Bukan Sekadar Gengsi",
         momen="Masa pendaftaran SNBP (perkiraan); Tahun Baru Imlek (6 Feb)",
         stories="Kuis 'Mitos atau fakta jurusan?' • Ucapan Imlek 2578",
         posts=[
             ("Carousel", "K", "Cara Memilih Prodi: Minat × Kemampuan × Peluang",
              "Kenali minat (hasil RIASEC/AKPD) • Cek kemampuan (nilai rapor mapel pendukung) • Riset peluang kerja & daya tampung • Konsep Ikigai sederhana • Konsultasi BK",
              "Prodi impianmu apa? Komen!", "-"),
             ("Carousel", "S", "Beda Pilihan Kuliah dengan Orang Tua? Begini Diskusinya",
              "Pahami alasan orang tua • Siapkan data (prodi, biaya, prospek) • Pilih waktu & bahasa yang tepat • Cari jalan tengah • Ajak BK sebagai mediator",
              "Share ke orang tuamu juga", "Orang tua / Komite Sekolah"),
             ("Reels", "K", "Mitos vs Fakta Jurusan Kuliah",
              "Format cepat 'Mitos/Fakta': 'Jurusan sosial susah kerja', 'Harus IPA untuk kedokteran', dst. • Diluruskan dengan data singkat",
              "Mitos apa lagi yang pernah kamu dengar?", "Alumni / mahasiswa"),
         ]),
    dict(start="2027-02-08", sem=SEM2, tema="Ramadan & Digital Wellbeing",
         momen="Libur awal Ramadan (8–12 Feb); Safer Internet Day (9 Feb)",
         stories="Template 'Target Ramadan-ku' • Polling: 'Pernah dapat DM mencurigakan?'",
         posts=[
             ("Single Image", "P", "Marhaban ya Ramadan: Apa Target Ramadan-mu?",
              "Ucapan Ramadan 1448 H • Mohon maaf lahir batin dari Tim BK • Ajak menulis 1 target ibadah & 1 target diri",
              "Tulis targetmu di komentar", "Rohis"),
             ("Carousel", "S", "Waspada Sextortion & Grooming Online",
              "Modus umum (kenalan baru, minta foto, ancaman) • Tanda bahaya (red flag) • Jangan kirim, jangan bayar, simpan bukti • Lapor: orang tua, BK, SAPA 129 • Kamu bukan yang salah",
              "Share agar temanmu terlindungi", "TPPK / Polsek Cigalontang (opsional)"),
             ("Carousel", "P", "Judi Online Menyamar Jadi Game: Kenali & Tolak",
              "Bentuk judol yang menyasar remaja (slot, 'top up' berhadiah) • Kenapa bikin ketagihan • Dampak: utang, konflik, kecemasan • Cara menolak ajakan • Cari bantuan",
              "Kenal teman yang terjebak? Ajak bicara ke BK", "-"),
         ]),
    dict(start="2027-02-15", sem=SEM2, tema="Ramadan Produktif & Hubungan Sehat",
         momen="Masuk sekolah selama Ramadan; pasca-Valentine (14 Feb)",
         stories="Polling: 'Belajar enaknya setelah sahur atau setelah tarawih?' • Kuis red/green flag",
         posts=[
             ("Infografis", "B", "Jadwal Belajar Saat Puasa: Kapan Otak Paling Fokus?",
              "Setelah sahur: materi berat • Siang: review ringan • Menjelang buka: istirahat • Setelah tarawih: latihan soal singkat • Tidur cukup",
              "Save jadwalnya", "-"),
             ("Carousel", "S", "Red Flag vs Green Flag dalam Pertemanan & Pacaran",
              "Red flag: posesif, cek HP, merendahkan, memaksa • Green flag: menghargai batasan, mendukung, jujur • Hubungan sehat = aman & setara • Cara keluar dari hubungan tidak sehat • BK siap mendengar",
              "Komen 1 green flag menurutmu", "-"),
             ("Reels", "S", "Ngabuburit Positif ala SMANRICI",
              "Montase kegiatan: tadarus, berbagi takjil, olahraga ringan, bantu orang tua • Ajak ide ngabuburit sehat",
              "Ngabuburitmu ngapain? Share di story", "Rohis & OSIS"),
         ]),
    dict(start="2027-02-22", sem=SEM2, tema="Hati Tenang, Pikiran Jernih",
         momen="Pesantren Ramadan (24–27 Feb)",
         stories="Repost momen pesantren • Template 'Jurnal syukur hari ini'",
         posts=[
             ("Carousel", "P", "Syukur sebagai Penawar Overthinking: Jurnal 3 Hal Baik",
              "Apa itu jurnal syukur • Manfaat menurut riset psikologi positif • Cara memulai (3 hal baik + alasannya) • Contoh tulisan siswa",
              "Coba tulis 3 hal baik hari ini di komentar", "-"),
             ("Reels", "S", "Kebersamaan di Pesantren Ramadan",
              "Dokumentasi kegiatan (tanpa menampilkan wajah tanpa izin) • Kutipan refleksi siswa & guru",
              "Momen favoritmu di pesantren?", "Rohis & Guru PAI"),
             ("Carousel", "K", "Kelas XII: Siapkan Plan A–B–C Setelah SMA",
              "Plan A: SNBP • Plan B: UTBK-SNBT • Plan C: mandiri/PTS/kedinasan/kerja • Tabel perbandingan jadwal & biaya • Pentingnya rencana cadangan",
              "Sudah punya Plan B? Komen 'sudah' / 'belum'", "-"),
         ]),
    dict(start="2027-03-01", sem=SEM2, tema="Fokus Akhir Jenjang",
         momen="ASAJ kelas XII (1–5 Mar); Pesantren Ramadan (1–5 Mar)",
         stories="Kirim semangat untuk XII • Kuis teknik belajar",
         posts=[
             ("Single Image", "B", "Semangat ASAJ, Kelas XII! Kamu Sudah Sejauh Ini",
              "Quote penyemangat • Pengingat: jujur, tidur cukup, sahur bergizi",
              "Tag teman seperjuanganmu", "-"),
             ("Reels", "B", "Active Recall & Spaced Repetition: Belajar Lebih Sedikit, Ingat Lebih Lama",
              "Kenapa membaca ulang kurang efektif • Active recall: uji diri tanpa melihat catatan • Spaced repetition: jadwal ulang 1-3-7 hari • Contoh penerapan",
              "Save & coba minggu ini", "Guru mapel"),
             ("Carousel", "P", "Menunggu Pengumuman Bikin Deg-degan? Kelola Cemasmu",
              "Kenapa menunggu terasa berat • Fokus pada yang bisa dikontrol • Tetap lanjut persiapan Plan B • Batasi baca rumor di medsos • Cerita ke orang terpercaya",
              "Kirim emoji 🤍 untuk teman yang sedang menunggu", "-"),
         ]),
    dict(start="2027-03-08", sem=SEM2, tema="Lebaran & Rumah Kedua",
         momen="Libur Idul Fitri (8–19 Mar); Nyepi (9 Mar); Idul Fitri (10 Mar); HUT SMANRICI (12 Mar)",
         stories="Ucapan Nyepi & Idul Fitri • Polling 'Mudik ke mana?' • Kenangan foto lama sekolah",
         posts=[
             ("Reels", "S", "Survive Pertanyaan Lebaran: 'Ranking Berapa? Mau Kuliah di Mana?'",
              "Kenapa pertanyaan itu muncul (bentuk perhatian) • Jawaban santai & sopan • Cara mengalihkan topik • Tetap menghargai yang bertanya • Jaga perasaan sepupu juga",
              "Pertanyaan lebaran paling 'horor' menurutmu?", "-"),
             ("Single Image", "S", "Selamat Idul Fitri 1448 H — Mohon Maaf Lahir & Batin",
              "Ucapan dari Tim BK • Pesan: maaf-memaafkan membuat hati lebih ringan",
              "-", "Seluruh warga sekolah"),
             ("Reels", "S", "HUT SMANRICI: Apa yang Bikin Kamu Bangga?",
              "Vox pop siswa, guru, alumni (direkam sebelum libur) • Kilas balik prestasi & momen sekolah",
              "Tulis ucapan untuk SMANRICI", "OSIS & Alumni"),
         ]),
    dict(start="2027-03-15", sem=SEM2, tema="THR & Dompet Remaja",
         momen="Libur Idul Fitri (s.d. 19 Mar); perkiraan pengumuman SNBP",
         stories="Polling: 'THR-mu buat apa?' • Kuis literasi keuangan",
         posts=[
             ("Infografis", "K", "Kelola Uang THR: Rumus 50–30–20 Versi Pelajar",
              "50% kebutuhan/tabungan pendidikan • 30% keinginan • 20% tabungan/sedekah • Bedakan butuh vs ingin • Mulai menabung untuk biaya kuliah",
              "Kamu tim nabung atau tim jajan?", "-"),
             ("Carousel", "S", "Paylater & Pinjol untuk Remaja: Kenali Risikonya",
              "Cara kerja paylater/pinjol • Bunga & denda yang menjerat • Pinjol ilegal & penyebaran data • Tekanan gaya hidup/FOMO • Cek legalitas di OJK",
              "Share ke teman & keluarga", "-"),
             ("Reels", "B", "H-3 Masuk Sekolah: Reset Jam Tidur Pasca Libur",
              "Majukan jam tidur 15 menit tiap malam • Bangun di jam yang sama • Cahaya pagi • Siapkan perlengkapan sekolah",
              "Siapa yang jam tidurnya masih kacau? 🙋", "-"),
         ]),
    dict(start="2027-03-22", sem=SEM2, tema="Bangkit Setelah Hasil",
         momen="Masuk kembali setelah libur Idul Fitri (22 Mar); pasca-pengumuman SNBP (perkiraan)",
         stories="Q&A 'Langkah setelah pengumuman' • Kirim semangat untuk XII",
         posts=[
             ("Carousel", "K", "Lolos atau Belum Lolos SNBP: Ini Langkah Selanjutnya",
              "Jika lolos: daftar ulang, KIP Kuliah, persiapan kuliah • Jika belum: fokus UTBK-SNBT, cek jalur mandiri • Konsultasi BK untuk strategi pilihan",
              "Datang ke BK untuk konsultasi pilihan", "Tim Info Karier BK"),
             ("Carousel", "P", "Kecewa Itu Wajar: 5 Cara Sehat Memproses Kegagalan",
              "Izinkan diri merasa sedih • Jangan menilai diri dari satu hasil • Cerita ke orang terpercaya • Ambil pelajaran • Susun langkah baru • Hindari flexing yang menyakiti teman",
              "Kamu tidak sendiri 🤍", "-"),
             ("Reels", "K", "Kata Alumni #2: Gagal SNBP, Lolos SNBT",
              "Cerita alumni bangkit dari penolakan • Strategi belajar UTBK • Pesan untuk adik kelas",
              "Tulis pertanyaanmu untuk alumni", "Alumni SMANRICI"),
         ]),
    dict(start="2027-03-29", sem=SEM2, tema="Siap ASTS dengan Jujur",
         momen="Menjelang ASTS (5–9 Apr); Hari Peduli Autisme Sedunia (2 Apr)",
         stories="Polling: 'Pernah pakai AI untuk tugas?' • Countdown ASTS",
         posts=[
             ("Infografis", "B", "H-7 ASTS: Rencana Belajar 7 Hari",
              "Petakan materi per mapel • Prioritaskan yang lemah • Teknik Pomodoro 25/5 • Latihan soal di H-2 • H-1: review ringan & tidur cepat",
              "Save & tempel di meja belajar", "-"),
             ("Carousel", "B", "Pakai AI untuk Belajar, Bukan untuk Curang",
              "Manfaat AI (ChatGPT, Gemini) untuk memahami konsep • Batas etis: tidak copy-paste tugas • Cara bertanya ke AI agar paham • Cek ulang jawaban AI • Integritas akademik",
              "Kamu pakai AI untuk apa? Jujur di komentar", "Guru TIK / Informatika"),
             ("Infografis", "S", "Peduli Autisme: Kenali, Pahami, Rangkul",
              "Autisme adalah spektrum • Mitos vs fakta • Cara berinteraksi yang menghargai • Sekolah inklusif dimulai dari kita",
              "Share untuk menyebarkan pemahaman", "-"),
         ]),
    dict(start="2027-04-05", sem=SEM2, tema="Ujian Tenang, Badan Sehat",
         momen="ASTS (5–9 Apr); Hari Kesehatan Sedunia (7 Apr)",
         stories="Mood check-in harian (stiker slider) • Semangat ASTS",
         posts=[
             ("Single Image", "P", "Pesan BK Selama ASTS: Tidur, Sarapan, Jujur",
              "Tiga pengingat sederhana • Visual ikon • 'Kami bangga pada usahamu, bukan hanya nilaimu'",
              "Tag teman satu ruang ujian", "-"),
             ("Carousel", "P", "Hari Kesehatan Sedunia: Cek Kesehatan Mentalmu",
              "Mood check-in skala 1–10 • Tanda perlu istirahat • 4 pilar: tidur, makan, gerak, terhubung • Kapan mencari bantuan • Into The Light (119 ext 8) & BK",
              "Angka mood-mu hari ini berapa?", "PMR / UKS"),
             ("Reels", "B", "ASTS Selesai: Apa yang Kamu Pelajari dari Cara Belajarmu?",
              "Refleksi cepat: apa yang berhasil, apa yang tidak • Ubah strategi untuk ASAT • Rayakan usaha",
              "Satu pelajaran dari ASTS kali ini?", "-"),
         ]),
    dict(start="2027-04-12", sem=SEM2, tema="Belajar dari Aksi Nyata",
         momen="Aksi Nyata (12–15 Apr); Pembagian LHB (16 Apr)",
         stories="Repost karya aksi nyata siswa • Polling: 'Peranmu di kelompok?'",
         posts=[
             ("Reels", "S", "Kerja Tim di Proyek: Atasi Teman 'Numpang Nama'",
              "Buat kesepakatan & pembagian tugas tertulis • Pantau progres bersama • Tegur dengan asertif • Libatkan guru bila perlu • Hargai kontribusi kecil",
              "Kamu tipe ketua, ide, eksekutor, atau dokumentasi?", "-"),
             ("Photo Dump", "S", "Behind The Scene Aksi Nyata SMANRICI",
              "Montase proses proyek siswa • Momen kolaborasi & kreativitas • Narasi: belajar dari aksi nyata",
              "Kelas mana yang paling kreatif?", "Wali Kelas & Koordinator Aksi Nyata"),
             ("Carousel", "B", "Membaca LHB: Tentukan 2 Target Perbaikan",
              "Apa isi LHB • Kenali mapel yang naik/turun • Pilih 2 target realistis • Rencana aksi mingguan • Diskusikan dengan wali kelas/BK",
              "Tulis target perbaikanmu", "Wali Kelas"),
         ]),
    dict(start="2027-04-19", sem=SEM2, tema="Perempuan Berdaya, Semua Setara",
         momen="Hari Kartini (21 Apr); Hari Bumi (22 Apr); perkiraan UTBK-SNBT",
         stories="Kuis tokoh perempuan Indonesia • Semangat UTBK untuk XII",
         posts=[
             ("Carousel", "K", "UTBK Day: Checklist & Strategi Waktu",
              "Dokumen & perlengkapan • Cek lokasi H-1 • Strategi per subtes • Atur waktu, lewati soal sulit • Jaga stamina & mental",
              "Save & kirim ke teman yang ikut UTBK", "-"),
             ("Carousel", "K", "Kartini Masa Kini: Karier Tanpa Batas Gender",
              "Perempuan di bidang STEM, teknik, kepemimpinan • Laki-laki di bidang keperawatan, PAUD, tata boga • Pilih karier sesuai minat, bukan stereotip • Tokoh inspiratif",
              "Tag teman yang menurutmu 'Kartini masa kini'", "-"),
             ("Reels", "S", "Catcalling & Pelecehan Verbal Bukan Candaan",
              "Skit singkat (tanpa adegan eksplisit) • Dampak pada korban • Cara merespons & membantu • Lapor ke TPPK/BK",
              "Share agar sekolah makin aman", "TPPK Sekolah"),
         ]),
    dict(start="2027-04-26", sem=SEM2, tema="Setelah SMA, Mau ke Mana?",
         momen="Libur Wafat Isa Al Masih (26 Apr); menjelang penetapan kelulusan",
         stories="Polling: 'Kuliah / kerja / wirausaha / gap year?' • Q&A beasiswa",
         posts=[
             ("Carousel", "K", "4 Jalan Setelah SMA: Kuliah, Kerja, Wirausaha, atau Gap Year?",
              "Kelebihan & tantangan tiap pilihan • Pertanyaan untuk menimbang diri • Gap year yang terencana • Semua jalan valid jika disiapkan",
              "Kamu pilih jalan yang mana?", "-"),
             ("Carousel", "K", "Sekolah Kedinasan & Beasiswa: Cek Jadwal & Syaratnya",
              "Contoh sekolah kedinasan & syarat umum • KIP Kuliah • Beasiswa pemerintah daerah & kampus • Dokumen yang perlu disiapkan • Waspada calo",
              "Save & cek situs resminya", "Tim Info Karier BK"),
             ("Reels", "K", "Kata Alumni #3: Alumni yang Bekerja & Berwirausaha",
              "Cerita alumni di dunia kerja/usaha • Skill yang dibutuhkan • Tips memulai dari SMA",
              "Tulis pertanyaan untuk alumni", "Alumni SMANRICI"),
         ]),
    dict(start="2027-05-03", sem=SEM2, tema="Lulus dengan Bermakna",
         momen="Hardiknas (2 Mei); Penetapan Kelulusan (3 Mei); Kenaikan Isa Al Masih (6 Mei)",
         stories="Ucapan kelulusan • Ide selebrasi bermakna • Polling seragam untuk didonasikan",
         posts=[
             ("Single Image", "K", "Selamat Lulus, Angkatan 2027!",
              "Ucapan kelulusan dari Tim BK • Sentuhan Hardiknas: 'Belajar tidak berhenti di sini'",
              "Tulis rencanamu setelah lulus", "Seluruh guru"),
             ("Carousel", "S", "Rayakan Kelulusan Tanpa Coret-coret & Konvoi",
              "Risiko konvoi & coret seragam • 6 ide selebrasi bermakna: donasi seragam, surat untuk guru, foto angkatan, syukuran, bakti sosial, kapsul waktu",
              "Ide selebrasi angkatanmu apa?", "OSIS & Kesiswaan"),
             ("Carousel", "P", "Lulus Tapi Masih Bingung? Itu Normal",
              "Kecemasan pasca-lulus itu umum • Jangan bandingkan timeline • Langkah kecil: eksplorasi, kursus, kerja paruh waktu • BK tetap terbuka untuk alumni",
              "Kamu tidak tertinggal 🤍", "-"),
         ]),
    dict(start="2027-05-10", sem=SEM2, tema="Siap Dunia Kerja & Kampus",
         momen="Masa transisi pasca-kelulusan kelas XII",
         stories="Kuis 'Lowongan asli atau palsu?' • Q&A wawancara kerja",
         posts=[
             ("Carousel", "K", "CV Pertama untuk Lulusan SMA: Template & Contoh",
              "Struktur CV sederhana • Isi pengalaman organisasi/ekskul/lomba • Tulis skill dengan jujur • Kesalahan umum • Contoh CV 1 halaman",
              "Download template di link bio", "-"),
             ("Carousel", "K", "Waspada Lowongan Kerja Palsu & Penipuan Kerja ke Luar Negeri",
              "Ciri lowongan palsu (gaji tak masuk akal, bayar dulu) • Modus perdagangan orang (TPPO) • Cek perusahaan • Jangan serahkan dokumen asli • Lapor bila curiga",
              "Share ke keluarga & teman", "-"),
             ("Reels", "K", "Simulasi Wawancara: 5 Pertanyaan yang Sering Muncul",
              "'Ceritakan tentang dirimu' • Kelebihan & kekurangan • Kenapa memilih ini • Contoh jawaban singkat",
              "Pertanyaan wawancara yang bikin kamu deg-degan?", "Alumni / praktisi HRD"),
         ]),
    dict(start="2027-05-17", sem=SEM2, tema="Bangkit & Berbagi",
         momen="Idul Adha (17 Mei); Waisak (16 Mei); Hari Kebangkitan Nasional (20 Mei)",
         stories="Ucapan Waisak & Idul Adha • Polling: 'Hal yang sering kamu tunda?'",
         posts=[
             ("Single Image", "S", "Selamat Idul Adha 1448 H: Belajar Ikhlas & Berbagi",
              "Ucapan Idul Adha • Refleksi: empati dan berbagi dengan sesama",
              "-", "Rohis"),
             ("Carousel", "B", "Kebangkitan Dimulai dari Diri: Lawan Prokrastinasi dengan Aturan 2 Menit",
              "Kenapa kita menunda (bukan malas, tapi menghindari rasa tidak nyaman) • Aturan 2 menit • Pecah tugas jadi kecil • Hadiah kecil setelah selesai",
              "Tugas apa yang mau kamu mulai hari ini?", "-"),
             ("Carousel", "K", "Kelas X: Kenali Mapel Pilihan Fase F & Hubungannya dengan Kuliah",
              "Apa itu mapel pilihan di kelas XI–XII • Contoh paket mapel & prodi terkait • Pentingnya konsisten dengan rencana karier • Jadwal konsultasi BK",
              "Komen prodi impianmu, kami bantu petakan mapelnya", "Wakasek Kurikulum"),
         ]),
    dict(start="2027-05-24", sem=SEM2, tema="Pilih Mapel Pilihan dengan Bijak",
         momen="Persiapan pemilihan mapel pilihan TA 2027/2028; menjelang ASAT",
         stories="Kuis 'Prodi ini butuh mapel apa?' • Jadwal konseling mapel pilihan",
         posts=[
             ("Carousel", "K", "4 Langkah Memilih Mapel Pilihan",
              "Kenali minat & bakat (hasil tes BK) • Cek mapel pendukung prodi tujuan • Lihat nilai rapor • Diskusi dengan orang tua & BK",
              "Isi form konsultasi di link bio", "Wakasek Kurikulum & Wali Kelas"),
             ("Reels", "K", "'Salah Pilih Mapel = Masa Depan Suram?' Mitos!",
              "Format mitos-fakta cepat • Masih banyak jalan ke prodi impian • Yang penting: pilihan sadar & konsultasi",
              "Masih galau? DM kami", "-"),
             ("Infografis", "B", "Persiapan ASAT dengan Metode Lampu Lalu Lintas",
              "Merah: materi belum paham (prioritas) • Kuning: setengah paham • Hijau: sudah paham (review ringan) • Contoh tabel per mapel",
              "Save & warnai materimu", "-"),
         ]),
    dict(start="2027-05-31", sem=SEM2, tema="Sehat Tanpa Asap & Narkoba",
         momen="Hari Tanpa Tembakau Sedunia (31 Mei); Hari Lahir Pancasila (1 Jun)",
         stories="Kuis mitos vape • Polling: 'Pernah ditawari rokok/vape?' (anonim)",
         posts=[
             ("Carousel", "P", "Vape 'Lebih Aman'? Mitos vs Fakta",
              "Kandungan nikotin & zat kimia • Dampak pada paru & otak remaja • Kecanduan nikotin • Liquid vape yang dicampur narkoba • Cara berhenti & cari bantuan",
              "Share ke teman yang masih nge-vape", "Puskesmas Cigalontang / BNNK Tasikmalaya"),
             ("Carousel", "S", "Pancasila di Tongkrongan: Menolak Ajakan Negatif dengan Asertif",
              "Peer pressure itu nyata • Teknik bilang 'tidak' (broken record, alasan singkat, tawarkan alternatif) • Pilih circle yang mendukung • Nilai Pancasila dalam pergaulan",
              "Kalimat penolakan andalanmu apa?", "-"),
             ("Single Image", "B", "H-3 ASAT: Tidak Harus Sempurna, Cukup Siap",
              "Quote penyemangat • 3 pengingat: tidur, review materi merah, jujur",
              "Tag teman belajarmu", "-"),
         ]),
    dict(start="2027-06-07", sem=SEM2, tema="Selesaikan dengan Baik",
         momen="ASAT (7–11 Jun); Tahun Baru Islam 1449 H (6 Jun)",
         stories="Semangat ASAT • Mood check-in • Ucapan Tahun Baru Islam",
         posts=[
             ("Single Image", "P", "Tahun Baru Islam & Semangat ASAT",
              "Ucapan Tahun Baru Islam 1449 H • Hijrah kecil: dari menunda jadi memulai • Semangat ASAT",
              "-", "Rohis"),
             ("Reels", "B", "Tips 60 Detik: Kerjakan Soal Mudah Dulu",
              "Scan semua soal • Kerjakan yang yakin • Tandai yang ragu • Kembali di akhir • Cek ulang identitas & jawaban",
              "Save sebelum ujian besok", "-"),
             ("Carousel", "P", "Habis Ujian, Otak Lelah? Kenali Burnout Akademik",
              "Tanda burnout (lelah terus, sinis, hilang motivasi) • Beda capek biasa & burnout • Cara pulih: istirahat, hobi, terhubung • Kapan perlu ke BK",
              "Kamu sedang di level capek berapa? (1–10)", "-"),
         ]),
    dict(start="2027-06-14", sem=SEM2, tema="Refleksi Satu Tahun",
         momen="Pasca-ASAT; classmeeting & pengolahan nilai",
         stories="Template 'Tahun ini aku belajar…' • Pesan untuk diri sendiri tahun depan",
         posts=[
             ("Carousel", "B", "Rapor Refleksi Diri: Apa yang Kamu Banggakan Tahun Ini?",
              "Template refleksi: pencapaian, tantangan, pelajaran, orang yang membantu, target tahun depan",
              "Isi di story & tag kami", "-"),
             ("Reels", "S", "Menutup Tahun Ajaran dengan Hubungan Baik",
              "Minta maaf & memaafkan • Ucapkan terima kasih ke teman & guru • Selesaikan konflik yang tertunda • Jaga pertemanan saat liburan",
              "Tulis terima kasih untuk seseorang di komentar", "-"),
             ("Photo Dump", "S", "Recap Setahun BK SMANRICI",
              "Photo dump kegiatan BK (klasikal, info karier, kolaborasi) — tanpa wajah siswa tanpa izin • Terima kasih atas kepercayaan siswa",
              "Konten BK favoritmu tahun ini apa?", "OSIS & Tim Dokumentasi"),
         ]),
    dict(start="2027-06-21", sem=SEM2, tema="Naik Kelas, Naik Level",
         momen="Penetapan & Pembagian Rapor (25 Jun); Hari Anti Narkotika Internasional (26 Jun)",
         stories="Ucapan naik kelas • Info layanan BK saat libur • Kampanye HANI",
         posts=[
             ("Carousel", "S", "Untuk Orang Tua: 5 Cara Merespons Rapor Anak",
              "Mulai dari apresiasi usaha • Hindari membandingkan dengan saudara/teman • Tanyakan perasaan anak • Susun target bersama • Libatkan wali kelas/BK bila perlu",
              "Share ke grup orang tua", "Komite Sekolah / Paguyuban Orang Tua"),
             ("Carousel", "K", "Naik ke Kelas XII? Mulai Siapkan Portofolio & Target PTN",
              "Kumpulkan sertifikat & prestasi • Jaga nilai rapor semester 5 • Mulai eksplorasi prodi & kampus • Latihan soal ringan saat liburan",
              "Kampus impianmu apa? Komen!", "-"),
             ("Single Image", "P", "Kamu Lebih dari Sekadar Nilai. Selamat Liburan!",
              "Ucapan pembagian rapor & naik kelas • Pengingat liburan aman & sehat • Info kontak BK selama libur",
              "Simpan & sampai jumpa tahun ajaran baru", "-"),
         ]),
]


def tanggal_indo(d):
    return f"{d.day} {BULAN[d.month]} {d.year}"


def build_rows():
    rows = []
    for i, w in enumerate(WEEKS, 1):
        mulai = dt.date.fromisoformat(w["start"])
        assert mulai.weekday() == 0, f"{w['start']} bukan hari Senin"
        assert len(w["posts"]) == 3
        for hari, p in zip(HARI, w["posts"]):
            fmt, bid, judul, isi, cta, kolab = p
            tgl = mulai + dt.timedelta(days=OFFSET_HARI[hari])
            rows.append(dict(
                minggu=i, sem=w["sem"], tanggal=tgl, hari=hari,
                rubrik=RUBRIK[hari][0], tema=w["tema"], momen=w["momen"],
                bidang=BIDANG[bid], format=fmt, judul=judul, isi=isi,
                cta=cta, kolab=kolab,
            ))
    return rows


# --- Excel ---------------------------------------------------------------
FONT = "Calibri"
thin = Side(style="thin", color="9E9E9E")
BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)
F_TITLE = Font(name=FONT, size=14, bold=True, color="1B4F72")
F_HEAD = Font(name=FONT, size=10, bold=True, color="FFFFFF")
F_NORM = Font(name=FONT, size=10)
F_BOLD = Font(name=FONT, size=10, bold=True)
FILL_HEAD = PatternFill("solid", fgColor="1B4F72")
FILL_SEM1 = PatternFill("solid", fgColor="FDF2E9")
FILL_BIDANG = {
    "Pribadi": PatternFill("solid", fgColor="E8DAEF"),
    "Sosial": PatternFill("solid", fgColor="D6EAF8"),
    "Belajar": PatternFill("solid", fgColor="D5F5E3"),
    "Karier": PatternFill("solid", fgColor="FCF3CF"),
}
WRAP = Alignment(wrap_text=True, vertical="top")
CENTER = Alignment(wrap_text=True, vertical="top", horizontal="center")


def header_row(ws, row, headers, widths):
    for c, (h, w) in enumerate(zip(headers, widths), 1):
        cell = ws.cell(row=row, column=c, value=h)
        cell.font, cell.fill, cell.border = F_HEAD, FILL_HEAD, BORDER
        cell.alignment = Alignment(wrap_text=True, vertical="center", horizontal="center")
        ws.column_dimensions[get_column_letter(c)].width = w


def sheet_kalender(wb, rows):
    ws = wb.active
    ws.title = "Kalender Konten"
    ws["A1"] = f"KALENDER KONTEN INSTAGRAM BK — {NAMA_SEKOLAH} — TA {TAHUN_PELAJARAN}"
    ws["A1"].font = F_TITLE
    ws["A2"] = ("Jadwal unggah: Senin (#SeninStarter), Rabu (#RabuRuangAman), Jumat (#JumatNgobrolBK). "
                "Baris berwarna krem = Sisa Semester 1 (bonus).")
    ws["A2"].font = Font(name=FONT, size=10, italic=True)
    headers = ["No", "Minggu", "Semester", "Tanggal", "Hari", "Rubrik", "Tema Mingguan",
               "Momen Kalender", "Bidang", "Format", "Judul / Hook", "Isi Konten (Poin Slide/Adegan)",
               "CTA / Interaksi", "Kolaborasi", "Status", "Link Postingan"]
    widths = [5, 8, 14, 13, 8, 16, 22, 28, 10, 12, 34, 60, 28, 22, 12, 18]
    header_row(ws, 4, headers, widths)
    for n, r in enumerate(rows, 1):
        vals = [n, r["minggu"], r["sem"], r["tanggal"], r["hari"], r["rubrik"], r["tema"],
                r["momen"], r["bidang"], r["format"], r["judul"], r["isi"], r["cta"],
                r["kolab"], "Ide", ""]
        rr = 4 + n
        for c, v in enumerate(vals, 1):
            cell = ws.cell(row=rr, column=c, value=v)
            cell.font, cell.border = F_NORM, BORDER
            cell.alignment = CENTER if c in (1, 2, 4, 5, 9, 10, 15) else WRAP
            if r["sem"] == SEM1:
                cell.fill = FILL_SEM1
        ws.cell(row=rr, column=4).number_format = "DD/MM/YYYY"
        ws.cell(row=rr, column=9).fill = FILL_BIDANG[r["bidang"]]
        ws.cell(row=rr, column=11).font = F_BOLD
    last = 4 + len(rows)
    dv = DataValidation(type="list", formula1='"Ide,Naskah,Desain,Review,Terjadwal,Terunggah"',
                        allow_blank=True)
    ws.add_data_validation(dv)
    dv.add(f"O5:O{last}")
    ws.freeze_panes = "E5"
    ws.auto_filter.ref = f"A4:P{last}"
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    return last


def sheet_mingguan(wb):
    ws = wb.create_sheet("Tema Mingguan")
    ws["A1"] = "TEMA MINGGUAN & STORIES PENDUKUNG"
    ws["A1"].font = F_TITLE
    headers = ["Minggu", "Semester", "Periode", "Tema Mingguan", "Momen Kalender",
               "Senin", "Rabu", "Jumat", "Ide Stories Pendukung"]
    widths = [8, 14, 22, 26, 34, 30, 30, 30, 44]
    header_row(ws, 3, headers, widths)
    for i, w in enumerate(WEEKS, 1):
        mulai = dt.date.fromisoformat(w["start"])
        akhir = mulai + dt.timedelta(days=4)
        judul = [f"[{p[0]}] {p[2]}" for p in w["posts"]]
        vals = [i, w["sem"], f"{tanggal_indo(mulai)} – {tanggal_indo(akhir)}", w["tema"],
                w["momen"], *judul, w["stories"]]
        for c, v in enumerate(vals, 1):
            cell = ws.cell(row=3 + i, column=c, value=v)
            cell.font, cell.border = F_NORM, BORDER
            cell.alignment = CENTER if c == 1 else WRAP
            if w["sem"] == SEM1:
                cell.fill = FILL_SEM1
        ws.cell(row=3 + i, column=4).font = F_BOLD
    ws.freeze_panes = "D4"


def sheet_panduan(wb):
    ws = wb.create_sheet("Panduan")
    ws.column_dimensions["A"].width = 26
    ws.column_dimensions["B"].width = 100
    baris = [
        ("PANDUAN KALENDER KONTEN", None),
        ("", ""),
        ("RUBRIK HARIAN", None),
    ]
    for hari in HARI:
        baris.append((f"{hari} — {RUBRIK[hari][0]}", RUBRIK[hari][1]))
    baris += [
        ("Stories (harian)", "Polling, kuis, Q&A, countdown, repost — ide per minggu ada di sheet 'Tema Mingguan'."),
        ("", ""),
        ("BIDANG LAYANAN", None),
        ("Pribadi", "Kesehatan mental, emosi, kepercayaan diri, spiritual"),
        ("Sosial", "Pertemanan, keluarga, anti-perundungan, toleransi, keamanan digital"),
        ("Belajar", "Strategi belajar, manajemen waktu, ujian, integritas akademik"),
        ("Karier", "Minat-bakat, prodi & kampus, SNPMB, mapel pilihan, dunia kerja"),
        ("", ""),
        ("FORMAT", None),
        ("Carousel", "Edukasi bertahap: Slide 1 hook → isi (1 poin/slide, maks 30 kata) → slide CTA + info layanan BK. Ukuran 1080×1350."),
        ("Reels", "15–60 detik, hook di 3 detik pertama, teks di layar + subtitle, audio tren yang aman. Ukuran 1080×1920."),
        ("Single Image", "Quote, ucapan hari besar, pengingat singkat. Teks besar & kontras tinggi."),
        ("Infografis", "Satu gambar padat informasi (checklist, jadwal, alur). Layak di-save; cantumkan sumber data."),
        ("Kuis Interaktif", "Carousel kuis + stiker kuis di Stories; jawaban diumumkan di Stories berikutnya."),
        ("Photo Dump", "Carousel foto dokumentasi kegiatan (maks 10 foto), wajah siswa hanya dengan izin."),
        ("", ""),
        ("HASHTAG TETAP", "#BKSMANCigalontang #BimbinganKonseling #GuruBK #RemajaBerdaya #SMANRICI"),
        ("Hashtag Pribadi", "#KesehatanMentalRemaja #KenaliDirimu #SelfLove #MentalHealthID"),
        ("Hashtag Sosial", "#AntiBullying #PersahabatanSehat #HubunganSehat #StopKekerasan"),
        ("Hashtag Belajar", "#TipsStudy #MotivasiBelajar #StudyWithMe #BelajarItuAsik"),
        ("Hashtag Karier", "#PilihJurusan #RencanaKarier #MimpiBesar #GenZBekerja"),
        ("", ""),
        ("CATATAN PENTING", None),
        ("Hari libur", "Konten tetap diunggah memakai fitur jadwal (Meta Business Suite / Instagram scheduler)."),
        ("Tanggal perkiraan", "Tanggal SNPMB/UTBK, TKA, dan hari besar berlabel 'perkiraan' wajib dicek ulang ke sumber resmi sebelum diunggah."),
        ("Privasi siswa", "Tidak menampilkan wajah/identitas siswa tanpa izin tertulis; cerita kasus selalu fiktif atau dianonimkan."),
        ("Topik sensitif", "Self-harm, kekerasan seksual, judol, narkoba: ikuti safe messaging, cantumkan layanan BK, SAPA 129, Into The Light (119 ext 8)."),
        ("Kolaborasi", "Hubungi mitra (OSIS, Rohis, PMR/UKS, guru mapel, alumni, Puskesmas, BNNK) minimal 1 minggu sebelum tanggal unggah."),
        ("Alur status", "Ide → Naskah → Desain → Review (Guru BK) → Terjadwal → Terunggah."),
        ("Sumber", "Kalender Pendidikan SMAN 1 Cigalontang TA 2026/2027 (ditetapkan 15 Juli 2026)."),
    ]
    for r, (a, b) in enumerate(baris, 1):
        ca = ws.cell(row=r, column=1, value=a)
        if b is None:
            ca.font = F_TITLE if r == 1 else Font(name=FONT, size=11, bold=True, color="1B4F72")
            continue
        cb = ws.cell(row=r, column=2, value=b)
        ca.font, cb.font = F_BOLD, F_NORM
        ca.alignment = cb.alignment = WRAP


def sheet_rekap(wb, last_row):
    ws = wb.create_sheet("Rekap")
    ws["A1"] = "REKAP SEBARAN KONTEN"
    ws["A1"].font = F_TITLE
    src = "'Kalender Konten'"
    sems = [SEM1, SEM2]

    def tabel(start_row, judul, kolom_src, items):
        header_row(ws, start_row, [judul, SEM1, SEM2, "Total"], [26, 22, 14, 10])
        for i, it in enumerate(items, 1):
            r = start_row + i
            ws.cell(row=r, column=1, value=it).font = F_BOLD
            for j, s in enumerate(sems, 2):
                ws.cell(row=r, column=j, value=(
                    f'=COUNTIFS({src}!${kolom_src}$5:${kolom_src}${last_row},$A{r},'
                    f'{src}!$C$5:$C${last_row},"{s}")'))
            ws.cell(row=r, column=4, value=f"=SUM(B{r}:C{r})").font = F_BOLD
            for c in range(1, 5):
                ws.cell(row=r, column=c).border = BORDER
        return start_row + len(items) + 2

    nxt = tabel(3, "Bidang", "I", list(BIDANG.values()))
    formats = sorted({p[0] for w in WEEKS for p in w["posts"]})
    nxt = tabel(nxt, "Format", "J", formats)
    tabel(nxt, "Status", "O", ["Ide", "Naskah", "Desain", "Review", "Terjadwal", "Terunggah"])


def build_xlsx(rows):
    wb = Workbook()
    last = sheet_kalender(wb, rows)
    sheet_mingguan(wb)
    sheet_rekap(wb, last)
    sheet_panduan(wb)
    path = OUT_DIR / "Kalender_Konten_IG_BK_2026-2027.xlsx"
    wb.save(path)
    return path


# --- Markdown ------------------------------------------------------------
def build_md(rows):
    out = [f"# Kalender Konten Instagram BK — {NAMA_SEKOLAH} — TA {TAHUN_PELAJARAN}", "",
           "> Dibuat otomatis oleh `build_kalender_konten.py`. Edit data di skrip, lalu jalankan ulang.", "",
           "## Rubrik Harian", "", "| Hari | Rubrik | Fokus |", "|---|---|---|"]
    for h in HARI:
        out.append(f"| {h} | {RUBRIK[h][0]} | {RUBRIK[h][1]} |")
    out += ["", "## Sebaran Konten", "", "| Kategori | Sisa Sem 1 (bonus) | Semester 2 | Total |", "|---|---|---|---|"]
    for key in ("bidang", "format"):
        cnt = {s: Counter(r[key] for r in rows if r["sem"] == s) for s in (SEM1, SEM2)}
        for item in sorted(set(cnt[SEM1]) | set(cnt[SEM2])):
            a, b = cnt[SEM1][item], cnt[SEM2][item]
            out.append(f"| {item} | {a} | {b} | {a + b} |")
    sem_now = None
    for i, w in enumerate(WEEKS, 1):
        if w["sem"] != sem_now:
            sem_now = w["sem"]
            out += ["", f"## {sem_now}"]
        mulai = dt.date.fromisoformat(w["start"])
        akhir = mulai + dt.timedelta(days=4)
        out += ["", f"### Minggu {i} · {tanggal_indo(mulai)} – {tanggal_indo(akhir)} · Tema: {w['tema']}",
                f"*Momen:* {w['momen']}  ", f"*Stories pendukung:* {w['stories']}", ""]
        for r in (x for x in rows if x["minggu"] == i):
            out.append(f"- **{r['hari']}, {tanggal_indo(r['tanggal'])}** · {r['rubrik']} · "
                       f"{r['format']} · {r['bidang']} — **{r['judul']}**  ")
            out.append(f"  Isi: {r['isi']}  ")
            extra = f"  CTA: {r['cta']}"
            if r["kolab"] != "-":
                extra += f" · Kolaborasi: {r['kolab']}"
            out.append(extra)
    path = OUT_DIR / "kalender-konten-2026-2027.md"
    path.write_text("\n".join(out) + "\n", encoding="utf-8")
    return path


if __name__ == "__main__":
    data = build_rows()
    print(build_xlsx(data))
    print(build_md(data))
    print(f"{len(WEEKS)} minggu, {len(data)} konten")
    for key in ("bidang", "format"):
        print(key, dict(Counter(r[key] for r in data)))
