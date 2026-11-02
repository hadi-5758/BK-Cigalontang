/* Halaman pengisian asesmen oleh siswa (tanpa login). */
'use strict';

const wadah = document.getElementById('tes');
const token = location.pathname.split('/').pop();
const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function muat() {
  const res = await fetch('/api/tes/' + encodeURIComponent(token));
  const d = await res.json();
  if (!res.ok) { wadah.innerHTML = `<div class="kartu"><div class="pesan galat">${e(d.galat)}</div></div>`; return; }
  const ins = d.instrumen;
  const pilihan = ins.kode === 'akpd'
    ? b => `<label class="cek"><input type="checkbox" name="b${b.no}" value="${b.no}"> <span>${b.no}. ${e(b.teks)}</span></label>`
    : b => `<div>${b.no}. ${e(b.teks)}</div><div class="skala">${ins.skala.map(s =>
        `<label><input type="radio" name="b${b.no}" value="${s.nilai}" required> ${e(s.label)}</label>`).join('')}</div>`;

  wadah.innerHTML = `
  <div class="kartu">
    <div class="redup">${e(d.sekolah)} · Kelas ${e(d.kelas)}</div>
    <h1>${e(ins.nama)}</h1>
    <p>${e(ins.petunjuk)}</p>
    ${d.tenggat ? `<p class="redup kecil">Batas pengisian: ${d.tenggat.split('-').reverse().join('/')}</p>` : ''}
  </div>
  <form id="fTes">
    <div class="kartu"><h2>Identitas</h2>
      <div class="dua-kolom">
        <div><label class="wajib">NIS</label><input name="nis" required inputmode="numeric" autocomplete="off"></div>
        <div><label class="wajib">Nama depan</label><input name="nama_depan" required autocomplete="off" placeholder="Sesuai data sekolah"></div>
      </div>
    </div>
    <div class="kartu"><h2>Pernyataan</h2>
      ${ins.butir.map(b => `<div class="butir">${pilihan(b)}</div>`).join('')}
    </div>
    <div class="kartu">
      <label class="cek"><input type="checkbox" name="setuju_dibagikan" value="1">
        <span>Saya bersedia hasil ini dipakai guru BK untuk mengajak saya berdiskusi tentang ${ins.kode === 'riasec' ? 'rencana studi dan karier' : 'kebutuhan saya'}. (Boleh tidak dicentang.)</span></label>
      <p class="redup kecil">Jawabanmu dijaga kerahasiaannya dan hanya dibaca guru BK sekolahmu. Hasil tes ini adalah bahan refleksi, bukan diagnosis atau penentu masa depanmu.</p>
      <div id="pesanTes"></div>
      <button class="btn" type="submit">Kirim jawaban</button>
    </div>
  </form>`;

  document.getElementById('fTes').addEventListener('submit', async ev => {
    ev.preventDefault();
    const f = ev.target;
    const fd = new FormData(f);
    let jawaban;
    if (ins.kode === 'akpd') {
      jawaban = ins.butir.filter(b => fd.get('b' + b.no)).map(b => b.no);
    } else {
      jawaban = Object.fromEntries(ins.butir.map(b => [b.no, Number(fd.get('b' + b.no))]));
    }
    const tombol = f.querySelector('button[type=submit]');
    tombol.disabled = true;
    try {
      const res = await fetch('/api/tes/' + encodeURIComponent(token), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nis: fd.get('nis'), nama_depan: fd.get('nama_depan'), jawaban, setuju_dibagikan: !!fd.get('setuju_dibagikan') }),
      });
      const d2 = await res.json();
      if (!res.ok) throw new Error(d2.galat);
      selesai(d2.hasil);
    } catch (err) {
      document.getElementById('pesanTes').innerHTML = `<div class="pesan galat">${e(err.message)}</div>`;
      tombol.disabled = false;
    }
  });
}

function selesai(hasil) {
  window.scrollTo(0, 0);
  wadah.innerHTML = `<div class="kartu">
    <h1>Terima kasih! 🎉</h1>
    <p>Jawabanmu sudah tersimpan.</p>
    ${hasil.kodeHolland ? `<h2>Kode minatmu: ${e(hasil.kodeHolland)}</h2>
      ${hasil.tipe.map(t => `<div class="butir"><b>${e(t.kode)} — ${e(t.nama)}</b><br>${e(t.ciri)}<br><span class="redup kecil">Contoh bidang: ${e(t.contoh)}</span></div>`).join('')}
      <p class="redup kecil">Minat bisa berubah seiring pengalaman. Diskusikan hasil ini dengan guru BK dan orang tuamu.</p>` : ''}
  </div>`;
}

muat().catch(() => { wadah.innerHTML = '<div class="pesan galat">Halaman tidak bisa dimuat. Periksa koneksi internet.</div>'; });
