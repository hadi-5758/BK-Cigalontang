"""
Buat klip dubbing Reels lewat API ElevenLabs (text-to-speech), satu file per baris.
Kunci API tidak disimpan di sini: header `xi-api-key` disisipkan otomatis oleh
proxy environment (Network secrets untuk api.elevenlabs.io).

Pemakaian:
  python3 dubbing_elevenlabs.py <folder_keluaran> [nomor_baris ...]
Tanpa nomor baris -> semua baris yang belum ada filenya.
"""
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

MODEL = "eleven_v4"
KECEPATAN = 0.9  # sedikit lebih pelan dari normal agar tidak terdengar tergesa-gesa
SUARA = {
    "Siswi": "TrU3igk19A4aIUi2GAA2",    # Velora - warm, youthful & conversational
    "Siswa": "URAuwR59OqCASDVp35yi",    # Ibnu - Calm, Clear
    "Guru BK": "AuBaOxpzoX6MXx6bnkls",  # Salsa - Warm, Calm and Breathy
}
# (nomor, pemeran, teks dengan tag emosi eleven_v4) — urutan sama dengan DIALOG di audio_reels.py
BARIS = [
    (1, "Siswi", "[worried] Aduh... H min lima TKA, tapi otakku nge-freeze."),
    (2, "Siswi", "[confused] Kok semua materi kayak baru pertama lihat, sih..."),
    (3, "Siswa", "[warmly] Eh, berhenti dulu sebentar. Coba ikutin aku."),
    (4, "Siswa", "[softly] Sebutin lima hal yang kamu lihat..."),
    (5, "Siswa", "[softly] Empat hal yang bisa kamu sentuh..."),
    (6, "Siswa", "[softly] Tiga suara yang kamu dengar..."),
    (7, "Siswa", "[softly] Dua aroma yang kamu cium..."),
    (8, "Siswa", "[warmly] Dan satu hal yang kamu syukuri."),
    (9, "Siswa", "[softly] Sekarang, ikuti titiknya. Tarik napas..."),
    (10, "Siswa", "[softly] Tahan..."),
    (11, "Siswa", "[softly] Hembuskan, pelan-pelan..."),
    (12, "Siswa", "[softly] Tahan..."),
    (13, "Siswa", "[warmly] Cemas itu wajar, kok."),
    (14, "Siswi", "[relieved] Oke... mulai dari satu bab dulu."),
    (15, "Guru BK", "[warmly] Butuh teman cerita? Ruang BK terbuka buat kamu."),
]


def buat(teks, voice_id):
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_128"
    body = json.dumps({"text": teks, "model_id": MODEL,
                       "voice_settings": {"speed": KECEPATAN}}).encode()
    req = urllib.request.Request(url, data=body, method="POST",
                                 headers={"Content-Type": "application/json", "Accept": "audio/mpeg"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


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
                    jeda = 20 * (coba + 1)
                    print(f"429 dialog-{no:02d}, tunggu {jeda} dtk")
                    time.sleep(jeda)
                    continue
                print(f"GAGAL dialog-{no:02d}: HTTP {e.code} {pesan}")
                return 1
        else:
            print(f"GAGAL dialog-{no:02d}: masih dibatasi setelah 6 percobaan")
            return 1
        time.sleep(1)
    return 0


if __name__ == "__main__":
    sys.exit(main())
