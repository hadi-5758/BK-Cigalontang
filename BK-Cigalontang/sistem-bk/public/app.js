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
const MENU = [
  ['beranda', 'Beranda'],
  ['layanan', 'Catatan Layanan'],
  ['siswa', 'Data Siswa'],
  ['kelas', 'Kelas & Penugasan'],
  ['asesmen', 'Asesmen'],
  ['laporan', 'Laporan Bulanan'],
  ['pengaturan', 'Pengaturan'],
];

function kerangka() {
  akar.innerHTML = `
  <div class="tata">
    <nav class="sisi" id="sisi">
      <div class="merek">Sistem BK</div>
      <div class="sekolah">${e(keadaan.sekolah)}</div>
      ${MENU.map(([k, l]) => `<a href="#${k}" data-menu="${k}">${l}</a>`).join('')}
      <div class="bawah">
        <div>${e(keadaan.pengguna.nama)}</div>
        <div class="redup" style="color:#cfe0ee">${keadaan.pengguna.peran === 'koordinator' ? 'Koordinator BK' : 'Guru BK'}</div>
        <p><a href="#" id="tombolKeluar">Keluar</a></p>
      </div>
    </nav>
    <main class="isi">
      <button class="btn kedua tombol-menu" id="tombolMenu">☰ Menu</button>
      <div id="halaman"></div>
    </main>
  </div>`;
  document.getElementById('tombolKeluar').addEventListener('click', async ev => {
    ev.preventDefault();
    await api('POST', '/api/keluar');
    keadaan.pengguna = null;
    location.hash = '';
    mulai();
  });
  document.getElementById('tombolMenu').addEventListener('click', () => document.getElementById('sisi').classList.toggle('buka'));
}

const HALAMAN = {};
async function arahkan() {
  if (!keadaan.pengguna) return;
  const [nama, ...param] = (location.hash.slice(1) || 'beranda').split('/');
  document.querySelectorAll('[data-menu]').forEach(a => a.classList.toggle('aktif', a.dataset.menu === nama));
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
HALAMAN.beranda = async w => {
  const d = await api('GET', '/api/beranda');
  const maks = Math.max(1, ...Object.values(d.perBidang));
  w.innerHTML = `
  <div class="kepala"><div><h1>Selamat datang, ${e(keadaan.pengguna.nama)}</h1>
    <div class="redup">${judulBulan(d.bulan)}</div></div>
    <a class="btn" href="#layanan/baru">+ Catat layanan</a></div>
  ${!d.pengaturanLengkap && keadaan.pengguna.peran === 'koordinator' ? '<div class="pesan info">Lengkapi nama Kepala Sekolah di <a href="#pengaturan">Pengaturan</a> agar laporan bulanan siap ditandatangani.</div>' : ''}
  ${d.siswa === 0 ? '<div class="pesan info">Belum ada data siswa. Mulai dari <a href="#siswa">Data Siswa → Impor Excel</a>.</div>' : ''}
  <div class="kisi">
    <div class="kartu statistik"><div class="redup">Siswa aktif</div><div class="angka">${d.siswa}</div></div>
    <div class="kartu statistik"><div class="redup">Kelas</div><div class="angka">${d.kelas}</div></div>
    <div class="kartu statistik"><div class="redup">Layanan bulan ini</div><div class="angka">${d.layananBulanIni}</div></div>
    <div class="kartu statistik"><div class="redup">Asesmen terbuka</div><div class="angka">${d.asesmenAktif}</div></div>
  </div>
  <div class="dua-kolom">
    <div class="kartu"><h2>Layanan per bidang (bulan ini)</h2>
      ${Object.entries(d.perBidang).map(([b, n]) => `<div class="baris-batang"><span>${e(b)}</span><div class="batang"><span style="width:${(n / maks) * 100}%"></span></div><span>${n}</span></div>`).join('')}
    </div>
    <div class="kartu"><h2>Kasus yang masih terbuka</h2>
      ${d.kasusTerbuka.length ? `<table><tbody>${d.kasusTerbuka.map(k => `<tr class="klik" data-href="#layanan/${k.id}"><td>${tgl(k.tanggal)}</td><td>${e(k.siswa)}<div class="redup kecil">${e(k.topik)}</div></td><td>${lencanaStatus(k.status)}</td></tr>`).join('')}</tbody></table>` : '<p class="redup">Tidak ada kasus terbuka.</p>'}
    </div>
  </div>`;
  barisKlik(w);
};

function barisKlik(w) {
  w.querySelectorAll('tr[data-href]').forEach(tr => tr.addEventListener('click', () => { location.hash = tr.dataset.href; }));
}

// ============================================================
// Siswa
// ============================================================
HALAMAN.siswa = async (w, nis) => {
  if (nis) return detailSiswa(w, nis);
  const koor = keadaan.pengguna.peran === 'koordinator';
  const kelas = await api('GET', '/api/kelas');
  w.innerHTML = `
  <div class="kepala"><div><h1>Data Siswa</h1><div class="redup">NIS dipakai sebagai kunci data. Siswa tidak dihapus, hanya diarsipkan.</div></div>
    ${koor ? `<div class="baris-aksi"><a class="btn kedua" href="/api/siswa-template.xlsx">Unduh template Excel</a>
    <label class="btn" style="margin:0">Impor Excel<input type="file" id="berkasImpor" accept=".xlsx" hidden></label>
    <button class="btn kedua" id="tombolTambah">+ Tambah siswa</button></div>` : ''}</div>
  <div id="pesanSiswa"></div>
  <div id="formTambah"></div>
  <div class="kartu">
    <div class="baris-aksi" style="margin-bottom:10px">
      <input id="cari" placeholder="Cari nama atau NIS…" style="max-width:260px">
      <select id="saringKelas" style="max-width:180px"><option value="">Semua kelas</option>${opsi(kelas.map(k => [k.id, k.nama]))}</select>
      <select id="saringStatus" style="max-width:140px">${opsi([['Aktif', 'Aktif'], ['Arsip', 'Arsip']])}</select>
      <span class="redup" id="jumlah"></span>
    </div>
    <div class="tabel-gulir"><table><thead><tr><th>NIS</th><th>Nama</th><th>JK</th><th>Kelas</th></tr></thead><tbody id="daftar"></tbody></table></div>
  </div>`;

  const muat = async () => {
    const q = new URLSearchParams({ q: cari.value, kelas_id: saringKelas.value, status: saringStatus.value });
    const data = await api('GET', '/api/siswa?' + q);
    document.getElementById('jumlah').textContent = `${data.length} siswa`;
    daftar.innerHTML = data.length
      ? data.map(s => `<tr class="klik" data-href="#siswa/${e(s.nis)}"><td>${e(s.nis)}</td><td>${e(s.nama)}</td><td>${e(s.jk)}</td><td>${e(s.kelas)}</td></tr>`).join('')
      : `<tr><td colspan="4" class="redup">${koor ? 'Belum ada siswa. Unduh template, isi, lalu klik Impor Excel.' : 'Belum ada siswa di kelas binaan Anda. Minta Koordinator menugaskan kelas.'}</td></tr>`;
    barisKlik(w);
  };
  const { cari, saringKelas, saringStatus, daftar } = Object.fromEntries(['cari', 'saringKelas', 'saringStatus', 'daftar'].map(id => [id, document.getElementById(id)]));
  let jeda;
  cari.addEventListener('input', () => { clearTimeout(jeda); jeda = setTimeout(muat, 250); });
  saringKelas.addEventListener('change', muat);
  saringStatus.addEventListener('change', muat);
  await muat();

  if (!koor) return;
  document.getElementById('berkasImpor').addEventListener('change', async ev => {
    const berkas = ev.target.files[0];
    if (!berkas) return;
    pesan('#pesanSiswa', 'info', 'Mengimpor…');
    try {
      const r = await api('POST', '/api/siswa/impor', await berkas.arrayBuffer());
      pesan('#pesanSiswa', 'sukses', `Impor selesai: ${r.ditambah} siswa baru, ${r.diperbarui} diperbarui.`);
      HALAMAN.siswa(w);
    } catch (err) { pesan('#pesanSiswa', 'galat', err.message, err.rincian); }
    ev.target.value = '';
  });
  document.getElementById('tombolTambah').addEventListener('click', () => {
    document.getElementById('formTambah').innerHTML = `
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
    document.getElementById('batal').addEventListener('click', () => { document.getElementById('formTambah').innerHTML = ''; });
    document.getElementById('fSiswa').addEventListener('submit', async ev => {
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
  <div class="kepala"><div><a href="#siswa" class="kecil">← Data Siswa</a><h1>${e(s.nama)}</h1>
    <div class="redup">NIS ${e(s.nis)} · ${e(s.kelas || '-')} · ${s.jk === 'L' ? 'Laki-laki' : 'Perempuan'} · ${lencanaStatus(s.status)}</div></div>
    <div class="baris-aksi"><a class="btn" href="#layanan/baru/${e(s.nis)}">+ Catat layanan</a>
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
    const baru = s.status === 'Aktif' ? 'Arsip' : 'Aktif';
    if (!confirm(`Ubah status ${s.nama} menjadi ${baru}?`)) return;
    await api('PUT', `/api/siswa/${encodeURIComponent(s.nis)}/status`, { status: baru });
    detailSiswa(w, nis);
  });
}

// ============================================================
// Kelas & penugasan
// ============================================================
HALAMAN.kelas = async w => {
  const koor = keadaan.pengguna.peran === 'koordinator';
  const [kelas, tim] = await Promise.all([api('GET', '/api/kelas'), api('GET', '/api/pengguna')]);
  const guru = tim.filter(p => p.status === 'Aktif');
  w.innerHTML = `
  <div class="kepala"><div><h1>Kelas & Penugasan</h1>
    <div class="redup">Guru BK hanya bisa melihat siswa di kelas yang ditugaskan kepadanya. Koordinator melihat semua kelas. Acuan ABKIN: 1 konselor untuk 150 siswa.</div></div></div>
  <div class="kartu"><div class="tabel-gulir"><table>
    <thead><tr><th>Kelas</th><th>Jumlah siswa</th><th>Wali kelas</th><th>Guru BK</th>${koor ? '<th></th>' : ''}</tr></thead>
    <tbody>${kelas.length ? kelas.map(k => `<tr data-id="${k.id}">
      <td><b>${e(k.nama)}</b></td><td>${k.jumlah_siswa}</td>
      <td>${koor ? `<input class="wali" value="${e(k.wali_kelas || '')}" placeholder="Nama wali kelas">` : e(k.wali_kelas || '-')}</td>
      <td>${koor ? `<select class="guru"><option value="">— belum ditugaskan —</option>${opsi(guru.map(g => [g.id, g.nama]), k.guru_bk_id)}</select>` : e(k.guru_bk || '-')}</td>
      ${koor ? '<td><button class="btn kecil simpan">Simpan</button></td>' : ''}</tr>`).join('')
      : '<tr><td colspan="5" class="redup">Kelas terbentuk otomatis saat data siswa diimpor.</td></tr>'}</tbody>
  </table></div></div>
  ${koor ? `<div class="kartu"><h2>Beban guru BK</h2><table><thead><tr><th>Nama</th><th>Peran</th><th>Kelas</th><th>Siswa binaan</th></tr></thead><tbody>
    ${guru.map(g => { const n = kelas.filter(k => k.guru_bk_id === g.id).reduce((s, k) => s + k.jumlah_siswa, 0); return `<tr><td>${e(g.nama)}</td><td>${g.peran === 'koordinator' ? 'Koordinator' : 'Guru BK'}</td><td>${g.jumlah_kelas}</td><td>${n}${n > 150 ? ' <span class="lencana Baru">di atas 150</span>' : ''}</td></tr>`; }).join('')}
  </tbody></table></div>` : ''}`;
  w.querySelectorAll('button.simpan').forEach(b => b.addEventListener('click', async () => {
    const tr = b.closest('tr');
    await api('PUT', '/api/kelas/' + tr.dataset.id, { wali_kelas: tr.querySelector('.wali').value, guru_bk_id: tr.querySelector('.guru').value });
    b.textContent = 'Tersimpan ✓';
    setTimeout(() => HALAMAN.kelas(w), 700);
  }));
};

// ============================================================
// Layanan
// ============================================================
HALAMAN.layanan = async (w, id, nisAwal) => {
  if (id === 'baru') return formLayanan(w, nisAwal);
  if (id) return detailLayanan(w, id);
  const r = keadaan.ref;
  w.innerHTML = `
  <div class="kepala"><div><h1>Catatan Layanan</h1><div class="redup">Semua layanan masuk otomatis ke laporan bulanan.</div></div>
    <a class="btn" href="#layanan/baru">+ Catat layanan</a></div>
  <div class="kartu">
    <div class="baris-aksi" style="margin-bottom:10px">
      <select id="fJenis" style="max-width:220px"><option value="">Semua jenis</option>${opsi(Object.entries(r.jenisLayanan).map(([k, v]) => [k, v.label]))}</select>
      <input type="month" id="fBulan" value="${bulanIni()}" style="max-width:180px">
      <select id="fStatus" style="max-width:170px"><option value="">Semua (kecuali arsip)</option>${opsi(r.status.map(s => [s, s]))}</select>
    </div>
    <div class="tabel-gulir"><table><thead><tr><th>Tanggal</th><th>Kode</th><th>Jenis</th><th>Sasaran</th><th>Topik</th><th>Status</th></tr></thead><tbody id="daftarLayanan"></tbody></table></div>
  </div>`;
  const muat = async () => {
    const q = new URLSearchParams({ jenis: fJenis.value, bulan: fBulan.value, status: fStatus.value });
    const data = await api('GET', '/api/layanan?' + q);
    daftarLayanan.innerHTML = data.length ? data.map(l => `<tr class="klik" data-href="#layanan/${l.id}">
      <td>${tgl(l.tanggal)}</td><td class="kecil">${e(l.kode)}</td><td>${e(labelJenis(l.jenis))}</td>
      <td>${e(l.kelas || l.siswa || '-')}</td><td>${e(l.topik)}<div class="redup kecil">${e(l.bidang)}</div></td><td>${lencanaStatus(l.status)}</td></tr>`).join('')
      : '<tr><td colspan="6" class="redup">Belum ada layanan pada filter ini.</td></tr>';
    barisKlik(w);
  };
  const fJenis = document.getElementById('fJenis'), fBulan = document.getElementById('fBulan'), fStatus = document.getElementById('fStatus');
  const daftarLayanan = document.getElementById('daftarLayanan');
  [fJenis, fBulan, fStatus].forEach(x => x.addEventListener('change', muat));
  await muat();
};

async function formLayanan(w, nisAwal) {
  const r = keadaan.ref;
  const [kelas, siswa] = await Promise.all([api('GET', '/api/kelas'), api('GET', '/api/siswa')]);
  const terpilih = new Map();
  if (nisAwal) { const s = siswa.find(x => x.nis === nisAwal); if (s) terpilih.set(s.nis, s); }

  w.innerHTML = `
  <div class="kepala"><div><a href="#layanan" class="kecil">← Catatan Layanan</a><h1>Catat layanan</h1></div></div>
  <form class="kartu" id="fLayanan">
    <div class="dua-kolom">
      <div><label class="wajib">Jenis layanan</label><select name="jenis" id="jenis">${opsi(Object.entries(r.jenisLayanan).map(([k, v]) => [k, v.label]), nisAwal ? 'konseling_individu' : 'bimbingan_klasikal')}</select></div>
      <div><label class="wajib">Tanggal</label><input type="date" name="tanggal" value="${hariIni()}" max="${hariIni()}" required></div>
      <div><label class="wajib">Bidang</label><select name="bidang">${opsi(r.bidang.map(b => [b, b]))}</select></div>
      <div id="wadahKategori"><label class="wajib">Kategori kasus</label><select name="kategori_kasus">${opsi(Object.entries(r.kategoriKasus).map(([k, v]) => [k, `${k} — ${v}`]))}</select></div>
    </div>
    <label class="wajib">Topik / masalah</label><input name="topik" required maxlength="200" placeholder="Tulis umum, mis. 'Motivasi belajar' — detail di catatan">
    <div id="wadahKelas"><label class="wajib">Kelas</label><select name="kelas_id">${opsi(kelas.map(k => [k.id, k.nama]))}</select></div>
    <div id="wadahSiswa"><label class="wajib">Siswa</label>
      <input id="cariSiswa" placeholder="Ketik nama atau NIS lalu pilih…" list="dafSiswa" autocomplete="off">
      <datalist id="dafSiswa">${siswa.map(s => `<option value="${e(s.nis)} — ${e(s.nama)} (${e(s.kelas)})">`).join('')}</datalist>
      <div id="chipSiswa" class="baris-aksi" style="margin-top:6px"></div>
    </div>
    <label>Catatan layanan</label>
    <div class="rahasia">Catatan ini <b>dienkripsi</b> dan hanya bisa dibuka oleh Anda dan Koordinator BK. Tidak dicetak di laporan bulanan.</div>
    <textarea name="catatan" style="margin-top:6px" placeholder="Proses, hasil, kesepakatan…"></textarea>
    <div class="dua-kolom">
      <div><label>Rencana tindak lanjut</label><input name="tindak_lanjut"></div>
      <div><label>Status</label><select name="status" id="status">${opsi(r.status.filter(s => s !== 'Arsip').map(s => [s, s]), 'Selesai')}</select></div>
    </div>
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
    const sasaranKelas = r.jenisLayanan[jenis.value].sasaran === 'kelas';
    document.getElementById('wadahKelas').hidden = !sasaranKelas;
    document.getElementById('wadahSiswa').hidden = sasaranKelas;
    document.getElementById('wadahKategori').hidden = jenis.value !== 'kasus';
    document.getElementById('status').value = jenis.value === 'kasus' ? 'Baru' : 'Selesai';
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
    try {
      const hasil = await api('POST', '/api/layanan', d);
      location.hash = '#layanan/' + hasil.id;
    } catch (err) { pesan('#pesanLayanan', 'galat', err.message); }
  });
}

async function detailLayanan(w, id) {
  const l = await api('GET', '/api/layanan/' + id);
  const r = keadaan.ref;
  w.innerHTML = `
  <div class="kepala"><div><a href="#layanan" class="kecil">← Catatan Layanan</a><h1>${e(labelJenis(l.jenis))}</h1>
    <div class="redup">${e(l.kode)} · ${tgl(l.tanggal)} · Bidang ${e(l.bidang)} ${l.kategori_kasus ? '· Kategori ' + e(l.kategori_kasus) : ''}</div></div>
    <div>${lencanaStatus(l.status)}</div></div>
  <div class="kartu">
    <p><b>Topik:</b> ${e(l.topik)}</p>
    ${l.siswa.length ? `<p><b>Siswa:</b> ${l.siswa.map(s => `<a href="#siswa/${e(s.nis)}">${e(s.nama)}</a>`).join(', ')}</p>` : ''}
    <form id="fUbah">
      <label>Catatan (terenkripsi)</label><textarea name="catatan">${e(l.catatan)}</textarea>
      <div class="dua-kolom">
        <div><label>Rencana tindak lanjut</label><input name="tindak_lanjut" value="${e(l.tindak_lanjut || '')}"></div>
        <div><label>Status</label><select name="status">${opsi(r.status.map(s => [s, s]), l.status)}</select></div>
      </div>
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
