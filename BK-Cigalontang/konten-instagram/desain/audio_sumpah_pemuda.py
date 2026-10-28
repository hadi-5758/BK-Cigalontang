"""
Musik latar + efek suara untuk Reels "Sumpah Pemuda Versi Anak Muda Digital" (50 detik).
Semua bunyi disintesis dari nol (numpy), jadi bebas hak cipta.
Waktu kejadian mengikuti render() di reels-sumpah-pemuda-digital.html.

Pemakaian:
  python3 audio_sumpah_pemuda.py <keluaran.wav>
"""
import sys
import wave
from pathlib import Path
import numpy as np

SR = 44100
DURASI = 50.0
N = int(SR * DURASI)
rng = np.random.default_rng(28)


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
TENANG = (22.0, 31.0)   # adegan mengetik komentar: musik lebih tipis
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
while t < 44.6:
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
    tambah(sfx, np.convolve(w, np.ones(60) / 60, "same"), t - .2, gain)


def klik(t, gain=.12):
    n = t2i(.02)
    x = rng.normal(0, 1, n) * np.exp(-np.linspace(0, 12, n))
    tambah(sfx, np.convolve(x, np.ones(3) / 3, "same"), t, gain)


def buzz(t):
    n = t2i(.22); tt = np.arange(n) / SR
    x = np.sign(np.sin(2 * np.pi * 150 * tt)) * np.exp(-tt * 9)
    tambah(sfx, np.convolve(x, np.ones(20) / 20, "same"), t, .05)


for t in (5.4, 11, 14, 22, 31, 38, 44.6):          # pergantian adegan
    whoosh(t)
tambah(sfx, pop(700), 1.4, .3)                      # stiker 98 tahun
for j, t in enumerate((11.6, 12.1, 12.6)):          # tiga janji
    tambah(sfx, pop(700 + j * 150), t, .3)
for t in (15, 15.7, 16.3):                          # pesan grup masuk
    tambah(sfx, pop(950), t, .25)
tambah(sfx, kick() * .8, 17.3, .5)                  # cap "jangan ikut react"
tambah(sfx, pop(800), 18.6, .3)                     # japri
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
    tambah(sfx, ding(m, .8), 28.4 + (j + 1) * .15, .06)
tambah(sfx, pop(1000), 29.2, .3)                    # komentar terkirim
for j, m in enumerate([84, 88]):                    # hati
    tambah(sfx, ding(m, .8), 29.8 + j * .08, .07)
for j in range(6):                                  # chip "beda"
    tambah(sfx, pop(600 + j * 80), 31.6 + j * .25, .22)
whoosh(33.4, .12)                                   # chip berkumpul
for j, m in enumerate([72, 76, 79, 84]):            # "Kita satu"
    tambah(sfx, ding(m), 34.6 + j * .06, .08)
tambah(sfx, pop(800), 35.6, .25)
for j in range(5):                                  # daftar aksi kecil
    tambah(sfx, ding(79 + j * 2, .9), 38.9 + j * .9, .07)
for j, m in enumerate([72, 76, 79, 84]):            # penutup
    tambah(sfx, ding(m), 44.8 + j * .12, .11)
tambah(sfx, pop(750), 46.4, .25)

# ---------- campur ----------
fade = np.ones(N)
fade[-t2i(2.5):] = np.linspace(1, 0, t2i(2.5)) ** 1.5
fade[:t2i(.3)] = np.linspace(0, 1, t2i(.3))
campur = (musik + sfx) * fade
campur /= max(1e-9, np.abs(campur).max() / .89)
kanan = np.concatenate([np.zeros(t2i(.012)), campur[:-t2i(.012)]]) * .97 + campur * .03
stereo = np.stack([campur, kanan], axis=1)
keluar = Path(sys.argv[1] if len(sys.argv) > 1 else "reels-audio.wav")
with wave.open(str(keluar), "w") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((stereo * 32767).astype(np.int16).tobytes())
print("audio:", keluar)
