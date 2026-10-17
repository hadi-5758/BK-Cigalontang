#!/usr/bin/env node
/**
 * Generator Gambar Konten Instagram BK — multi-AI (Gemini / ChatGPT)
 *
 * Membaca naskah .md (carousel/stories), mengambil "Saran visual" tiap slide,
 * lalu meminta AI gambar membuatkan ilustrasi latar per slide.
 *
 * Contoh:
 *   node konten-instagram/tools/generate-gambar.js naskah/carousel/sosial-cyberbullying-tanda-tanda.md
 *   node konten-instagram/tools/generate-gambar.js <naskah.md> --provider openai --slide 1,7
 *   node konten-instagram/tools/generate-gambar.js --prompt "ilustrasi siswa belajar bersama" --format story
 *   node konten-instagram/tools/generate-gambar.js <naskah.md> --dry-run   (hanya tampilkan prompt)
 *
 * Kunci API dibaca dari .env (GEMINI_API_KEY / OPENAI_API_KEY) — jangan ditulis di kode.
 */

const fs = require('fs');
const path = require('path');

// Muat .env dari folder BK-Cigalontang (pakai dotenv bila terpasang, atau fitur bawaan Node 20.12+)
const FILE_ENV = path.join(__dirname, '..', '..', '.env');
if (fs.existsSync(FILE_ENV)) {
  try {
    require('dotenv').config({ path: FILE_ENV });
  } catch {
    process.loadEnvFile?.(FILE_ENV);
  }
}

const ROOT_KONTEN = path.join(__dirname, '..');

// Gaya visual standar sesuai konten-instagram/CLAUDE.md (Standar Visual)
const GAYA_DASAR = [
  'Flat vector illustration, modern, friendly, suitable for Indonesian high school students (age 15-18).',
  'Warm and supportive mood, clean composition, soft gradients, high contrast.',
  'Characters are stylized illustrations (not photos of real people), diverse Indonesian students,',
  'some female students wearing hijab, school uniform white-grey (SMA) when relevant.',
  'No explicit violence, no blood, no self-harm imagery.',
  'IMPORTANT: do not render any text, letters, words, numbers or logos in the image.',
  'Leave clear empty space for text overlay that will be added later.'
].join(' ');

const FORMAT = {
  feed: { label: 'square 1:1 Instagram feed post', gemini: '1:1', openai: '1024x1024' },
  story: { label: 'vertical 9:16 Instagram story', gemini: '9:16', openai: '1024x1536' }
};

// ===== Argumen CLI =====
function bacaArgumen(argv) {
  const opsi = { provider: process.env.IMAGE_PROVIDER || 'gemini', dryRun: false };
  const sisa = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--provider') opsi.provider = argv[++i];
    else if (a === '--slide') opsi.slide = argv[++i].split(',').map(Number);
    else if (a === '--format') opsi.format = argv[++i];
    else if (a === '--prompt') opsi.prompt = argv[++i];
    else if (a === '--out') opsi.out = argv[++i];
    else if (a === '--dry-run') opsi.dryRun = true;
    else if (a === '--help' || a === '-h') opsi.help = true;
    else sisa.push(a);
  }
  opsi.naskah = sisa[0];
  return opsi;
}

// ===== Parser naskah =====
// Memecah naskah berdasarkan heading "### SLIDE n" / "### STORY n"
function parseNaskah(isi) {
  // Topik diambil dari judul dokumen, misal "# Naskah Carousel — Mengenali Cyberbullying"
  const judulDok = (isi.match(/^# (.+)$/m) || [])[1] || '';
  const topik = judulDok.split(/[—-]/).slice(1).join('-').trim() || judulDok;
  const bagian = isi.split(/^### /m).slice(1);
  const slides = [];
  for (const b of bagian) {
    const baris = b.split('\n');
    const judulHeading = baris[0].trim();
    const cocok = judulHeading.match(/^(SLIDE|STORY)\s+(\d+)\s*[—-]?\s*(.*)$/i);
    if (!cocok) continue;

    const judulSlide = (b.match(/\*\*Judul slide:\*\*\s*(.+)/) || [])[1] || cocok[3];

    // Ambil bullet di bawah "**Saran visual:**" sampai baris kosong / blok baru
    const visual = [];
    const idx = baris.findIndex(l => /\*\*Saran visual:?\*\*/i.test(l));
    if (idx >= 0) {
      for (let i = idx + 1; i < baris.length; i++) {
        const l = baris[i].trim();
        if (l.startsWith('- ')) visual.push(l.slice(2));
        else if (l === '' && visual.length === 0) continue;
        else break;
      }
    }

    slides.push({
      topik,
      jenis: cocok[1].toUpperCase(),
      nomor: Number(cocok[2]),
      judul: judulSlide.trim(),
      visual
    });
  }
  return slides;
}

function buatPrompt(slide, format) {
  const visual = slide.visual.length
    ? slide.visual.filter(v => !/font|teks|logo|nama akun/i.test(v)).join('; ')
    : `an illustration that represents the theme: "${slide.judul}"`;
  return [
    `Create a ${FORMAT[format].label} background illustration for a school counseling (Bimbingan Konseling) Instagram post.`,
    slide.topik ? `Content topic (Indonesian): "${slide.topik}".` : '',
    `Slide theme (Indonesian): "${slide.judul}".`,
    `Visual direction (Indonesian): ${visual}.`,
    GAYA_DASAR
  ].filter(Boolean).join('\n');
}

// ===== Provider: Google Gemini (Nano Banana) =====
async function gambarGemini(prompt, format) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY belum diisi di file .env');
  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ['IMAGE'],
        imageConfig: { aspectRatio: FORMAT[format].gemini }
      }
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${data.error?.message || JSON.stringify(data)}`);

  const parts = data.candidates?.[0]?.content?.parts || [];
  const img = parts.find(p => p.inlineData || p.inline_data);
  if (!img) throw new Error('Gemini tidak mengembalikan gambar (mungkin diblokir filter keamanan). Coba ubah prompt.');
  return Buffer.from((img.inlineData || img.inline_data).data, 'base64');
}

// ===== Provider: OpenAI (ChatGPT / GPT Image) =====
async function gambarOpenAI(prompt, format) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY belum diisi di file .env');
  const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, prompt, size: FORMAT[format].openai, n: 1 })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${data.error?.message || JSON.stringify(data)}`);

  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error('OpenAI tidak mengembalikan gambar.');
  return Buffer.from(b64, 'base64');
}

const PROVIDER = { gemini: gambarGemini, openai: gambarOpenAI };

// ===== Utama =====
async function main() {
  const opsi = bacaArgumen(process.argv.slice(2));
  if (opsi.help || (!opsi.naskah && !opsi.prompt)) {
    console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0]);
    return;
  }
  const buatGambar = PROVIDER[opsi.provider];
  if (!buatGambar) throw new Error(`Provider tidak dikenal: ${opsi.provider} (pilih: ${Object.keys(PROVIDER).join(', ')})`);

  let tugas = [];
  let folderOut;

  if (opsi.prompt) {
    const format = opsi.format || 'feed';
    if (!FORMAT[format]) throw new Error(`Format tidak dikenal: ${format} (pilih: feed, story)`);
    tugas.push({ nama: `custom-${Date.now()}.png`, prompt: buatPrompt({ judul: opsi.prompt, visual: [] }, format), format });
    folderOut = opsi.out || path.join(ROOT_KONTEN, 'desain', 'gambar', 'custom');
  } else {
    const fileNaskah = fs.existsSync(opsi.naskah) ? opsi.naskah : path.join(ROOT_KONTEN, opsi.naskah);
    if (!fs.existsSync(fileNaskah)) throw new Error(`File naskah tidak ditemukan: ${opsi.naskah}`);

    let slides = parseNaskah(fs.readFileSync(fileNaskah, 'utf8'));
    if (opsi.slide) slides = slides.filter(s => opsi.slide.includes(s.nomor));
    if (!slides.length) throw new Error('Tidak ada slide yang cocok di naskah.');

    tugas = slides.map(s => {
      const format = opsi.format || (s.jenis === 'STORY' ? 'story' : 'feed');
      return { nama: `${s.jenis.toLowerCase()}-${s.nomor}.png`, prompt: buatPrompt(s, format), format };
    });
    const slug = path.basename(fileNaskah, '.md');
    folderOut = opsi.out || path.join(ROOT_KONTEN, 'desain', 'gambar', slug);
  }

  if (!opsi.dryRun) fs.mkdirSync(folderOut, { recursive: true });
  console.log(`Provider: ${opsi.provider} | ${tugas.length} gambar → ${folderOut}\n`);

  for (const t of tugas) {
    if (opsi.dryRun) {
      console.log(`--- ${t.nama} (${t.format}) ---\n${t.prompt}\n`);
      continue;
    }
    process.stdout.write(`⏳ ${t.nama} ... `);
    try {
      const buffer = await buatGambar(t.prompt, t.format);
      fs.writeFileSync(path.join(folderOut, t.nama), buffer);
      console.log('✓');
    } catch (err) {
      console.log(`✗ ${err.message}`);
    }
  }
}

main().catch(err => {
  console.error('Gagal:', err.message);
  process.exit(1);
});
