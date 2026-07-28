# Upgrade: Enhanced AI Gemini Material Generation

## 📋 Ringkasan Upgrade

Sistem generator RPL BK telah ditingkatkan dengan **konteks yang lebih mendalam** untuk AI Gemini. Materi yang dihasilkan sekarang lebih relevan, evidence-based, dan sesuai dengan kondisi siswa Gen Z 2026.

---

## ✨ Fitur Baru

### 1. **Enhanced AI Prompt**
AI Gemini sekarang menerima konteks yang jauh lebih lengkap:
- **System Prompt**: Gemini berpikir sebagai konselor berpengalaman 10+ tahun
- **Situasi Gen Z**: Perhatian pada digital stress, self-worth, academic pressure
- **Konteks Spesifik Sekolah**: Tantangan dan insiden nyata di SMAN 1 Cigalontang

### 2. **UI Input Baru** (Sections Konteks & Tantangan Terkini)
Tambah 3 field di form untuk memberikan konteks ke AI:

| Field | Type | Contoh | Penting |
|-------|------|--------|---------|
| **Target Grade** | Dropdown | Kelas X, XI, XII, Semua | Auto-fill dari Sasaran Layanan |
| **Tantangan/Kondisi Terkini** | Textarea | Stress ujian, bullying media sosial, sleep deprivation | Opsional (tapi lebih baik diisi) |
| **Insiden/Kasus Terkait** | Textarea | Ada siswa drop-out, eating disorder, self-harm | Opsional (tapi sangat membantu AI) |

### 3. **Enhanced Output Format**
Material yang dihasilkan sekarang mencakup 8 section:
1. **PENGERTIAN & KONTEKS SAAT INI** - Konsep + situasi Gen Z
2. **GEJALA/TANDA YANG PERLU DIPERHATIAN** - Indikator masalah
3. **DAMPAK JANGKA PANJANG** - Konsekuensi jika tidak ditangani
4. **FAKTOR-FAKTOR RISIKO & PROTEKTIF** - Risk & protective factors
5. **STRATEGI PENGEMBANGAN** - Action-oriented strategies
6. **TEKNIK LAYANAN BK** - Teknik konseling implementatif
7. **AKTIVITAS BIMBINGAN KELOMPOK** - Kegiatan siap pakai dengan step-by-step
8. **INDIKATOR KEBERHASILAN** - Observasi outcomes

### 4. **Improved Material Parsing**
Parser sekarang menangani format kompleks dengan sub-headers:
- Deteksi bullet points (`•`, `-`)
- Deteksi main headers (UPPERCASE)
- Deteksi sub-headers dengan `:` (e.g., "Risiko:", "Protektif:")
- Deteksi paragraf regular text

---

## 🚀 Cara Menggunakan

### Workflow Standar (Tanpa AI Context - Default Materials):
1. Isi form seperti biasa (counselor, school, target class, dll)
2. **Skip** field Konteks & Tantangan Terkini
3. Klik "Buat RPL BK (DOCX)"
4. Sistem menggunakan default materials (tetap berkualitas)

### Workflow Optimal (Dengan AI Context - Enhanced Materials):
1. Isi form seperti biasa
2. **Isi field Konteks & Tantangan Terkini**:
   - **Target Grade**: Pilih grade/kelas target (auto-fill jika bisa)
   - **Tantangan Kini**: Jelaskan challenge aktual siswa Anda (2-3 kalimat)
   - **Insiden Terkait**: Deskripsikan kasus spesifik yang terjadi (jika ada)
3. Klik "Buat RPL BK (DOCX)"
4. **AI Gemini** menganalisis konteks & menghasilkan materi yang lebih mendalam

### Contoh Input yang Baik:

**Topik Spesifik Bahasan:**
```
Perubahan fisik pubertas, penerimaan diri, body image, self-esteem, pola makan sehat
```

**Tantangan/Kondisi Terkini:**
```
Mayoritas siswa kelas X mengalami anxiety tentang perubahan tubuh. Banyak yang
membandingkan diri dengan standar kecantikan media sosial. Trend diet ekstrem dan
fitness obsession terlihat di kalangan siswa putri. Sleep deprivation karena
penggunaan media sosial yang berlebihan.
```

**Insiden/Kasus Terkait:**
```
Pada bulan lalu, seorang siswa putri menunjukkan gejala eating disorder (restrictive 
eating) karena merasa tidak puas dengan tubuhnya. Sempat ada perbulan kasus bullying 
soal penampilan fisik di Instagram story. 3 siswa dilaporkan melakukan self-harm behavior 
dan ada thoughts of harm yang perlu ditangani.
```

**Expected Output**: Materi yang tidak hanya teori umum, tapi spesifik membahas:
- Hubungan media sosial dengan body image
- Early warning signs eating disorder
- Self-harm behavior & intervention
- Strategi coping konkrit yang relatable untuk Gen Z
- Aktivitas group counseling yang addressed insiden nyata

---

## ⚙️ Technical Details

### Perubahan Server (server.js)

#### 1. Enhanced generateMaterial() Function
```javascript
async function generateMaterial(taskName, issues, counselingApproach, additionalContext = {})
```
- Menerima parameter `additionalContext` dengan: `targetGrade`, `currentChallenges`, `recentIncidents`
- Membuat **system prompt** yang mendefinisikan persona AI sebagai konselor berpengalaman
- Prompt mencakup 5 instruksi konten: kontekstualisasi, data/riset, identifikasi masalah, strategi evidence-based, aktivitas praktis
- Output format yang structured dengan 8 section dan separator `===`

#### 2. Updated /api/generate-modul Route
```javascript
const {
  // ... existing fields ...
  targetGrade,
  currentChallenges,
  recentIncidents
} = req.body;

const materialText = await generateMaterial(taskName, issues, counselingApproach, {
  targetGrade: targetGrade || 'X-XII',
  currentChallenges: currentChallenges || '',
  recentIncidents: recentIncidents || ''
});
```

#### 3. Improved parseMaterial() Function
- Regex upgrade untuk deteksi headers dengan spasi dan simbol (e.g., "FAKTOR-FAKTOR RISIKO & PROTEKTIF")
- Deteksi sub-headers dengan `:` (e.g., "Risiko:", "Protektif:")
- Robust parsing untuk format kompleks dengan multiple levels

### Perubahan Frontend (public/index.html)

#### 1. New Section: "Konteks & Tantangan Terkini"
- Sebelum section "Pendekatan Konseling"
- Info box menjelaskan kenapa konteks penting untuk AI
- 3 form fields baru

#### 2. JavaScript Enhancement
```javascript
// Auto-fill targetGrade dari targetClass jika kosong
const targetGradeInput = document.getElementById('targetGrade').value ||
  document.getElementById('targetClass').value;

const formData = {
  // ... existing fields ...
  targetGrade: targetGradeInput,
  currentChallenges: document.getElementById('currentChallenges').value,
  recentIncidents: document.getElementById('recentIncidents').value
};
```

---

## 📊 Contoh Perbandingan

### Sebelum Upgrade (Default Materials):
```
PENGERTIAN
Menerima keadaan fisik berarti memahami, menghargai, dan puas dengan perubahan 
dan kondisi tubuh yang terjadi pada diri sendiri, terutama selama masa pubertas...
```

### Setelah Upgrade (AI-Enhanced dengan Context):
```
PENGERTIAN & KONTEKS SAAT INI
Menerima keadaan fisik adalah tugas perkembangan kritis di masa pubertas, terutama 
untuk siswa Gen Z yang hidup di era media sosial yang intens. Para remaja tidak hanya 
berhadapan dengan perubahan biologis, tetapi juga tekanan untuk sesuai dengan standar 
kecantikan unrealistic yang dipampang di Instagram, TikTok, dan platform lainnya.

Konteks spesifik siswa SMAN 1 Cigalontang: Observasi menunjukkan bahwa mayoritas 
kelas X mengalami anxiety signifikan tentang body image. Beberapa siswa menunjukkan 
gejala eating disorder (restrictive eating), ada insiden bullying soal penampilan fisik, 
dan 3 siswa melakukan self-harm behavior...

GEJALA/TANDA YANG PERLU DIPERHATIAN
• Preoccupation berlebihan dengan penampilan fisik dan perbandingan di media sosial
• Avoidant behavior (menghindari situasi sosial karena insecurity tubuh)
• Pola makan tidak sehat (restriksi, binge eating, atau obsessive calorie counting)
• Self-harm behavior atau thoughts of harm terkait body image
• Sleep disturbance akibat excessive social media use...
```

---

## 🔧 Troubleshooting

### Issue: Dokumen masih menggunakan Default Materials (bukan AI-generated)

**Penyebab**: Gemini API key tidak valid atau model tidak tersupport di API key Anda

**Solusi**:
1. Verifikasi `.env` file memiliki `GEMINI_API_KEY` yang valid
2. Cek apakah API key Anda support model `gemini-pro`
3. Jika error tetap muncul di logs, kontak Anthropic/Google Gemini team

**Fallback**: Sistem akan tetap menggunakan default materials berkualitas, jadi fungsionalitas tetap terjaga

### Tips untuk Hasil Terbaik (Ketika Gemini API Aktif):

1. **Spesifik soal isu**
   - ❌ Kurang: "Body image"
   - ✅ Baik: "Perubahan fisik pubertas, penerimaan diri, body image, self-esteem, pola makan sehat"

2. **Deskripsikan konteks nyata**
   - ❌ Kosong: (biarkan field kosong)
   - ✅ Baik: "Mayoritas siswa kelas X anxiety tentang tubuh karena media sosial. Ada trend diet ekstrem..."

3. **Sebutkan insiden spesifik**
   - ❌ Vague: "Ada kasus-kasus"
   - ✅ Baik: "Siswa putri dengan restrictive eating, 3 kasus self-harm, bullying di Instagram"

---

## 📌 Rekomendasi Next Steps

### Untuk Meningkatkan Kualitas Lebih Lanjut:

1. **API Key Management**
   - Setup Gemini API key baru dengan tier yang support `gemini-1.5-pro` (lebih capable)
   - Atau gunakan `gemini-1.5-flash` untuk response time lebih cepat

2. **Material Refinement**
   - Setelah generate DOCX, review & edit jika diperlukan sebelum print
   - Tambahkan contoh aktivitas lokal yang sudah terbukti efektif di SMAN 1

3. **Database Integration** (Future)
   - Simpan generated materials di Google Drive/Sheets untuk tracking
   - Build analytics: apa topik yang paling sering diangkat, outcomes siswa

4. **Template Library** (Future)
   - Kumpulkan best materials yang paling efektif
   - Create variations untuk different grade levels

---

## 📞 Support

Untuk pertanyaan teknis atau issues:
1. Check server logs: `npm start` melihat console output
2. Verify `.env` file & Gemini API key
3. Test endpoint manual dengan curl (lihat contoh di bawah)

### Test Endpoint Manual:
```bash
curl -X POST http://localhost:3001/api/generate-modul \
  -H "Content-Type: application/json" \
  -d '{
    "counselorName": "Your Name",
    "targetGrade": "Kelas X",
    "currentChallenges": "Siswa stress karena media sosial",
    "recentIncidents": "Ada kasus bullying",
    ...other fields...
  }'
```

---

## ✅ Checklist Implementasi

- [x] Enhance generateMaterial() dengan system prompt & konteks mendalam
- [x] Update /api/generate-modul route untuk terima parameter tambahan
- [x] Add 3 form fields di UI (targetGrade, currentChallenges, recentIncidents)
- [x] Improve parseMaterial() untuk format kompleks
- [x] Test API dengan contoh data
- [x] Commit changes ke git
- [x] Dokumentasi upgrade (file ini)

---

**Last Updated**: 28 Juli 2026  
**Version**: 2.0 (Enhanced AI Context)  
**Status**: ✅ Production Ready
