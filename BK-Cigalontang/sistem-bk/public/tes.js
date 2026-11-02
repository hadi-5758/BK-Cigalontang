/* Halaman pengisian asesmen oleh siswa (tanpa login). Alur: identitas → pertanyaan → hasil. */
'use strict';

const wadah = document.getElementById('tes');
const token = location.pathname.split('/').pop();
const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let data = null;     // info tes dari server
let identitas = null; // { nis, nama_depan, nama, teman }

async function kirimJson(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const isi = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(isi.galat || 'Gagal mengirim.');
  return isi;
}

const kepalaTes = () => `<div class="kartu">
  <div class="redup">${e(data.sekolah)} · Kelas ${e(data.kelas)}</div>
  <h1>${e(data.instrumen.nama)}</h1>
  <p>${e(data.instrumen.petunjuk)}</p>
  ${data.tenggat ? `<p class="redup kecil">Batas pengisian: ${data.tenggat.split('-').reverse().join('/')}</p>` : ''}
</div>`;

async function muat() {
  const res = await fetch('/api/tes/' + encodeURIComponent(token));
  data = await res.json();
  if (!res.ok) { wadah.innerHTML = `<div class="kartu"><div class="pesan galat">${e(data.galat)}</div></div>`; return; }
  layarIdentitas();
}

function layarIdentitas() {
  wadah.innerHTML = `${kepalaTes()}
  <form class="kartu" id="fIdentitas"><h2>Identitas</h2>
    <div class="dua-kolom">
      <div><label class="wajib">NIS</label><input name="nis" required inputmode="numeric" autocomplete="off"></div>
      <div><label class="wajib">Nama depan</label><input name="nama_depan" required autocomplete="off" placeholder="Sesuai data sekolah"></div>
    </div>
    <div id="pesanIdentitas"></div>
    <p><button class="btn">Lanjut</button></p>
  </form>`;
  document.getElementById('fIdentitas').addEventListener('submit', async ev => {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const body = { nis: fd.get('nis').trim(), nama_depan: fd.get('nama_depan').trim() };
    try {
      const r = await kirimJson(`/api/tes/${encodeURIComponent(token)}/identitas`, body);
      identitas = { ...body, nama: r.nama, teman: r.teman || [] };
      layarPertanyaan();
    } catch (err) { document.getElementById('pesanIdentitas').innerHTML = `<div class="pesan galat">${e(err.message)}</div>`; }
  });
}

// ---------- Tampilan pertanyaan per instrumen ----------
const TAMPIL = {
  akpd: ins => `<div class="kartu"><h2>Pernyataan</h2>${ins.butir.map(b =>
    `<div class="butir"><label class="cek"><input type="checkbox" name="b" value="${b.no}"> <span>${b.no}. ${e(b.teks)}</span></label></div>`).join('')}</div>`,

  dcm: ins => {
    const grup = {};
    ins.butir.forEach(b => { (grup[b.bidang] ??= []).push(b); });
    return Object.entries(grup).map(([kode, butir]) => `<div class="kartu"><h2>${e(ins.bidang[kode])}</h2>${butir.map(b =>
      `<div class="butir"><label class="cek"><input type="checkbox" name="b" value="${b.no}"> <span>${b.no}. ${e(b.teks)}</span></label></div>`).join('')}</div>`).join('')
      + `<div class="kartu"><label class="cek"><input type="checkbox" name="konsultasi" value="1"> <span><b>Saya ingin berbicara dengan guru BK</b> tentang masalah yang saya centang.</span></label></div>`;
  },

  riasec: ins => `<div class="kartu"><h2>Pernyataan</h2>${ins.butir.map(b => `<div class="butir"><div>${b.no}. ${e(b.teks)}</div>
    <div class="skala">${ins.skala.map(s => `<label><input type="radio" name="b${b.no}" value="${s.nilai}" required> ${e(s.label)}</label>`).join('')}</div></div>`).join('')}</div>`,

  gaya: ins => `<div class="kartu"><h2>Pilih satu yang paling sesuai</h2>${ins.set.map(s => `<div class="butir"><div><b>Nomor ${s.no}</b></div>
    <div class="skala kolom">${s.pilihan.map(p => `<label><input type="radio" name="g${s.no}" value="${p.kode}" required> ${e(p.teks)}</label>`).join('')}</div></div>`).join('')}</div>`,

  eskul: ins => `<div class="kartu"><h2>Pilih maksimal ${ins.maksPilihan}</h2>
    <p class="redup kecil">Urutan pilihan mengikuti urutan kamu mencentang. Pilihan pertama dianggap yang paling diminati.</p>
    <div class="kisi-cek">${ins.daftar.map(nama => `<label class="cek-kelas"><input type="checkbox" name="eskul" value="${e(nama)}"> <span>${e(nama)}</span></label>`).join('')}</div>
    <p class="kecil" id="urutanEskul"></p></div>`,

  sosiometri: ins => {
    const pilihTeman = (nama, judul) => `<div class="kartu"><h2>${e(judul)}</h2>
      <p class="redup kecil">Pilih 1 sampai ${ins.maksPilihan} teman.</p>
      <div class="kisi-cek">${identitas.teman.map(t => `<label class="cek-kelas"><input type="checkbox" name="${nama}" value="${e(t.nis)}"> <span>${e(t.nama)}</span></label>`).join('')}</div></div>`;
    return pilihTeman('positif', ins.pertanyaan) + (ins.pertanyaanNegatif
      ? pilihTeman('negatif', ins.pertanyaanNegatif).replace('Pilih 1 sampai', 'Boleh dikosongkan. Pilih paling banyak') : '');
  },
};

function layarPertanyaan() {
  const ins = data.instrumen;
  wadah.innerHTML = `${kepalaTes()}
  <div class="pesan info">Halo, <b>${e(identitas.nama)}</b>. Jawab sesuai keadaanmu yang sebenarnya.</div>
  <form id="fTes">
    ${TAMPIL[ins.kode](ins)}
    <div class="kartu">
      ${ins.kode === 'sosiometri' ? '' : `<label class="cek"><input type="checkbox" name="setuju_dibagikan" value="1">
        <span>Saya bersedia hasil ini dipakai guru BK untuk mengajak saya berdiskusi tentang ${ins.kode === 'riasec' ? 'rencana studi dan karier' : 'diri saya'}. (Boleh tidak dicentang.)</span></label>`}
      <p class="redup kecil">Jawabanmu dijaga kerahasiaannya dan hanya dibaca guru BK sekolahmu. Hasil asesmen adalah bahan refleksi, bukan diagnosis atau penentu masa depanmu.</p>
      <div id="pesanTes"></div>
      <button class="btn" type="submit">Kirim jawaban</button>
    </div>
  </form>`;

  // Batasi jumlah centang (eskul & sosiometri) dan catat urutan pilihan eskul
  const urutanEskul = [];
  const maks = ins.maksPilihan;
  if (maks) {
    wadah.querySelectorAll('input[type=checkbox][name=eskul], input[type=checkbox][name=positif], input[type=checkbox][name=negatif]').forEach(c => c.addEventListener('change', () => {
      const sekelompok = wadah.querySelectorAll(`input[name=${c.name}]:checked`);
      if (sekelompok.length > maks) { c.checked = false; alert(`Pilih paling banyak ${maks}.`); return; }
      if (c.name === 'eskul') {
        if (c.checked) urutanEskul.push(c.value); else urutanEskul.splice(urutanEskul.indexOf(c.value), 1);
        document.getElementById('urutanEskul').innerHTML = urutanEskul.length ? 'Urutan pilihanmu: ' + urutanEskul.map((x, i) => `<b>${i + 1}. ${e(x)}</b>`).join(' · ') : '';
      }
      if (c.name === 'positif' || c.name === 'negatif') {
        // Teman yang sama tidak boleh muncul di dua pertanyaan
        const lawan = c.name === 'positif' ? 'negatif' : 'positif';
        const kembar = wadah.querySelector(`input[name=${lawan}][value="${CSS.escape(c.value)}"]`);
        if (c.checked && kembar?.checked) { c.checked = false; alert('Teman yang sama tidak boleh dipilih di dua pertanyaan.'); }
      }
    }));
  }

  document.getElementById('fTes').addEventListener('submit', async ev => {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const semua = nama => fd.getAll(nama).map(String);
    let jawaban;
    if (ins.kode === 'akpd') jawaban = semua('b').map(Number);
    else if (ins.kode === 'dcm') jawaban = { butir: semua('b').map(Number), konsultasi: !!fd.get('konsultasi') };
    else if (ins.kode === 'riasec') jawaban = Object.fromEntries(ins.butir.map(b => [b.no, Number(fd.get('b' + b.no))]));
    else if (ins.kode === 'gaya') jawaban = Object.fromEntries(ins.set.map(s => [s.no, fd.get('g' + s.no)]));
    else if (ins.kode === 'eskul') jawaban = { pilihan: urutanEskul };
    else if (ins.kode === 'sosiometri') jawaban = { positif: semua('positif'), negatif: semua('negatif') };
    const tombol = ev.target.querySelector('button[type=submit]');
    tombol.disabled = true;
    try {
      const r = await kirimJson('/api/tes/' + encodeURIComponent(token), {
        nis: identitas.nis, nama_depan: identitas.nama_depan, jawaban, setuju_dibagikan: !!fd.get('setuju_dibagikan'),
      });
      selesai(r.hasil);
    } catch (err) {
      document.getElementById('pesanTes').innerHTML = `<div class="pesan galat">${e(err.message)}</div>`;
      tombol.disabled = false;
    }
  });
}

function selesai(hasil) {
  window.scrollTo(0, 0);
  const bagianTipe = (judul, tipe) => `<h2>${judul}</h2>${tipe.map(t => `<div class="butir"><b>${e(t.kode)} — ${e(t.nama)}</b><br>${e(t.ciri)}
    ${t.contoh ? `<br><span class="redup kecil">Contoh bidang: ${e(t.contoh)}</span>` : ''}${t.saran ? `<br><span class="redup kecil">Saran: ${e(t.saran)}</span>` : ''}</div>`).join('')}`;
  wadah.innerHTML = `<div class="kartu">
    <h1>Terima kasih! 🎉</h1>
    <p>Jawabanmu sudah tersimpan.</p>
    ${hasil.kodeHolland ? bagianTipe(`Kode minatmu: ${e(hasil.kodeHolland)}`, hasil.tipe)
      + '<p class="redup kecil">Minat bisa berubah seiring pengalaman. Diskusikan hasil ini dengan guru BK dan orang tuamu.</p>' : ''}
    ${hasil.gaya ? bagianTipe('Gaya perilakumu yang paling menonjol', hasil.gaya)
      + '<p class="redup kecil">Setiap gaya punya kekuatan masing-masing. Tidak ada gaya yang lebih baik.</p>' : ''}
  </div>`;
}

muat().catch(() => { wadah.innerHTML = '<div class="pesan galat">Halaman tidak bisa dimuat. Periksa koneksi internet.</div>'; });
