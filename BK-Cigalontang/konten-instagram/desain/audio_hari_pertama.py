"""
Musik latar + efek suara (+ dubbing opsional) untuk Reels "Pagi Hari Pertama TKA".
Semua musik & efek disintesis dari nol (numpy), jadi bebas hak cipta.

Waktu kejadian ditulis dalam waktu TIMELINE animasi (sama dengan render() di
reels-hari-pertama-tka.html), lalu dipetakan ke waktu video dengan TEMPO yang sama.

Pemakaian:
  python3 audio_hari_pertama.py <keluaran.wav>                       (versi tanpa suara, 50,6 dtk)
  python3 audio_hari_pertama.py <keluaran.wav> --dubbing <folder>    (versi dubbing, 62,5 dtk;
                                                                      folder berisi dialog-01..13.mp3)
"""
import subprocess
import sys
import tempfile
import wave
from pathlib import Path
import numpy as np

SR = 44100
rng = np.random.default_rng(11)
args = sys.argv[1:]
DUBBING = "--dubbing" in args

# [detik video, detik timeline] — HARUS sama dengan TEMPO di reels-hari-pertama-tka.html
TEMPO = ([[0, 0], [4.8, 4.8], [5.2, 5.2], [8.6, 7.4], [9.1, 7.9], [12.7, 10.4], [12.9, 10.6], [15.5, 13.2],
          [19.8, 15.9], [20.0, 16.1], [23.9, 18.6], [24.1, 18.8], [24.7, 19.4], [28.6, 21.4], [28.8, 21.6],
          [31.0, 23.8], [35.4, 26.6], [35.6, 26.8], [41.6, 30.2], [42.0, 30.6], [44.0, 32], [47.5, 34.4],
          [51.4, 37.4], [51.7, 37.7], [54.3, 39.8], [54.5, 40], [62.5, 48]]
         if DUBBING else [[0, 0], [26.8, 26.8], [32.8, 30.2], [50.6, 48]])
DURASI = TEMPO[-1][0]
N = int(SR * DURASI)


def nyata(t):
    """waktu timeline -> waktu video"""
    return float(np.interp(t, [a for _, a in TEMPO], [r for r, _ in TEMPO]))


# (mulai detik VIDEO, pemeran, kalimat) — versi dubbing; file dialog-NN.mp3 sesuai urutan
DIALOG = [
    (0.8, "Siswi", "Hari ini... hari pertama TKA."),
    (5.4, "Siswi", "Duh... gimana kalau nanti aku blank?"),
    (9.2, "Siswi", "Kalau waktunya nggak cukup? Kalau nilainya jelek?"),
    (15.7, "Siswa", "Pagi! Tenang... kita kan udah latihan bareng."),
    (20.2, "Siswa", "Kerjain sebisanya. Satu soal, satu soal."),
    (24.9, "Siswi", "Iya juga, ya... aku udah berusaha."),
    (31.2, "Guru BK", "Selamat pagi! Sebelum masuk, tarik napas dulu, yuk."),
    (36.0, "Guru BK", "Tarik napas..."),
    (38.8, "Guru BK", "Hembuskan pelan-pelan..."),
    (42.2, "Guru BK", "Kamu sudah berusaha."),
    (44.2, "Guru BK", "Hasil bukan satu-satunya ukuran dirimu."),
    (47.6, "Guru BK", "Kerjakan dengan jujur, lakukan yang terbaik, ya."),
    (51.9, "Siswi", "Makasih, Bu! Bismillah."),
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
CEMAS = (nyata(4.8), nyata(10.6))        # close-up Nisa cemas: musik redup
NAPAS = (nyata(26.8), nyata(30.2))       # napas bersama: tanpa arpeggio & drum
PESAN = (nyata(30.4), nyata(37.4))       # pesan Bu Guru BK: drum setengah

# ---------- musik: progresi hangat 84 bpm, C – G/B – Am7 – Fmaj7 ----------
BPM = 84
ketuk = 60 / BPM
akor = [[48, 55, 60, 64], [47, 55, 59, 62], [45, 52, 57, 60], [41, 53, 57, 64]]
t, i = 0.0, 0
while t < DURASI - 1:
    nadas = akor[i % 4]
    dur = 4 * ketuk
    redup = .55 if CEMAS[0] <= t < CEMAS[1] else 1.0
    for k, m in enumerate(nadas[1:]):
        x = nada(hz(m), dur, (1, .25, .07)) * np.exp(-np.linspace(0, 2.4, t2i(dur)))
        tambah(musik, x, t + k * .02, .05 * redup)
        if not (NAPAS[0] <= t < NAPAS[1]):
            for j in (1, 2, 3):
                y = nada(hz(nadas[1 + (k + j) % 3] + 12), ketuk, (1, .2)) * np.exp(-np.linspace(0, 6, t2i(ketuk)))
                tambah(musik, y, t + j * ketuk + k * .01, .014 * redup)
    b = nada(hz(nadas[0] - 12), dur + .1, (1, .15)) * env_adsr(t2i(dur + .1), .02, .2, .7, .3)
    tambah(musik, b, t, .10 * redup)
    pad = sum(nada(hz(m + 12), dur + .5, (1, .1)) for m in nadas[1:]) / 3
    tambah(musik, pad * env_adsr(t2i(dur + .5), .5, .1, 1, .5), t, .03)
    t += dur
    i += 1


def kick():
    n = t2i(.3); tt = np.arange(n) / SR
    f = 105 * np.exp(-tt * 18) + 45
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 10)


def snare():
    n = t2i(.2)
    x = rng.normal(0, 1, n) * np.exp(-np.linspace(0, 7, n))
    return np.convolve(x, np.ones(6) / 6, "same")


def hat():
    n = t2i(.05)
    x = rng.normal(0, 1, n) * np.exp(-np.linspace(0, 10, n))
    return x - np.convolve(x, np.ones(4) / 4, "same")


# drum mulai saat Raka datang; berhenti saat napas bersama, setengah saat pesan Bu Guru
t, k = nyata(10.9), 0
while t < nyata(44):
    diam = NAPAS[0] - .4 <= t < PESAN[0] or (PESAN[0] <= t < PESAN[1] and k % 2)
    if not diam:
        if k % 4 in (0, 2):
            tambah(musik, kick(), t, .26)
        if k % 4 in (1, 3):
            tambah(musik, snare(), t, .08)
        tambah(musik, hat(), t + ketuk / 2, .04)
    t += ketuk
    k += 1

# pad napas bersama: mengembang saat tarik, surut saat hembus
t0, T = nyata(26.8) + .2, NAPAS[1] - NAPAS[0]
n = t2i(T); tt = np.arange(n) / SR
vol = np.interp(tt / T, [0, .03, .5, .97, 1], [0, .2, 1, .05, 0])
padn = sum(np.sin(2 * np.pi * hz(m) * tt + .3 * np.sin(2 * np.pi * .2 * tt)) for m in (60, 64, 67, 71))
tambah(musik, padn * vol / 4, t0, .2)
desah = np.convolve(rng.normal(0, 1, n), np.ones(80) / 80, "same") * vol
tambah(sfx, desah, t0, .25)


# ---------- efek suara (waktu timeline) ----------
def pop(f=880):
    n = t2i(.12); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * (f + 900 * np.exp(-tt * 40)) * tt) * np.exp(-tt * 30)


def ding(m, dur=1.4):
    return nada(hz(m), dur, (1, .4, .15, .05)) * np.exp(-np.linspace(0, 5, t2i(dur)))


def langkah_kaki(t, gain=.45):
    n = t2i(.08)
    s = rng.normal(0, 1, n) * np.exp(-np.linspace(0, 8, n))
    tambah(sfx, np.convolve(s, np.ones(25) / 25, "same"), nyata(t), gain)


def whoosh(t, gain=.18):
    n = t2i(.4)
    w = rng.normal(0, 1, n) * np.sin(np.linspace(0, np.pi, n)) ** 2
    tambah(sfx, np.convolve(w, np.ones(60) / 60, "same"), nyata(t) - .2, gain)


for j in range(9):                      # Nisa berjalan
    langkah_kaki(.4 + j * .46, .35)
for j in range(5):                      # Raka berjalan masuk
    langkah_kaki(11.0 + j * .45, .4)
for j in range(5):                      # Bu Guru keluar gerbang
    langkah_kaki(21.7 + j * .5, .3)
for j in range(8):                      # masuk gerbang bersama, makin jauh
    langkah_kaki(40.4 + j * .42, .35 * (1 - j / 9))
for t in (4.8, 18.8, 30.4, 40.0):       # potong ke/dari close-up
    whoosh(t)
for t, f in ((5.2, 600), (7.9, 600), (13.2, 760), (16.1, 760), (19.4, 900), (23.8, 680), (37.7, 900)):
    tambah(sfx, pop(f), nyata(t), .3)    # gelembung muncul
for j, m in enumerate([67, 64]):          # kekhawatiran beterbangan
    tambah(sfx, ding(m, .8), nyata(8.2) + j * .3, .06)
for j, m in enumerate([72, 76, 79]):      # "Kamu sudah berusaha"
    tambah(sfx, ding(m), nyata(30.6) + j * .1, .07)
for j, m in enumerate([76, 79, 84]):      # baris kedua pesan
    tambah(sfx, ding(m), nyata(32.0) + j * .1, .07)
for j, m in enumerate([84, 88, 91, 96]):  # Nisa tersenyum
    tambah(sfx, ding(m), nyata(38.8) + j * .07, .08)
for j, m in enumerate([72, 76, 79, 84]):  # kartu penutup
    tambah(sfx, ding(m), nyata(44.3) + j * .12, .12)


# ---------- dubbing ----------
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
        # samakan kekerasan rata-rata (RMS bagian bersuara) agar kalimat lembut tidak tenggelam
        bersuara = data[np.convolve(np.abs(data), np.ones(441) / 441, "same") > .01]
        rms = np.sqrt(np.mean(bersuara ** 2)) if len(bersuara) else 1e-9
        data = data * (10 ** (-18 / 20) / (rms + 1e-9))
        data = np.tanh(data * 1.1) / 1.1 if np.abs(data).max() > .95 else data
        tambah(suara, data, mulai)
        akhir_sebelum = mulai + len(data) / SR
        print(f"  dialog-{k:02d} {mulai:5.1f}–{akhir_sebelum:5.1f} dtk  {siapa}: {kalimat}")
    # ducking: musik & efek turun saat ada suara
    env = np.convolve(np.abs(suara), np.ones(t2i(.25)) / t2i(.25), "same")
    redam = 1 - .6 * np.clip(env / .05, 0, 1)
    musik *= redam
    sfx *= .5 + .5 * redam

# ---------- campur ----------
fade = np.ones(N)
fade[-t2i(2.5):] = np.linspace(1, 0, t2i(2.5)) ** 1.5
fade[:t2i(.4)] = np.linspace(0, 1, t2i(.4))
campur = (musik + sfx) * fade + suara
campur /= max(1e-9, np.abs(campur).max() / .89)
kanan = np.concatenate([np.zeros(t2i(.012)), campur[:-t2i(.012)]]) * .97 + campur * .03
stereo = np.stack([campur, kanan], axis=1)
keluar = Path(args[0] if args and not args[0].startswith("--") else "reels-audio.wav")
with wave.open(str(keluar), "w") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((stereo * 32767).astype(np.int16).tobytes())
print("audio:", keluar, f"{DURASI} dtk")
