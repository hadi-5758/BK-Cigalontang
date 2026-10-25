# Prompt Google Flow & HeyGen — Reels "Pagi Hari Pertama TKA"

Cerita sama dengan `reels-hari-pertama-tka.md` (Nisa cemas → Raka menyemangati → Bu Guru BK mengajak napas bersama → pesan "Kamu sudah berusaha" → masuk gerbang). Total ±50–60 detik.

**Pembagian kerja yang disarankan**
- **Google Flow (Veo):** adegan bergerak (berjalan, gerbang, napas bersama, masuk sekolah). Satu klip ±8 detik, jadi dibuat 8 klip lalu disambung.
- **HeyGen:** close-up berbicara (lip-sync rapi, suara bahasa Indonesia), terutama pesan Bu Guru BK. Opsional, karena Flow juga bisa membuat dialog.
- **CapCut / editor lain:** sambung klip, tambah teks layar, musik, dan sampul.

> Prompt ditulis dalam **bahasa Inggris** karena model video paling patuh dengan bahasa Inggris. Dialog tetap **bahasa Indonesia** di dalam tanda kutip.

---

## 0. Siapkan gambar referensi karakter

Unggah sebagai *ingredients* / gambar acuan (atau *frame* awal) supaya wajah & seragam konsisten:

| Karakter | File |
|---|---|
| Nisa (siswi) | `brand/karakter/3d/siswi/utama.png` atau `tampak-depan.png` |
| Raka (siswa) | `brand/karakter/3d/siswa/utama.png` atau `tampak-depan.png` |
| Bu Guru BK | `brand/karakter/3d/guru-bk-putri/tampak-depan.png` |
| Lembar lengkap | `brand/karakter/3d/referensi/*.webp` (bagus untuk acuan detail seragam) |

Tips: PNG transparan kadang dibaca model sebagai latar hitam. Kalau hasilnya aneh, pakai lembar referensi `.webp` atau tempel PNG di atas latar putih dulu.

---

## 1. Blok gaya & karakter (tempel di awal SETIAP prompt)

```
STYLE: Stylized 3D animated short film, soft Pixar-like rendering, rounded friendly faces, big expressive eyes, warm early-morning sunlight, soft shadows, pastel teal and mint color palette with warm golden accents. Setting: an Indonesian public senior high school (SMA) front gate in a green village area, white school building with teal roof, trees, a small fence. Vertical 9:16 format. Smooth gentle camera movement. No on-screen text, no subtitles, no captions, no watermark.

CHARACTERS (keep exactly consistent with the reference images):
- NISA: cartoon student character, long white hijab draped over the chest, white long-sleeve school shirt, grey necktie, small brown OSIS badge on the chest pocket, round yellow school emblem on the left sleeve, black belt, long pleated blue-grey skirt, white socks, black loafers, black backpack. Stylized cartoon face, big brown eyes.
- RAKA: cartoon student character, short wavy black hair, white short-sleeve school shirt, grey necktie, OSIS badge on the pocket, yellow emblem on the left sleeve, blue-grey trousers, black belt, black-and-white canvas sneakers, black backpack. Friendly, cheerful.
- BU GURU BK: cartoon teacher character (school counselor), beige hijab, khaki civil-servant uniform (fitted blazer and long khaki skirt), black name tag and small gold pin, holding a black folder, black low heels. Warm, calm, motherly smile.
```

---

## 2. Prompt per adegan — Google Flow (±8 detik per klip)

**Klip 1 · Datang ke sekolah (0–8 dtk)**
```
[STYLE + CHARACTERS]
SCENE: Wide shot, early morning. Nisa walks slowly along the path toward the school gate, holding both backpack straps tightly, eyes looking down, a little nervous. Birds chirping, soft footsteps, distant students' chatter. Camera slowly tracks alongside her, then she stops in front of the gate and looks up at it.
AUDIO: ambient morning sounds only, no music, no dialogue.
```

**Klip 2 · Nisa cemas (8–16 dtk)**
```
[STYLE + CHARACTERS]
SCENE: Medium close-up of Nisa standing in front of the school gate. Her eyebrows rise anxiously, she fiddles with her backpack strap and takes a shaky breath. Slight slow push-in of the camera. Soft blurred background.
DIALOGUE (Nisa, quiet inner voice, worried, Indonesian): "Duh… gimana kalau nanti aku blank? Kalau waktunya nggak cukup?"
AUDIO: soft heartbeat-like low tone, no music.
```

**Klip 3 · Raka datang (16–24 dtk)**
```
[STYLE + CHARACTERS]
SCENE: Medium shot. Raka jogs in from the right side of the frame, waving with a big friendly smile, and stops next to Nisa. Nisa turns toward him, surprised then relieved.
DIALOGUE (Raka, cheerful and warm, Indonesian): "Pagi, Nis! Tenang… kita kan udah latihan bareng."
AUDIO: footsteps, light morning ambience.
```

**Klip 4 · Satu soal, satu soal (24–32 dtk)**
```
[STYLE + CHARACTERS]
SCENE: Two-shot of Nisa and Raka facing each other at the gate. Raka gives an encouraging thumbs up. Nisa slowly smiles and nods, her shoulders relax.
DIALOGUE (Raka, encouraging, Indonesian): "Kerjain sebisanya. Satu soal, satu soal."
DIALOGUE (Nisa, softly, relieved, Indonesian): "Iya juga, ya… aku udah berusaha."
```

**Klip 5 · Bu Guru BK menyapa (32–40 dtk)**
```
[STYLE + CHARACTERS]
SCENE: Bu Guru BK walks out through the school gate toward the two students, holding a black folder, smiling warmly. She stops between them; Nisa and Raka greet her politely with a small bow. Camera slowly pulls back to a wide three-shot.
DIALOGUE (Bu Guru BK, warm and calm, Indonesian): "Selamat pagi! Sebelum masuk, tarik napas dulu, yuk."
```

**Klip 6 · Napas bersama (40–48 dtk)**
```
[STYLE + CHARACTERS]
SCENE: Wide three-shot in front of the gate. All three close their eyes and breathe in slowly together, shoulders rising, then breathe out slowly, shoulders relaxing. Gentle sunlight flare, leaves moving softly in the breeze. Very calm, slow pacing.
DIALOGUE (Bu Guru BK, slow and soothing, Indonesian): "Tarik napas… dua… tiga… empat. Hembuskan pelan-pelan…"
AUDIO: soft wind, calm ambient pad, audible gentle breathing.
```

**Klip 7 · Pesan utama (48–56 dtk)** — *atau buat versi HeyGen di bagian 3*
```
[STYLE + CHARACTERS]
SCENE: Close-up of Bu Guru BK looking kindly at Nisa (slightly off-camera), warm golden backlight, shallow depth of field. She speaks gently and sincerely, with a small reassuring nod at the end.
DIALOGUE (Bu Guru BK, gentle, sincere, Indonesian): "Kamu sudah berusaha. Hasil bukan satu-satunya ukuran dirimu."
```

**Klip 8 · Masuk gerbang (56–64 dtk)**
```
[STYLE + CHARACTERS]
SCENE: Nisa smiles brightly and says thank you, then Nisa and Raka walk side by side through the school gate into the school yard, seen from behind. Bu Guru BK stands at the gate waving goodbye. The camera rises slowly to show the whole school in the morning sun.
DIALOGUE (Nisa, happy and confident, Indonesian): "Makasih, Bu! Bismillah."
AUDIO: footsteps fading, birds, a hopeful soft music swell.
```

**Kalau muncul "Gagal — melanggar kebijakan … anak di bawah umur"**
Flow sangat ketat untuk apa pun yang terbaca sebagai anak. Penyebab paling umum dan cara mengatasinya:
- Jangan sebut umur atau kata *girl/boy/kid/teen/16-year-old*. Pakai *cartoon student character* (sudah diterapkan di blok di atas).
- Hindari deskripsi tubuh/wajah yang detail (bibir, badan); cukup pakaian, ekspresi, dan aksi.
- Gambar referensi juga ikut dinilai: kalau tetap gagal dengan gambar siswa, coba **tanpa gambar referensi** dulu (teks saja), atau pakai lembar referensi yang ada latarnya.
- Jangan "mengakali" dengan menyebut karakter sebagai orang dewasa. Kalau tetap ditolak, buat adegan siswa dengan animasi kita sendiri (`reels-hari-pertama-tka.mp4`), dan pakai Flow hanya untuk klip Bu Guru BK dan suasana sekolah (klip 5–7 tanpa siswa, atau b-roll gerbang/halaman sekolah).

**Kalau hasil Flow kurang pas**
- Wajah berubah antar klip → pakai *frame terakhir* klip sebelumnya sebagai *frame awal* klip berikutnya (fitur extend / frames-to-video), dan selalu sertakan gambar referensi.
- Muncul teks/huruf aneh di papan sekolah → tambah "the gate sign is plain teal with no readable letters".
- Dialog bukan bahasa Indonesia atau logatnya aneh → biarkan klip tanpa suara (hapus baris DIALOGUE, tulis "no dialogue"), lalu isi suara dengan HeyGen/ElevenLabs.
- Gerakan terlalu cepat → tambah "slow, calm pacing, subtle movements".

---

## 3. HeyGen — close-up berbicara

### Opsi A: Photo Avatar / Avatar IV per karakter (paling rapi untuk lip-sync)
1. Buat avatar dari foto karakter: Bu Guru BK → `brand/karakter/3d/guru-bk-putri/ekspresi-normal-ramah.png` (atau potongan wajah dari `referensi/guru-bk-putri.webp` yang lebih besar). Lakukan hal sama untuk Nisa (`siswi/ekspresi-normal.png`) dan Raka (`siswa/ekspresi-normal.png`) bila perlu.
2. Format 9:16, latar: unggah gambar gerbang sekolah atau warna mint `#E6F7F1`.
3. Suara: pilih suara bahasa Indonesia, atau unggah audio ElevenLabs yang sudah ada (Bu Guru: suara *Salsa*; Nisa: *Velora*; Raka: *Ibnu*).
4. Kalau ada kolom prompt gerakan/ekspresi, isi dengan teks di bawah.

| Karakter | Naskah | Prompt gerakan/ekspresi |
|---|---|---|
| Nisa | "Duh… gimana kalau nanti aku blank? Kalau waktunya nggak cukup?" | Worried expression, eyebrows raised, glances down, small anxious breath, slight head shake. |
| Raka | "Pagi, Nis! Tenang… kita kan udah latihan bareng. Kerjain sebisanya. Satu soal, satu soal." | Cheerful, friendly smile, small wave at the start, encouraging nod, thumbs-up feeling. |
| Bu Guru BK | "Selamat pagi! Sebelum masuk, tarik napas dulu, yuk. … Kamu sudah berusaha. Hasil bukan satu-satunya ukuran dirimu." | Warm, calm, motherly. Slow gentle nods, soft smile, eye contact, relaxed shoulders, pauses between sentences. |
| Nisa | "Iya juga, ya… aku udah berusaha. … Makasih, Bu! Bismillah." | From hesitant to relieved, then a bright confident smile and a small nod. |

Tips naskah HeyGen: tulis jeda dengan "…" atau baris baru agar tidak tergesa-gesa; ucapan "TKA" tulis "te-ka-a" kalau dibaca aneh.

### Opsi B: HeyGen Video Agent (satu prompt untuk seluruh video)
```
Create a 60-second vertical (9:16) Instagram Reel in Indonesian for a high school guidance & counseling account (BK SMA Negeri 1 Cigalontang, @bksmanrici), for the first day of the national exam TKA (Monday, 26 October 2026). Use my uploaded 3D character images: Nisa (female student with white hijab), Raka (male student), and Bu Guru BK (female counselor in khaki uniform and beige hijab). Stylized 3D animated look, warm morning light, teal/mint palette (#0D9488, #10B981, accent #F59E0B).

Story:
1) Morning at the school gate, Nisa arrives nervous. On-screen title: "Hari pertama TKA. Siapa yang deg-degan?"
2) Nisa (worried): "Duh… gimana kalau nanti aku blank? Kalau waktunya nggak cukup?"
3) Raka arrives and waves: "Pagi, Nis! Tenang… kita kan udah latihan bareng. Kerjain sebisanya. Satu soal, satu soal."
4) Nisa (relieved): "Iya juga, ya… aku udah berusaha."
5) Bu Guru BK comes out of the gate: "Selamat pagi! Sebelum masuk, tarik napas dulu, yuk." Then a slow breathing moment with on-screen count "Tarik napas… 1-2-3-4 / Hembuskan pelan…".
6) Bu Guru BK close-up, gentle and sincere: "Kamu sudah berusaha. Hasil bukan satu-satunya ukuran dirimu." On-screen text: "Kamu sudah berusaha. Hasil bukan satu-satunya ukuran dirimu. 🤍"
7) Nisa smiles: "Makasih, Bu! Bismillah." Nisa and Raka walk into school. On-screen: "Deg-degan boleh, nyerah jangan."
8) End card on teal background: "Semangat TKA hari pertama, SMANRICI! 🤍", "Kirim semangat untuk temanmu 👇", "@bksmanrici".

Tone: warm, calm, supportive, not preachy. Indonesian voices: young female (Nisa), young male (Raka), warm adult female (Bu Guru BK). Soft hopeful background music, low volume under dialogue. Keep text away from the bottom 20% and right edge (Instagram UI). Use the school logo I uploaded in the top-left corner.
```

---

## 4. Teks layar untuk disunting (CapCut)

| Waktu | Teks |
|---|---|
| Awal | SENIN, 26 OKTOBER · **Hari pertama TKA.** Siapa yang deg-degan? 🙋 |
| Napas | Tarik napas… 1-2-3-4 · Hembuskan pelan… |
| Pesan | **Kamu sudah berusaha.** Hasil bukan satu-satunya ukuran dirimu. 🤍 |
| Masuk gerbang | Deg-degan boleh, **nyerah jangan.** |
| Penutup | Semangat TKA hari pertama, SMANRICI! 🤍 · Kirim semangat untuk temanmu 👇 · @bksmanrici |

Font: Plus Jakarta Sans (judul) & Inter (isi); warna toska `#0D9488`, emas `#F59E0B`; logo `brand/logo-bk-smanrici.png` di kiri atas. Jaga teks di luar 20% bawah & tepi kanan layar (tertutup tombol Instagram).
