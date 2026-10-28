"""
Musik latar + efek suara untuk Reels "Sumpah Pemuda Versi Anak Muda Digital" (50 detik).
Semua bunyi disintesis dari nol (numpy), jadi bebas hak cipta.
Waktu kejadian mengikuti render() di reels-sumpah-pemuda-digital.html.

Waktu kejadian ditulis dalam waktu TIMELINE animasi, lalu dipetakan ke waktu video
dengan TEMPO yang sama seperti di HTML (versi dubbing diregangkan mengikuti narasi).

Pemakaian:
  python3 audio_sumpah_pemuda.py <keluaran.wav>                       (tanpa suara, 50 dtk)
  python3 audio_sumpah_pemuda.py <keluaran.wav> --dubbing <folder>    (narasi dialog-01..15.mp3, 77,5 dtk)
"""
import subprocess
import sys
import tempfile
import wave
from pathlib import Path
import numpy as np

SR = 44100
rng = np.random.default_rng(28)
args = sys.argv[1:]
DUBBING = "--dubbing" in args

# [detik video, detik timeline] — HARUS sama dengan TEMPO di reels-sumpah-pemuda-digital.html
TEMPO = ([[0, 0], [6.1, 5.4], [9.8, 7.8], [15.1, 11], [18.9, 14], [23.2, 17.3], [27.1, 18.6], [31.1, 22],
          [37.4, 24.4], [39.4, 25.2], [40.0, 25.8], [43.6, 28.8], [44.0, 29.2], [45.8, 31], [50.1, 34.6],
          [53.0, 35.6], [57.0, 38], [59.4, 38.8], [63.2, 42.4], [65.2, 44.6], [66.0, 45.2], [69.4, 45.8],
          [73.9, 46.8], [77.5, 50]]
         if DUBBING else [[0, 0], [50, 50]])
DURASI = TEMPO[-1][0]
N = int(SR * DURASI)


def nyata(t):
    """waktu timeline -> waktu video"""
    return float(np.interp(t, [a for _, a in TEMPO], [r for r, _ in TEMPO]))


# (mulai detik VIDEO, pemeran, kalimat) — versi dubbing; file dialog-NN.mp3 sesuai urutan
DIALOG = [
    (0.5, "Siswi", "Sembilan puluh delapan tahun lalu, para pemuda bersatu lewat satu janji."),
    (6.3, "Siswa", "Dulu, mereka berkumpul dan berikrar."),
    (9.9, "Siswi", "Sekarang, kita berkumpul di grup chat, kolom komentar, dan FYP."),
    (15.3, "Siswa", "Jadi, ini tiga janji kita di ruang digital."),
    (19.1, "Siswa", "Janji pertama: satu ruang digital, tanpa perundungan."),
    (23.3, "Siswi", "Kalau ada teman diejek di grup, jangan ikut react."),
    (27.3, "Siswi", "Japri dia. Tanya, kamu oke?"),
    (31.3, "Siswi", "Janji kedua: satu bahasa, santun di kolom komentar."),
    (35.6, "Siswa", "Sebelum kirim, cek dulu. Benar? Perlu? Baik?"),
    (40.1, "Siswa", "Kalau nggak, ganti jadi kata-kata yang mendukung."),
    (46.0, "Siswa", "Janji ketiga: satu tekad, bersatu dalam beda."),
    (50.2, "Siswi", "Kita satu, walau nggak sama. Nggak setuju? Bantah idenya, bukan orangnya."),
    (57.2, "Guru BK", "Mulai dari jempol sendiri. Bisukan, laporkan, dukung, japri, dan cek fakta."),
    (65.4, "Guru BK", "Tulis janji digital-mu di kolom komentar. Kalau kamu sedang dirundung, kamu nggak sendiri. Ruang BK selalu terbuka."),
    (74.0, "Siswa", "Selamat Hari Sumpah Pemuda!"),
]


def t2i(t):
    return int(round(t * SR))


def env_adsr(n, a=.01, d=.1, s=.6, r=.3):
    a, d, r = (int(x * SR) for x in (a, d, r))
    e = np.full(n, float(s))
    e[:a] = np.linspace(0, 1, a, endpoint=False)
    e[a:a + d] = np.linspace(1, s, d, endpoint=False)
    e[-r:] *= np.linspace(1, 0, r)
    return e


def nada(freq, dur, harm=(1, .35, .12)):
    t = np.arange(t2i(dur)) / SR
    return sum(amp * np.sin(2 * np.pi * freq * (k + 1) * t) for k, amp in enumerate(harm))


def tambah(buf, x, t, gain=1.0):
    i = t2i(t)
    j = min(len(buf), i + len(x))
    if j > i:
        buf[i:j] += x[:j - i] * gain


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


musik = np.zeros(N)
sfx = np.zeros(N)

# ---------- musik: ceria 100 bpm, G – D – Em – C ----------
BPM = 100
ketuk = 60 / BPM
akor = [[43, 55, 59, 62], [50, 54, 57, 62], [52, 55, 59, 64], [48, 55, 60, 64]]
TENANG = (nyata(22.0), nyata(31.0))   # adegan mengetik komentar: musik lebih tipis
t, i = 0.0, 0
while t < DURASI - .5:
    nadas = akor[i % 4]
    dur = 4 * ketuk
    tipis = .6 if TENANG[0] <= t < TENANG[1] else 1.0
    for k in range(4):                      # piano berdenyut tiap ketuk
        for m in nadas[1:]:
            x = nada(hz(m), ketuk, (1, .25, .06)) * np.exp(-np.linspace(0, 4, t2i(ketuk)))
            tambah(musik, x, t + k * ketuk, .028 * tipis)
    mel = [nadas[3] + 12, nadas[2] + 12, nadas[3] + 12, nadas[1] + 12]   # melodi pendek
    for k, m in enumerate(mel):
        x = nada(hz(m), ketuk * .9, (1, .3, .1)) * np.exp(-np.linspace(0, 3, t2i(ketuk * .9)))
        tambah(musik, x, t + k * ketuk + ketuk / 2, .02 * tipis)
    b = nada(hz(nadas[0] - 12), dur, (1, .15)) * env_adsr(t2i(dur), .02, .2, .7, .2)
    tambah(musik, b, t, .10 * tipis)
    t += dur
    i += 1


def kick():
    n = t2i(.3); tt = np.arange(n) / SR
    f = 110 * np.exp(-tt * 18) + 45
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 10)


def snare():
    n = t2i(.18)
    x = rng.normal(0, 1, n) * np.exp(-np.linspace(0, 7, n))
    return np.convolve(x, np.ones(5) / 5, "same")


def hat():
    n = t2i(.04)
    x = rng.normal(0, 1, n) * np.exp(-np.linspace(0, 10, n))
    return x - np.convolve(x, np.ones(4) / 4, "same")


t, k = .6, 0
while t < nyata(44.6):
    tipis = TENANG[0] <= t < TENANG[1]
    if k % 4 in (0, 2) and not (tipis and k % 4 == 2):
        tambah(musik, kick(), t, .24)
    if k % 4 in (1, 3) and not tipis:
        tambah(musik, snare(), t, .08)
    tambah(musik, hat(), t + ketuk / 2, .035)
    t += ketuk
    k += 1


# ---------- efek suara ----------
def pop(f=880):
    n = t2i(.12); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * (f + 900 * np.exp(-tt * 40)) * tt) * np.exp(-tt * 30)


def ding(m, dur=1.2):
    return nada(hz(m), dur, (1, .4, .15, .05)) * np.exp(-np.linspace(0, 5, t2i(dur)))


def whoosh(t, gain=.16):
    n = t2i(.4)
    w = rng.normal(0, 1, n) * np.sin(np.linspace(0, np.pi, n)) ** 2
    tambah(sfx, np.convolve(w, np.ones(60) / 60, "same"), nyata(t) - .2, gain)


def klik(t, gain=.12):
    n = t2i(.02)
    x = rng.normal(0, 1, n) * np.exp(-np.linspace(0, 12, n))
    tambah(sfx, np.convolve(x, np.ones(3) / 3, "same"), nyata(t), gain)


def buzz(t):
    n = t2i(.22); tt = np.arange(n) / SR
    x = np.sign(np.sin(2 * np.pi * 150 * tt)) * np.exp(-tt * 9)
    tambah(sfx, np.convolve(x, np.ones(20) / 20, "same"), nyata(t), .05)


for t in (5.4, 11, 14, 22, 31, 38, 44.6):          # pergantian adegan
    whoosh(t)
tambah(sfx, pop(700), nyata(1.4), .3)                      # stiker 98 tahun
for j, t in enumerate((11.6, 12.1, 12.6)):          # tiga janji
    tambah(sfx, pop(700 + j * 150), nyata(t), .3)
for t in (15, 15.7, 16.3):                          # pesan grup masuk
    tambah(sfx, pop(950), nyata(t), .25)
tambah(sfx, kick() * .8, nyata(17.3), .5)                  # cap "jangan ikut react"
tambah(sfx, pop(800), nyata(18.6), .3)                     # japri
rng_k = np.random.default_rng(3)
for t in np.arange(22.8, 24.3, 1 / 13):             # mengetik komentar kasar
    klik(t + rng_k.uniform(-.02, .02))
for t in (24.4, 24.8, 25.2):                        # cek: salah
    buzz(t)
for t in np.arange(25.8, 26.6, 1 / 22):             # menghapus
    klik(t, .08)
for t in np.arange(26.9, 28.8, 1 / 14):             # mengetik komentar baik
    klik(t + rng_k.uniform(-.02, .02))
for j, m in enumerate([76, 79, 83]):                # cek: benar
    tambah(sfx, ding(m, .8), nyata(28.4 + (j + 1) * .15), .06)
tambah(sfx, pop(1000), nyata(29.2), .3)                    # komentar terkirim
for j, m in enumerate([84, 88]):                    # hati
    tambah(sfx, ding(m, .8), nyata(29.8 + j * .08), .07)
for j in range(6):                                  # chip "beda"
    tambah(sfx, pop(600 + j * 80), nyata(31.6 + j * .25), .22)
whoosh(33.4, .12)                                   # chip berkumpul
for j, m in enumerate([72, 76, 79, 84]):            # "Kita satu"
    tambah(sfx, ding(m), nyata(34.6 + j * .06), .08)
tambah(sfx, pop(800), nyata(35.6), .25)
for j in range(5):                                  # daftar aksi kecil
    tambah(sfx, ding(79 + j * 2, .9), nyata(38.9 + j * .9), .07)
for j, m in enumerate([72, 76, 79, 84]):            # penutup
    tambah(sfx, ding(m), nyata(44.8 + j * .12), .11)
tambah(sfx, pop(750), nyata(46.4), .25)

# ---------- narasi (dubbing) ----------
def baca_suara(berkas):
    """mp3/wav apa pun -> mono 44,1 kHz, hening awal/akhir dipotong"""
    with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(berkas), "-vn", "-ac", "1", "-ar", str(SR), tmp.name],
                       check=True)
        with wave.open(tmp.name) as w:
            d = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768
    energi = np.convolve(np.abs(d), np.ones(441) / 441, "same")
    aktif = np.nonzero(energi > max(.003, energi.max() * .02))[0]
    if len(aktif):
        d = d[max(0, aktif[0] - t2i(.05)):aktif[-1] + t2i(.15)]
    return d


suara = np.zeros(N)
if DUBBING:
    folder = Path(args[args.index("--dubbing") + 1])
    akhir_sebelum = 0.0
    for k, (mulai, siapa, kalimat) in enumerate(DIALOG, 1):
        data = baca_suara(folder / f"dialog-{k:02d}.mp3")
        if mulai < akhir_sebelum + .1:
            print(f"  peringatan: dialog-{k:02d} bertumpuk dengan baris sebelumnya")
        bersuara = data[np.convolve(np.abs(data), np.ones(441) / 441, "same") > .01]
        rms = np.sqrt(np.mean(bersuara ** 2)) if len(bersuara) else 1e-9
        data = data * (10 ** (-18 / 20) / (rms + 1e-9))
        data = np.tanh(data * 1.1) / 1.1 if np.abs(data).max() > .95 else data
        tambah(suara, data, mulai)
        akhir_sebelum = mulai + len(data) / SR
        print(f"  dialog-{k:02d} {mulai:5.1f}–{akhir_sebelum:5.1f} dtk  {siapa}: {kalimat}")
    env = np.convolve(np.abs(suara), np.ones(t2i(.25)) / t2i(.25), "same")
    redam = 1 - .6 * np.clip(env / .05, 0, 1)
    musik *= redam
    sfx *= .5 + .5 * redam

# ---------- campur ----------
fade = np.ones(N)
fade[-t2i(2.5):] = np.linspace(1, 0, t2i(2.5)) ** 1.5
fade[:t2i(.3)] = np.linspace(0, 1, t2i(.3))
campur = (musik + sfx) * fade + suara
campur /= max(1e-9, np.abs(campur).max() / .89)
kanan = np.concatenate([np.zeros(t2i(.012)), campur[:-t2i(.012)]]) * .97 + campur * .03
stereo = np.stack([campur, kanan], axis=1)
keluar = Path(args[0] if args and not args[0].startswith("--") else "reels-audio.wav")
with wave.open(str(keluar), "w") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((stereo * 32767).astype(np.int16).tobytes())
print("audio:", keluar)
