/* Sistem BK — antarmuka guru BK (tanpa framework). */
'use strict';

const akar = document.getElementById('aplikasi');
const keadaan = { pengguna: null, ref: null, sekolah: '' };

// ============================================================
// Utilitas
// ============================================================
const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tgl = iso => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '-');
const hariIni = () => new Date().toLocaleDateString('sv-SE');
const bulanIni = () => hariIni().slice(0, 7);
const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const judulBulan = b => `${NAMA_BULAN[Number(b.slice(5, 7)) - 1]} ${b.slice(0, 4)}`;
const lencanaStatus = s => `<span class="lencana ${e(String(s).split(' ')[0])}">${e(s)}</span>`;
const labelJenis = j => keadaan.ref?.jenisLayanan[j]?.label || j;

async function api(metode, url, data, mentah = false) {
  const opsi = { method: metode, headers: {} };
  if (data instanceof Blob || data instanceof ArrayBuffer) {
    opsi.body = data;
    opsi.headers['Content-Type'] = 'application/octet-stream';
  } else if (data !== undefined) {
    opsi.body = JSON.stringify(data);
    opsi.headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, opsi);
  if (mentah) return res;
  const isi = await res.json().catch(() => ({}));
  if (res.status === 401 && !url.includes('/masuk')) { keadaan.pengguna = null; mulai(); throw new Error(isi.galat); }
  if (!res.ok) { const err = new Error(isi.galat || 'Permintaan gagal.'); err.rincian = isi.rincian; throw err; }
  return isi;
}

function pesan(tempat, jenis, teks, rincian) {
  const el = typeof tempat === 'string' ? document.querySelector(tempat) : tempat;
  if (!el) return;
  el.innerHTML = `<div class="pesan ${jenis}">${e(teks)}${rincian?.length ? '<ul>' + rincian.map(r => `<li>${e(r)}</li>`).join('') + '</ul>' : ''}</div>`;
}

const dataForm = form => Object.fromEntries(new FormData(form).entries());
const opsi = (daftar, terpilih) => daftar.map(([v, l]) => `<option value="${e(v)}" ${String(v) === String(terpilih) ? 'selected' : ''}>${e(l)}</option>`).join('');

// ============================================================
// Masuk & setup awal
// ============================================================
function layarMasuk(perluSetup) {
  akar.innerHTML = `
  <div class="tengah"><div class="kartu panel-masuk">
    <h1>${perluSetup ? 'Buat Akun Koordinator BK' : 'Masuk'}</h1>
    <p class="redup">${e(keadaan.sekolah)} · Sistem Layanan BK</p>
    ${perluSetup ? '<div class="pesan info">Aplikasi belum punya pengguna. Akun pertama otomatis menjadi Koordinator BK.</div>' : ''}
    <form id="formMasuk">
      ${perluSetup ? `<label class="wajib">Nama lengkap</label><input name="nama" required>
      <label>NIP</label><input name="nip">` : ''}
      <label class="wajib">Email</label><input name="email" type="email" required autocomplete="username">
      <label class="wajib">Password</label><input name="password" type="password" required minlength="${perluSetup ? 8 : 1}" autocomplete="${perluSetup ? 'new-password' : 'current-password'}">
      <div id="pesanMasuk"></div>
      <p><button class="btn" type="submit">${perluSetup ? 'Buat akun & masuk' : 'Masuk'}</button></p>
    </form>
  </div></div>`;
  document.getElementById('formMasuk').addEventListener('submit', async ev => {
    ev.preventDefault();
    try {
      await api('POST', perluSetup ? '/api/setup' : '/api/masuk', dataForm(ev.target));
      mulai();
    } catch (err) { pesan('#pesanMasuk', 'galat', err.message); }
  });
}

// ============================================================
// Kerangka & navigasi
// ============================================================
// Menu dikelompokkan per alur kerja BK: [grup, [[rute, label, ikon], ...]]
const MENU = [
  ['Utama', [['beranda', 'Beranda', '🏠']]],
  ['Siswa & Kelas', [['siswa', 'Manajemen Siswa', '👥'], ['analitik', 'Analitik Siswa', '📊'], ['progres', 'Progres Siswa', '📈'],
    ['kelas', 'Manajemen Kelas', '🏫'], ['penugasan', 'Penugasan Kelas BK', '🧭']]],
  ['Layanan BK', [['konseling-individu', 'Konseling Individual', '💬'], ['konseling-kelompok', 'Konseling Kelompok', '🗣️'], ['klasikal', 'Layanan Klasikal', '🧑‍🏫'],
    ['perkembangan', 'Catatan Perkembangan', '⭐'], ['anekdot', 'Catatan Anekdot', '📝'], ['layanan', 'Semua Catatan Layanan', '🗂️']]],
  ['Asesmen', [['asesmen', 'Asesmen Siswa', '📋']]],
  ['Program & Laporan', [['laporan', 'Laporan Bulanan', '📄']]],
  ['Administrasi', [['pengaturan', 'Pengaturan', '⚙️']]],
];

// Preferensi tampilan menu (lipat grup & sidebar ciut) — hanya kenyamanan per browser
const KUNCI_MENU = 'sistemBk.menu';
function bacaPrefMenu() {
  try { return { ciut: false, tutup: [], ...JSON.parse(localStorage.getItem(KUNCI_MENU) || '{}') }; }
  catch { return { ciut: false, tutup: [] }; }
}
function simpanPrefMenu(pref) {
  try { localStorage.setItem(KUNCI_MENU, JSON.stringify(pref)); } catch { /* penyimpanan tidak tersedia */ }
}
const prefMenu = bacaPrefMenu();

// Navigasi bawah untuk layar HP
const NAV_BAWAH = [['beranda', '⌂', 'Beranda'], ['layanan/baru', '✎', 'Catat'], ['siswa', '☺', 'Siswa'], ['asesmen', '✓', 'Asesmen'], ['laporan', '▤', 'Laporan']];

function kerangka() {
  akar.innerHTML = `
  <div class="tata ${prefMenu.ciut ? 'ciut' : ''}" id="tata">
    <nav class="sisi" id="sisi" aria-label="Menu utama">
      <div class="kepala-sisi">
        <div class="identitas"><div class="merek">Sistem BK</div><div class="sekolah">${e(keadaan.sekolah)}</div></div>
        <button class="tombol-ciut" id="tombolCiut" title="${prefMenu.ciut ? 'Lebarkan menu' : 'Lipat menu'}" aria-label="Lipat atau lebarkan menu">${prefMenu.ciut ? '»' : '«'}</button>
      </div>
      <div class="aksi-grup"><button id="lipatSemua">Lipat semua</button> · <button id="bukaSemua">Buka semua</button></div>
      ${MENU.map(([grup, isi]) => {
        const tertutup = prefMenu.tutup.includes(grup);
        return `<section class="grup ${tertutup ? 'tertutup' : ''}" data-grup="${e(grup)}">
          <button class="grup-menu" aria-expanded="${!tertutup}"><span>${e(grup)}</span><span class="panah">▾</span></button>
          <div class="isi-grup">${isi.map(([k, l, ikon]) => `<a href="#${k}" data-menu="${k}" title="${e(l)}"><span class="ikon">${ikon}</span><span class="teks">${e(l)}</span></a>`).join('')}</div>
        </section>`;
      }).join('')}
      <div class="bawah">
        <div class="teks">${e(keadaan.pengguna.nama)}</div>
        <div class="redup teks" style="color:#cfe0ee">${keadaan.pengguna.peran === 'koordinator' ? 'Koordinator BK' : 'Guru BK'}</div>
        <p><a href="#" id="tombolKeluar" title="Keluar"><span class="ikon">🚪</span><span class="teks">Keluar</span></a></p>
      </div>
    </nav>
    <main class="isi">
      <button class="btn kedua tombol-menu" id="tombolMenu">☰ Menu</button>
      <div id="halaman"></div>
    </main>
    <nav class="nav-bawah">${NAV_BAWAH.map(([k, ikon, l]) => `<a href="#${k}" data-menu="${k.split('/')[0]}"><span>${ikon}</span>${l}</a>`).join('')}</nav>
  </div>`;
  document.getElementById('tombolKeluar').addEventListener('click', async ev => {
    ev.preventDefault();
    await api('POST', '/api/keluar');
    keadaan.pengguna = null;
    location.hash = '';
    mulai();
  });
  document.getElementById('tombolMenu').addEventListener('click', () => document.getElementById('sisi').classList.toggle('buka'));

  // Lipat/buka satu grup
  const aturGrup = (sec, tutup) => {
    sec.classList.toggle('tertutup', tutup);
    sec.querySelector('.grup-menu').setAttribute('aria-expanded', String(!tutup));
  };
  const simpanGrup = () => {
    prefMenu.tutup = [...document.querySelectorAll('.grup.tertutup')].map(s => s.dataset.grup);
    simpanPrefMenu(prefMenu);
  };
  document.querySelectorAll('.grup').forEach(sec => sec.querySelector('.grup-menu').addEventListener('click', () => {
    aturGrup(sec, !sec.classList.contains('tertutup'));
    simpanGrup();
  }));
  document.getElementById('lipatSemua').addEventListener('click', () => {
    // Grup halaman yang sedang dibuka tetap terlihat
    document.querySelectorAll('.grup').forEach(sec => aturGrup(sec, !sec.querySelector('a.aktif')));
    simpanGrup();
  });
  document.getElementById('bukaSemua').addEventListener('click', () => {
    document.querySelectorAll('.grup').forEach(sec => aturGrup(sec, false));
    simpanGrup();
  });

  // Ciutkan seluruh menu samping menjadi ikon saja
  document.getElementById('tombolCiut').addEventListener('click', ev => {
    prefMenu.ciut = !prefMenu.ciut;
    document.getElementById('tata').classList.toggle('ciut', prefMenu.ciut);
    ev.currentTarget.textContent = prefMenu.ciut ? '»' : '«';
    ev.currentTarget.title = prefMenu.ciut ? 'Lebarkan menu' : 'Lipat menu';
    simpanPrefMenu(prefMenu);
  });
}

/** Pastikan grup berisi halaman aktif terbuka. */
function bukaGrupAktif() {
  const aktif = document.querySelector('.isi-grup a.aktif');
  const sec = aktif?.closest('.grup');
  if (sec?.classList.contains('tertutup')) {
    sec.classList.remove('tertutup');
    sec.querySelector('.grup-menu').setAttribute('aria-expanded', 'true');
  }
}

const HALAMAN = {};
async function arahkan() {
  if (!keadaan.pengguna) return;
  const [nama, ...param] = (location.hash.slice(1) || 'beranda').split('/');
  document.querySelectorAll('[data-menu]').forEach(a => a.classList.toggle('aktif', a.dataset.menu === nama));
  bukaGrupAktif();
  document.getElementById('sisi')?.classList.remove('buka');
  const wadah = document.getElementById('halaman');
  wadah.innerHTML = '<p class="redup">Memuat…</p>';
  try {
    await (HALAMAN[nama] || HALAMAN.beranda)(wadah, ...param.map(decodeURIComponent));
  } catch (err) {
    wadah.innerHTML = `<div class="pesan galat">${e(err.message)}</div>`;
  }
}
window.addEventListener('hashchange', arahkan);

async function mulai() {
  const st = await api('GET', '/api/status');
  keadaan.sekolah = st.sekolah;
  if (!st.pengguna) return layarMasuk(st.perluSetup);
  keadaan.pengguna = st.pengguna;
  keadaan.ref = await api('GET', '/api/referensi');
  kerangka();
  arahkan();
}

// ============================================================
// Beranda
// ============================================================
const TIPS_BK = [
  'Catat layanan di hari yang sama selagi ingatan masih segar — cukup ringkas, detail di catatan terenkripsi.',
  'Tulis topik secara umum ("Motivasi belajar"), simpan rincian pribadi siswa hanya di kolom catatan.',
  'Hasil asesmen adalah pembuka percakapan, bukan label untuk siswa.',
  'Seimbangkan bidang layanan klasikal: Pribadi, Sosial, Belajar, dan Karier.',
  'Kasus berstatus Baru sebaiknya ditanggapi dalam satu minggu.',
  'Cadangkan folder data/ setiap bulan, termasuk kunci enkripsi.',
];

const ALUR_KERJA = [
  { judul: 'Kenali kebutuhan', isi: 'Sebar angket kebutuhan (AKPD) dan minat karier ke kelas. Rekap kelas menunjukkan bidang yang paling dibutuhkan.', aksi: [['#asesmen', 'Buka asesmen']] },
  { judul: 'Susun rencana', isi: 'Gunakan bidang prioritas dan butir yang paling banyak dicentang sebagai dasar topik bimbingan klasikal dan kelompok.', aksi: [['#asesmen', 'Lihat rekap kelas']] },
  { judul: 'Dampingi & catat', isi: 'Laksanakan layanan, lalu catat. Catatan konseling terenkripsi dan hanya terbuka untuk Anda dan Koordinator.', aksi: [['#layanan/baru/-/bimbingan_klasikal', 'Bimbingan klasikal'], ['#layanan/baru/-/konseling_individu', 'Konseling individu'], ['#layanan/baru/-/kasus', 'Buku kasus']] },
  { judul: 'Tinjau & laporkan', isi: 'Pantau kasus yang belum selesai, lalu unduh laporan bulanan berkop untuk Kepala Sekolah.', aksi: [['#layanan', 'Tinjau layanan'], ['#laporan', 'Laporan bulanan']] },
];

const PINTASAN = [
  ['#layanan/baru/-/konseling_individu', '💬', 'Konseling Individu'],
  ['#layanan/baru/-/bimbingan_klasikal', '🏫', 'Bimbingan Klasikal'],
  ['#layanan/baru/-/kasus', '📒', 'Buku Kasus'],
  ['#layanan/baru/-/kunjungan_rumah', '🏠', 'Kunjungan Rumah'],
  ['#siswa', '👥', 'Manajemen Siswa'],
  ['#analitik', '📊', 'Analitik Siswa'],
  ['#asesmen', '📋', 'Asesmen Siswa'],
  ['#laporan', '📄', 'Laporan Bulanan'],
];

function sapaan() {
  const j = new Date().getHours();
  return j < 11 ? 'Selamat pagi' : j < 15 ? 'Selamat siang' : j < 18 ? 'Selamat sore' : 'Selamat malam';
}

const persen = (a, b) => (b ? Math.round((a / b) * 100) : 0);

HALAMAN.beranda = async w => {
  const d = await api('GET', '/api/beranda');
  const koor = keadaan.pengguna.peran === 'koordinator';
  const kelas = await api('GET', '/api/kelas');
  const c = d.cakupan;
  const maks = Math.max(1, ...Object.values(d.perBidang));
  const tanggalPanjang = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const tip = TIPS_BK[new Date().getDate() % TIPS_BK.length];

  const tabPrioritas = {
    cakupan: `
      <div class="baris-batang lebar"><span>Siswa dilayani bulan ini</span><div class="batang"><span style="width:${persen(c.siswaTerlayani, c.siswaTotal)}%"></span></div><span>${c.siswaTerlayani}/${c.siswaTotal}</span></div>
      <div class="baris-batang lebar"><span>Kelas mendapat klasikal</span><div class="batang"><span style="width:${persen(c.kelasKlasikal, c.kelasTotal)}%"></span></div><span>${c.kelasKlasikal}/${c.kelasTotal}</span></div>
      <div class="baris-batang lebar"><span>Siswa sudah asesmen</span><div class="batang"><span style="width:${persen(c.siswaAsesmen, c.siswaTotal)}%"></span></div><span>${c.siswaAsesmen}/${c.siswaTotal}</span></div>
      <h3 class="subjudul">Layanan per bidang bulan ini</h3>
      ${Object.entries(d.perBidang).map(([b, n]) => `<div class="baris-batang"><span>${e(b)}</span><div class="batang"><span style="width:${(n / maks) * 100}%"></span></div><span>${n}</span></div>`).join('')}`,
    tindak: d.tindakLanjut.length
      ? `<table><tbody>${d.tindakLanjut.map(k => `<tr class="klik" data-href="#layanan/${k.id}"><td class="kecil">${tgl(k.tanggal)}</td>
          <td>${e(k.siswa || labelJenis(k.jenis))}<div class="redup kecil">${e(labelJenis(k.jenis))} · ${e(k.topik)}${k.tindak_lanjut ? ' → ' + e(k.tindak_lanjut) : ''}</div></td>
          <td>${lencanaStatus(k.status)}</td></tr>`).join('')}</tbody></table>`
      : '<p class="redup">Tidak ada layanan yang menunggu tindak lanjut.</p>',
    tim: `<table><thead><tr><th>Nama</th><th>Kelas</th><th>Siswa binaan</th><th>Layanan bulan ini</th></tr></thead><tbody>
      ${d.tim.map(t => `<tr><td>${e(t.nama)}<div class="redup kecil">${t.peran === 'koordinator' ? 'Koordinator' : 'Guru BK'}</div></td><td>${t.kelas}</td>
        <td>${t.siswa}${t.siswa > 150 ? ' <span class="lencana Baru">&gt;150</span>' : ''}</td><td>${t.layanan}</td></tr>`).join('')}</tbody></table>
      <p><a href="#penugasan">Atur penugasan kelas →</a></p>`,
    laporan: `<table><tbody>
      <tr><td>${judulBulan(d.bulan)} <span class="redup kecil">(berjalan)</span></td><td>${d.laporan.bulanIni} layanan</td><td><a href="#laporan/${d.bulan}">Lihat</a></td></tr>
      <tr><td>${judulBulan(d.bulanLalu)}</td><td>${d.laporan.bulanLalu} layanan</td><td><a href="#laporan/${d.bulanLalu}">Lihat</a> · <a href="/api/laporan/${d.bulanLalu}/pdf" target="_blank" rel="noopener">PDF</a></td></tr>
    </tbody></table>`,
  };
  const daftarTab = [['cakupan', 'Cakupan'], ['tindak', `Tindak lanjut (${d.tindakLanjut.length})`], ...(koor ? [['tim', 'Tim BK']] : []), ['laporan', 'Laporan bulanan']];

  w.innerHTML = `
  <section class="kartu sambutan">
    <div>
      <div class="label-atas">${koor ? 'Koordinasi BK Sekolah' : 'Ruang Kerja Guru BK'}</div>
      <h1>${sapaan()}, ${e(keadaan.pengguna.nama)}</h1>
      <div class="redup">${e(d.sekolah)} — ${koor ? 'Koordinator Bimbingan dan Konseling' : 'Guru Bimbingan dan Konseling'}</div>
      <div class="redup kecil">${e(tanggalPanjang)}</div>
    </div>
    <a class="btn" href="#layanan/baru">+ Catat layanan</a>
  </section>

  <div class="tata-beranda">
    <div class="kolom-utama">
      <section class="kartu">
        <div class="kepala-kartu"><h2>Perlu tindakan</h2><span class="lencana ${d.perluTindakan.length ? 'Baru' : 'Selesai'}">${d.perluTindakan.length} butir</span></div>
        ${d.perluTindakan.length ? `<ul class="daftar-tindakan">${d.perluTindakan.map(t => `<li class="${t.tingkat}"><a href="${e(t.href)}">${e(t.teks)}</a></li>`).join('')}</ul>`
          : '<p class="redup">Semua beres. Tidak ada yang perlu ditindaklanjuti saat ini.</p>'}
      </section>

      <section class="kartu catat-cepat">
        <h2>Catat cepat bimbingan klasikal</h2>
        <p class="redup kecil">Empat isian, kurang dari satu menit. Langsung masuk ke laporan bulanan.</p>
        ${kelas.length ? `<form id="fCepat">
          <div class="empat-kolom">
            <div><label class="wajib">1. Kelas</label><select name="kelas_id">${opsi(kelas.map(k => [k.id, k.nama]))}</select></div>
            <div><label class="wajib">2. Topik</label><input name="topik" required maxlength="200" placeholder="mis. Mengelola stres ujian"></div>
            <div><label class="wajib">3. Tanggal</label><input type="date" name="tanggal" value="${hariIni()}" max="${hariIni()}" required></div>
            <div><label class="wajib">Bidang</label><select name="bidang">${opsi(keadaan.ref.bidang.map(b => [b, b]))}</select></div>
          </div>
          <label>4. Catatan singkat</label><input name="catatan" placeholder="Opsional: respons siswa, evaluasi singkat">
          <div id="pesanCepat"></div>
          <p><button class="btn">Simpan</button></p>
        </form>` : '<p class="redup">Tambahkan data siswa dulu agar kelas tersedia.</p>'}
      </section>

      <section class="kartu">
        <div class="kepala-kartu"><h2>Prioritas ${koor ? 'koordinasi' : 'saya'}</h2></div>
        <div class="tab" role="tablist">${daftarTab.map(([k, l], i) => `<button role="tab" class="${i ? '' : 'aktif'}" data-tab="${k}">${l}</button>`).join('')}</div>
        <div id="isiTab">${tabPrioritas.cakupan}</div>
      </section>

      <section class="kartu">
        <h2>Ruang kerja BK</h2>
        <div class="alur">${ALUR_KERJA.map((a, i) => `<button class="${i === 2 ? 'aktif' : ''}" data-alur="${i}"><span>Langkah ${i + 1}</span>${e(a.judul)}</button>`).join('')}</div>
        <div id="isiAlur"></div>
      </section>
    </div>

    <aside class="kolom-samping">
      <section class="kartu">
        <h2>Pintasan</h2>
        <div class="pintasan">${PINTASAN.map(([h, ikon, l]) => `<a href="${h}"><span>${ikon}</span>${e(l)}</a>`).join('')}</div>
      </section>

      <section class="kartu">
        <h2>Akses siswa</h2>
        <p class="redup kecil">Tautan tes yang sedang terbuka. Bagikan ke grup kelas.</p>
        ${d.aksesSiswa.length ? d.aksesSiswa.map(a => `<div class="akses">
            <div><b>${e(keadaan.ref.instrumen[a.instrumen])}</b> · ${e(a.kelas)}
              <div class="redup kecil">${a.jumlah_jawaban}/${a.jumlah_siswa} terisi${a.tenggat ? ' · tenggat ' + tgl(a.tenggat) : ''}</div></div>
            <div class="baris-aksi"><button class="btn kecil kedua" data-salin="${e(location.origin + '/tes/' + a.token)}">Salin</button><a class="btn kecil kedua" href="#asesmen/${a.id}">Hasil</a></div>
          </div>`).join('')
          : '<p class="redup">Belum ada tes terbuka. <a href="#asesmen">Buka asesmen</a>.</p>'}
      </section>

      <section class="kartu tips">
        <h2>💡 Tips hari ini</h2>
        <p>${e(tip)}</p>
      </section>
    </aside>
  </div>`;

  // Tab prioritas
  const isiTab = document.getElementById('isiTab');
  w.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => {
    w.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('aktif', x === b));
    isiTab.innerHTML = tabPrioritas[b.dataset.tab];
    barisKlik(isiTab);
  }));

  // Alur kerja 4 langkah
  const isiAlur = document.getElementById('isiAlur');
  const tampilAlur = i => {
    const a = ALUR_KERJA[i];
    w.querySelectorAll('[data-alur]').forEach(x => x.classList.toggle('aktif', Number(x.dataset.alur) === i));
    isiAlur.innerHTML = `<p>${e(a.isi)}</p><div class="baris-aksi">${a.aksi.map(([h, l]) => `<a class="btn kecil kedua" href="${h}">${e(l)}</a>`).join('')}</div>`;
  };
  w.querySelectorAll('[data-alur]').forEach(b => b.addEventListener('click', () => tampilAlur(Number(b.dataset.alur))));
  tampilAlur(2);

  // Salin tautan tes
  w.querySelectorAll('[data-salin]').forEach(b => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.salin); b.textContent = 'Tersalin ✓'; }
    catch { prompt('Salin tautan ini:', b.dataset.salin); }
  }));

  // Catat cepat
  document.getElementById('fCepat')?.addEventListener('submit', async ev => {
    ev.preventDefault();
    const data = { ...dataForm(ev.target), jenis: 'bimbingan_klasikal', status: 'Selesai' };
    try {
      const r = await api('POST', '/api/layanan', data);
      pesan('#pesanCepat', 'sukses', `Tersimpan sebagai ${r.kode}.`);
      setTimeout(() => HALAMAN.beranda(w), 900);
    } catch (err) { pesan('#pesanCepat', 'galat', err.message); }
  });
  barisKlik(w);
};

function barisKlik(w) {
  w.querySelectorAll('tr[data-href]').forEach(tr => tr.addEventListener('click', () => { location.hash = tr.dataset.href; }));
}

// ============================================================
// Siswa & Kelas — Manajemen Siswa
// ============================================================
const ALASAN_ARSIP = ['Lulus', 'Mutasi keluar', 'Mengundurkan diri', 'Lainnya'];

/** Grafik batang sederhana tanpa pustaka luar. */
function grafikBatang(data, opsiGrafik = {}) {
  if (!data.length) return `<p class="redup">${opsiGrafik.kosong || 'Belum ada data.'}</p>`;
  const maks = Math.max(1, ...data.map(d => d.nilai));
  return data.map(d => `<div class="baris-batang ${opsiGrafik.lebar ? 'lebar' : ''}"><span title="${e(d.label)}">${e(d.label)}</span>
    <div class="batang"><span style="width:${(d.nilai / maks) * 100}%"></span></div><span>${d.teks ?? d.nilai}</span></div>`).join('');
}

HALAMAN.siswa = async (w, nis) => {
  if (nis) return detailSiswa(w, nis);
  const koor = keadaan.pengguna.peran === 'koordinator';
  const kelas = await api('GET', '/api/kelas');
  w.innerHTML = `
  <div class="kepala"><div><h1>Manajemen Siswa</h1>
    <div class="redup">Kelola data induk siswa, penempatan kelas, kenaikan kelas, dan mutasi. NIS menjadi kunci data; siswa tidak dihapus, hanya diarsipkan.</div></div>
    ${koor ? `<div class="baris-aksi">
      <a class="btn kedua" href="/api/siswa-template.xlsx">Unduh template</a>
      <label class="btn kedua" style="margin:0">Impor Excel<input type="file" id="berkasImpor" accept=".xlsx" hidden></label>
      <button class="btn" id="tombolTambah">+ Tambah siswa</button></div>` : ''}</div>
  <div class="kisi" id="statistik"></div>
  <p><button class="btn kecil kedua" id="tombolGrafik">Tampilkan grafik per kelas</button></p>
  <div class="kartu" id="grafikKelas" hidden><h2>Jumlah siswa aktif per kelas</h2>
    ${grafikBatang(kelas.map(k => ({ label: k.nama, nilai: k.jumlah_siswa, teks: `${k.jumlah_siswa} (L ${k.jumlah_l} · P ${k.jumlah_p})` })), { lebar: true })}</div>
  <div id="pesanSiswa"></div>
  <div id="formTambah"></div>
  <div class="kartu">
    <div class="baris-aksi" style="margin-bottom:10px">
      <input id="cari" placeholder="Cari nama atau NIS…" style="max-width:240px">
      <select id="saringKelas" style="max-width:170px"><option value="">Semua kelas</option>${opsi(kelas.map(k => [k.id, k.nama]))}</select>
      <select id="saringStatus" style="max-width:150px">${opsi([['Aktif', 'Aktif'], ['Arsip', 'Arsip (lulus/mutasi)']])}</select>
      <span class="redup" id="jumlah"></span>
    </div>
    ${koor ? `<div class="panel-massal" id="panelMassal" hidden>
      <b id="jumlahPilih"></b>
      <span class="baris-aksi">
        <input id="kelasTujuan" list="dafKelasTujuan" placeholder="Kelas tujuan, mis. XI-1" style="width:170px">
        <datalist id="dafKelasTujuan">${kelas.map(k => `<option value="${e(k.nama)}">`).join('')}</datalist>
        <button class="btn kecil" id="tombolPindah">Naik / pindah kelas</button>
      </span>
      <span class="baris-aksi" id="grupArsip">
        <select id="alasanArsip" style="width:170px">${opsi(ALASAN_ARSIP.map(a => [a, a]))}</select>
        <button class="btn kecil kedua" id="tombolArsipkan">Arsipkan</button>
      </span>
      <button class="btn kecil kedua" id="tombolAktifkan" hidden>Aktifkan kembali</button>
    </div>` : ''}
    <div class="tabel-gulir"><table><thead><tr>
      ${koor ? '<th style="width:32px"><input type="checkbox" id="pilihSemua" title="Pilih semua"></th>' : ''}
      <th>NIS</th><th>Nama</th><th>JK</th><th>Kelas</th><th>Keterangan</th></tr></thead><tbody id="daftar"></tbody></table></div>
  </div>`;

  const $ = id => document.getElementById(id);
  const terpilih = new Set();
  const perbaruiPanel = () => {
    if (!koor) return;
    $('panelMassal').hidden = terpilih.size === 0;
    $('jumlahPilih').textContent = `${terpilih.size} siswa dipilih`;
    const arsip = $('saringStatus').value === 'Arsip';
    $('grupArsip').hidden = arsip;
    $('tombolAktifkan').hidden = !arsip;
  };

  const muatStatistik = async () => {
    const s = await api('GET', '/api/siswa-statistik?' + new URLSearchParams({ kelas_id: $('saringKelas').value }));
    $('statistik').innerHTML = [['Total siswa', s.total], ['Laki-laki', s.laki], ['Perempuan', s.perempuan], ['Siswa aktif', s.aktif], ['Arsip', s.arsip]]
      .map(([l, n]) => `<div class="kartu statistik"><div class="redup">${l}</div><div class="angka">${n || 0}</div></div>`).join('');
  };

  const muat = async () => {
    const q = new URLSearchParams({ q: $('cari').value, kelas_id: $('saringKelas').value, status: $('saringStatus').value });
    const data = await api('GET', '/api/siswa?' + q);
    terpilih.clear();
    if (koor) $('pilihSemua').checked = false;
    $('jumlah').textContent = `${data.length} siswa`;
    $('daftar').innerHTML = data.length
      ? data.map(s => `<tr class="klik" data-href="#siswa/${e(s.nis)}">
          ${koor ? `<td data-henti><input type="checkbox" class="pilih" value="${e(s.nis)}"></td>` : ''}
          <td>${e(s.nis)}</td><td>${e(s.nama)}</td><td>${e(s.jk)}</td><td>${e(s.kelas)}</td><td class="redup">${e(s.keterangan || '')}</td></tr>`).join('')
      : `<tr><td colspan="6" class="redup">${koor ? 'Belum ada siswa pada filter ini. Unduh template, isi, lalu klik Impor Excel.' : 'Belum ada siswa di kelas binaan Anda. Minta Koordinator menugaskan kelas.'}</td></tr>`;
    w.querySelectorAll('[data-henti]').forEach(td => td.addEventListener('click', ev => ev.stopPropagation()));
    w.querySelectorAll('.pilih').forEach(c => c.addEventListener('change', () => { c.checked ? terpilih.add(c.value) : terpilih.delete(c.value); perbaruiPanel(); }));
    barisKlik(w);
    perbaruiPanel();
  };

  let jeda;
  $('cari').addEventListener('input', () => { clearTimeout(jeda); jeda = setTimeout(muat, 250); });
  $('saringKelas').addEventListener('change', () => { muat(); muatStatistik(); });
  $('saringStatus').addEventListener('change', muat);
  $('tombolGrafik').addEventListener('click', ev => {
    $('grafikKelas').hidden = !$('grafikKelas').hidden;
    ev.target.textContent = $('grafikKelas').hidden ? 'Tampilkan grafik per kelas' : 'Sembunyikan grafik';
  });
  await Promise.all([muat(), muatStatistik()]);

  if (!koor) return;
  $('pilihSemua').addEventListener('change', ev => {
    w.querySelectorAll('.pilih').forEach(c => { c.checked = ev.target.checked; c.checked ? terpilih.add(c.value) : terpilih.delete(c.value); });
    perbaruiPanel();
  });
  const massal = async (data, konfirmasi) => {
    if (!confirm(konfirmasi)) return;
    try {
      const r = await api('POST', '/api/siswa/massal', { ...data, nis: [...terpilih] });
      pesan('#pesanSiswa', 'sukses', `${r.diubah} siswa diperbarui.`);
      HALAMAN.siswa(w);
    } catch (err) { pesan('#pesanSiswa', 'galat', err.message); }
  };
  $('tombolPindah').addEventListener('click', () => {
    const kelasTujuan = $('kelasTujuan').value.trim();
    if (!kelasTujuan) return pesan('#pesanSiswa', 'galat', 'Isi kelas tujuan terlebih dahulu.');
    massal({ aksi: 'pindah', kelas: kelasTujuan }, `Pindahkan ${terpilih.size} siswa ke kelas ${kelasTujuan}? Kelas baru dibuat otomatis jika belum ada.`);
  });
  $('tombolArsipkan').addEventListener('click', () => {
    const alasan = $('alasanArsip').value;
    massal({ aksi: 'arsip', keterangan: alasan }, `Arsipkan ${terpilih.size} siswa dengan keterangan "${alasan}"? Riwayat layanan tetap tersimpan.`);
  });
  $('tombolAktifkan').addEventListener('click', () => massal({ aksi: 'aktifkan' }, `Aktifkan kembali ${terpilih.size} siswa?`));

  $('berkasImpor').addEventListener('change', async ev => {
    const berkas = ev.target.files[0];
    if (!berkas) return;
    pesan('#pesanSiswa', 'info', 'Mengimpor…');
    try {
      const r = await api('POST', '/api/siswa/impor', await berkas.arrayBuffer());
      pesan('#pesanSiswa', 'sukses', `Impor selesai: ${r.ditambah} siswa baru, ${r.diperbarui} diperbarui.`);
      setTimeout(() => HALAMAN.siswa(w), 1200);
    } catch (err) { pesan('#pesanSiswa', 'galat', err.message, err.rincian); }
    ev.target.value = '';
  });
  $('tombolTambah').addEventListener('click', () => {
    $('formTambah').innerHTML = `
    <form class="kartu" id="fSiswa"><h2>Tambah siswa</h2>
      <div class="dua-kolom">
        <div><label class="wajib">NIS (10 digit)</label><input name="nis" required pattern="\\d{10}" inputmode="numeric"></div>
        <div><label class="wajib">Nama lengkap</label><input name="nama" required></div>
        <div><label class="wajib">Jenis kelamin</label><select name="jk" required>${opsi([['L', 'Laki-laki'], ['P', 'Perempuan']])}</select></div>
        <div><label class="wajib">Kelas</label><input name="kelas" required list="dafKelas" placeholder="mis. X-1"><datalist id="dafKelas">${kelas.map(k => `<option value="${e(k.nama)}">`).join('')}</datalist></div>
        <div><label>Kontak orang tua (disimpan terenkripsi)</label><input name="kontak_ortu"></div>
      </div>
      <div id="pesanForm"></div>
      <p class="baris-aksi"><button class="btn">Simpan</button><button type="button" class="btn kedua" id="batal">Batal</button></p>
    </form>`;
    $('batal').addEventListener('click', () => { $('formTambah').innerHTML = ''; });
    $('fSiswa').addEventListener('submit', async ev => {
      ev.preventDefault();
      try { await api('POST', '/api/siswa', dataForm(ev.target)); HALAMAN.siswa(w); }
      catch (err) { pesan('#pesanForm', 'galat', err.message); }
    });
  });
};

async function detailSiswa(w, nis) {
  const s = await api('GET', '/api/siswa/' + encodeURIComponent(nis));
  const koor = keadaan.pengguna.peran === 'koordinator';
  const ringkasAsesmen = a => a.instrumen === 'riasec'
    ? `Kode Holland <b>${e(a.hasil.kodeHolland)}</b>`
    : `Bidang prioritas <b>${e(a.hasil.bidangPrioritas)}</b> · ${a.hasil.totalDicentang} butir dicentang`;
  w.innerHTML = `
  <div class="kepala"><div><a href="#siswa" class="kecil">← Manajemen Siswa</a><h1>${e(s.nama)}</h1>
    <div class="redup">NIS ${e(s.nis)} · ${e(s.kelas || '-')} · ${s.jk === 'L' ? 'Laki-laki' : 'Perempuan'} · ${lencanaStatus(s.status)} ${s.keterangan ? e(s.keterangan) : ''}</div></div>
    <div class="baris-aksi"><a class="btn" href="#layanan/baru/${e(s.nis)}">+ Catat layanan</a>
    <a class="btn kedua" href="#progres/${e(s.nis)}">Lihat progres</a>
    ${koor ? `<button class="btn kedua" id="tombolArsip">${s.status === 'Aktif' ? 'Arsipkan' : 'Aktifkan kembali'}</button>` : ''}</div></div>
  <div class="dua-kolom">
    <div class="kartu"><h2>Data</h2>
      <p><b>Wali kelas:</b> ${e(s.wali_kelas || '-')}</p>
      <p><b>Kontak orang tua:</b> ${e(s.kontak_ortu || '-')}</p>
    </div>
    <div class="kartu"><h2>Hasil asesmen</h2>
      ${s.asesmen.length ? s.asesmen.map(a => `<p>${e(keadaan.ref.instrumen[a.instrumen])} · ${tgl(a.dikirim)}<br>${ringkasAsesmen(a)}</p>`).join('') : '<p class="redup">Belum ada asesmen.</p>'}
    </div>
  </div>
  <div class="kartu"><h2>Riwayat layanan</h2>
    ${s.layanan.length ? `<div class="tabel-gulir"><table><thead><tr><th>Tanggal</th><th>Kode</th><th>Jenis</th><th>Topik</th><th>Status</th></tr></thead><tbody>
    ${s.layanan.map(l => `<tr class="klik" data-href="#layanan/${l.id}"><td>${tgl(l.tanggal)}</td><td>${e(l.kode)}</td><td>${e(labelJenis(l.jenis))}</td><td>${e(l.topik)}</td><td>${lencanaStatus(l.status)}</td></tr>`).join('')}
    </tbody></table></div>` : '<p class="redup">Belum ada layanan tercatat.</p>'}
  </div>`;
  barisKlik(w);
  document.getElementById('tombolArsip')?.addEventListener('click', async () => {
    if (s.status === 'Aktif') {
      const alasan = prompt(`Alasan mengarsipkan ${s.nama}? (${ALASAN_ARSIP.join(' / ')})`, 'Mutasi keluar');
      if (!alasan) return;
      try { await api('POST', '/api/siswa/massal', { aksi: 'arsip', keterangan: alasan, nis: [s.nis] }); }
      catch (err) { return alert(err.message); }
    } else {
      if (!confirm(`Aktifkan kembali ${s.nama}?`)) return;
      await api('POST', '/api/siswa/massal', { aksi: 'aktifkan', nis: [s.nis] });
    }
    detailSiswa(w, nis);
  });
}

// ============================================================
// Siswa & Kelas — Analitik Siswa
// ============================================================
HALAMAN.analitik = async w => {
  const d = await api('GET', '/api/analitik');
  const ev = d.evaluasi;
  w.innerHTML = `
  <div class="kepala"><div><h1>Analitik Siswa</h1><div class="redup">Ringkasan demografi dan aktivitas layanan BK${keadaan.pengguna.peran === 'koordinator' ? ' seluruh sekolah' : ' di kelas binaan Anda'}.</div></div></div>
  <div class="kisi">
    ${[['Total siswa', d.totalSiswa], ['Jumlah kelas', d.jumlahKelas], ['Sesi konseling', d.sesiKonseling], ['Asesmen AKPD', d.asesmenAkpd]]
      .map(([l, n]) => `<div class="kartu statistik"><div class="redup">${l}</div><div class="angka">${n}</div></div>`).join('')}
  </div>
  <div class="dua-kolom">
    <div class="kartu"><h2>Jumlah siswa per kelas</h2>
      ${grafikBatang(d.perKelas.map(k => ({ label: k.kelas, nilai: k.siswa })), { kosong: 'Belum ada data siswa.' })}</div>
    <div class="kartu"><h2>Distribusi jenis kelamin</h2>
      ${d.totalSiswa ? `<div class="donat" style="--p:${(d.gender.L / d.totalSiswa) * 100}%"><span>${Math.round((d.gender.L / d.totalSiswa) * 100)}% L</span></div>
        <p class="tengah-teks"><span class="titik l"></span> Laki-laki ${d.gender.L} &nbsp; <span class="titik p"></span> Perempuan ${d.gender.P}</p>` : '<p class="redup">Belum ada data.</p>'}</div>
    <div class="kartu"><h2>Distribusi kategori AKPD</h2>
      <p class="redup kecil">Bidang prioritas tiap siswa dari angket kebutuhan terbaru.</p>
      ${d.asesmenAkpd ? grafikBatang(Object.entries(d.kategoriAkpd).map(([b, n]) => ({ label: b, nilai: n }))) : '<p class="redup">Belum ada asesmen AKPD.</p>'}</div>
    <div class="kartu"><h2>Top 8 topik konseling</h2>
      ${grafikBatang(d.topik.map(t => ({ label: t.topik, nilai: t.n })), { lebar: true, kosong: 'Belum ada sesi konseling.' })}</div>
  </div>
  <div class="kartu"><h2>Tren sesi konseling (6 bulan terakhir)</h2>
    <div class="kolom-grafik">${(() => { const m = Math.max(1, ...d.tren.map(t => t.n)); return d.tren.map(t =>
      `<div><span class="nilai">${t.n}</span><div class="tiang" style="height:${(t.n / m) * 100}%"></div><span class="kecil redup">${judulBulan(t.bulan).slice(0, 3)}</span></div>`).join(''); })()}</div></div>
  <div class="kartu"><h2>Evaluasi hasil layanan (pra/pasca)</h2>
    <p class="redup kecil">Rata-rata skala kondisi 1–5 sebelum dan sesudah layanan. Isi skala saat mencatat konseling atau bimbingan.</p>
    ${ev.length ? `<table><thead><tr><th>Jenis layanan</th><th>Sesi</th><th>Pra</th><th>Pasca</th><th>Perubahan</th></tr></thead><tbody>
      ${ev.map(x => { const sel = Math.round((x.pasca - x.pra) * 100) / 100; return `<tr><td>${e(labelJenis(x.jenis))}</td><td>${x.n}</td><td>${x.pra}</td><td>${x.pasca}</td>
        <td><b style="color:${sel >= 0 ? 'var(--sukses)' : 'var(--bahaya)'}">${sel >= 0 ? '+' : ''}${sel}</b></td></tr>`; }).join('')}</tbody></table>`
      : '<p class="redup">Belum ada data evaluasi pra/pasca pada catatan layanan.</p>'}</div>
  <div class="kartu"><h2>Ringkasan per kelas</h2>
    <div class="tabel-gulir"><table><thead><tr><th>Kelas</th><th>Guru BK</th><th>Siswa</th><th>Layanan individu/kelompok</th><th>Bimbingan klasikal</th><th>Sudah asesmen</th></tr></thead><tbody>
    ${d.ringkasKelas.length ? d.ringkasKelas.map(k => `<tr><td><b>${e(k.kelas)}</b></td><td>${e(k.guru_bk || '-')}</td><td>${k.siswa}</td><td>${k.layanan_individu}</td><td>${k.klasikal}</td>
      <td>${k.sudah_asesmen}/${k.siswa} <span class="redup kecil">(${persen(k.sudah_asesmen, k.siswa)}%)</span></td></tr>`).join('') : '<tr><td colspan="6" class="redup">Belum ada data.</td></tr>'}
    </tbody></table></div></div>`;
};

// ============================================================
// Siswa & Kelas — Progres Siswa
// ============================================================
HALAMAN.progres = async (w, nis) => {
  const siswa = await api('GET', '/api/siswa');
  w.innerHTML = `
  <div class="kepala"><div><h1>Progres Siswa</h1><div class="redup">Pantau perkembangan siswa dari layanan, kasus, dan asesmen dalam satu linimasa.</div></div></div>
  <div class="kartu"><label for="pilihSiswa">Pilih siswa</label>
    <input id="pilihSiswa" list="dafSiswaProgres" placeholder="Ketik nama atau NIS…" autocomplete="off" style="max-width:420px">
    <datalist id="dafSiswaProgres">${siswa.map(s => `<option value="${e(s.nis)} — ${e(s.nama)} (${e(s.kelas)})">`).join('')}</datalist></div>
  <div id="isiProgres"><p class="redup">Pilih siswa untuk melihat progresnya.</p></div>`;
  const input = document.getElementById('pilihSiswa');
  input.addEventListener('change', () => {
    const n = input.value.split(' — ')[0].trim();
    if (siswa.some(s => s.nis === n)) location.hash = '#progres/' + n;
  });
  if (!nis) return;
  const s = await api('GET', '/api/siswa/' + encodeURIComponent(nis));
  input.value = `${s.nis} — ${s.nama} (${s.kelas})`;

  const perBidang = Object.fromEntries(keadaan.ref.bidang.map(b => [b, 0]));
  s.layanan.forEach(l => { if (l.bidang) perBidang[l.bidang]++; });
  const kasusTerbuka = s.layanan.filter(l => l.jenis === 'kasus' && ['Baru', 'Proses', 'Tindak Lanjut'].includes(l.status)).length;
  const peristiwa = [
    ...s.layanan.map(l => ({ tanggal: l.tanggal, jenis: 'layanan', judul: labelJenis(l.jenis), isi: `${l.topik} · ${l.bidang}`, status: l.status, href: `#layanan/${l.id}` })),
    ...s.asesmen.map(a => ({ tanggal: a.dikirim.slice(0, 10), jenis: 'asesmen', judul: keadaan.ref.instrumen[a.instrumen],
      isi: a.instrumen === 'riasec' ? `Kode Holland ${a.hasil.kodeHolland}` : `Bidang prioritas ${a.hasil.bidangPrioritas} (${a.hasil.totalDicentang} butir)` })),
    ...s.perkembangan.map(c => ({ tanggal: c.tanggal, jenis: c.jenis === 'Apresiasi' ? 'apresiasi' : 'pembinaan',
      judul: `${c.jenis} ${c.jenis === 'Apresiasi' ? '+' : '−'}${c.poin}`, isi: `${c.kategori ? c.kategori + ' · ' : ''}${c.keterangan}`, href: '#perkembangan' })),
    ...s.anekdot.map(a => ({ tanggal: a.tanggal, jenis: 'anekdot', judul: 'Catatan anekdot',
      isi: `${a.tempat ? a.tempat + ': ' : ''}${a.deskripsi}`, href: '#anekdot' })),
  ].sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  document.getElementById('isiProgres').innerHTML = `
  <div class="kisi">
    <div class="kartu statistik"><div class="redup">Total layanan</div><div class="angka">${s.layanan.length}</div></div>
    <div class="kartu statistik"><div class="redup">Kasus terbuka</div><div class="angka">${kasusTerbuka}</div></div>
    <div class="kartu statistik"><div class="redup">Poin perkembangan</div><div class="angka">${(() => { const n = s.perkembangan.reduce((t, c) => t + (c.jenis === 'Apresiasi' ? c.poin : -c.poin), 0); return (n >= 0 ? '+' : '') + n; })()}</div></div>
    <div class="kartu statistik"><div class="redup">Layanan terakhir</div><div class="angka kecil-angka">${s.layanan[0] ? tgl(s.layanan[0].tanggal) : '-'}</div></div>
  </div>
  <div class="dua-kolom">
    <div class="kartu"><h2>${e(s.nama)}</h2>
      <p class="redup">NIS ${e(s.nis)} · ${e(s.kelas)} · Wali kelas ${e(s.wali_kelas || '-')}</p>
      <h3 class="subjudul">Layanan per bidang</h3>${grafikBatang(Object.entries(perBidang).map(([b, n]) => ({ label: b, nilai: n })))}
      <p class="baris-aksi"><a class="btn kecil" href="#layanan/baru/${e(s.nis)}">+ Catat layanan</a><a class="btn kecil kedua" href="#siswa/${e(s.nis)}">Profil siswa</a></p>
    </div>
    <div class="kartu"><h2>Linimasa</h2>
      ${peristiwa.length ? `<ol class="linimasa">${peristiwa.map(p => `<li class="${p.jenis}">
        <div class="redup kecil">${tgl(p.tanggal)}</div>
        <div>${p.href ? `<a href="${p.href}"><b>${e(p.judul)}</b></a>` : `<b>${e(p.judul)}</b>`} ${p.status ? lencanaStatus(p.status) : ''}</div>
        <div class="kecil">${e(p.isi)}</div></li>`).join('')}</ol>` : '<p class="redup">Belum ada aktivitas untuk siswa ini.</p>'}
    </div>
  </div>`;
};

// ============================================================
// Siswa & Kelas — Manajemen Kelas
// ============================================================
HALAMAN.kelas = async w => {
  const koor = keadaan.pengguna.peran === 'koordinator';
  const kelas = await api('GET', '/api/kelas');
  w.innerHTML = `
  <div class="kepala"><div><h1>Manajemen Kelas</h1>
    <div class="redup">Lihat seluruh kelas, guru BK pembinanya, serta ganti nama atau gabungkan kelas tanpa mengubah siswa satu per satu.</div></div></div>
  <div class="pesan info">Mengganti nama kelas otomatis berlaku untuk semua siswa dan asesmen di kelas itu. Menggabungkan kelas memindahkan semua siswa ke kelas tujuan; kelas asal diarsipkan, tidak dihapus. Kelas baru terbentuk otomatis dari data siswa.</div>
  <div id="pesanKelas"></div>
  <div class="kartu"><div class="tabel-gulir"><table>
    <thead><tr><th>Kelas</th><th>Siswa</th><th>L / P</th><th>Wali kelas</th><th>Guru BK</th>${koor ? '<th>Aksi</th>' : ''}</tr></thead>
    <tbody>${kelas.length ? kelas.map(k => `<tr data-id="${k.id}" data-nama="${e(k.nama)}">
      <td>${koor ? `<input class="nama" value="${e(k.nama)}" style="width:110px">` : `<b>${e(k.nama)}</b>`}</td>
      <td>${k.jumlah_siswa}</td><td>${k.jumlah_l} / ${k.jumlah_p}</td>
      <td>${koor ? `<input class="wali" value="${e(k.wali_kelas || '')}" placeholder="Nama wali kelas">` : e(k.wali_kelas || '-')}</td>
      <td>${e(k.guru_bk || '—')}</td>
      ${koor ? `<td class="baris-aksi" style="flex-wrap:nowrap"><button class="btn kecil simpan">Simpan</button>
        <select class="gabungKe" style="width:auto"><option value="">Gabung ke…</option>${opsi(kelas.filter(x => x.id !== k.id).map(x => [x.id, x.nama]))}</select></td>` : ''}</tr>`).join('')
      : `<tr><td colspan="6" class="redup">Belum ada kelas. Kelas muncul otomatis saat menambahkan siswa. <a href="#siswa">Buka Manajemen Siswa</a></td></tr>`}</tbody>
  </table></div>
  ${koor ? '<p class="redup kecil">Penugasan guru BK diatur di menu <a href="#penugasan">Penugasan Kelas BK</a>.</p>' : ''}</div>`;

  w.querySelectorAll('button.simpan').forEach(b => b.addEventListener('click', async () => {
    const tr = b.closest('tr');
    try {
      await api('PUT', '/api/kelas/' + tr.dataset.id, { nama: tr.querySelector('.nama').value, wali_kelas: tr.querySelector('.wali').value });
      b.textContent = 'Tersimpan ✓';
      setTimeout(() => HALAMAN.kelas(w), 700);
    } catch (err) { pesan('#pesanKelas', 'galat', err.message); }
  }));
  w.querySelectorAll('select.gabungKe').forEach(sel => sel.addEventListener('change', async () => {
    if (!sel.value) return;
    const tr = sel.closest('tr');
    const tujuan = sel.options[sel.selectedIndex].text;
    if (!confirm(`Gabungkan kelas ${tr.dataset.nama} ke ${tujuan}? Semua siswa ${tr.dataset.nama} dipindah ke ${tujuan}, lalu kelas ${tr.dataset.nama} diarsipkan.`)) { sel.value = ''; return; }
    try {
      const r = await api('POST', `/api/kelas/${tr.dataset.id}/gabung`, { ke_id: sel.value });
      pesan('#pesanKelas', 'sukses', `${r.siswaDipindah} siswa dipindah ke ${tujuan}.`);
      setTimeout(() => HALAMAN.kelas(w), 900);
    } catch (err) { pesan('#pesanKelas', 'galat', err.message); }
  }));
};

// ============================================================
// Siswa & Kelas — Penugasan Kelas BK
// ============================================================
HALAMAN.penugasan = async (w, idGuru) => {
  const koor = keadaan.pengguna.peran === 'koordinator';
  const [kelas, tim] = await Promise.all([api('GET', '/api/kelas'), api('GET', '/api/pengguna')]);
  const guru = tim.filter(p => p.status === 'Aktif');
  const totalSiswa = kelas.reduce((s, k) => s + k.jumlah_siswa, 0);
  const terpilihGuru = guru.find(g => String(g.id) === String(idGuru)) || guru[0];
  const bebanGuru = g => kelas.filter(k => k.guru_bk_id === g.id);

  w.innerHTML = `
  <div class="kepala"><div><h1>Penugasan Kelas BK</h1>
    <div class="redup">Tugaskan guru BK ke kelas binaan. Penugasan menentukan pembagian beban dan batas akses data siswa.</div></div></div>
  <details class="kartu panduan"><summary><b>Standar penulisan kelas, rasio bimbingan, dan hak akses</b></summary>
    <ul class="kecil">
      <li>Tulis kelas secara konsisten, mis. <code>X-1</code>, <code>XI-2</code>, <code>XII IPS 1</code>. Nama yang berbeda sedikit dianggap kelas berbeda.</li>
      <li>Rasio ideal: 1 guru BK membimbing 150 siswa (acuan ABKIN).</li>
      <li><b>Kelas ditugaskan</b>: guru BK hanya melihat siswa di kelas binaannya. <b>Bebas kelas</b>: guru BK dapat mengakses seluruh siswa sekolah.</li>
      <li>Isi catatan konseling tetap hanya terbuka bagi pencatat dan Koordinator, apa pun mode aksesnya.</li>
    </ul></details>

  <div class="kartu"><h2>Rekap beban guru BK</h2>
    <p class="redup kecil">${kelas.filter(k => k.guru_bk_id).length} dari ${kelas.length} kelas sudah ditugaskan · ${totalSiswa} siswa aktif</p>
    <div class="tabel-gulir"><table><thead><tr><th>Nama</th><th>Peran</th><th>Akses</th><th>Kelas binaan</th><th>Siswa</th><th>Beban (dari 150)</th></tr></thead><tbody>
    ${guru.map(g => { const kb = bebanGuru(g); const n = kb.reduce((s, k) => s + k.jumlah_siswa, 0); return `<tr>
      <td>${e(g.nama)}</td><td>${g.peran === 'koordinator' ? 'Koordinator' : 'Guru BK'}</td>
      <td>${g.peran === 'koordinator' ? '<span class="lencana">Semua kelas</span>' : g.akses_bebas ? '<span class="lencana">Bebas kelas</span>' : '<span class="lencana Arsip">Kelas ditugaskan</span>'}</td>
      <td>${kb.length ? kb.map(k => e(k.nama)).join(', ') : '<span class="redup">—</span>'}</td><td>${n}</td>
      <td style="min-width:140px"><div class="batang"><span style="width:${Math.min(100, (n / 150) * 100)}%;${n > 150 ? 'background:var(--bahaya)' : ''}"></span></div>
        <span class="kecil ${n > 150 ? '' : 'redup'}">${Math.round((n / 150) * 100)}%${n > 150 ? ' — melebihi rasio' : ''}</span></td></tr>`; }).join('')}
    </tbody></table></div></div>

  ${koor && terpilihGuru ? `<form class="kartu" id="fTugas"><h2>Atur penugasan</h2>
    <div class="dua-kolom">
      <div><label>Guru BK</label><select id="pilihGuru">${opsi(guru.map(g => [g.id, g.nama]), terpilihGuru.id)}</select></div>
      <div>${terpilihGuru.peran === 'koordinator' ? '<label>Hak akses</label><p class="redup">Koordinator selalu dapat mengakses semua kelas.</p>'
        : `<label>Hak akses</label><label class="cek"><input type="checkbox" name="akses_bebas" ${terpilihGuru.akses_bebas ? 'checked' : ''}> <span>Mode bebas kelas (akses seluruh siswa)</span></label>`}</div>
    </div>
    <label>Kelas binaan <span class="redup">(kelas yang sudah dibina guru lain akan dipindahkan ke guru ini)</span></label>
    <p class="baris-aksi"><button type="button" class="btn kecil kedua" id="semuaKelas">Pilih semua</button><button type="button" class="btn kecil kedua" id="kosongkanKelas">Kosongkan</button></p>
    <div class="kisi-cek">${kelas.map(k => `<label class="cek-kelas"><input type="checkbox" name="kelas" value="${k.id}" ${k.guru_bk_id === terpilihGuru.id ? 'checked' : ''}>
      <span><b>${e(k.nama)}</b><br><span class="redup kecil">${k.jumlah_siswa} siswa${k.guru_bk_id && k.guru_bk_id !== terpilihGuru.id ? ' · ' + e(k.guru_bk) : ''}</span></span></label>`).join('') || '<p class="redup">Belum ada kelas.</p>'}</div>
    <div id="pesanTugas"></div>
    <p><button class="btn">Simpan penugasan</button></p>
  </form>` : ''}`;

  if (!koor || !terpilihGuru) return;
  document.getElementById('pilihGuru').addEventListener('change', ev => { location.hash = '#penugasan/' + ev.target.value; });
  const kotak = () => w.querySelectorAll('input[name=kelas]');
  document.getElementById('semuaKelas').addEventListener('click', () => kotak().forEach(c => { c.checked = true; }));
  document.getElementById('kosongkanKelas').addEventListener('click', () => kotak().forEach(c => { c.checked = false; }));
  document.getElementById('fTugas').addEventListener('submit', async ev => {
    ev.preventDefault();
    const kelas_ids = [...kotak()].filter(c => c.checked).map(c => Number(c.value));
    const akses = ev.target.querySelector('[name=akses_bebas]');
    try {
      await api('PUT', '/api/penugasan/' + terpilihGuru.id, { kelas_ids, ...(akses ? { akses_bebas: akses.checked } : {}) });
      pesan('#pesanTugas', 'sukses', 'Penugasan tersimpan.');
      setTimeout(() => HALAMAN.penugasan(w, terpilihGuru.id), 800);
    } catch (err) { pesan('#pesanTugas', 'galat', err.message); }
  });
};

// ============================================================
// Layanan
// ============================================================
// Layanan yang dievaluasi dengan skala kondisi 1–5 sebelum/sesudah
const JENIS_DIEVALUASI = ['konseling_individu', 'konseling_kelompok', 'bimbingan_kelompok', 'bimbingan_klasikal'];
const JENIS_KONSELING = ['konseling_individu', 'konseling_kelompok'];
const LABEL_SKALA = [['', '— tidak diisi —'], [1, '1 · Sangat kurang'], [2, '2 · Kurang'], [3, '3 · Cukup'], [4, '4 · Baik'], [5, '5 · Sangat baik']];
const isianSkala = (pra = '', pasca = '') => `<div class="dua-kolom">
  <div><label>Kondisi sebelum layanan (1–5)</label><select name="skala_pra">${opsi(LABEL_SKALA, pra ?? '')}</select></div>
  <div><label>Kondisi sesudah layanan (1–5)</label><select name="skala_pasca">${opsi(LABEL_SKALA, pasca ?? '')}</select></div>
</div><p class="redup kecil">Opsional. Skala kondisi terkait topik, dinilai sebelum dan sesudah layanan. Dipakai untuk evaluasi pra/pasca di Analitik Siswa.</p>`;

/** Bagian tambahan form sesuai jenis layanan (konseling / klasikal). */
const isianKonseling = (l = {}) => `
  <details class="lipat" ${l.intake || l.teknik || l.prognosis ? 'open' : ''}><summary>Intake &amp; anamnesis <span class="redup">(opsional, terenkripsi)</span></summary>
    <textarea name="intake" placeholder="Gambaran masalah, riwayat layanan sebelumnya, harapan konseli…">${e(l.intake || '')}</textarea></details>
  <details class="lipat" ${l.teknik || l.prognosis ? 'open' : ''}><summary>Teknik &amp; prognosis <span class="redup">(opsional)</span></summary>
    <label>Pendekatan / teknik konseling</label>
    <input name="teknik" list="dafTeknik" value="${e(l.teknik || '')}" placeholder="Pilih atau tulis sendiri">
    <datalist id="dafTeknik">${keadaan.ref.teknikKonseling.map(t => `<option value="${e(t)}">`).join('')}</datalist>
    <label>Prognosis <span class="redup">(terenkripsi)</span></label>
    <textarea name="prognosis" placeholder="Perkiraan perkembangan dan dasar penilaian profesional…">${e(l.prognosis || '')}</textarea></details>`;

const isianKlasikal = (l = {}) => `
  <label>Materi</label><textarea name="materi" style="min-height:70px" placeholder="Pokok materi yang disampaikan">${e(l.materi || '')}</textarea>
  <div class="dua-kolom">
    <div><label>Tipe layanan</label><select name="tipe_klasikal"><option value="">— pilih tipe —</option>${opsi(keadaan.ref.tipeKlasikal.map(t => [t, t]), l.tipe_klasikal || '')}</select></div>
    <div><label>Capaian / SKKPD</label><input name="capaian" value="${e(l.capaian || '')}" placeholder="mis. Siswa mampu mengenali gaya belajarnya"></div>
  </div>`;

const evaluasiSingkat = l => (l.skala_pra && l.skala_pasca
  ? `${l.skala_pra} → ${l.skala_pasca} <b style="color:${l.skala_pasca >= l.skala_pra ? 'var(--sukses)' : 'var(--bahaya)'}">(${l.skala_pasca - l.skala_pra >= 0 ? '+' : ''}${l.skala_pasca - l.skala_pra})</b>`
  : '<span class="redup">—</span>');

// Rute: #layanan/baru/<nis atau ->/<jenis>
HALAMAN.layanan = async (w, id, nisAwal, jenisAwal) => {
  if (id === 'baru') return formLayanan(w, nisAwal === '-' ? null : nisAwal, jenisAwal);
  if (id) return detailLayanan(w, id);
  const r = keadaan.ref;
  w.innerHTML = `
  <div class="kepala"><div><h1>Semua Catatan Layanan</h1><div class="redup">Seluruh jenis layanan, termasuk buku kasus, kunjungan rumah, konferensi kasus, dan alih tangan kasus. Semua masuk otomatis ke laporan bulanan.</div></div>
    <a class="btn" href="#layanan/baru">+ Catat layanan</a></div>
  <div class="kartu">
    <div class="baris-aksi" style="margin-bottom:10px">
      <select id="fJenis" style="max-width:220px"><option value="">Semua jenis</option>${opsi(Object.entries(r.jenisLayanan).map(([k, v]) => [k, v.label]))}</select>
      <input type="month" id="fBulan" value="${bulanIni()}" style="max-width:180px">
      <select id="fStatus" style="max-width:170px"><option value="">Semua (kecuali arsip)</option>${opsi(r.status.map(s => [s, s]))}</select>
    </div>
    <div class="tabel-gulir"><table><thead><tr><th>Tanggal</th><th>Kode</th><th>Jenis</th><th>Sasaran</th><th>Topik</th><th>Status</th></tr></thead><tbody id="daftarLayanan"></tbody></table></div>
  </div>`;
  const fJenis = document.getElementById('fJenis'), fBulan = document.getElementById('fBulan'), fStatus = document.getElementById('fStatus');
  const muat = async () => {
    const q = new URLSearchParams({ jenis: fJenis.value, bulan: fBulan.value, status: fStatus.value });
    const data = await api('GET', '/api/layanan?' + q);
    document.getElementById('daftarLayanan').innerHTML = data.length ? data.map(l => `<tr class="klik" data-href="#layanan/${l.id}">
      <td>${tgl(l.tanggal)}</td><td class="kecil">${e(l.kode)}</td><td>${e(labelJenis(l.jenis))}</td>
      <td>${e(l.kelas || l.siswa || '-')}</td><td>${e(l.topik)}<div class="redup kecil">${e(l.bidang)}</div></td><td>${lencanaStatus(l.status)}</td></tr>`).join('')
      : '<tr><td colspan="6" class="redup">Belum ada layanan pada filter ini.</td></tr>';
    barisKlik(w);
  };
  [fJenis, fBulan, fStatus].forEach(x => x.addEventListener('change', muat));
  await muat();
};

// ---------- Konseling Individual & Kelompok ----------
function halamanKonseling(jenis) {
  return async w => {
    const individu = jenis === 'konseling_individu';
    const judul = individu ? 'Konseling Individual' : 'Konseling Kelompok';
    w.innerHTML = `
    <div class="kepala"><div><h1>${judul}</h1>
      <div class="redup">${individu ? 'Sesi konseling satu per satu dengan catatan intake, teknik, dan prognosis.' : 'Sesi konseling kelompok: peserta, proses, dan tindak lanjut.'}</div></div>
      <a class="btn" href="#layanan/baru/-/${jenis}">+ Tambah sesi</a></div>
    <div class="rahasia">🔒 Catatan sesi, intake, dan prognosis <b>dienkripsi</b> di server. Hanya pencatat dan Koordinator BK yang dapat membukanya.</div>
    <div class="kisi" id="statKonseling" style="margin-top:14px"></div>
    <div class="kartu">
      <div class="baris-aksi" style="margin-bottom:10px">
        <input id="fCari" placeholder="Cari siswa atau topik…" style="max-width:240px">
        <input type="month" id="fBulan" style="max-width:170px" title="Kosongkan untuk semua bulan">
        <select id="fStatus" style="max-width:170px"><option value="">Semua (kecuali arsip)</option>${opsi(keadaan.ref.status.map(s => [s, s]))}</select>
        <span class="redup" id="jumlahSesi"></span>
      </div>
      <div class="tabel-gulir"><table><thead><tr><th>Tanggal</th><th>Kode</th><th>${individu ? 'Siswa' : 'Peserta'}</th><th>Topik</th><th>Evaluasi</th><th>Status</th></tr></thead><tbody id="daftarSesi"></tbody></table></div>
    </div>`;
    const $ = id => document.getElementById(id);
    const muat = async () => {
      const q = new URLSearchParams({ jenis, q: $('fCari').value, bulan: $('fBulan').value, status: $('fStatus').value });
      const data = await api('GET', '/api/layanan?' + q);
      const bulanIniData = data.filter(l => l.tanggal.startsWith(bulanIni()));
      const dinilai = data.filter(l => l.skala_pra && l.skala_pasca);
      const rerata = dinilai.length ? (dinilai.reduce((s, l) => s + l.skala_pasca - l.skala_pra, 0) / dinilai.length).toFixed(1) : '-';
      $('statKonseling').innerHTML = [['Sesi ditampilkan', data.length], ['Bulan ini', bulanIniData.length],
        ['Perlu tindak lanjut', data.filter(l => ['Baru', 'Proses', 'Tindak Lanjut'].includes(l.status)).length],
        ['Rata-rata perubahan', rerata === '-' ? '-' : (rerata > 0 ? '+' : '') + rerata]]
        .map(([l, n]) => `<div class="kartu statistik"><div class="redup">${l}</div><div class="angka">${n}</div></div>`).join('');
      $('jumlahSesi').textContent = `${data.length} sesi`;
      $('daftarSesi').innerHTML = data.length ? data.map(l => `<tr class="klik" data-href="#layanan/${l.id}">
        <td>${tgl(l.tanggal)}</td><td class="kecil">${e(l.kode)}</td>
        <td>${e(l.siswa)}${individu ? '' : ` <span class="redup kecil">(${l.jumlah_siswa})</span>`}</td>
        <td>${e(l.topik)}<div class="redup kecil">${e(l.bidang)}${l.teknik ? ' · ' + e(l.teknik) : ''}</div></td>
        <td class="kecil">${evaluasiSingkat(l)}</td><td>${lencanaStatus(l.status)}</td></tr>`).join('')
        : `<tr><td colspan="6" class="redup">Belum ada sesi ${individu ? 'konseling' : 'kelompok'}. <a href="#layanan/baru/-/${jenis}">Tambahkan sesi pertama</a>.</td></tr>`;
      barisKlik(w);
    };
    let jeda;
    $('fCari').addEventListener('input', () => { clearTimeout(jeda); jeda = setTimeout(muat, 250); });
    [$('fBulan'), $('fStatus')].forEach(x => x.addEventListener('change', muat));
    await muat();
  };
}
HALAMAN['konseling-individu'] = halamanKonseling('konseling_individu');
HALAMAN['konseling-kelompok'] = halamanKonseling('konseling_kelompok');

// ---------- Layanan Klasikal ----------
HALAMAN.klasikal = async w => {
  const [kelas] = await Promise.all([api('GET', '/api/kelas')]);
  w.innerHTML = `
  <div class="kepala"><div><h1>Layanan Klasikal</h1><div class="redup">Bimbingan di kelas: materi, topik, tipe layanan, dan evaluasi hasil.</div></div>
    <div class="baris-aksi"><a class="btn kedua" href="#beranda">Catat cepat (4 isian)</a><a class="btn" href="#layanan/baru/-/bimbingan_klasikal">+ Tambah layanan</a></div></div>
  <div class="kisi" id="statKlasikal"></div>
  <div class="dua-kolom">
    <div class="kartu"><h2>Cakupan kelas bulan ini</h2><div id="cakupanKelas"></div></div>
    <div class="kartu"><h2>Pekerjaan BK berikutnya</h2>
      <p class="redup kecil">Layanan yang belum dievaluasi atau masih punya rencana tindak lanjut.</p><div id="pekerjaanBerikut"></div></div>
  </div>
  <div class="kartu">
    <div class="baris-aksi" style="margin-bottom:10px">
      <select id="fKelas" style="max-width:170px"><option value="">Semua kelas</option>${opsi(kelas.map(k => [k.id, k.nama]))}</select>
      <select id="fBidang" style="max-width:150px"><option value="">Semua bidang</option>${opsi(keadaan.ref.bidang.map(b => [b, b]))}</select>
      <input type="month" id="fBulan" style="max-width:170px" title="Kosongkan untuk semua bulan">
      <span class="redup" id="jumlahKlasikal"></span>
    </div>
    <div class="tabel-gulir"><table><thead><tr><th>Tanggal</th><th>Kelas</th><th>Topik</th><th>Tipe</th><th>Evaluasi</th></tr></thead><tbody id="daftarKlasikal"></tbody></table></div>
  </div>`;
  const $ = id => document.getElementById(id);

  // Ringkasan & pekerjaan berikutnya memakai semua data (tanpa filter)
  const semua = await api('GET', '/api/layanan?jenis=bimbingan_klasikal');
  const bulanIniData = semua.filter(l => l.tanggal.startsWith(bulanIni()));
  const kelasTerlayani = new Set(bulanIniData.map(l => l.kelas_id));
  $('statKlasikal').innerHTML = [['Total layanan', semua.length], ['Bulan ini', bulanIniData.length],
    ['Kelas terlayani bulan ini', `${kelasTerlayani.size}/${kelas.length}`], ['Sudah dievaluasi', `${semua.filter(l => l.skala_pasca).length}/${semua.length}`]]
    .map(([l, n]) => `<div class="kartu statistik"><div class="redup">${l}</div><div class="angka">${n}</div></div>`).join('');
  $('cakupanKelas').innerHTML = kelas.length ? `<div class="kisi-cek">${kelas.map(k => `<div class="cek-kelas ${kelasTerlayani.has(k.id) ? 'sudah' : ''}">
      <span>${kelasTerlayani.has(k.id) ? '✅' : '⬜'} <b>${e(k.nama)}</b><br><span class="redup kecil">${bulanIniData.filter(l => l.kelas_id === k.id).length} layanan</span></span></div>`).join('')}</div>`
    : '<p class="redup">Belum ada kelas.</p>';
  const tertunda = semua.filter(l => !l.skala_pasca || l.tindak_lanjut).slice(0, 6);
  $('pekerjaanBerikut').innerHTML = tertunda.length ? `<ul class="daftar-tindakan">${tertunda.map(l => `<li><a href="#layanan/${l.id}">
      ${tgl(l.tanggal)} · ${e(l.kelas)} · ${e(l.topik)} — ${!l.skala_pasca ? 'isi evaluasi' : 'tindak lanjut: ' + e(l.tindak_lanjut)}</a></li>`).join('')}</ul>`
    : '<p class="redup">Tidak ada evaluasi atau tindak lanjut tertunda.</p>';

  const muat = async () => {
    const data = await api('GET', '/api/layanan?' + new URLSearchParams({ jenis: 'bimbingan_klasikal', kelas_id: $('fKelas').value, bidang: $('fBidang').value, bulan: $('fBulan').value }));
    $('jumlahKlasikal').textContent = `${data.length} layanan`;
    $('daftarKlasikal').innerHTML = data.length ? data.map(l => `<tr class="klik" data-href="#layanan/${l.id}">
      <td>${tgl(l.tanggal)}</td><td>${e(l.kelas)}</td><td>${e(l.topik)}<div class="redup kecil">${e(l.bidang)}${l.capaian ? ' · ' + e(l.capaian) : ''}</div></td>
      <td class="kecil">${e(l.tipe_klasikal || '-')}</td><td class="kecil">${evaluasiSingkat(l)}</td></tr>`).join('')
      : '<tr><td colspan="5" class="redup">Belum ada layanan klasikal pada filter ini.</td></tr>';
    barisKlik(w);
  };
  [$('fKelas'), $('fBidang'), $('fBulan')].forEach(x => x.addEventListener('change', muat));
  await muat();
};

// ---------- Form & detail layanan ----------
async function formLayanan(w, nisAwal, jenisAwal) {
  const r = keadaan.ref;
  const [kelas, siswa] = await Promise.all([api('GET', '/api/kelas'), api('GET', '/api/siswa')]);
  const terpilih = new Map();
  if (nisAwal) { const s = siswa.find(x => x.nis === nisAwal); if (s) terpilih.set(s.nis, s); }
  const jenisMula = r.jenisLayanan[jenisAwal] ? jenisAwal : nisAwal ? 'konseling_individu' : 'bimbingan_klasikal';
  const kembali = { konseling_individu: '#konseling-individu', konseling_kelompok: '#konseling-kelompok', bimbingan_klasikal: '#klasikal' }[jenisMula] || '#layanan';

  w.innerHTML = `
  <div class="kepala"><div><a href="${kembali}" class="kecil">← Kembali</a><h1>Catat layanan</h1></div></div>
  <form class="kartu" id="fLayanan">
    <div class="dua-kolom">
      <div><label class="wajib">Jenis layanan</label><select name="jenis" id="jenis">${opsi(Object.entries(r.jenisLayanan).map(([k, v]) => [k, v.label]), jenisMula)}</select></div>
      <div><label class="wajib">Tanggal</label><input type="date" name="tanggal" value="${hariIni()}" max="${hariIni()}" required></div>
      <div><label class="wajib">Bidang</label><select name="bidang">${opsi(r.bidang.map(b => [b, b]))}</select></div>
      <div id="wadahKategori"><label class="wajib">Kategori kasus</label><select name="kategori_kasus">${opsi(Object.entries(r.kategoriKasus).map(([k, v]) => [k, `${k} — ${v}`]))}</select></div>
    </div>
    <label class="wajib">Topik / masalah</label><input name="topik" required maxlength="200" placeholder="Tulis umum, mis. 'Motivasi belajar' — detail di catatan">
    <div id="wadahKelas"><label class="wajib">Kelas</label><select name="kelas_id">${opsi(kelas.map(k => [k.id, k.nama]))}</select></div>
    <div id="wadahSiswa"><label class="wajib" id="labelSiswa">Siswa</label>
      <input id="cariSiswa" placeholder="Ketik nama atau NIS lalu pilih…" list="dafSiswa" autocomplete="off">
      <datalist id="dafSiswa">${siswa.map(s => `<option value="${e(s.nis)} — ${e(s.nama)} (${e(s.kelas)})">`).join('')}</datalist>
      <div id="chipSiswa" class="baris-aksi" style="margin-top:6px"></div>
    </div>
    <div id="wadahKlasikal">${isianKlasikal()}</div>
    <label>Catatan sesi</label>
    <div class="rahasia">Catatan ini <b>dienkripsi</b> dan hanya bisa dibuka oleh Anda dan Koordinator BK. Tidak dicetak di laporan bulanan.</div>
    <textarea name="catatan" style="margin-top:6px" placeholder="Proses, hasil, kesepakatan…"></textarea>
    <div id="wadahKonseling">${isianKonseling()}</div>
    <div class="dua-kolom">
      <div><label>Rencana tindak lanjut</label><input name="tindak_lanjut"></div>
      <div><label>Status</label><select name="status" id="status">${opsi(r.status.filter(s => s !== 'Arsip').map(s => [s, s]), 'Selesai')}</select></div>
    </div>
    <div id="wadahSkala"><h3 class="subjudul">Evaluasi hasil</h3>${isianSkala()}</div>
    <div id="pesanLayanan"></div>
    <p><button class="btn">Simpan catatan</button></p>
  </form>`;

  const jenis = document.getElementById('jenis');
  const gambarChip = () => {
    document.getElementById('chipSiswa').innerHTML = [...terpilih.values()].map(s =>
      `<span class="lencana">${e(s.nama)} <a href="#" data-hapus="${e(s.nis)}" title="Hapus">✕</a></span>`).join('');
    document.querySelectorAll('[data-hapus]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); terpilih.delete(a.dataset.hapus); gambarChip(); }));
  };
  const sesuaikan = () => {
    const j = jenis.value;
    const sasaranKelas = r.jenisLayanan[j].sasaran === 'kelas';
    document.getElementById('wadahKelas').hidden = !sasaranKelas;
    document.getElementById('wadahSiswa').hidden = sasaranKelas;
    document.getElementById('labelSiswa').textContent = j === 'konseling_individu' ? 'Siswa' : 'Peserta (bisa lebih dari satu)';
    document.getElementById('wadahKategori').hidden = j !== 'kasus';
    document.getElementById('wadahSkala').hidden = !JENIS_DIEVALUASI.includes(j);
    document.getElementById('wadahKonseling').hidden = !JENIS_KONSELING.includes(j);
    document.getElementById('wadahKlasikal').hidden = j !== 'bimbingan_klasikal';
    document.getElementById('status').value = j === 'kasus' ? 'Baru' : 'Selesai';
  };
  jenis.addEventListener('change', sesuaikan);
  sesuaikan();
  gambarChip();

  const cariSiswa = document.getElementById('cariSiswa');
  cariSiswa.addEventListener('change', () => {
    const nis = cariSiswa.value.split(' — ')[0].trim();
    const s = siswa.find(x => x.nis === nis);
    if (s) {
      if (jenis.value === 'konseling_individu') terpilih.clear();
      terpilih.set(s.nis, s);
      gambarChip();
    }
    cariSiswa.value = '';
  });

  document.getElementById('fLayanan').addEventListener('submit', async ev => {
    ev.preventDefault();
    const d = dataForm(ev.target);
    d.nis = [...terpilih.keys()];
    // Kosongkan isian yang tidak relevan dengan jenis terpilih
    if (!JENIS_KONSELING.includes(d.jenis)) ['intake', 'teknik', 'prognosis'].forEach(k => delete d[k]);
    if (d.jenis !== 'bimbingan_klasikal') ['materi', 'tipe_klasikal', 'capaian'].forEach(k => delete d[k]);
    if (!JENIS_DIEVALUASI.includes(d.jenis)) ['skala_pra', 'skala_pasca'].forEach(k => delete d[k]);
    try {
      const hasil = await api('POST', '/api/layanan', d);
      location.hash = '#layanan/' + hasil.id;
    } catch (err) { pesan('#pesanLayanan', 'galat', err.message); }
  });
}

async function detailLayanan(w, id) {
  const l = await api('GET', '/api/layanan/' + id);
  const r = keadaan.ref;
  const kembali = { konseling_individu: '#konseling-individu', konseling_kelompok: '#konseling-kelompok', bimbingan_klasikal: '#klasikal' }[l.jenis] || '#layanan';
  w.innerHTML = `
  <div class="kepala"><div><a href="${kembali}" class="kecil">← Kembali</a><h1>${e(labelJenis(l.jenis))}</h1>
    <div class="redup">${e(l.kode)} · ${tgl(l.tanggal)} · Bidang ${e(l.bidang)} ${l.kategori_kasus ? '· Kategori ' + e(l.kategori_kasus) : ''}</div></div>
    <div>${lencanaStatus(l.status)}</div></div>
  <div class="kartu">
    <p><b>Topik:</b> ${e(l.topik)}</p>
    ${l.kelas ? `<p><b>Kelas:</b> ${e(l.kelas)}</p>` : ''}
    ${l.siswa.length ? `<p><b>${l.siswa.length > 1 ? 'Peserta' : 'Siswa'}:</b> ${l.siswa.map(s => `<a href="#progres/${e(s.nis)}">${e(s.nama)}</a>`).join(', ')}</p>` : ''}
    <form id="fUbah">
      ${l.jenis === 'bimbingan_klasikal' ? isianKlasikal(l) : ''}
      <label>Catatan sesi (terenkripsi)</label><textarea name="catatan">${e(l.catatan)}</textarea>
      ${JENIS_KONSELING.includes(l.jenis) ? isianKonseling(l) : ''}
      <div class="dua-kolom">
        <div><label>Rencana tindak lanjut</label><input name="tindak_lanjut" value="${e(l.tindak_lanjut || '')}"></div>
        <div><label>Status</label><select name="status">${opsi(r.status.map(s => [s, s]), l.status)}</select></div>
      </div>
      ${JENIS_DIEVALUASI.includes(l.jenis) ? `<h3 class="subjudul">Evaluasi hasil</h3>${isianSkala(l.skala_pra, l.skala_pasca)}` : ''}
      <div id="pesanUbah"></div>
      <p><button class="btn">Simpan perubahan</button></p>
    </form>
  </div>`;
  document.getElementById('fUbah').addEventListener('submit', async ev => {
    ev.preventDefault();
    try { await api('PUT', '/api/layanan/' + id, dataForm(ev.target)); pesan('#pesanUbah', 'sukses', 'Perubahan tersimpan.'); }
    catch (err) { pesan('#pesanUbah', 'galat', err.message); }
  });
}

// ---------- Pemilih siswa sederhana (dipakai catatan perkembangan & anekdot) ----------
const pemilihSiswa = (siswa, nama = 'nis', wajibIsi = true) => `
  <input name="${nama}_cari" list="daf_${nama}" placeholder="Ketik nama atau NIS lalu pilih…" autocomplete="off" ${wajibIsi ? 'required' : ''}>
  <datalist id="daf_${nama}">${siswa.map(s => `<option value="${e(s.nis)} — ${e(s.nama)} (${e(s.kelas)})">`).join('')}</datalist>`;
const nisDariPilihan = teks => String(teks || '').split(' — ')[0].trim();

// ---------- Catatan Perkembangan ----------
HALAMAN.perkembangan = async w => {
  const [siswa, kelas] = await Promise.all([api('GET', '/api/siswa'), api('GET', '/api/kelas')]);
  const ref = keadaan.ref;
  w.innerHTML = `
  <div class="kepala"><div><h1>Catatan Perkembangan</h1>
    <div class="redup">Catat apresiasi (poin positif) dan pembinaan (poin negatif) untuk memantau perkembangan siswa.</div></div>
    <button class="btn" id="tombolTambahCatatan">+ Tambah catatan</button></div>
  <form class="kartu" id="fPerkembangan" hidden><h2>Tambah catatan</h2>
    <div class="dua-kolom">
      <div><label class="wajib">Tanggal</label><input type="date" name="tanggal" value="${hariIni()}" max="${hariIni()}" required></div>
      <div><label class="wajib">Siswa</label>${pemilihSiswa(siswa)}</div>
      <div><label class="wajib">Jenis catatan</label>
        <div class="pilih-jenis">${ref.jenisPerkembangan.map((j, i) => `<label class="cek-kelas"><input type="radio" name="jenis" value="${j}" ${i ? '' : 'checked'}> <span>${j === 'Apresiasi' ? '👍 Apresiasi (+)' : '📌 Pembinaan (−)'}</span></label>`).join('')}</div></div>
      <div><label class="wajib">Poin</label><input type="number" name="poin" min="1" max="100" value="5" required>
        <p class="redup kecil" id="infoPoin">Akan disimpan sebagai nilai positif.</p></div>
      <div><label>Kategori</label><select name="kategori">${opsi(ref.kategoriPerkembangan.map(k => [k, k]))}</select></div>
    </div>
    <label class="wajib">Keterangan</label><textarea name="keterangan" required style="min-height:70px" placeholder="Perilaku atau capaian yang diamati"></textarea>
    <div id="pesanPerkembangan"></div>
    <p class="baris-aksi"><button class="btn">Simpan</button><button type="button" class="btn kedua" id="batalPerkembangan">Batal</button></p>
  </form>
  <div class="kisi" id="statPerkembangan"></div>
  <div class="tata-beranda">
    <div class="kartu"><h2>Riwayat catatan</h2>
      <div class="baris-aksi" style="margin-bottom:10px">
        <select id="fJenis" style="max-width:150px"><option value="">Semua jenis</option>${opsi(ref.jenisPerkembangan.map(j => [j, j]))}</select>
        <select id="fKelas" style="max-width:150px"><option value="">Semua kelas</option>${opsi(kelas.map(k => [k.id, k.nama]))}</select>
        <input id="fSiswa" list="daf_fsiswa" placeholder="Semua siswa" style="max-width:220px" autocomplete="off">
        <datalist id="daf_fsiswa">${siswa.map(s => `<option value="${e(s.nis)} — ${e(s.nama)} (${e(s.kelas)})">`).join('')}</datalist>
      </div>
      <div class="tabel-gulir"><table><thead><tr><th>Tanggal</th><th>Siswa</th><th>Kategori</th><th>Keterangan</th><th>Poin</th><th></th></tr></thead><tbody id="daftarPerkembangan"></tbody></table></div>
    </div>
    <div class="kartu"><h2>Poin bersih per siswa</h2><div id="peringkat"></div></div>
  </div>`;
  const $ = id => document.getElementById(id);
  const form = $('fPerkembangan');
  $('tombolTambahCatatan').addEventListener('click', () => { form.hidden = false; form.scrollIntoView({ behavior: 'smooth' }); });
  $('batalPerkembangan').addEventListener('click', () => { form.hidden = true; });
  form.querySelectorAll('[name=jenis]').forEach(r => r.addEventListener('change', () => {
    $('infoPoin').textContent = form.jenis.value === 'Apresiasi' ? 'Akan disimpan sebagai nilai positif.' : 'Akan dihitung sebagai pengurang (negatif).';
  }));

  const muat = async () => {
    const q = new URLSearchParams({ jenis: $('fJenis').value, kelas_id: $('fKelas').value, nis: nisDariPilihan($('fSiswa').value) });
    const d = await api('GET', '/api/perkembangan?' + q);
    const net = d.ringkas.apresiasi - d.ringkas.pembinaan;
    $('statPerkembangan').innerHTML = `
      <div class="kartu statistik"><div class="redup">Total apresiasi</div><div class="angka" style="color:var(--sukses)">+${d.ringkas.apresiasi}</div><div class="redup kecil">Poin positif terkumpul</div></div>
      <div class="kartu statistik"><div class="redup">Total pembinaan</div><div class="angka" style="color:var(--bahaya)">−${d.ringkas.pembinaan}</div><div class="redup kecil">Poin negatif terkumpul</div></div>
      <div class="kartu statistik"><div class="redup">Poin bersih</div><div class="angka">${net >= 0 ? '+' : ''}${net}</div><div class="redup kecil">${d.ringkas.jumlah} catatan</div></div>`;
    $('daftarPerkembangan').innerHTML = d.daftar.length ? d.daftar.map(c => `<tr>
      <td>${tgl(c.tanggal)}</td><td><a href="#progres/${e(c.nis)}">${e(c.nama)}</a><div class="redup kecil">${e(c.kelas)}</div></td>
      <td>${e(c.kategori || '-')}</td><td>${e(c.keterangan)}<div class="redup kecil">oleh ${e(c.pencatat)}</div></td>
      <td><b style="color:${c.jenis === 'Apresiasi' ? 'var(--sukses)' : 'var(--bahaya)'}">${c.jenis === 'Apresiasi' ? '+' : '−'}${c.poin}</b></td>
      <td><button class="btn kecil kedua" data-arsip="${c.id}" title="Arsipkan">Arsip</button></td></tr>`).join('')
      : '<tr><td colspan="6" class="redup">Belum ada catatan perkembangan.</td></tr>';
    $('peringkat').innerHTML = d.perSiswa.length ? `<table><tbody>${d.perSiswa.slice(0, 15).map(s => `<tr class="klik" data-href="#progres/${e(s.nis)}">
      <td>${e(s.nama)}<div class="redup kecil">${e(s.kelas)} · ${s.jumlah} catatan</div></td>
      <td><b style="color:${s.net >= 0 ? 'var(--sukses)' : 'var(--bahaya)'}">${s.net >= 0 ? '+' : ''}${s.net}</b></td></tr>`).join('')}</tbody></table>
      <p class="redup kecil">Poin adalah catatan perkembangan, bukan hukuman. Siswa dengan poin bersih negatif dapat menjadi prioritas pendampingan.</p>`
      : '<p class="redup">Belum ada data.</p>';
    w.querySelectorAll('[data-arsip]').forEach(b => b.addEventListener('click', async () => {
      if (!confirm('Arsipkan catatan ini? Catatan tidak dihapus, hanya disembunyikan dari rekap.')) return;
      await api('PUT', `/api/perkembangan/${b.dataset.arsip}/arsip`);
      muat();
    }));
    barisKlik(w);
  };
  [$('fJenis'), $('fKelas'), $('fSiswa')].forEach(x => x.addEventListener('change', muat));

  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    const d = dataForm(form);
    d.nis = nisDariPilihan(d.nis_cari);
    if (!siswa.some(s => s.nis === d.nis)) return pesan('#pesanPerkembangan', 'galat', 'Pilih siswa dari daftar.');
    try {
      await api('POST', '/api/perkembangan', d);
      pesan('#pesanPerkembangan', 'sukses', 'Catatan tersimpan.');
      form.reset(); form.tanggal.value = hariIni();
      muat();
    } catch (err) { pesan('#pesanPerkembangan', 'galat', err.message); }
  });
  await muat();
};

// ---------- Catatan Anekdot ----------
HALAMAN.anekdot = async w => {
  const siswa = await api('GET', '/api/siswa');
  w.innerHTML = `
  <div class="kepala"><div><h1>Catatan Anekdot</h1>
    <div class="redup">Rekam fakta satu kejadian atau perilaku spesifik siswa: kapan, di mana, dan apa yang teramati — tanpa penafsiran, kesimpulan, atau penilaian.</div></div>
    <button class="btn" id="tombolTambahAnekdot">+ Tambah catatan</button></div>
  <div class="dua-kolom">
    <div class="pesan sukses kecil">✅ <b>Deskripsi objektif:</b> "Saat jam istirahat di kantin, A mendorong temannya hingga terjatuh, lalu meninggalkan tempat."</div>
    <div class="pesan galat kecil">✖ <b>Interpretasi (hindari):</b> "A anak yang agresif dan tidak punya empati."</div>
  </div>
  <p class="redup kecil">Berbeda dari Catatan Perkembangan: di sini tidak ada skor, kategori, atau kesimpulan. Deskripsi disimpan terenkripsi.</p>
  <form class="kartu" id="fAnekdot" hidden><h2>Tambah catatan anekdot</h2>
    <div class="dua-kolom">
      <div><label class="wajib">Tanggal</label><input type="date" name="tanggal" value="${hariIni()}" max="${hariIni()}" required></div>
      <div><label>Waktu (opsional)</label><input type="time" name="waktu"></div>
      <div><label class="wajib">Siswa</label>${pemilihSiswa(siswa)}</div>
      <div><label>Tempat / lokasi (opsional)</label><input name="tempat" placeholder="mis. Kantin, lapangan, kelas X-1"></div>
    </div>
    <label class="wajib">Deskripsi perilaku</label>
    <textarea name="deskripsi" required placeholder="Tulis apa yang benar-benar terjadi dan teramati — hindari label atau kesimpulan."></textarea>
    <div id="peringatanLabel"></div>
    <div id="pesanAnekdot"></div>
    <p class="baris-aksi"><button class="btn">Simpan</button><button type="button" class="btn kedua" id="batalAnekdot">Batal</button></p>
  </form>
  <div class="kartu"><div class="kepala-kartu"><h2>Riwayat catatan anekdot</h2><span class="redup" id="jumlahAnekdot"></span></div>
    <div class="baris-aksi" style="margin-bottom:10px">
      <input id="fSiswa" list="daf_fanek" placeholder="Semua siswa" style="max-width:260px" autocomplete="off">
      <datalist id="daf_fanek">${siswa.map(s => `<option value="${e(s.nis)} — ${e(s.nama)} (${e(s.kelas)})">`).join('')}</datalist>
    </div>
    <div id="daftarAnekdot"></div></div>`;
  const $ = id => document.getElementById(id);
  const form = $('fAnekdot');
  $('tombolTambahAnekdot').addEventListener('click', () => { form.hidden = false; form.scrollIntoView({ behavior: 'smooth' }); });
  $('batalAnekdot').addEventListener('click', () => { form.hidden = true; });

  // Pengingat lembut bila deskripsi memuat kata label/penilaian
  const KATA_LABEL = ['nakal', 'malas', 'agresif', 'bodoh', 'kurang ajar', 'tidak sopan', 'bandel', 'pemalas', 'egois', 'jahat', 'selalu', 'tidak pernah'];
  form.deskripsi.addEventListener('input', () => {
    const t = form.deskripsi.value.toLowerCase();
    const temu = KATA_LABEL.filter(k => t.includes(k));
    $('peringatanLabel').innerHTML = temu.length ? `<div class="pesan info kecil">Ada kata yang terdengar seperti label/penilaian: <b>${temu.map(e).join(', ')}</b>. Coba ganti dengan perilaku yang teramati.</div>` : '';
  });

  const muat = async () => {
    const data = await api('GET', '/api/anekdot?' + new URLSearchParams({ nis: nisDariPilihan($('fSiswa').value) }));
    $('jumlahAnekdot').textContent = `${data.length} catatan`;
    $('daftarAnekdot').innerHTML = data.length ? data.map(a => `<div class="anekdot">
      <div class="kepala-kartu"><div><a href="#progres/${e(a.nis)}"><b>${e(a.nama)}</b></a> <span class="redup kecil">${e(a.kelas)}</span></div>
        <button class="btn kecil kedua" data-arsip="${a.id}">Arsip</button></div>
      <div class="redup kecil">📅 ${tgl(a.tanggal)}${a.waktu ? ' · 🕒 ' + e(a.waktu) : ''}${a.tempat ? ' · 📍 ' + e(a.tempat) : ''} · dicatat ${e(a.pencatat)}</div>
      <p>${e(a.deskripsi)}</p></div>`).join('')
      : '<p class="redup">Belum ada catatan anekdot.</p>';
    w.querySelectorAll('[data-arsip]').forEach(b => b.addEventListener('click', async () => {
      if (!confirm('Arsipkan catatan anekdot ini? Catatan tidak dihapus.')) return;
      try { await api('PUT', `/api/anekdot/${b.dataset.arsip}/arsip`); muat(); } catch (err) { alert(err.message); }
    }));
  };
  $('fSiswa').addEventListener('change', muat);

  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    const d = dataForm(form);
    d.nis = nisDariPilihan(d.nis_cari);
    if (!siswa.some(s => s.nis === d.nis)) return pesan('#pesanAnekdot', 'galat', 'Pilih siswa dari daftar.');
    try {
      await api('POST', '/api/anekdot', d);
      pesan('#pesanAnekdot', 'sukses', 'Catatan anekdot tersimpan.');
      form.reset(); form.tanggal.value = hariIni(); $('peringatanLabel').innerHTML = '';
      muat();
    } catch (err) { pesan('#pesanAnekdot', 'galat', err.message); }
  });
  await muat();
};

// ============================================================
// Asesmen
// ============================================================
HALAMAN.asesmen = async (w, id) => {
  if (id) return hasilAsesmen(w, id);
  const [daftar, kelas] = await Promise.all([api('GET', '/api/asesmen'), api('GET', '/api/kelas')]);
  w.innerHTML = `
  <div class="kepala"><div><h1>Asesmen</h1><div class="redup">Bagikan tautan ke kelas. Siswa mengisi dengan NIS dan nama depan, tanpa perlu akun.</div></div></div>
  <form class="kartu" id="fAsesmen"><h2>Buka asesmen baru</h2>
    <div class="dua-kolom">
      <div><label class="wajib">Instrumen</label><select name="instrumen">${opsi(Object.entries(keadaan.ref.instrumen))}</select></div>
      <div><label class="wajib">Kelas</label><select name="kelas_id" required>${opsi(kelas.map(k => [k.id, `${k.nama} (${k.jumlah_siswa} siswa)`]))}</select></div>
      <div><label>Tenggat (opsional)</label><input type="date" name="tenggat" min="${hariIni()}"></div>
    </div>
    <div id="pesanAsesmen"></div>
    <p><button class="btn" ${kelas.length ? '' : 'disabled'}>Buat tautan tes</button> ${kelas.length ? '' : '<span class="redup">Impor data siswa dulu.</span>'}</p>
  </form>
  <div class="kartu"><h2>Daftar asesmen</h2><div class="tabel-gulir"><table>
    <thead><tr><th>Dibuat</th><th>Instrumen</th><th>Kelas</th><th>Terisi</th><th>Status</th></tr></thead>
    <tbody>${daftar.length ? daftar.map(a => `<tr class="klik" data-href="#asesmen/${a.id}">
      <td>${tgl(a.dibuat)}</td><td>${e(keadaan.ref.instrumen[a.instrumen])}</td><td>${e(a.kelas)}</td>
      <td>${a.jumlah_jawaban} / ${a.jumlah_siswa}</td><td>${a.aktif ? '<span class="lencana Selesai">Terbuka</span>' : '<span class="lencana Arsip">Ditutup</span>'}</td></tr>`).join('')
      : '<tr><td colspan="5" class="redup">Belum ada asesmen.</td></tr>'}</tbody>
  </table></div></div>`;
  barisKlik(w);
  document.getElementById('fAsesmen').addEventListener('submit', async ev => {
    ev.preventDefault();
    try { const r = await api('POST', '/api/asesmen', dataForm(ev.target)); location.hash = '#asesmen/' + r.id; }
    catch (err) { pesan('#pesanAsesmen', 'galat', err.message); }
  });
};

async function hasilAsesmen(w, id) {
  const d = await api('GET', `/api/asesmen/${id}/hasil`);
  const a = d.asesmen;
  const tautan = `${location.origin}/tes/${a.token}`;
  const ref = keadaan.ref;
  let rekap = '';
  if (a.instrumen === 'akpd') {
    rekap = `<div class="dua-kolom">
      <div class="kartu"><h2>Rata-rata kebutuhan per bidang</h2>
        ${Object.entries(d.rekap.perBidang).map(([b, p]) => `<div class="baris-batang"><span>${e(b)}</span><div class="batang"><span style="width:${p}%"></span></div><span>${p}%</span></div>`).join('')}
        <p class="redup kecil">Bidang dengan persentase tertinggi menjadi prioritas program layanan klasikal kelas ini.</p></div>
      <div class="kartu"><h2>10 butir paling banyak dicentang</h2>
        ${d.rekap.butirTeratas.length ? `<table><tbody>${d.rekap.butirTeratas.map(b => `<tr><td>${e(b.teks)}<div class="redup kecil">${e(b.bidang)}</div></td><td>${b.persen}%</td></tr>`).join('')}</tbody></table>` : '<p class="redup">Belum ada jawaban.</p>'}</div>
    </div>`;
  } else {
    const maks = Math.max(1, ...Object.values(d.rekap.dominan));
    rekap = `<div class="kartu"><h2>Sebaran tipe minat dominan</h2>
      ${Object.entries(d.rekap.dominan).map(([t, n]) => `<div class="baris-batang"><span title="${e(ref.tipeRiasec[t].ciri)}">${t} · ${e(ref.tipeRiasec[t].nama.split(' ')[0])}</span><div class="batang"><span style="width:${(n / maks) * 100}%"></span></div><span>${n}</span></div>`).join('')}
      <p class="redup kecil">Gunakan sebagai bahan diskusi bimbingan karier, bukan penentu tunggal jurusan.</p></div>`;
  }
  const kolomHasil = j => a.instrumen === 'akpd'
    ? `${e(j.hasil.bidangPrioritas)} <span class="redup kecil">(${j.hasil.totalDicentang} butir)</span>`
    : `<b>${e(j.hasil.kodeHolland)}</b>`;
  w.innerHTML = `
  <div class="kepala"><div><a href="#asesmen" class="kecil">← Asesmen</a><h1>${e(ref.instrumen[a.instrumen])} — ${e(a.kelas)}</h1>
    <div class="redup">${d.jawaban.length} sudah mengisi · ${d.belum.length} belum ${a.tenggat ? '· tenggat ' + tgl(a.tenggat) : ''}</div></div>
    <button class="btn kedua" id="tombolStatus">${a.aktif ? 'Tutup tes' : 'Buka kembali'}</button></div>
  ${a.aktif ? `<div class="kartu"><h2>Tautan untuk siswa</h2>
    <div class="kotak-tautan"><input readonly value="${e(tautan)}" id="tautan"><button class="btn" id="salin">Salin</button></div>
    <p class="redup kecil">Bagikan lewat grup kelas. Siswa memasukkan NIS dan nama depan sebelum mengisi.</p></div>` : ''}
  ${rekap}
  <div class="dua-kolom">
    <div class="kartu"><h2>Sudah mengisi</h2>
      ${d.jawaban.length ? `<table><thead><tr><th>Nama</th><th>Hasil</th><th>Izin dibagikan</th></tr></thead><tbody>
      ${d.jawaban.map(j => `<tr class="klik" data-href="#siswa/${e(j.nis)}"><td>${e(j.nama)}</td><td>${kolomHasil(j)}</td><td>${j.setuju_dibagikan ? 'Ya' : '<span class="redup">Tidak</span>'}</td></tr>`).join('')}
      </tbody></table>` : '<p class="redup">Belum ada.</p>'}</div>
    <div class="kartu"><h2>Belum mengisi</h2>
      ${d.belum.length ? `<ul>${d.belum.map(s => `<li>${e(s.nama)}</li>`).join('')}</ul>` : '<p class="redup">Semua siswa sudah mengisi.</p>'}</div>
  </div>`;
  barisKlik(w);
  document.getElementById('salin')?.addEventListener('click', async ev => {
    try { await navigator.clipboard.writeText(tautan); ev.target.textContent = 'Tersalin ✓'; }
    catch { document.getElementById('tautan').select(); }
  });
  document.getElementById('tombolStatus').addEventListener('click', async () => {
    await api('PUT', '/api/asesmen/' + id, { aktif: !a.aktif });
    hasilAsesmen(w, id);
  });
}

// ============================================================
// Laporan bulanan
// ============================================================
HALAMAN.laporan = async (w, bulan) => {
  bulan = bulan || bulanIni();
  const r = await api('GET', '/api/laporan/' + bulan);
  const ref = keadaan.ref;
  w.innerHTML = `
  <div class="kepala"><div><h1>Laporan Bulanan BK</h1><div class="redup">Rekap otomatis dari catatan layanan. Isi catatan rahasia tidak dicetak.</div></div>
    <div class="baris-aksi"><input type="month" id="pilihBulan" value="${bulan}" max="${bulanIni()}" style="width:auto">
    <a class="btn" href="/api/laporan/${bulan}/pdf" target="_blank" rel="noopener">Unduh PDF</a></div></div>
  <div class="kisi">
    <div class="kartu statistik"><div class="redup">Layanan</div><div class="angka">${r.total}</div></div>
    <div class="kartu statistik"><div class="redup">Siswa dilayani</div><div class="angka">${r.siswaTerlayani}</div></div>
    <div class="kartu statistik"><div class="redup">Asesmen diisi</div><div class="angka">${r.asesmen.reduce((s, a) => s + a.n, 0)}</div></div>
  </div>
  ${r.total === 0 ? `<div class="pesan info">Belum ada layanan tercatat pada ${judulBulan(bulan)}. <a href="#layanan/baru">Catat layanan</a> dengan tanggal di bulan tersebut.</div>` : ''}
  <div class="dua-kolom">
    <div class="kartu"><h2>Per jenis layanan</h2><table><tbody>
      ${Object.entries(ref.jenisLayanan).map(([k, v]) => `<tr><td>${e(v.label)}</td><td>${r.perJenis[k] || 0}</td></tr>`).join('')}</tbody></table></div>
    <div class="kartu"><h2>Buku kasus per kategori</h2><table><tbody>
      ${Object.entries(ref.kategoriKasus).map(([k, v]) => `<tr><td>${k} — ${e(v)}</td><td>${r.kasusPerKategori[k] || 0}</td></tr>`).join('')}</tbody></table></div>
  </div>
  <div class="kartu"><h2>Bimbingan klasikal</h2>
    ${r.klasikal.length ? `<table><thead><tr><th>Tanggal</th><th>Kelas</th><th>Bidang</th><th>Topik</th></tr></thead><tbody>
    ${r.klasikal.map(k => `<tr><td>${tgl(k.tanggal)}</td><td>${e(k.kelas)}</td><td>${e(k.bidang)}</td><td>${e(k.topik)}</td></tr>`).join('')}</tbody></table>` : '<p class="redup">Belum ada.</p>'}
  </div>`;
  document.getElementById('pilihBulan').addEventListener('change', ev => { location.hash = '#laporan/' + ev.target.value; });
};

// ============================================================
// Pengaturan, tim & akun
// ============================================================
HALAMAN.pengaturan = async w => {
  const koor = keadaan.pengguna.peran === 'koordinator';
  const [p, tim] = await Promise.all([api('GET', '/api/pengaturan'), api('GET', '/api/pengguna')]);
  const isian = (k, label, wajibIsi) => `<div><label class="${wajibIsi ? 'wajib' : ''}">${label}</label><input name="${k}" value="${e(p[k] || '')}" ${koor ? '' : 'disabled'}></div>`;
  w.innerHTML = `
  <div class="kepala"><div><h1>Pengaturan</h1></div></div>
  <form class="kartu" id="fSekolah"><h2>Identitas sekolah (untuk kop laporan)</h2>
    <div class="dua-kolom">
      ${isian('nama_sekolah', 'Nama sekolah', true)}${isian('alamat_sekolah', 'Alamat')}
      ${isian('kepala_sekolah', 'Nama kepala sekolah', true)}${isian('nip_kepala_sekolah', 'NIP kepala sekolah')}
      ${isian('tahun_pelajaran', 'Tahun pelajaran', true)}
      <div><label>Semester</label><select name="semester" ${koor ? '' : 'disabled'}>${opsi([['Ganjil', 'Ganjil'], ['Genap', 'Genap']], p.semester)}</select></div>
    </div>
    <div id="pesanSekolah"></div>
    ${koor ? '<p><button class="btn">Simpan</button></p>' : ''}
  </form>
  <div class="kartu"><h2>Tim BK</h2>
    <table><thead><tr><th>Nama</th><th>Email</th><th>Peran</th><th>Kelas</th></tr></thead><tbody>
    ${tim.map(t => `<tr><td>${e(t.nama)}</td><td>${e(t.email)}</td><td>${t.peran === 'koordinator' ? 'Koordinator' : 'Guru BK'}</td><td>${t.jumlah_kelas}</td></tr>`).join('')}</tbody></table>
    ${koor ? `<form id="fGuru" style="margin-top:12px"><h2 style="margin-top:12px">Tambah guru BK</h2>
      <div class="dua-kolom">
        <div><label class="wajib">Nama</label><input name="nama" required></div>
        <div><label>NIP</label><input name="nip"></div>
        <div><label class="wajib">Email</label><input name="email" type="email" required></div>
        <div><label class="wajib">Password awal (min. 8)</label><input name="password" type="password" minlength="8" required autocomplete="new-password"></div>
      </div>
      <div id="pesanGuru"></div><p><button class="btn">Tambah</button></p></form>` : ''}
  </div>
  <form class="kartu" id="fPassword"><h2>Ganti password saya</h2>
    <div class="dua-kolom">
      <div><label>Password lama</label><input name="lama" type="password" required autocomplete="current-password"></div>
      <div><label>Password baru (min. 8)</label><input name="baru" type="password" minlength="8" required autocomplete="new-password"></div>
    </div>
    <div id="pesanPassword"></div><p><button class="btn">Ganti password</button></p>
  </form>
  ${koor ? `<div class="kartu"><h2>Cadangan data</h2>
    <p class="redup">Unduh data siswa dan daftar layanan ke Excel setiap bulan. Isi catatan rahasia dan kontak orang tua tidak ikut.</p>
    <p><a class="btn kedua" href="/api/cadangan.xlsx">Unduh cadangan Excel</a></p>
    <p class="redup kecil">Untuk cadangan lengkap, salin folder <code>data/</code> (database + kunci enkripsi) ke penyimpanan aman.</p></div>` : ''}`;

  const kirim = (idForm, metode, url, idPesan, sukses, setelah) => document.getElementById(idForm)?.addEventListener('submit', async ev => {
    ev.preventDefault();
    try { await api(metode, url, dataForm(ev.target)); pesan(idPesan, 'sukses', sukses); setelah?.(ev.target); }
    catch (err) { pesan(idPesan, 'galat', err.message); }
  });
  kirim('fSekolah', 'PUT', '/api/pengaturan', '#pesanSekolah', 'Pengaturan tersimpan.');
  kirim('fGuru', 'POST', '/api/pengguna', '#pesanGuru', 'Guru BK ditambahkan. Tugaskan kelas di menu Kelas & Penugasan.', () => setTimeout(() => HALAMAN.pengaturan(w), 900));
  kirim('fPassword', 'PUT', '/api/password', '#pesanPassword', 'Password berhasil diganti.', f => f.reset());
};

mulai().catch(err => { akar.innerHTML = `<div class="tengah"><div class="pesan galat">${e(err.message)}</div></div>`; });
