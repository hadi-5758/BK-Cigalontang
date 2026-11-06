"""
Klip dubbing ElevenLabs untuk Reels "Pagi Hari Pertama TKA", satu file per baris.
Memakai fungsi & suara yang sama dengan dubbing_elevenlabs.py (kunci API dari Network secrets).

Pemakaian:
  python3 dubbing_hari_pertama.py <folder_keluaran> [nomor_baris ...]
Tanpa nomor baris -> semua baris yang belum ada filenya.
"""
import sys
import time
import urllib.error
from pathlib import Path

from dubbing_elevenlabs import SUARA, buat

# (nomor, pemeran, teks dengan tag emosi eleven_v4) — urutan sama dengan DIALOG di reels-hari-pertama-tka.html
BARIS = [
    (1, "Siswi", "[nervous] Hari ini... hari pertama TKA."),
    (2, "Siswi", "[worried] Duh... gimana kalau nanti aku blank?"),
    (3, "Siswi", "[anxious] Kalau waktunya nggak cukup? Kalau nilainya jelek?"),
    (4, "Siswa", "[cheerful] Pagi! Tenang... kita kan udah latihan bareng."),
    (5, "Siswa", "[warmly] Kerjain sebisanya. Satu soal, satu soal."),
    (6, "Siswi", "[relieved] Iya juga, ya... aku udah berusaha."),
    (7, "Guru BK", "[warmly] Selamat pagi! Sebelum masuk, tarik napas dulu, yuk."),
    (8, "Guru BK", "[calm] Tarik napas..."),
    (9, "Guru BK", "[calm] Hembuskan pelan-pelan..."),
    (10, "Guru BK", "[warmly] Kamu sudah berusaha."),
    (11, "Guru BK", "[warmly] Hasil bukan satu-satunya ukuran dirimu."),
    (12, "Guru BK", "[warmly] Kerjakan dengan jujur, lakukan yang terbaik, ya."),
    (13, "Siswi", "[happy] Makasih, Bu! Bismillah."),
]


def main():
    keluar = Path(sys.argv[1])
    keluar.mkdir(parents=True, exist_ok=True)
    pilih = {int(x) for x in sys.argv[2:]}
    for no, siapa, teks in BARIS:
        f = keluar / f"dialog-{no:02d}.mp3"
        if (pilih and no not in pilih) or (not pilih and f.exists()):
            continue
        for coba in range(6):
            try:
                f.write_bytes(buat(teks, SUARA[siapa]))
                print(f"OK  dialog-{no:02d} ({siapa}) {f.stat().st_size // 1024} KB")
                break
            except urllib.error.HTTPError as e:
                pesan = e.read().decode(errors="replace")[:300]
                if e.code == 429:
                    time.sleep(20 * (coba + 1))
                    continue
                print(f"GAGAL dialog-{no:02d}: HTTP {e.code} {pesan}")
                return 1
        else:
            print(f"GAGAL dialog-{no:02d}: masih dibatasi")
            return 1
        time.sleep(1)
    return 0


if __name__ == "__main__":
    sys.exit(main())
