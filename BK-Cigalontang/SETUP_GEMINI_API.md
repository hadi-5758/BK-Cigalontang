# 🚀 Setup Gemini API untuk AI Material Generation

Generator RPL BK sekarang dilengkapi dengan **Google Gemini AI** untuk automatic material generation!

## 📋 Apa yang Baru?

Saat Anda membuat RPL, sistem akan:
1. ✅ Menerima data dari form (tugas perkembangan, topik, pendekatan)
2. 🔄 Memanggil Gemini AI untuk generate materi yang relevan
3. 📄 Mengintegrasikan materi langsung ke DOCX
4. ⬇️ Download RPL dengan materi yang sudah siap pakai

## 🔑 Cara Setup Gemini API

### Step 1: Dapatkan Gemini API Key (GRATIS)

1. **Buka Google AI Studio:**
   - Kunjungi: https://aistudio.google.com/app/apikey

2. **Login dengan Google Account Anda**

3. **Klik "Create API Key"**
   - Pilih "Create API Key in new project" ATAU gunakan project yang sudah ada

4. **Copy API Key yang digenerate**

### Step 2: Setup File `.env`

1. **Buka file `.env` di folder BK-Cigalontang** (atau copy dari `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` dan tambahkan API Key Anda:**
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   PORT=3001
   NODE_ENV=development
   ```

3. **Simpan file**

### Step 3: Restart Server

```bash
cd BK-Cigalontang
npm start
```

Jika setup berhasil, Anda akan melihat:
```
Server running at http://localhost:3001
✓ Gemini API enabled - Material generation available
```

## 🎯 Fitur AI Material Generation

### Materi yang Di-generate:

Setiap RPL akan include bagian **"MATERI LAYANAN"** dengan:

**1. PENGERTIAN**
   - Definisi tugas perkembangan
   - Konteks untuk siswa

**2. KARAKTERISTIK/CIRI-CIRI**
   - 4-5 ciri-ciri yang menunjukkan

**3. MANFAAT/PENTINGNYA**
   - Alasan penting aspek ini
   - Dampak positif pengembangan

**4. STRATEGI PENGEMBANGAN**
   - 5-6 cara mengembangkan aspek ini
   - Praktis dan implementatif

**5. TEKNIK LAYANAN BK**
   - 4-5 teknik konseling yang bisa digunakan
   - Sesuai dengan pendekatan yang dipilih

### Contoh Output:

Untuk **"Menerima Keadaan Fisik"** dengan pendekatan **Humanistik**, sistem akan generate:
- Penjelasan tentang body image dan pubertas
- Ciri siswa yang bisa menerima keadaan fisik
- Manfaat self-acceptance
- Strategi seperti psyco-education, discussion, etc.
- Teknik counseling yang humanistik

## ⚙️ Konfigurasi (Optional)

### Menggunakan OpenAI GPT (Alternatif)

Jika Anda lebih suka GPT, edit `.env`:

```
# Gunakan OpenAI
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4-turbo-preview

# Disable Gemini
GEMINI_API_KEY=
```

(Fitur OpenAI masih dalam development)

### Timeout & Rate Limiting

Jika Anda khawatir timeout, edit `server.js`:
```javascript
const GENERATION_TIMEOUT = 30000; // 30 seconds
```

## 📊 Biaya

### Gemini API
- **GRATIS** untuk tier awal (50 requests/hari)
- Cukup untuk testing dan usage pribadi
- Jika butuh lebih, bisa upgrade ke paid tier

### OpenAI (jika dipakai)
- Berbayar per token
- ~$0.01-0.02 per material generation

## 🆘 Troubleshooting

### Error: "GEMINI_API_KEY is not set"
**Solusi:** 
- Pastikan `.env` file sudah ada dan benar
- Restart server setelah edit `.env`

### Error: "API call failed"
**Solusi:**
- Cek internet connection
- Cek API key yang valid
- Cek quota Gemini API (50/hari gratis)

### Material tidak di-generate, pakai default?
**Solusi:**
- Ini adalah fallback otomatis jika Gemini error
- Akan ada material default tapi mungkin kurang relevan
- Cek console untuk error message

### Proses terlalu lambat?
**Solusi:**
- Gemini biasanya 3-10 detik per material
- Network speed mempengaruhi
- Coba restart server

## 📝 Customization

### Mengubah Prompt untuk AI

Edit di `server.js` function `generateMaterial()`:

```javascript
const prompt = `Buatkan materi ringkas untuk layanan bimbingan dan konseling...`
```

Anda bisa customize:
- Panjang materi
- Format output
- Level kesulitan
- Fokus konten

### Menambah Prompt Khusus per Tugas Perkembangan

```javascript
const taskSpecificPrompts = {
  'Menerima Keadaan Fisik': 'Fokus pada body image dan pubertas...',
  'Persiapan Karir': 'Fokus pada eksplorasi karir dan self-discovery...'
}
```

## 🔐 Security Tips

⚠️ **PENTING:**
- **Jangan** push `.env` ke Git!
- File `.env` sudah di `.gitignore`
- API Key pribadi - jangan share ke orang lain
- Jika key ter-expose, regenerate di Google AI Studio

## 📱 Usage Example

### Workflow:

1. **Form:** Isi semua data (tugas perkembangan = "Menerima Keadaan Fisik")
2. **Click:** "Buat RPL BK"
3. **Process:**
   - ✓ Form valid
   - 🔄 Menghasilkan materi dengan AI Gemini...
   - 📝 Menyusun dokumen RPL...
   - ✓ RPL siap diunduh!
4. **Download:** DOCX dengan materi lengkap

## 🎓 Saran Penggunaan

✅ **Bagus untuk:**
- Generate material dasar/template
- Brainstorming isi layanan
- Referensi dan ide
- Membantu teacher/counselor yang sibuk

❌ **JANGAN:**
- Langsung pakai tanpa review
- Mengandalkan 100% pada AI
- Gunakan tanpa customize

💡 **Best Practice:**
1. Generate material dengan AI
2. Review dan validate konten
3. Customize sesuai kebutuhan siswa
4. Tambahkan referensi lokal/personal
5. Gunakan untuk layanan

## 📚 Referensi

- [Google Generative AI API Docs](https://ai.google.dev/docs)
- [Gemini API Quickstart](https://ai.google.dev/tutorials/python_quickstart)
- [Best Practices for Prompt Engineering](https://ai.google.dev/docs/prompt_engineering)

## 🚨 Known Limitations

1. **Rate Limit:** 50 requests/hari di free tier
2. **Response Time:** 3-10 detik per request
3. **Content Accuracy:** AI bisa biasanya tapi perlu verify
4. **Language:** Optimal untuk Indonesia tapi bisa ada typo

## 📧 Support

Jika ada issue:
1. Cek error message di console
2. Cek `.env` file sudah setup
3. Restart server
4. Cek Google AI Studio untuk quota info

---

**Selamat menggunakan Gemini AI untuk RPL BK! 🎉**

*Material generation v1.0 - Ready for production*
