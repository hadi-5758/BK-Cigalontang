# Naskah HeyGen — Reels "POV: H-5 TKA tapi Otak Nge-freeze"

Untuk dubbing `desain/export/reels-otak-nge-freeze/reels-otak-nge-freeze.mp4` (versi tanpa suara, 48 detik).
Teks sudah ditulis **sesuai pelafalan** agar suara AI tidak salah baca (H-5 → "H min lima", TKA → "Te Ka A", BK → "Be Ka").

## Pengaturan Suara

| Pemeran | Suara HeyGen | Kecepatan | Gaya |
|---|---|---|---|
| **Siswi** | Bahasa Indonesia, perempuan muda | 1.0 (adegan panik 1.1) | ceria/ekspresif |
| **Siswa** | Bahasa Indonesia, laki-laki muda | 0.9 | tenang/hangat |
| **Guru BK** | Bahasa Indonesia, perempuan/laki-laki dewasa (atau *voice clone* suara Bapak/Ibu sendiri) | 0.95 | ramah |

## Klip per Kalimat

Buat **satu klip per baris** (satu scene HeyGen per baris, atau satu proyek audio per pemeran), lalu unduh. Nama file mengikuti kolom pertama.

| File | Mulai di video | Pemeran | Teks untuk HeyGen (salin persis) | Maks. durasi |
|---|---|---|---|---|
| dialog-01 | 0,4 dtk | Siswi | Aduh... H min lima Te Ka A, tapi otakku nge-friz. | 3,0 dtk |
| dialog-02 | 3,6 dtk | Siswi | Kok semua materi kayak baru pertama lihat, sih... | 4,0 dtk |
| dialog-03 | 9,3 dtk | Siswa | Eh, berhenti dulu sebentar. Coba ikutin aku. | 3,0 dtk |
| dialog-04 | 13,0 dtk | Siswa | Sebutin lima hal yang kamu lihat... | 1,9 dtk |
| dialog-05 | 15,0 dtk | Siswa | Empat hal yang bisa kamu sentuh... | 1,9 dtk |
| dialog-06 | 17,0 dtk | Siswa | Tiga suara yang kamu dengar... | 1,9 dtk |
| dialog-07 | 19,0 dtk | Siswa | Dua aroma yang kamu cium... | 1,9 dtk |
| dialog-08 | 21,0 dtk | Siswa | Dan satu hal yang kamu syukuri. | 2,2 dtk |
| dialog-09 | 23,6 dtk | Siswa | Sekarang, ikuti titiknya. Tarik napas... | 3,8 dtk |
| dialog-10 | 27,6 dtk | Siswa | Tahan... | 3,8 dtk |
| dialog-11 | 31,6 dtk | Siswa | Hembuskan, pelan-pelan... | 3,8 dtk |
| dialog-12 | 35,6 dtk | Siswa | Tahan... | 3,4 dtk |
| dialog-13 | 39,6 dtk | Siswa | Cemas itu wajar, kok. | 1,5 dtk |
| dialog-14 | 41,2 dtk | Siswi | Oke... mulai dari satu bab dulu. | 1,8 dtk |
| dialog-15 | 43,4 dtk | Guru BK | Butuh teman cerita? Ruang Be Ka terbuka buat kamu. | 4,0 dtk |

## Versi Satu Naskah Utuh (per pemeran)

Kalau ingin membuat satu klip panjang per pemeran, pakai jeda (*pause*) HeyGen di antara kalimat sesuai angka di dalam kurung siku, lalu potong/geser di editor video.

**Siswi**
```
Aduh... H min lima Te Ka A, tapi otakku nge-friz. [jeda 0,3 dtk] Kok semua materi kayak baru pertama lihat, sih...
[jeda panjang — kalimat berikut mulai di detik 41,2]
Oke... mulai dari satu bab dulu.
```

**Siswa** (mulai detik 9,3)
```
Eh, berhenti dulu sebentar. Coba ikutin aku. [jeda 0,7 dtk]
Sebutin lima hal yang kamu lihat... [jeda 0,5 dtk] Empat hal yang bisa kamu sentuh... [jeda 0,5 dtk]
Tiga suara yang kamu dengar... [jeda 0,5 dtk] Dua aroma yang kamu cium... [jeda 0,5 dtk]
Dan satu hal yang kamu syukuri. [jeda 0,5 dtk]
Sekarang, ikuti titiknya. Tarik napas... [jeda 2 dtk] Tahan... [jeda 3 dtk] Hembuskan, pelan-pelan... [jeda 2 dtk] Tahan... [jeda 3 dtk]
Cemas itu wajar, kok.
```

**Guru BK** (mulai detik 43,4)
```
Butuh teman cerita? Ruang Be Ka terbuka buat kamu.
```

## Langkah di HeyGen

1. **Create Video**, pilih rasio **9:16**.
2. Untuk audio saja: hapus/sembunyikan avatar di scene, isi kolom **Script** dengan teks di atas, pilih suara Bahasa Indonesia, atur kecepatan.
3. Klik **Play** pada tiap scene untuk cek durasi. Kalau melebihi kolom *Maks. durasi*, naikkan kecepatan sedikit atau pendekkan kalimat.
4. **Submit/Export**, unduh hasilnya.
5. Gabungkan ke video:
   - **Paling rapi:** kirim file-file HeyGen ke Claude; tiap file ditempatkan otomatis di detiknya:
     `python3 desain/audio_reels.py audio-dubbing.wav --suara folder_heygen`
   - **Manual:** di CapCut, impor `reels-otak-nge-freeze.mp4`, lalu letakkan tiap audio di detik "Mulai di video".

## Catatan

- Dubbing AI tidak memerlukan izin suara siswa; tetap jangan menyebut nama siswa.
- Jika memakai *voice clone* suara guru, gunakan suara milik sendiri dan atas persetujuan pemiliknya.
