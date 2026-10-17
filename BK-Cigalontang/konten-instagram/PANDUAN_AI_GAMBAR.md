# Panduan Koneksi Claude ↔ Gemini / ChatGPT untuk Gambar Konten

Claude (di Claude Code) jago menulis naskah, caption, dan desain HTML, tetapi **tidak membuat gambar sendiri**.
Untuk ilustrasi yang lebih menarik, Claude "menyuruh" AI gambar lain lewat salah satu dari 3 cara di bawah.

```
Claude (naskah + saran visual)  ──►  Gemini / ChatGPT (bikin ilustrasi)  ──►  PNG
                                                                             │
desain/*.html (teks slide di atas gambar)  ◄─────────────────────────────────┘
```

> **Kenapa gambar dibuat tanpa teks?** AI gambar sering salah eja kata Bahasa Indonesia.
> Jadi AI hanya membuat ilustrasi latar, sedangkan teks tetap ditaruh di desain HTML/Canva agar rapi dan bisa diedit.

---

## Cara 1 — Skrip Otomatis (Disarankan)

Skrip `tools/generate-gambar.js` membaca naskah, mengambil **Saran visual** tiap slide, lalu memanggil API.

### Langkah setup (sekali saja)

1. **Ambil API key**
   - Gemini (gratis, ada kuota harian): https://aistudio.google.com/app/apikey
   - ChatGPT/OpenAI (berbayar per gambar): https://platform.openai.com/api-keys
     *(langganan ChatGPT Plus **tidak** termasuk kuota API — perlu isi saldo terpisah)*
2. Salin `.env.example` menjadi `.env` di folder `BK-Cigalontang/`, lalu isi:
   ```
   GEMINI_API_KEY=isi_key_gemini
   OPENAI_API_KEY=isi_key_openai      # opsional
   IMAGE_PROVIDER=gemini              # atau openai
   ```
3. Pastikan Node.js versi 20 ke atas (`node -v`).

### Pemakaian

Jalankan dari folder `BK-Cigalontang/`:

```bash
# Semua slide carousel, pakai Gemini
npm run gambar -- naskah/carousel/sosial-cyberbullying-tanda-tanda.md

# Slide 1 dan 7 saja, pakai ChatGPT
npm run gambar -- naskah/carousel/sosial-cyberbullying-tanda-tanda.md --provider openai --slide 1,7

# Stories otomatis format 9:16
npm run gambar -- naskah/stories/belajar-persiapan-utbk.md

# Gambar bebas dari satu kalimat
npm run gambar -- --prompt "siswa SMA belajar bersama di perpustakaan, suasana hangat" --format story

# Cek prompt dulu tanpa memakai kuota
npm run gambar -- naskah/carousel/sosial-cyberbullying-tanda-tanda.md --dry-run
```

Hasil tersimpan di `desain/gambar/<nama-naskah>/slide-1.png`, `slide-2.png`, dst.

### Memakai gambar di desain HTML

Di file `desain/*.html`, tambahkan gambar sebagai latar slide:

```css
.s1 {
  background:
    linear-gradient(rgba(15,12,41,.55), rgba(15,12,41,.85)),   /* lapisan gelap agar teks terbaca */
    url('gambar/sosial-cyberbullying-tanda-tanda/slide-1.png') center/cover;
}
```

### Atau minta Claude yang menjalankan

Cukup ketik di Claude Code:

> Buatkan naskah carousel tentang *toxic friendship*, lalu jalankan
> `npm run gambar` untuk naskah itu dan pasang gambarnya di desain HTML.

Claude akan menulis naskah → memanggil skrip → Gemini/ChatGPT membuat gambar → Claude memasang ke HTML.

---

## Cara 2 — MCP Server (Claude memanggil Gemini langsung sebagai "tool")

MCP membuat Claude Code punya tool tambahan, misal `generate_image`, tanpa skrip.
Folder `nano-banana-mcp/` di repo ini dimaksudkan untuk itu, tetapi saat ini kosong
(tercatat sebagai submodule tanpa alamat). Cara memasang MCP Nano Banana (Gemini Image):

```bash
# Ganti <PAKET_MCP> dengan paket MCP Nano Banana yang Anda pilih dari npm
claude mcp add nano-banana --env GEMINI_API_KEY=isi_key_gemini -- npx -y <PAKET_MCP>
claude mcp list        # pastikan statusnya "connected"
```

Lalu di Claude Code: *"Pakai nano-banana, buat ilustrasi untuk slide 1 naskah cyberbullying."*

Catatan:
- Selalu masukkan key lewat `--env`, **jangan** di teks perintah yang tersimpan di `settings.local.json`.
- Untuk OpenAI ada juga MCP server gambar pihak ketiga; polanya sama (`--env OPENAI_API_KEY=...`).
- Paket MCP buatan komunitas — cek dulu jumlah unduhan & repo GitHub-nya sebelum dipasang.

---

## Cara 3 — Manual Tanpa Koding

1. Jalankan skrip dengan `--dry-run` (atau minta Claude): akan keluar **prompt bahasa Inggris** per slide.
2. Salin prompt ke aplikasi **Gemini** (gemini.google.com) atau **ChatGPT** — keduanya bisa membuat gambar.
3. Unduh hasilnya ke `desain/gambar/<nama-naskah>/`.

Cocok bila belum punya API key atau hanya butuh 1–2 gambar.

---

## Perbandingan Singkat

| | Gemini (Nano Banana) | ChatGPT (GPT Image) |
|---|---|---|
| Biaya | Ada kuota gratis harian | Berbayar per gambar |
| Kekuatan | Cepat, konsisten gaya, bagus untuk edit gambar | Komposisi detail, ilustrasi rapi |
| Model default skrip | `gemini-2.5-flash-image` | `gpt-image-1` |
| Ganti model | `GEMINI_IMAGE_MODEL=` di `.env` | `OPENAI_IMAGE_MODEL=` di `.env` |

Tip: buat satu slide dengan kedua provider, pilih gaya yang paling cocok, lalu pakai provider itu untuk seluruh seri agar tampilannya seragam.

---

## Aturan Wajib (sesuai CLAUDE.md konten)

- Gambar AI **bukan** foto siswa asli — jangan unggah foto siswa ke AI untuk diedit tanpa izin tertulis.
- Prompt skrip sudah melarang kekerasan eksplisit, darah, dan gambaran self-harm. Jangan dihapus.
- Periksa setiap gambar sebelum posting: tangan/wajah aneh, simbol yang tidak pantas, teks nyasar.
- **API key = password.** Simpan hanya di `.env` (sudah di-.gitignore), jangan di-commit atau dibagikan.
