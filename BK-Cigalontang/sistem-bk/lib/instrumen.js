/**
 * Instrumen asesmen. Butir disusun sendiri untuk aplikasi ini (bukan salinan
 * instrumen baku berhak cipta) dan boleh disesuaikan oleh tim BK.
 *
 * Hasil asesmen adalah bahan percakapan bimbingan, bukan diagnosis atau
 * penentu tunggal jurusan/karier.
 */

// ---------- Angket Kebutuhan Siswa (gaya AKPD) ----------
// Siswa mencentang pernyataan yang sesuai dengan dirinya.
const AKPD = {
  kode: 'akpd',
  nama: 'Angket Kebutuhan Siswa (AKPD)',
  petunjuk: 'Centang pernyataan yang benar-benar kamu alami akhir-akhir ini. Tidak ada jawaban benar atau salah. Jawabanmu hanya dibaca guru BK.',
  butir: [
    // Pribadi
    ['Pribadi', 'Saya sering merasa cemas tanpa tahu sebabnya.'],
    ['Pribadi', 'Saya sulit mengendalikan rasa marah.'],
    ['Pribadi', 'Saya kurang percaya diri dengan kemampuan saya.'],
    ['Pribadi', 'Saya sering merasa sedih atau kehilangan semangat.'],
    ['Pribadi', 'Saya kurang puas dengan penampilan atau keadaan fisik saya.'],
    ['Pribadi', 'Saya sulit mengatur waktu antara sekolah, rumah, dan istirahat.'],
    ['Pribadi', 'Saya kurang tidur karena memikirkan banyak hal.'],
    ['Pribadi', 'Saya bingung menentukan apa yang penting bagi hidup saya.'],
    ['Pribadi', 'Saya sering menunda pekerjaan sampai menit terakhir.'],
    ['Pribadi', 'Saya merasa ada masalah di rumah yang mengganggu pikiran saya.'],
    // Sosial
    ['Sosial', 'Saya sulit memulai pertemanan dengan orang baru.'],
    ['Sosial', 'Saya merasa tidak punya teman dekat untuk bercerita.'],
    ['Sosial', 'Saya pernah diejek, dikucilkan, atau diganggu teman.'],
    ['Sosial', 'Saya sulit menyampaikan pendapat di depan orang lain.'],
    ['Sosial', 'Saya sering berselisih dengan teman.'],
    ['Sosial', 'Saya merasa kurang dekat dengan orang tua atau wali.'],
    ['Sosial', 'Saya sulit menolak ajakan teman meskipun saya tidak setuju.'],
    ['Sosial', 'Saya kurang nyaman bekerja dalam kelompok.'],
    ['Sosial', 'Saya terlalu banyak menghabiskan waktu di media sosial atau gim.'],
    ['Sosial', 'Saya merasa kurang dihargai di lingkungan saya.'],
    // Belajar
    ['Belajar', 'Saya sulit berkonsentrasi saat belajar.'],
    ['Belajar', 'Saya belum menemukan cara belajar yang cocok untuk saya.'],
    ['Belajar', 'Saya sering tertinggal tugas atau pekerjaan rumah.'],
    ['Belajar', 'Saya kesulitan memahami beberapa mata pelajaran.'],
    ['Belajar', 'Saya merasa cemas berlebihan saat menghadapi ujian.'],
    ['Belajar', 'Saya malas belajar di rumah.'],
    ['Belajar', 'Saya malu bertanya kepada guru ketika belum paham.'],
    ['Belajar', 'Saya tidak punya tempat atau waktu belajar yang tenang di rumah.'],
    ['Belajar', 'Nilai saya menurun dibanding sebelumnya.'],
    ['Belajar', 'Saya belum tahu cara membuat catatan dan ringkasan yang baik.'],
    // Karier
    ['Karier', 'Saya belum tahu ingin melanjutkan ke mana setelah lulus.'],
    ['Karier', 'Saya belum mengenal bakat dan minat saya sendiri.'],
    ['Karier', 'Saya kurang informasi tentang jurusan kuliah.'],
    ['Karier', 'Saya kurang informasi tentang dunia kerja.'],
    ['Karier', 'Pilihan saya berbeda dengan keinginan orang tua.'],
    ['Karier', 'Saya khawatir soal biaya untuk melanjutkan pendidikan.'],
    ['Karier', 'Saya belum memahami jalur masuk perguruan tinggi (SNBP/SNBT/mandiri).'],
    ['Karier', 'Saya ragu apakah pilihan mata pelajaran saya sudah tepat.'],
    ['Karier', 'Saya belum punya pengalaman organisasi atau kegiatan pengembangan diri.'],
    ['Karier', 'Saya ingin tahu tentang beasiswa yang tersedia.'],
  ].map(([bidang, teks], i) => ({ no: i + 1, bidang, teks })),
};

function nilaiAkpd(jawaban) {
  // jawaban: array nomor butir yang dicentang
  const dipilih = new Set((jawaban || []).map(Number));
  const perBidang = {};
  for (const b of AKPD.butir) {
    perBidang[b.bidang] ??= { jumlah: 0, total: 0 };
    perBidang[b.bidang].total++;
    if (dipilih.has(b.no)) perBidang[b.bidang].jumlah++;
  }
  for (const v of Object.values(perBidang)) v.persen = Math.round((v.jumlah / v.total) * 100);
  const prioritas = Object.entries(perBidang).sort((a, b) => b[1].persen - a[1].persen)[0][0];
  return { perBidang, totalDicentang: dipilih.size, bidangPrioritas: prioritas, butir: [...dipilih] };
}

// ---------- Minat Karier (RIASEC / Holland) ----------
// Skala: 1 = tidak suka, 2 = biasa saja, 3 = suka
const TIPE_RIASEC = {
  R: { nama: 'Realistic (Praktis)', ciri: 'Senang bekerja dengan alat, mesin, tanaman, atau hewan; menyukai kegiatan fisik dan hasil nyata.', contoh: 'Teknik mesin/sipil, pertanian, kehutanan, teknisi, olahraga' },
  I: { nama: 'Investigative (Peneliti)', ciri: 'Senang mengamati, menganalisis, dan memecahkan masalah dengan berpikir.', contoh: 'Kedokteran, farmasi, MIPA, ilmu komputer, riset' },
  A: { nama: 'Artistic (Kreatif)', ciri: 'Senang berekspresi melalui seni, bahasa, desain, atau pertunjukan.', contoh: 'DKV, arsitektur, sastra, musik, film, jurnalistik' },
  S: { nama: 'Social (Penolong)', ciri: 'Senang membantu, mengajar, merawat, dan bekerja bersama orang lain.', contoh: 'Pendidikan, BK/psikologi, keperawatan, kesejahteraan sosial' },
  E: { nama: 'Enterprising (Pemimpin)', ciri: 'Senang memimpin, meyakinkan orang, berwirausaha, dan mengambil keputusan.', contoh: 'Manajemen, hukum, komunikasi, kewirausahaan, ilmu politik' },
  C: { nama: 'Conventional (Teratur)', ciri: 'Senang bekerja rapi dengan data, angka, dan prosedur yang jelas.', contoh: 'Akuntansi, administrasi, perpajakan, perbankan, statistika' },
};

const RIASEC = {
  kode: 'riasec',
  nama: 'Minat Karier (RIASEC)',
  petunjuk: 'Bayangkan kamu melakukan kegiatan berikut. Pilih seberapa kamu menyukainya. Jawab sesuai dirimu, bukan sesuai harapan orang lain.',
  skala: [{ nilai: 1, label: 'Tidak suka' }, { nilai: 2, label: 'Biasa saja' }, { nilai: 3, label: 'Suka' }],
  butir: [
    ['R', 'Memperbaiki sepeda motor atau alat elektronik yang rusak'],
    ['R', 'Merakit perabot atau membuat sesuatu dari kayu'],
    ['R', 'Bercocok tanam atau merawat hewan ternak'],
    ['R', 'Mengoperasikan mesin atau peralatan teknik'],
    ['R', 'Kegiatan luar ruang seperti mendaki atau berkemah'],
    ['R', 'Membuat bangunan sederhana atau maket'],
    ['I', 'Melakukan percobaan di laboratorium'],
    ['I', 'Memecahkan soal matematika atau teka-teki logika'],
    ['I', 'Membaca artikel tentang penemuan ilmiah'],
    ['I', 'Mencari tahu penyebab suatu penyakit'],
    ['I', 'Belajar membuat program komputer'],
    ['I', 'Mengamati bintang, cuaca, atau gejala alam'],
    ['A', 'Menggambar, melukis, atau mendesain poster'],
    ['A', 'Menulis cerita, puisi, atau artikel'],
    ['A', 'Bermain musik atau bernyanyi'],
    ['A', 'Membuat video, foto, atau konten kreatif'],
    ['A', 'Berakting atau tampil di panggung'],
    ['A', 'Menata ruangan atau memadukan busana'],
    ['S', 'Mengajari teman yang belum paham pelajaran'],
    ['S', 'Mendengarkan teman yang sedang punya masalah'],
    ['S', 'Merawat orang sakit atau lansia'],
    ['S', 'Ikut kegiatan sosial atau relawan'],
    ['S', 'Menjadi pemandu atau pendamping kegiatan anak-anak'],
    ['S', 'Menengahi teman yang berselisih'],
    ['E', 'Memimpin rapat atau organisasi siswa'],
    ['E', 'Berjualan atau menjalankan usaha kecil'],
    ['E', 'Meyakinkan orang lain agar setuju dengan ide saya'],
    ['E', 'Berbicara di depan umum atau berpidato'],
    ['E', 'Merencanakan acara dan membagi tugas panitia'],
    ['E', 'Bernegosiasi untuk mendapatkan kesepakatan'],
    ['C', 'Menyusun data ke dalam tabel atau lembar kerja'],
    ['C', 'Mencatat keuangan atau kas kelas'],
    ['C', 'Merapikan arsip dan dokumen'],
    ['C', 'Mengecek kesalahan ketik atau hitungan'],
    ['C', 'Mengikuti prosedur kerja yang jelas dan teratur'],
    ['C', 'Membuat jadwal dan daftar tugas secara rinci'],
  ].map(([tipe, teks], i) => ({ no: i + 1, tipe, teks })),
};

function nilaiRiasec(jawaban) {
  // jawaban: { [no]: 1|2|3 }
  const skor = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  for (const b of RIASEC.butir) {
    const n = Number(jawaban?.[b.no]);
    if (![1, 2, 3].includes(n)) throw new Error(`Butir ${b.no} belum dijawab.`);
    skor[b.tipe] += n;
  }
  const urut = Object.entries(skor).sort((a, b) => b[1] - a[1]);
  const kodeHolland = urut.slice(0, 3).map(([t]) => t).join('');
  return { skor, kodeHolland, dominan: urut[0][0] };
}

const INSTRUMEN = { akpd: AKPD, riasec: RIASEC };

function nilai(instrumen, jawaban) {
  if (instrumen === 'akpd') return nilaiAkpd(jawaban);
  if (instrumen === 'riasec') return nilaiRiasec(jawaban);
  throw new Error('Instrumen tidak dikenal.');
}

module.exports = { INSTRUMEN, TIPE_RIASEC, nilai };
