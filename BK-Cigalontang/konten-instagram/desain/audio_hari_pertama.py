"""
Musik latar + efek suara untuk Reels "Pagi Hari Pertama TKA" (50,6 detik).
Semua bunyi disintesis dari nol (numpy), jadi bebas hak cipta.
Timing mengikuti waktu NYATA video reels-hari-pertama-tka.html
(adegan sesudah momen napas sudah termasuk pergeseran +2,6 detik).

Pemakaian:
  python3 audio_hari_pertama.py <keluaran.wav>
"""
import sys
import wave
from pathlib import Path
import numpy as np

SR = 44100
DURASI = 50.6
N = int(SR * DURASI)
rng = np.random.default_rng(11)


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

# ---------- musik: progresi hangat 84 bpm, C – G/B – Am7 – Fmaj7 ----------
BPM = 84
ketuk = 60 / BPM
akor = [[48, 55, 60, 64], [47, 55, 59, 62], [45, 52, 57, 60], [41, 53, 57, 64]]
t, i = 0.0, 0
while t < DURASI - 1:
    nadas = akor[i % 4]
    dur = 4 * ketuk
    # Nisa cemas (4,8–10,6 s): piano lebih pelan & redup
    redup = .55 if 4.8 <= t < 10.6 else 1.0
    for k, m in enumerate(nadas[1:]):
        x = nada(hz(m), dur, (1, .25, .07)) * np.exp(-np.linspace(0, 2.4, t2i(dur)))
        tambah(musik, x, t + k * .02, .05 * redup)
        # arpeggio ringan di ketuk 2-4 (bukan saat napas bersama)
        if not (26.8 <= t < 32.8):
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


# drum mulai saat Raka datang (10,9 s); berhenti saat napas bersama & close-up pesan Bu Guru
t, k = 10.9, 0
while t < 46.6:
    if not (26.4 <= t < 33.0 or 33.0 <= t < 40.0 and k % 2):   # saat pesan Bu Guru: setengah kepadatan
        if k % 4 in (0, 2):
            tambah(musik, kick(), t, .26)
        if k % 4 in (1, 3):
            tambah(musik, snare(), t, .08)
        tambah(musik, hat(), t + ketuk / 2, .04)
    t += ketuk
    k += 1

# pad napas bersama: mengembang saat tarik (27,15–30 s), surut saat hembus (30–32,8 s)
t0, T = 27.0, 6.0
n = t2i(T); tt = np.arange(n) / SR
vol = np.interp(tt, [0, .15, 3.0, 5.8, 6.0], [0, .2, 1, .05, 0])
padn = sum(np.sin(2 * np.pi * hz(m) * tt + .3 * np.sin(2 * np.pi * .2 * tt)) for m in (60, 64, 67, 71))
tambah(musik, padn * vol / 4, t0, .2)
desah = np.convolve(rng.normal(0, 1, n), np.ones(80) / 80, "same") * vol
tambah(sfx, desah, t0, .25)    # desir napas


# ---------- efek suara ----------
def pop(f=880):
    n = t2i(.12); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * (f + 900 * np.exp(-tt * 40)) * tt) * np.exp(-tt * 30)


def ding(m, dur=1.4):
    return nada(hz(m), dur, (1, .4, .15, .05)) * np.exp(-np.linspace(0, 5, t2i(dur)))


def langkah_kaki(t, gain=.45):
    n = t2i(.08)
    s = rng.normal(0, 1, n) * np.exp(-np.linspace(0, 8, n))
    tambah(sfx, np.convolve(s, np.ones(25) / 25, "same"), t, gain)


def whoosh(t, gain=.18):
    n = t2i(.4)
    w = rng.normal(0, 1, n) * np.sin(np.linspace(0, np.pi, n)) ** 2
    tambah(sfx, np.convolve(w, np.ones(60) / 60, "same"), t - .2, gain)


for j in range(9):                      # Nisa berjalan (0,2–4,4 s)
    langkah_kaki(.4 + j * .46, .35)
for j in range(5):                      # Raka berjalan masuk (10,9–12,9 s)
    langkah_kaki(11.0 + j * .45, .4)
for j in range(5):                      # Bu Guru keluar gerbang (21,6–23,8 s)
    langkah_kaki(21.7 + j * .5, .3)
for j in range(8):                      # masuk gerbang bersama (43–46 s), makin jauh
    langkah_kaki(43.0 + j * .42, .35 * (1 - j / 9))
for t in (4.8, 18.8, 33.0, 42.6):       # potong ke/dari close-up
    whoosh(t)
for t, f in ((5.2, 600), (7.9, 600), (13.2, 760), (16.1, 760), (19.4, 900), (23.8, 680), (40.3, 900)):
    tambah(sfx, pop(f), t, .3)           # gelembung muncul
for j, m in enumerate([67, 64]):          # kekhawatiran beterbangan (8,2 s), nada turun
    tambah(sfx, ding(m, .8), 8.2 + j * .3, .06)
for j, m in enumerate([72, 76, 79]):      # "Kamu sudah berusaha" (33,2 s) & baris kedua (34,6 s)
    tambah(sfx, ding(m), 33.2 + j * .1, .07)
for j, m in enumerate([76, 79, 84]):
    tambah(sfx, ding(m), 34.6 + j * .1, .07)
for j, m in enumerate([84, 88, 91, 96]):  # Nisa tersenyum (40 s)
    tambah(sfx, ding(m), 41.4 + j * .07, .08)
for j, m in enumerate([72, 76, 79, 84]):  # kartu penutup (46,8 s)
    tambah(sfx, ding(m), 46.9 + j * .12, .12)

# ---------- campur ----------
fade = np.ones(N)
fade[-t2i(2.5):] = np.linspace(1, 0, t2i(2.5)) ** 1.5
fade[:t2i(.4)] = np.linspace(0, 1, t2i(.4))
campur = (musik + sfx) * fade
campur /= max(1e-9, np.abs(campur).max() / .89)
kanan = np.concatenate([np.zeros(t2i(.012)), campur[:-t2i(.012)]]) * .97 + campur * .03
stereo = np.stack([campur, kanan], axis=1)
keluar = Path(sys.argv[1] if len(sys.argv) > 1 else "reels-audio.wav")
with wave.open(str(keluar), "w") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((stereo * 32767).astype(np.int16).tobytes())
print("audio:", keluar)
