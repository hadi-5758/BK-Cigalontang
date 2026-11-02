/* Lembar soal asesmen siap cetak (untuk asesmen massal di kertas). Perlu login guru BK. */
'use strict';

const wadah = document.getElementById('cetak');
const kode = new URLSearchParams(location.search).get('i') || 'akpd';
const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const kotak = '<span class="kotak-cek"></span>';

const ISI = {
  akpd: ins => `<ol class="soal">${ins.butir.map(b => `<li>${kotak} ${e(b.teks)}</li>`).join('')}</ol>`,
  dcm: ins => {
    const grup = {};
    ins.butir.forEach(b => { (grup[b.bidang] ??= []).push(b); });
    return Object.entries(grup).map(([k, butir]) => `<h3>${e(ins.bidang[k])}</h3><ol class="soal" start="${butir[0].no}">${butir.map(b => `<li>${kotak} ${e(b.teks)}</li>`).join('')}</ol>`).join('')
      + `<p>${kotak} <b>Saya ingin berbicara dengan guru BK tentang masalah yang saya centang.</b></p>`;
  },
  riasec: ins => `<table class="tabel-cetak"><thead><tr><th>No</th><th>Kegiatan</th>${ins.skala.map(s => `<th>${e(s.label)}</th>`).join('')}</tr></thead><tbody>
    ${ins.butir.map(b => `<tr><td>${b.no}</td><td>${e(b.teks)}</td>${ins.skala.map(() => `<td>${kotak}</td>`).join('')}</tr>`).join('')}</tbody></table>`,
  gaya: ins => ins.set.map(s => `<div class="set-cetak"><b>${s.no}.</b> ${s.pilihan.map(p => `<div>${kotak} <b>${p.kode}</b>. ${e(p.teks)}</div>`).join('')}</div>`).join(''),
  eskul: ins => `<p>Tulis nomor urut 1–${ins.maksPilihan} pada kotak eskul pilihanmu.</p><div class="kolom-cetak">${ins.daftar.map(n => `<div>${kotak} ${e(n)}</div>`).join('')}</div>`,
  sosiometri: ins => `<p><b>${e(ins.pertanyaan)}</b></p><ol>${Array.from({ length: ins.maksPilihan }, () => '<li class="garis-isi">&nbsp;</li>').join('')}</ol>
    <p class="redup">Untuk pertanyaan negatif (jika dipakai), guru BK akan memberi lembar tambahan.</p>`,
};

async function muat() {
  const res = await fetch('/api/instrumen/' + encodeURIComponent(kode));
  const ins = await res.json();
  if (!res.ok) { wadah.innerHTML = `<div class="pesan galat">${e(ins.galat || 'Gagal memuat. Pastikan Anda sudah masuk.')}</div>`; return; }
  document.title = `Lembar ${ins.nama}`;
  wadah.innerHTML = `
  <p class="tanpa-cetak"><button class="btn" id="tombolCetak">🖨 Cetak</button> <span class="redup">Setelah diisi siswa, rekap jawaban ke template Excel sesi lalu unggah di Pusat Asesmen.</span></p>
  <h1>${e(ins.nama)}</h1>
  <table class="identitas-cetak"><tr><td>Nama</td><td>: ____________________________</td><td>Kelas</td><td>: __________</td></tr>
    <tr><td>NIS</td><td>: ____________________________</td><td>Tanggal</td><td>: __________</td></tr></table>
  <p><i>${e(ins.petunjuk)}</i></p>
  ${ISI[kode](ins)}
  ${kode === 'sosiometri' ? '' : `<p style="margin-top:18px">${kotak} Saya bersedia hasil ini dipakai guru BK untuk mengajak saya berdiskusi.</p>`}`;
  document.getElementById('tombolCetak').addEventListener('click', () => window.print());
}

muat().catch(() => { wadah.innerHTML = '<div class="pesan galat">Halaman tidak bisa dimuat.</div>'; });
