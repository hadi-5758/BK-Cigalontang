/**
 * Kas Revitalisasi Sekolah — penyimpanan di Google Sheets.
 *
 * Script ini dipasang dari dalam spreadsheet (Ekstensi → Apps Script).
 * Setiap jenis transaksi punya tab sendiri; aplikasi web (Index.html)
 * membaca dan menulis lewat fungsi-fungsi di bawah.
 */

const SHEETS = {
  salur: {name: 'Dana Salur', hide: ['id'], cols: [
    ['id', 'ID'], ['tanggal', 'Tanggal'], ['tahap', 'Tahap'], ['nominal', 'Nominal'], ['ket', 'Keterangan'],
    ['created', 'Dibuat'], ['updated', 'Diubah']]},
  tarik: {name: 'Tarik Tunai', hide: ['id'], cols: [
    ['id', 'ID'], ['tanggal', 'Tanggal'], ['noSI', 'Nomor SI'], ['nominal', 'Nominal'], ['ket', 'Keterangan'],
    ['created', 'Dibuat'], ['updated', 'Diubah']]},
  keluar: {name: 'Pengeluaran', hide: ['id'], cols: [
    ['id', 'ID'], ['tanggal', 'Tanggal'], ['noBukti', 'No. Bukti'], ['kepada', 'Dikeluarkan Kepada'],
    ['keperluan', 'Untuk Keperluan'], ['kategori', 'Kategori'], ['kelompok', 'Kelompok'], ['nominal', 'Nominal'],
    ['volume', 'Volume'], ['satuan', 'Satuan'], ['ket', 'Keterangan'], ['created', 'Dibuat'], ['updated', 'Diubah']]},
  cicil: {name: 'Cicilan Kasbon', hide: ['id', 'piutangId'], cols: [
    ['id', 'ID'], ['piutangId', 'ID Kasbon'], ['tanggal', 'Tanggal'], ['nama', 'Nama Pekerja'], ['cara', 'Cara'],
    ['nominal', 'Nominal'], ['ket', 'Keterangan'], ['created', 'Dibuat'], ['updated', 'Diubah']]}
};
const SHEET_SETTING = 'Pengaturan';
const SHEET_RINGKASAN = 'Ringkasan';
const SETTING_KEYS = [
  ['sekolah', 'Nama sekolah'], ['lokasi', 'Tempat (tanda tangan)'], ['kepsek', 'Kepala Sekolah'],
  ['nipKepsek', 'NIP Kepala Sekolah'], ['ketua', 'Ketua Panitia'], ['bendahara', 'Bendahara'], ['nipBendahara', 'NIP Bendahara']];
const KELOMPOK = [
  ['Material', ['Pasir Cor', 'Pasir Pasang', 'Batu Split', 'Batu Beulah', 'Semen', 'Kayu', 'Granit', 'Besi', 'Wermes', 'Bondek', 'Bahan Kusen', 'Terakota', 'Bahan Bangunan']],
  ['Upah', ['Upah Tukang Mingguan', 'Upah Pasang Plafon', 'Upah Pasang Atap', 'Upah Pasang Kusen']],
  ['Operasional', ['Konsumsi', 'Alat Bangunan', 'Sewa']]
];
const FOLDER_ARSIP = 'Kas Revitalisasi - Arsip';
const WARNA_JUDUL = '#e1f1ee';

/* ---------- Aplikasi web ---------- */

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Kas Revitalisasi Sekolah')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
}

/** Jalankan sekali dari editor Apps Script untuk menyiapkan tab dan memberi izin. */
function setup() {
  const ss = spreadsheet_();
  Object.keys(SHEETS).forEach(function (k) { sheet_(ss, k); });
  settingSheet_(ss);
  ringkasan_(ss);
  hapusLembarKosongBawaan_(ss);
  folderArsip_();
  Logger.log('Siap. Spreadsheet: ' + ss.getUrl());
  return ss.getUrl();
}

/* ---------- Dipanggil dari aplikasi (google.script.run) ---------- */

function getAll() {
  const ss = spreadsheet_();
  const tz = ss.getSpreadsheetTimeZone();
  const out = {sheetUrl: ss.getUrl(), setting: readSetting_(ss)};
  Object.keys(SHEETS).forEach(function (k) { out[k] = readSheet_(ss, k, tz); });
  return out;
}

function putRec(key, rec) {
  validKey_(key);
  if (!rec || !rec.id) throw new Error('Data tidak valid.');
  return withLock_(function () {
    const ss = spreadsheet_(), tz = ss.getSpreadsheetTimeZone(), sh = sheet_(ss, key);
    const h = headerMap_(sh, key);
    const row = findRow_(sh, h.map.id, rec.id);
    if (row) {
      const range = sh.getRange(row, 1, 1, h.width);
      range.setValues([toRow_(key, rec, h.map, tz, range.getValues()[0])]);
    } else {
      sh.appendRow(toRow_(key, rec, h.map, tz, kosong_(h.width)));
    }
    return true;
  });
}

function delRec(key, id) {
  validKey_(key);
  return withLock_(function () {
    const ss = spreadsheet_(), sh = sheet_(ss, key);
    const row = findRow_(sh, headerMap_(sh, key).map.id, id);
    if (row) sh.deleteRow(row);
    return true;
  });
}

function putSetting(obj) {
  return withLock_(function () {
    writeSetting_(spreadsheet_(), obj || {});
    return true;
  });
}

/** Ganti seluruh isi (dipakai untuk Pulihkan Backup dan Hapus Semua). */
function replaceAll(data) {
  data = data || {};
  return withLock_(function () {
    const ss = spreadsheet_(), tz = ss.getSpreadsheetTimeZone();
    Object.keys(SHEETS).forEach(function (key) {
      const sh = sheet_(ss, key), h = headerMap_(sh, key);
      const last = sh.getLastRow();
      if (last > 1) sh.getRange(2, 1, last - 1, h.width).clearContent();
      const recs = (data[key] || []).filter(function (r) { return r && r.id; });
      if (!recs.length) return;
      const need = recs.length + 1 - sh.getMaxRows();
      if (need > 0) sh.insertRowsAfter(sh.getMaxRows(), need);
      sh.getRange(2, 1, recs.length, h.width).setValues(recs.map(function (r) { return toRow_(key, r, h.map, tz, kosong_(h.width)); }));
    });
    if (data.setting) writeSetting_(ss, data.setting);
    return true;
  });
}

/** Simpan file (PDF/Excel/backup) ke folder arsip di Google Drive. */
function saveFile(name, base64, mime) {
  const folder = folderArsip_();
  const blob = Utilities.newBlob(Utilities.base64Decode(base64), mime || 'application/octet-stream', name);
  const file = folder.createFile(blob);
  return {url: file.getUrl(), name: file.getName(), folder: folder.getName()};
}

/* ---------- Internal ---------- */

function spreadsheet_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('SHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Script harus dibuat dari menu Ekstensi → Apps Script di dalam Google Sheets, lalu jalankan fungsi setup.');
  props.setProperty('SHEET_ID', ss.getId());
  return ss;
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function validKey_(key) {
  if (!SHEETS[key]) throw new Error('Jenis data tidak dikenal: ' + key);
}

function kosong_(n) {
  const a = [];
  for (let i = 0; i < n; i++) a.push('');
  return a;
}

function sheet_(ss, key) {
  const def = SHEETS[key];
  let sh = ss.getSheetByName(def.name);
  if (!sh) {
    sh = ss.insertSheet(def.name);
    sh.getRange(1, 1, 1, def.cols.length).setValues([def.cols.map(function (c) { return c[1]; })])
      .setFontWeight('bold').setBackground(WARNA_JUDUL);
    sh.setFrozenRows(1);
    def.cols.forEach(function (c, i) {
      const r = sh.getRange(2, i + 1, sh.getMaxRows() - 1, 1);
      if (c[0] === 'tanggal') r.setNumberFormat('dd/mm/yyyy');
      else if (c[0] === 'nominal') r.setNumberFormat('#,##0');
      else if (c[0] === 'created' || c[0] === 'updated') r.setNumberFormat('dd/mm/yyyy hh:mm');
      else r.setNumberFormat('@'); // teks apa adanya, mis. "005/SI/X/2026" tidak berubah jadi tanggal
    });
    def.hide.forEach(function (k) {
      const i = def.cols.findIndex(function (c) { return c[0] === k; });
      if (i >= 0) sh.hideColumns(i + 1);
    });
  }
  return sh;
}

/** Posisi kolom dicari dari judulnya, jadi kolom boleh digeser atau ditambah sendiri. */
function headerMap_(sh, key) {
  const def = SHEETS[key];
  let width = Math.max(sh.getLastColumn(), 1);
  const head = sh.getRange(1, 1, 1, width).getValues()[0].map(String);
  const map = {};
  def.cols.forEach(function (c) {
    let i = head.indexOf(c[1]);
    if (i < 0) { // kolom hilang: tambahkan lagi di ujung
      width++;
      sh.getRange(1, width).setValue(c[1]).setFontWeight('bold').setBackground(WARNA_JUDUL);
      head.push(c[1]);
      i = width - 1;
    }
    map[c[0]] = i;
  });
  return {map: map, width: width};
}

function findRow_(sh, idIdx, id) {
  const last = sh.getLastRow();
  if (last < 2) return 0;
  const ids = sh.getRange(2, idIdx + 1, last - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return i + 2;
  return 0;
}

function readSheet_(ss, key, tz) {
  const def = SHEETS[key], sh = sheet_(ss, key), h = headerMap_(sh, key);
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, h.width).getValues()
    .filter(function (r) { return r[h.map.id] !== '' && r[h.map.id] != null; })
    .map(function (r) {
      const o = {};
      def.cols.forEach(function (c) { o[c[0]] = fromCell_(c[0], r[h.map[c[0]]], tz); });
      return o;
    });
}

function fromCell_(k, v, tz) {
  if (k === 'tanggal') {
    if (v instanceof Date) return Utilities.formatDate(v, tz, 'yyyy-MM-dd');
    const s = String(v || '').trim();
    const m = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/.exec(s); // diketik manual: 5/9/2026
    if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
    return s.slice(0, 10);
  }
  if (k === 'created' || k === 'updated') return v instanceof Date ? v.getTime() : (Number(v) || 0);
  if (k === 'nominal') return Math.round(Number(String(v).replace(/[^\d.-]/g, '')) || 0);
  return v == null ? '' : String(v);
}

function toRow_(key, rec, map, tz, base) {
  const row = base.slice();
  SHEETS[key].cols.forEach(function (c) {
    const k = c[0];
    let v = rec[k];
    if (k === 'tanggal') v = v ? Utilities.parseDate(String(v), tz, 'yyyy-MM-dd') : '';
    else if (k === 'created' || k === 'updated') v = v ? new Date(Number(v)) : '';
    else if (k === 'nominal') v = Math.round(Number(v) || 0);
    else v = v == null ? '' : String(v);
    row[map[k]] = v;
  });
  return row;
}

function settingSheet_(ss) {
  let sh = ss.getSheetByName(SHEET_SETTING);
  if (!sh) {
    sh = ss.insertSheet(SHEET_SETTING);
    sh.getRange(1, 1, 1, 3).setValues([['Kunci', 'Keterangan', 'Isi']]).setFontWeight('bold').setBackground(WARNA_JUDUL);
    sh.getRange(2, 1, SETTING_KEYS.length, 3).setNumberFormat('@')
      .setValues(SETTING_KEYS.map(function (k) { return [k[0], k[1], '']; }));
    sh.setFrozenRows(1);
    sh.hideColumns(1);
    sh.setColumnWidth(2, 200);
    sh.setColumnWidth(3, 280);
  }
  return sh;
}

function readSetting_(ss) {
  const sh = settingSheet_(ss), last = sh.getLastRow(), out = {};
  if (last < 2) return out;
  sh.getRange(2, 1, last - 1, 3).getValues().forEach(function (r) { if (r[0]) out[String(r[0])] = String(r[2] == null ? '' : r[2]); });
  return out;
}

function writeSetting_(ss, obj) {
  const sh = settingSheet_(ss);
  const rows = SETTING_KEYS.map(function (k) { return [k[0], k[1], obj[k[0]] == null ? '' : String(obj[k[0]])]; });
  const last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, 3).clearContent();
  sh.getRange(2, 1, rows.length, 3).setNumberFormat('@').setValues(rows);
}

function kolom_(key, field) {
  const i = SHEETS[key].cols.findIndex(function (c) { return c[0] === field; });
  return String.fromCharCode(65 + i); // semua tab < 26 kolom
}

/** Tab Ringkasan berisi rumus, jadi tetap benar walau data diubah langsung di Sheet. */
function ringkasan_(ss) {
  if (ss.getSheetByName(SHEET_RINGKASAN)) return;
  const sh = ss.insertSheet(SHEET_RINGKASAN, 0);
  const q = function (key) { return "'" + SHEETS[key].name + "'!"; };
  const nomSalur = q('salur') + kolom_('salur', 'nominal') + '2:' + kolom_('salur', 'nominal');
  const nomTarik = q('tarik') + kolom_('tarik', 'nominal') + '2:' + kolom_('tarik', 'nominal');
  const nomKeluar = q('keluar') + kolom_('keluar', 'nominal') + '2:' + kolom_('keluar', 'nominal');
  const katKeluar = q('keluar') + kolom_('keluar', 'kategori') + '2:' + kolom_('keluar', 'kategori');
  const nomCicil = q('cicil') + kolom_('cicil', 'nominal') + '2:' + kolom_('cicil', 'nominal');

  sh.getRange('A1').setValue('RINGKASAN KAS REVITALISASI SEKOLAH').setFontWeight('bold').setFontSize(13);
  sh.getRange('A2').setValue('Dihitung otomatis dari tab lain. Jangan diketik manual.').setFontColor('#62706d');
  const ring = [
    ['Total Dana Salur', '=SUM(' + nomSalur + ')'],
    ['Total Tarik Tunai', '=SUM(' + nomTarik + ')'],
    ['Saldo Rekening Bank', '=B4-B5'],
    ['Total Pengeluaran (termasuk kasbon)', '=SUM(' + nomKeluar + ')'],
    ['Kasbon Pekerja Diberikan', '=SUMIF(' + katKeluar + ',"Piutang",' + nomKeluar + ')'],
    ['Biaya Proyek (tanpa kasbon)', '=B7-B8'],
    ['Cicilan Kasbon Kembali', '=SUM(' + nomCicil + ')'],
    ['Sisa Kasbon Belum Kembali', '=B8-B10'],
    ['Saldo Kas Tunai', '=B5+B10-B7'],
    ['Penyerapan Dana (biaya ÷ dana salur)', '=IF(B4=0,0,B9/B4)']
  ];
  sh.getRange(4, 1, ring.length, 2).setValues(ring);
  sh.getRange('B4:B12').setNumberFormat('#,##0');
  sh.getRange('B13').setNumberFormat('0.00%');
  sh.getRange('A6:B6').setFontWeight('bold');
  sh.getRange('A12:B12').setFontWeight('bold');

  let r = 15;
  sh.getRange(r, 1, 1, 4).setValues([['Kelompok', 'Kategori', 'Jumlah Transaksi', 'Nominal']]).setFontWeight('bold').setBackground(WARNA_JUDUL);
  r++;
  KELOMPOK.forEach(function (g) {
    g[1].forEach(function (kat) {
      sh.getRange(r, 1, 1, 4).setValues([[g[0], kat,
        '=COUNTIF(' + katKeluar + ',B' + r + ')',
        '=SUMIF(' + katKeluar + ',B' + r + ',' + nomKeluar + ')']]);
      r++;
    });
  });
  sh.getRange(r, 1, 1, 4).setValues([['', 'TOTAL BIAYA PROYEK', '=SUM(C16:C' + (r - 1) + ')', '=SUM(D16:D' + (r - 1) + ')']]).setFontWeight('bold');
  sh.getRange('D16:D' + r).setNumberFormat('#,##0');
  sh.setColumnWidth(1, 290);
  sh.setColumnWidth(2, 190);
  sh.setColumnWidth(3, 130);
  sh.setColumnWidth(4, 140);
}

function hapusLembarKosongBawaan_(ss) {
  const kita = Object.keys(SHEETS).map(function (k) { return SHEETS[k].name; }).concat([SHEET_SETTING, SHEET_RINGKASAN]);
  ss.getSheets().forEach(function (sh) {
    if (kita.indexOf(sh.getName()) < 0 && sh.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(sh);
  });
}

function folderArsip_() {
  const it = DriveApp.getFoldersByName(FOLDER_ARSIP);
  return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_ARSIP);
}
