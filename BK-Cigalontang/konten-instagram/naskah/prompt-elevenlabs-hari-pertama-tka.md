# Prompt ElevenLabs (Image & Video) — Reels "Pagi Hari Pertama TKA"

Cerita sama dengan `reels-hari-pertama-tka.md`. Di ElevenLabs, video dibuat per klip pendek (±5–10 detik, tergantung model yang dipilih), lalu disambung. **Suaranya tidak perlu dibuat ulang**: pakai 13 klip dubbing yang sudah ada di `audio/elevenlabs-reels-hari-pertama-tka/` (Nisa = Velora, Raka = Ibnu, Bu Guru BK = Salsa).

## Alur kerja yang disarankan

1. **Buat gambar awal (start frame) dulu** dengan model gambar di ElevenLabs, memakai gambar referensi karakter. Gambar diam lebih mudah dikontrol dan lebih jarang ditolak daripada langsung video.
2. **Gambar → video (image-to-video):** pilih gambar awal tadi, lalu tempel *prompt gerakan* klipnya. Pilih rasio **9:16**.
3. **Matikan / abaikan audio bawaan model** (kalau modelnya membuat suara), karena suara diambil dari klip dubbing kita.
4. Sambung klip + suara di ElevenLabs Studio (timeline) atau CapCut, mengikuti tabel waktu di bagian 4.

Gambar referensi yang diunggah:

| Karakter | File |
|---|---|
| Nisa | `brand/karakter/3d/siswi/utama.png` |
| Raka | `brand/karakter/3d/siswa/utama.png` |
| Bu Guru BK | `brand/karakter/3d/guru-bk-putri/tampak-depan.png` |
| Detail seragam | `brand/karakter/3d/referensi/*.webp` |

> **Penting (filter konten):** jangan tulis umur atau kata *girl/boy/kid/teen*. Pakai *cartoon student character*, seperti di bawah. Kalau gambar siswa tetap ditolak, buat adegan siswa dari animasi kita (`reels-hari-pertama-tka-dubbing.mp4`) dan pakai ElevenLabs untuk klip Bu Guru BK & suasana sekolah saja.

---

## 1. Blok gaya & karakter (tempel di awal setiap prompt gambar)

```
STYLE: Stylized 3D animated short film still, soft Pixar-like rendering, rounded friendly faces, big expressive eyes, warm early-morning sunlight, soft shadows, pastel teal and mint palette with warm golden accents. Setting: front gate of an Indonesian public senior high school in a green village area, white school building with a teal roof, trees, low fence, the gate sign is plain teal with no readable letters. Vertical 9:16. No text, no captions, no watermark.

CHARACTERS (match the reference images exactly):
- NISA: cartoon student character, long white hijab draped over the chest, white long-sleeve school shirt, grey necktie, small brown OSIS badge on the chest pocket, round yellow school emblem on the left sleeve, black belt, long pleated blue-grey skirt, white socks, black loafers, black backpack. Big brown eyes.
- RAKA: cartoon student character, short wavy black hair, white short-sleeve school shirt, grey necktie, OSIS badge, yellow emblem on the left sleeve, blue-grey trousers, black belt, black-and-white canvas sneakers, black backpack.
- BU GURU BK: cartoon teacher character (school counselor), beige hijab, khaki civil-servant uniform (fitted blazer and long khaki skirt), black name tag, small gold pin, holding a black folder, black low heels, warm calm smile.
```

---

## 2. Prompt per klip

Tiap klip punya **GAMBAR** (untuk start frame) dan **GERAKAN** (untuk image-to-video). Tulis gerakan sederhana: model video paling stabil untuk satu aksi per klip.

**Klip 1 · Datang ke sekolah** (dialog-01)
- GAMBAR: `[STYLE + CHARACTERS] Wide shot. Nisa walking on the path toward the school gate in the morning, holding both backpack straps, looking slightly down, nervous.`
- GERAKAN: `Nisa walks slowly toward the gate, camera tracks gently alongside her, leaves sway in a light breeze, birds fly in the sky. Calm, slow pacing.`

**Klip 2 · Nisa cemas** (dialog-02, 03)
- GAMBAR: `[STYLE + CHARACTERS] Medium close-up of Nisa standing in front of the school gate, worried expression, eyebrows raised, hands gripping her backpack strap. Soft blurred background.`
- GERAKAN: `Nisa glances down and then up at the gate, takes a small nervous breath, fiddles with her backpack strap. Slow camera push-in. Subtle movements.`

**Klip 3 · Raka datang** (dialog-04)
- GAMBAR: `[STYLE + CHARACTERS] Medium two-shot at the school gate. Raka on the right waving with a big friendly smile, Nisa on the left turning toward him, surprised.`
- GERAKAN: `Raka walks in from the right and waves cheerfully, then stops next to Nisa; Nisa turns toward him and relaxes a little. Gentle camera.`

**Klip 4 · Satu soal, satu soal** (dialog-05, 06)
- GAMBAR: `[STYLE + CHARACTERS] Two-shot of Nisa and Raka facing each other at the gate. Raka giving an encouraging thumbs up, Nisa starting to smile.`
- GERAKAN: `Raka nods and gives a thumbs up; Nisa slowly smiles and nods, her shoulders relax. Very subtle camera drift.`

**Klip 5 · Bu Guru BK menyapa** (dialog-07)
- GAMBAR: `[STYLE + CHARACTERS] Wide three-shot. Bu Guru BK walking out through the school gate toward Nisa and Raka, holding a black folder, warm smile; the two characters stand on each side of the path.`
- GERAKAN: `Bu Guru BK walks toward the camera and stops between the two characters, smiling and greeting them; Nisa and Raka nod politely. Camera slowly pulls back.`

**Klip 6 · Napas bersama** (dialog-08, 09)
- GAMBAR: `[STYLE + CHARACTERS] Wide three-shot in front of the gate, all three with eyes closed, calm faces, soft sunlight flare.`
- GERAKAN: `All three breathe in slowly together, shoulders rising, hold for a moment, then breathe out slowly, shoulders relaxing. Leaves move gently. Very slow, peaceful pacing, static camera.`

**Klip 7 · Pesan utama** (dialog-10, 11, 12)
- GAMBAR: `[STYLE + CHARACTERS] Close-up portrait of Bu Guru BK looking kindly slightly off-camera, warm golden backlight, shallow depth of field, gentle reassuring smile.`
- GERAKAN: `Bu Guru BK speaks gently and sincerely, small slow nods, soft blink, warm smile at the end. Static camera with a very slow push-in.`
- *Lip-sync (opsional):* kalau ada model lip-sync / talking-avatar di akun Anda, pakai gambar ini + gabungan `dialog-10`, `11`, `12` sebagai audio.

**Klip 8 · Masuk gerbang** (dialog-13)
- GAMBAR: `[STYLE + CHARACTERS] Nisa and Raka seen from behind walking side by side through the school gate into the school yard; Bu Guru BK standing at the gate on the right, waving.`
- GERAKAN: `Nisa and Raka walk away through the gate into the school; Bu Guru BK waves goodbye; the camera slowly rises to show the whole school in the morning sun.`

**Klip close-up tambahan (opsional, untuk dipotong di antara klip):**
- `[STYLE + CHARACTERS] Close-up portrait of Nisa, worried expression` → gerakan: `small anxious breath, eyes look down then up, subtle head tremble.`
- `[STYLE + CHARACTERS] Close-up portrait of Nisa smiling brightly` → gerakan: `she smiles wider and nods confidently, gentle blink.`

---

## 3. Kalau hasilnya kurang pas

| Masalah | Coba |
|---|---|
| Ditolak "konten anak / minor" | Hapus umur & kata girl/boy; coba tanpa gambar referensi; atau pakai ElevenLabs hanya untuk klip Bu Guru BK & suasana |
| Wajah/seragam berubah antar klip | Selalu mulai dari gambar awal (start frame) yang dibuat dengan referensi yang sama; pakai frame terakhir klip sebelumnya sebagai start frame klip berikutnya |
| Muncul huruf aneh di papan sekolah | Tambah `the gate sign is plain teal with no readable letters` |
| Gerakan terlalu cepat / aneh | Tambah `slow, calm pacing, subtle movements`, kurangi jumlah aksi per klip |
| Model menambahkan suara | Abaikan; ganti dengan dubbing kita di editor |

---

## 4. Susunan akhir (pakai klip dubbing yang sudah ada)

Waktu mengikuti versi dubbing kita (`reels-hari-pertama-tka-dubbing.mp4`), jadi teks layar & suara tinggal diikuti.

| Waktu | Klip video | Audio | Teks layar |
|---|---|---|---|
| 0–4,8 | Klip 1 | dialog-01 (0,8 dtk) | SENIN, 26 OKTOBER · **Hari pertama TKA.** Siapa yang deg-degan? 🙋 |
| 4,8–12,9 | Klip 2 | dialog-02 (5,4), dialog-03 (9,2) | "Duh… gimana kalau nanti aku blank? 😣" → "Kalau waktunya nggak cukup? Kalau nilainya jelek?" |
| 12,9–20 | Klip 3 | dialog-04 (15,7) | Raka: "Pagi! Tenang… kita kan udah latihan bareng." |
| 20–28,8 | Klip 4 | dialog-05 (20,2), dialog-06 (24,9) | "Kerjain sebisanya. Satu soal, satu soal. 👍" → "Iya juga, ya… aku udah berusaha. 🙂" |
| 28,8–35,6 | Klip 5 | dialog-07 (31,2) | Bu Guru BK: "Selamat pagi! Sebelum masuk, tarik napas dulu, yuk." |
| 35,6–41,6 | Klip 6 | dialog-08 (36,0), dialog-09 (38,8) | "Tarik napas… 1-2-3-4" → "Hembuskan pelan…" |
| 41,6–51,4 | Klip 7 | dialog-10 (42,2), 11 (44,2), 12 (47,6) | **Kamu sudah berusaha.** Hasil bukan satu-satunya ukuran dirimu. 🤍 |
| 51,4–54,5 | Close-up Nisa tersenyum | dialog-13 (51,9) | Nisa: "Makasih, Bu! Bismillah. 💪" |
| 54,5–58,7 | Klip 8 | — | Deg-degan boleh, **nyerah jangan.** |
| 58,7–62,5 | Kartu penutup (ambil dari video kita) | chime | Semangat TKA hari pertama, SMANRICI! 🤍 · Kirim semangat untuk temanmu 👇 · @bksmanrici |

Musik latar: pakai musik dari pustaka ElevenLabs/Instagram dengan volume rendah, atau ambil trek musik kita (`python3 desain/audio_hari_pertama.py musik.wav` menghasilkan versi tanpa dialog).

Teks: Plus Jakarta Sans (judul) & Inter; warna toska `#0D9488`, emas `#F59E0B`; logo `brand/logo-bk-smanrici.png` di kiri atas; jaga teks di luar 20% bawah & tepi kanan layar.
