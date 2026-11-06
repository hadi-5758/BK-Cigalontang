# Panduan Rekaman Suara — Reels "POV: H-5 TKA tapi Otak Nge-freeze"

Video animasi dan musik latar sudah jadi (`desain/export/reels-otak-nge-freeze/reels-otak-nge-freeze-musik.mp4`).
Tinggal suara percakapannya. Rekam setiap baris sebagai **file terpisah**, lalu kirim ke Claude untuk dicampur. Musik otomatis mengecil saat ada suara (*ducking*).

## Pemeran Suara

| Pemeran | Siapa | Karakter suara |
|---|---|---|
| **Siswi** | siswi (dengan izin) / guru perempuan | awalnya panik & cepat, di akhir lega dan tersenyum |
| **Siswa** | siswa (dengan izin) / guru laki-laki | tenang, hangat, pelan seperti teman yang menenangkan |
| **Guru BK** | Guru BK | ramah, mengundang |

## Naskah per File

Durasi maksimal = waktu yang tersedia sebelum adegan berikutnya. Kalau lewat, ucapkan sedikit lebih cepat.

| File | Mulai (detik) | Pemeran | Kalimat | Maks. |
|---|---|---|---|---|
| `dialog-01.wav` | 0,4 | Siswi | "Aduh… H-5 TKA, tapi otakku nge-freeze." | 3,0 dtk |
| `dialog-02.wav` | 3,6 | Siswi | "Kok semua materi kayak baru pertama lihat, sih…" | 4,0 dtk |
| `dialog-03.wav` | 9,3 | Siswa | "Eh, berhenti dulu sebentar. Coba ikutin aku." | 3,0 dtk |
| `dialog-04.wav` | 13,0 | Siswa | "Sebutin lima hal yang kamu lihat…" | 1,9 dtk |
| `dialog-05.wav` | 15,0 | Siswa | "empat hal yang bisa kamu sentuh…" | 1,9 dtk |
| `dialog-06.wav` | 17,0 | Siswa | "tiga suara yang kamu dengar…" | 1,9 dtk |
| `dialog-07.wav` | 19,0 | Siswa | "dua aroma yang kamu cium…" | 1,9 dtk |
| `dialog-08.wav` | 21,0 | Siswa | "dan satu hal yang kamu syukuri." | 2,2 dtk |
| `dialog-09.wav` | 23,6 | Siswa | "Sekarang ikuti titiknya. Tarik napas…" | 3,8 dtk |
| `dialog-10.wav` | 27,6 | Siswa | "Tahan…" | 3,8 dtk |
| `dialog-11.wav` | 31,6 | Siswa | "Hembuskan pelan-pelan…" | 3,8 dtk |
| `dialog-12.wav` | 35,6 | Siswa | "Tahan…" | 3,4 dtk |
| `dialog-13.wav` | 39,6 | Siswa | "Cemas itu wajar. Bisa dikelola, kok." | 1,5 dtk |
| `dialog-14.wav` | 41,2 | Siswi | "Oke… mulai dari satu bab dulu." | 1,8 dtk |
| `dialog-15.wav` | 43,4 | Guru BK | "Butuh teman cerita? Ruang BK terbuka buat kamu." | 4,0 dtk |

> Baris 13 hanya 1,5 detik. Kalau terlalu singkat, cukup ucapkan "Cemas itu wajar, kok."

## Cara Merekam dengan HP

1. Cari ruangan sunyi dan berkain (perpustakaan/ruang BK, tutup jendela, matikan kipas).
2. Pakai aplikasi perekam suara bawaan HP; jarak mulut ke HP ±20 cm, jangan meniup langsung ke mikrofon.
3. Diam 1 detik sebelum dan sesudah berbicara (bagian hening dipotong otomatis).
4. Satu kalimat = satu file. Beri nama sesuai tabel. Format **WAV** paling baik; M4A/MP3 juga bisa (akan dikonversi).
5. Rekam 2–3 versi kalau ragu, pilih yang paling natural.
6. Kirim semua file ke Claude, lalu Claude menjalankan:
   ```
   python3 desain/audio_reels.py export/.../audio-final.wav --suara folder_rekaman
   ```
   dan menggabungkannya ke video.

## Alternatif Tanpa Rekam: Suara AI di CapCut

1. Buka CapCut, impor `reels-otak-nge-freeze-musik.mp4`.
2. Tambahkan **Teks** sesuai tabel di detik yang sama, lalu pilih **Teks ke ucapan** (*Text to speech*) dengan suara berbahasa Indonesia (perempuan untuk Siswi, laki-laki untuk Siswa & Guru BK).
3. Turunkan volume musik video ke ±40% agar suara jelas, lalu hapus teks tambahan kalau tidak ingin tampil dobel.

## Etika

- Suara siswa hanya dipakai dengan **izin tertulis** siswa dan orang tua.
- Jangan menyebut nama siswa di konten.
