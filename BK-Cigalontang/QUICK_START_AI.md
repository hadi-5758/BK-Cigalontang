# ⚡ Quick Start - AI Material Generation

## 🎯 Setup dalam 3 Langkah

### 1️⃣ Dapatkan API Key (2 menit)
```
Buka: https://aistudio.google.com/app/apikey
Click: Create API Key
Copy: API Key Anda
```

### 2️⃣ Setup .env File (1 menit)
```bash
# Di folder BK-Cigalontang, buat atau edit .env:
GEMINI_API_KEY=paste_your_api_key_here
PORT=3001
```

### 3️⃣ Restart Server (1 menit)
```bash
cd BK-Cigalontang
npm start
```

**Lihat di console:**
```
✓ Gemini API enabled - Material generation available
```

---

## 🚀 Sekarang Gunakan!

1. **Buka:** http://localhost:3001
2. **Isi form:** Semua data yang diperlukan
3. **Click:** "Buat RPL BK (DOCX)"
4. **Tunggu:** AI generate materi (~5-10 detik)
5. **Download:** RPL dengan materi AI-generated!

---

## ✨ Apa yang Didapat?

RPL Anda sekarang include:

```
📄 RPL LENGKAP:
├── Komponen A-M (standar)
├── L. Uraian Kegiatan (detail)
├── M. Evaluasi
├── 📌 MATERI LAYANAN (BARU!)
│   ├── Pengertian
│   ├── Karakteristik
│   ├── Manfaat
│   ├── Strategi Pengembangan
│   └── Teknik Layanan BK
└── Tanda Tangan
```

---

## 💡 Contoh Hasil

**Input:**
- Tugas: "Menerima Keadaan Fisik"
- Kelas: Kelas 7
- Pendekatan: Konseling Humanistik

**Output Materi:**
```
PENGERTIAN
Menerima keadaan fisik berarti memahami, menghargai, 
dan puas dengan perubahan dan kondisi tubuh yang terjadi 
pada diri sendiri, terutama selama masa pubertas...

KARAKTERISTIK/CIRI-CIRI
• Memahami perubahan fisik yang terjadi selama pubertas
• Menunjukkan sikap positif terhadap penampilan fisik
• Tidak terlalu khawatir dengan kritik terhadap penampilan
• Mampu merawat dan menjaga kesehatan tubuh
• Menunjukkan percaya diri dalam berinteraksi sosial

[dst...]
```

---

## ⚙️ Tips

✅ **Berjalan Offline?**
- Gunakan default material (builtin)
- Material default sudah cukup baik

✅ **Gemini Timeout?**
- Coba lagi (biasanya berhasil kedua kali)
- Check internet connection

✅ **Ingin Customize?**
- Setelah download, edit materi di Word
- Tambahkan referensi pribadi
- Customize untuk siswa spesifik

✅ **Quota Habis?**
- Free tier: 50 requests/hari
- Cukup untuk ~50 RPL per hari
- Reset otomatis besok hari

---

## 🔗 Links

- [Setup Detail](SETUP_GEMINI_API.md)
- [API Documentation](https://ai.google.dev/docs)
- [Main README](README_MODUL_BK.md)

---

**Ready? Let's generate some awesome RPLs! 🎉**
