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

// ---------- Daftar Cek Masalah (DCM versi sekolah) ----------
// Butir disusun sendiri; siswa mencentang masalah yang sedang dialami.
const DCM_BIDANG = {
  KES: 'Kesehatan & Kondisi Fisik',
  EKO: 'Ekonomi & Keuangan',
  KEL: 'Keluarga & Rumah',
  AGM: 'Agama, Nilai & Moral',
  SOS: 'Hubungan Sosial',
  PRI: 'Pribadi & Emosi',
  SEK: 'Penyesuaian terhadap Sekolah',
  KUR: 'Pelajaran & Kurikulum',
  BLJ: 'Kebiasaan Belajar',
  KAR: 'Masa Depan & Karier',
  WLG: 'Waktu Luang & Gawai',
};

const DCM = {
  kode: 'dcm',
  nama: 'Daftar Cek Masalah (DCM)',
  jenisInstrumen: 'Non-tes',
  petunjuk: 'Bacalah setiap pernyataan. Centang yang benar-benar sedang kamu alami. Jawabanmu rahasia dan hanya dibaca guru BK untuk membantumu.',
  butir: [
    ['KES', 'Saya sering merasa lelah atau mengantuk di sekolah.'], ['KES', 'Saya sering sakit kepala atau sakit perut.'],
    ['KES', 'Saya jarang sarapan sebelum berangkat sekolah.'], ['KES', 'Saya punya gangguan kesehatan yang mengganggu kegiatan.'],
    ['KES', 'Saya kurang berolahraga.'],
    ['EKO', 'Uang saku saya sering tidak cukup.'], ['EKO', 'Saya khawatir dengan biaya sekolah.'],
    ['EKO', 'Saya harus bekerja untuk membantu keluarga.'], ['EKO', 'Saya tidak punya perlengkapan belajar yang memadai.'],
    ['EKO', 'Ongkos ke sekolah memberatkan saya.'],
    ['KEL', 'Orang tua saya sering bertengkar.'], ['KEL', 'Saya jarang berbicara dengan orang tua.'],
    ['KEL', 'Saya merasa dibanding-bandingkan dengan saudara.'], ['KEL', 'Saya tinggal jauh dari orang tua.'],
    ['KEL', 'Suasana rumah membuat saya tidak nyaman.'],
    ['AGM', 'Saya sering lalai menjalankan ibadah.'], ['AGM', 'Saya bingung membedakan yang benar dan salah dalam pergaulan.'],
    ['AGM', 'Saya pernah melakukan hal yang membuat saya merasa bersalah.'], ['AGM', 'Saya mudah terpengaruh ajakan yang kurang baik.'],
    ['AGM', 'Saya ingin belajar agama lebih dalam tetapi bingung mulai dari mana.'],
    ['SOS', 'Saya merasa sulit diterima teman-teman.'], ['SOS', 'Saya pernah diejek atau dirundung.'],
    ['SOS', 'Saya sering merasa kesepian.'], ['SOS', 'Saya punya masalah dengan pacar atau teman dekat.'],
    ['SOS', 'Saya canggung berbicara dengan lawan jenis.'],
    ['PRI', 'Saya mudah tersinggung.'], ['PRI', 'Saya sering merasa minder.'], ['PRI', 'Saya sulit tidur karena banyak pikiran.'],
    ['PRI', 'Saya pernah merasa sangat sedih dalam waktu lama.'], ['PRI', 'Saya sulit mengungkapkan perasaan.'],
    ['SEK', 'Saya kurang nyaman dengan suasana sekolah.'], ['SEK', 'Saya sering terlambat datang ke sekolah.'],
    ['SEK', 'Saya takut atau segan kepada guru tertentu.'], ['SEK', 'Saya sulit mematuhi tata tertib sekolah.'],
    ['SEK', 'Saya merasa tidak dihargai di kelas.'],
    ['KUR', 'Ada mata pelajaran yang sangat sulit saya pahami.'], ['KUR', 'Beban tugas terasa terlalu banyak.'],
    ['KUR', 'Saya merasa salah memilih mata pelajaran pilihan.'], ['KUR', 'Saya sulit mengikuti cara mengajar guru tertentu.'],
    ['KUR', 'Nilai rapor saya menurun.'],
    ['BLJ', 'Saya tidak punya jadwal belajar yang teratur.'], ['BLJ', 'Saya sulit berkonsentrasi lebih dari 15 menit.'],
    ['BLJ', 'Saya baru belajar ketika akan ujian.'], ['BLJ', 'Saya tidak tahu cara meringkas materi.'],
    ['BLJ', 'Saya sering menyontek atau ingin menyontek.'],
    ['KAR', 'Saya belum tahu cita-cita saya.'], ['KAR', 'Saya bingung memilih jurusan kuliah.'],
    ['KAR', 'Saya ragu bisa melanjutkan kuliah.'], ['KAR', 'Saya belum tahu keterampilan yang dibutuhkan dunia kerja.'],
    ['KAR', 'Rencana saya berbeda dengan harapan orang tua.'],
    ['WLG', 'Saya bermain gawai lebih dari 5 jam sehari.'], ['WLG', 'Saya sulit berhenti bermain gim.'],
    ['WLG', 'Saya tidak punya kegiatan positif di waktu luang.'], ['WLG', 'Saya sering begadang.'],
    ['WLG', 'Saya merasa cemas jika tidak memegang ponsel.'],
  ].map(([bidang, teks], i) => ({ no: i + 1, bidang, teks })),
};

function kategoriDcm(persen) {
  if (persen === 0) return 'Tidak ada masalah';
  if (persen <= 20) return 'Ringan';
  if (persen <= 40) return 'Sedang';
  return 'Perlu perhatian';
}

function nilaiDcm(jawaban) {
  // jawaban: { butir: [no...], konsultasi: bool }
  const dipilih = new Set((jawaban?.butir || []).map(Number));
  const perBidang = {};
  for (const b of DCM.butir) {
    perBidang[b.bidang] ??= { jumlah: 0, total: 0 };
    perBidang[b.bidang].total++;
    if (dipilih.has(b.no)) perBidang[b.bidang].jumlah++;
  }
  for (const v of Object.values(perBidang)) {
    v.persen = Math.round((v.jumlah / v.total) * 100);
    v.kategori = kategoriDcm(v.persen);
  }
  const persenTotal = Math.round((dipilih.size / DCM.butir.length) * 100);
  const prioritas = Object.entries(perBidang).sort((a, b) => b[1].persen - a[1].persen)[0][0];
  return { perBidang, totalDicentang: dipilih.size, persenTotal, kategori: kategoriDcm(persenTotal),
    bidangPrioritas: prioritas, butir: [...dipilih], ingin_konsultasi: !!jawaban?.konsultasi };
}

// ---------- Gaya Perilaku (model 4 gaya ala DISC, butir sendiri) ----------
const TIPE_GAYA = {
  D: { nama: 'Dominan (Tegas)', ciri: 'Suka tantangan, cepat mengambil keputusan, berorientasi hasil.', saran: 'Latih kesabaran dan mendengarkan pendapat orang lain.' },
  I: { nama: 'Interaktif (Ekspresif)', ciri: 'Ramah, antusias, senang bergaul dan meyakinkan orang.', saran: 'Latih fokus menyelesaikan tugas sampai tuntas.' },
  S: { nama: 'Stabil (Suportif)', ciri: 'Sabar, setia, tenang, dan senang membantu tim.', saran: 'Latih keberanian menyampaikan pendapat dan menghadapi perubahan.' },
  C: { nama: 'Cermat (Teliti)', ciri: 'Teliti, sistematis, menyukai aturan dan kualitas.', saran: 'Latih fleksibilitas dan tidak terlalu keras pada diri sendiri.' },
};

const GAYA = {
  kode: 'gaya',
  nama: 'Gaya Perilaku (D-I-S-C)',
  jenisInstrumen: 'Asesmen tes',
  petunjuk: 'Setiap nomor berisi empat pernyataan. Pilih SATU yang paling menggambarkan dirimu. Tidak ada gaya yang lebih baik atau lebih buruk.',
  set: [
    { D: 'Saya suka memimpin kelompok', I: 'Saya mudah akrab dengan orang baru', S: 'Saya senang membantu tanpa diminta', C: 'Saya suka mengerjakan sesuatu dengan rapi' },
    { D: 'Saya cepat mengambil keputusan', I: 'Saya suka bercerita di depan teman', S: 'Saya sabar menunggu giliran', C: 'Saya memeriksa ulang pekerjaan saya' },
    { D: 'Saya berani menghadapi tantangan', I: 'Saya senang suasana ramai dan ceria', S: 'Saya menjaga suasana tetap damai', C: 'Saya mengikuti petunjuk dengan tepat' },
    { D: 'Saya ingin hasil yang cepat', I: 'Saya pandai menyemangati teman', S: 'Saya pendengar yang baik', C: 'Saya suka merencanakan sebelum bertindak' },
    { D: 'Saya terus terang menyampaikan pendapat', I: 'Saya senang mencoba hal baru bersama teman', S: 'Saya setia pada teman dan kelompok', C: 'Saya teliti terhadap detail' },
    { D: 'Saya tidak mudah menyerah ketika ditolak', I: 'Saya mudah membuat orang tertawa', S: 'Saya nyaman dengan rutinitas yang teratur', C: 'Saya suka mencari data sebelum memutuskan' },
    { D: 'Saya suka bersaing untuk menang', I: 'Saya senang tampil dan dikenal banyak orang', S: 'Saya tidak suka konflik', C: 'Saya menjaga kualitas walau butuh waktu lama' },
    { D: 'Saya mengambil alih saat tim kebingungan', I: 'Saya pandai meyakinkan orang', S: 'Saya membantu teman yang tertinggal', C: 'Saya membuat daftar langkah kerja' },
    { D: 'Saya suka menentukan target sendiri', I: 'Saya mudah bersemangat', S: 'Saya tenang menghadapi masalah', C: 'Saya berhati-hati agar tidak salah' },
    { D: 'Saya tidak sabar dengan proses yang lambat', I: 'Saya suka bekerja sambil mengobrol', S: 'Saya mau mengalah demi kebersamaan', C: 'Saya kurang nyaman jika aturan tidak jelas' },
    { D: 'Saya senang diberi tanggung jawab besar', I: 'Saya punya banyak teman di berbagai kelompok', S: 'Saya dapat diandalkan untuk tugas rutin', C: 'Saya suka menganalisis masalah secara logis' },
    { D: 'Saya berani mengambil risiko', I: 'Saya optimis dalam situasi apa pun', S: 'Saya konsisten dalam bersikap', C: 'Saya menyukai ketepatan dan keakuratan' },
  ].map((s, i) => ({ no: i + 1, pilihan: s })),
};

function nilaiGaya(jawaban) {
  // jawaban: { [no]: 'D'|'I'|'S'|'C' }
  const skor = { D: 0, I: 0, S: 0, C: 0 };
  for (const s of GAYA.set) {
    const t = jawaban?.[s.no];
    if (!skor.hasOwnProperty(t)) throw new Error(`Nomor ${s.no} belum dijawab.`);
    skor[t]++;
  }
  const urut = Object.entries(skor).sort((a, b) => b[1] - a[1]);
  return { skor, dominan: urut[0][0], kedua: urut[1][0], pola: urut[0][0] + urut[1][0] };
}

// ---------- Peminatan Ekstrakurikuler ----------
const ESKUL_BAWAAN = ['Pramuka', 'PMR', 'Paskibra', 'OSIS/MPK', 'Rohis', 'Futsal', 'Bola Voli', 'Basket', 'Bulu Tangkis', 'Pencak Silat',
  'Seni Tari', 'Musik & Paduan Suara', 'Teater', 'Jurnalistik', 'Karya Ilmiah Remaja', 'English Club', 'Pecinta Alam', 'Kewirausahaan', 'TIK & Robotik', 'Literasi'];

const ESKUL = {
  kode: 'eskul',
  nama: 'Peminatan Ekstrakurikuler',
  jenisInstrumen: 'Non-tes',
  petunjuk: 'Pilih paling banyak 3 ekstrakurikuler yang paling ingin kamu ikuti, urut dari yang paling diminati.',
  maksPilihan: 3,
};

function nilaiEskul(jawaban, daftarEskul) {
  // jawaban: { pilihan: [nama eskul, ...] }
  const pilihan = [...new Set((jawaban?.pilihan || []).map(String))];
  if (!pilihan.length) throw new Error('Pilih minimal satu ekstrakurikuler.');
  if (pilihan.length > ESKUL.maksPilihan) throw new Error(`Pilih paling banyak ${ESKUL.maksPilihan} ekstrakurikuler.`);
  const salah = pilihan.find(p => !daftarEskul.includes(p));
  if (salah) throw new Error(`Ekstrakurikuler "${salah}" tidak ada di daftar.`);
  return { pilihan, utama: pilihan[0] };
}

// ---------- Sosiometri ----------
const KONTEKS_SOSIOMETRI = {
  belajar: { label: 'Kelompok belajar', pertanyaan: 'Siapa teman yang paling kamu inginkan menjadi anggota kelompok belajarmu?', negatif: 'Siapa teman yang kurang kamu inginkan dalam kelompok belajar?' },
  bergaul: { label: 'Teman bergaul', pertanyaan: 'Siapa teman yang paling sering dan paling nyaman kamu ajak bergaul?', negatif: 'Siapa teman yang kurang nyaman kamu ajak bergaul?' },
  curhat: { label: 'Teman bercerita', pertanyaan: 'Kepada siapa kamu paling nyaman bercerita tentang masalahmu?', negatif: 'Kepada siapa kamu kurang nyaman bercerita?' },
  pemimpin: { label: 'Tim & pemimpin', pertanyaan: 'Siapa teman yang paling kamu inginkan memimpin tim kelasmu?', negatif: 'Siapa teman yang kurang kamu inginkan memimpin tim?' },
  sebangku: { label: 'Teman sebangku', pertanyaan: 'Dengan siapa kamu paling ingin duduk sebangku?', negatif: 'Dengan siapa kamu kurang ingin duduk sebangku?' },
};

const SOSIOMETRI = {
  kode: 'sosiometri',
  nama: 'Sosiometri Kelas',
  jenisInstrumen: 'Non-tes',
  petunjuk: 'Pilih teman sekelas sesuai pertanyaan. Pilihanmu RAHASIA: tidak akan diberitahukan kepada siapa pun selain guru BK.',
  maksPilihan: 3,
};

function nilaiSosiometri(jawaban, rosterNis, nisPengisi, izinkanNegatif) {
  const bersihkan = arr => [...new Set((arr || []).map(String))];
  const positif = bersihkan(jawaban?.positif);
  const negatif = izinkanNegatif ? bersihkan(jawaban?.negatif) : [];
  if (!positif.length) throw new Error('Pilih minimal satu teman.');
  for (const daftar of [positif, negatif]) {
    if (daftar.length > SOSIOMETRI.maksPilihan) throw new Error(`Pilih paling banyak ${SOSIOMETRI.maksPilihan} teman.`);
    if (daftar.includes(nisPengisi)) throw new Error('Kamu tidak dapat memilih dirimu sendiri.');
    if (daftar.some(n => !rosterNis.includes(n))) throw new Error('Ada pilihan yang bukan teman sekelasmu.');
  }
  if (positif.some(n => negatif.includes(n))) throw new Error('Satu teman tidak boleh dipilih di dua pertanyaan sekaligus.');
  return { positif, negatif, jumlahPositif: positif.length, jumlahNegatif: negatif.length };
}

/**
 * Analisis sosiometri satu kelas.
 * roster: [{nis, nama, jk}], jawaban: [{nis, hasil:{positif,negatif}}]
 */
function analisisSosiometri(roster, jawaban) {
  const n = roster.length;
  const data = Object.fromEntries(roster.map(s => [s.nis, { ...s, P: 0, N: 0, pilihPositif: [], pilihNegatif: [], mengisi: false }]));
  for (const j of jawaban) {
    const d = data[j.nis];
    if (!d) continue;
    d.mengisi = true;
    d.pilihPositif = j.hasil.positif;
    d.pilihNegatif = j.hasil.negatif || [];
    j.hasil.positif.forEach(t => { if (data[t]) data[t].P++; });
    (j.hasil.negatif || []).forEach(t => { if (data[t]) data[t].N++; });
  }
  const daftar = Object.values(data);
  const rataP = daftar.reduce((s, d) => s + d.P, 0) / (n || 1);
  const sdP = Math.sqrt(daftar.reduce((s, d) => s + (d.P - rataP) ** 2, 0) / (n || 1));
  const timbalBalik = [];
  for (const d of daftar) {
    d.indeks = n > 1 ? Math.round(((d.P - d.N) / (n - 1)) * 100) / 100 : 0;
    // Status deskriptif (bukan label untuk siswa) — dipakai guru BK untuk menentukan siapa yang layak disapa
    if (d.P >= rataP + sdP && d.P > 0) d.status = 'Bintang';
    else if (d.P === 0 && d.N > 0) d.status = 'Kurang diterima';
    else if (d.P === 0) d.status = 'Belum terpilih';
    else if (d.N > d.P) d.status = 'Perlu perhatian';
    else d.status = 'Rata-rata';
    for (const t of d.pilihPositif) {
      if (d.nis < t && data[t]?.pilihPositif.includes(d.nis)) timbalBalik.push([d.nis, t]);
    }
  }
  return {
    jumlahSiswa: n, jumlahMengisi: daftar.filter(d => d.mengisi).length,
    siswa: daftar.sort((a, b) => b.P - a.P || a.N - b.N || a.nama.localeCompare(b.nama)),
    timbalBalik, rataP: Math.round(rataP * 100) / 100,
  };
}

const INSTRUMEN = {
  akpd: { ...AKPD, jenisInstrumen: 'Non-tes' },
  dcm: DCM,
  sosiometri: SOSIOMETRI,
  gaya: GAYA,
  riasec: { ...RIASEC, jenisInstrumen: 'Asesmen tes' },
  eskul: ESKUL,
};

/** Nilai jawaban; konteks berisi data tambahan (daftar eskul, roster sosiometri). */
function nilai(instrumen, jawaban, konteks = {}) {
  if (instrumen === 'akpd') return nilaiAkpd(jawaban);
  if (instrumen === 'riasec') return nilaiRiasec(jawaban);
  if (instrumen === 'dcm') return nilaiDcm(jawaban);
  if (instrumen === 'gaya') return nilaiGaya(jawaban);
  if (instrumen === 'eskul') return nilaiEskul(jawaban, konteks.daftarEskul || ESKUL_BAWAAN);
  if (instrumen === 'sosiometri') return nilaiSosiometri(jawaban, konteks.rosterNis || [], konteks.nis, konteks.izinkanNegatif);
  throw new Error('Instrumen tidak dikenal.');
}

module.exports = {
  INSTRUMEN, TIPE_RIASEC, TIPE_GAYA, DCM_BIDANG, KONTEKS_SOSIOMETRI, ESKUL_BAWAAN, nilai, analisisSosiometri,
};
