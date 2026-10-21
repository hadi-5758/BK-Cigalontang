"""
Musik latar + efek suara untuk Reels "POV: H-5 TKA tapi Otak Nge-freeze".
Semua bunyi disintesis dari nol (numpy), jadi bebas hak cipta.
Timing mengikuti animasi di reels-otak-nge-freeze.html (48 detik).

Pemakaian:
  python3 audio_reels.py <keluaran.wav> [--suara folder_rekaman]
Jika --suara diberikan, file dialog-01.wav … dialog-NN.wav di folder itu
dicampur pada waktu yang tercantum di DIALOG, dan musik otomatis diturunkan (ducking).
"""
import sys
import wave
from pathlib import Path
import numpy as np

SR = 44100
DURASI = 48.0
N = int(SR * DURASI)
rng = np.random.default_rng(7)

# waktu mulai tiap baris dialog (detik) — sama dengan teks di layar
# (mulai detik, pembicara, kalimat, durasi maksimal detik) — sama dengan teks di layar
DIALOG = [
    (0.2, "Siswi", "Aduh… H-5 TKA, tapi otakku nge-freeze.", 5.0),
    (5.3, "Siswi", "Kok semua materi kayak baru pertama lihat, sih…", 3.2),
    (9.3, "Siswa", "Eh, berhenti dulu sebentar. Coba ikutin aku.", 3.6),
    (13.0, "Siswa", "Sebutin lima hal yang kamu lihat…", 1.9),
    (15.0, "Siswa", "empat hal yang bisa kamu sentuh…", 1.9),
    (17.0, "Siswa", "tiga suara yang kamu dengar…", 1.9),
    (19.0, "Siswa", "dua aroma yang kamu cium…", 1.9),
    (21.0, "Siswa", "dan satu hal yang kamu syukuri.", 2.2),
    (23.6, "Siswa", "Sekarang ikuti titiknya. Tarik napas…", 3.8),
    (27.6, "Siswa", "Tahan…", 3.8),
    (31.6, "Siswa", "Hembuskan pelan-pelan…", 3.8),
    (35.6, "Siswa", "Tahan…", 3.4),
    (39.6, "Siswa", "Cemas itu wajar. Bisa dikelola, kok.", 1.5),
    (41.2, "Siswi", "Oke… mulai dari satu bab dulu.", 1.8),
    (43.4, "Guru BK", "Butuh teman cerita? Ruang BK terbuka buat kamu.", 4.0),
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


def nada(freq, dur, harm=(1, .35, .12), vib=0.0):
    t = np.arange(t2i(dur)) / SR
    x = sum(amp * np.sin(2 * np.pi * freq * (k + 1) * t + vib * np.sin(2 * np.pi * 5 * t))
            for k, amp in enumerate(harm))
    return x


def tambah(buf, x, t, gain=1.0):
    i = t2i(t)
    j = min(len(buf), i + len(x))
    if j > i:
        buf[i:j] += x[:j - i] * gain


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


musik = np.zeros(N)
sfx = np.zeros(N)

# ---------- 0–8 s: tegang (drone rendah + detak jam yang makin cepat) ----------
drone = (nada(hz(38), 8.4, (1, .5, .2)) + .6 * nada(hz(45), 8.4, (1, .3))) * env_adsr(t2i(8.4), 1.5, .1, 1, 1.2)
tambah(musik, drone, 0, .10)
t = 0.2
while t < 8:
    klik = rng.normal(0, 1, t2i(.025)) * np.exp(-np.linspace(0, 9, t2i(.025)))
    klik = np.convolve(klik, np.ones(3) / 3, "same")
    tambah(sfx, klik, t, .22 if int(t * 2) % 2 == 0 else .14)
    t += .5 if t < 4 else .36
# "whoosh" kecil saat materi beterbangan (3.8 s dst.)
for i in range(5):
    n = t2i(.35)
    w = rng.normal(0, 1, n) * np.sin(np.linspace(0, np.pi, n)) ** 2
    w = np.convolve(w, np.ones(40) / 40, "same")
    tambah(sfx, w, 3.8 + i * .35, .25)

# ---------- 8–48 s: lo-fi hangat 80 bpm ----------
BPM = 80
ketuk = 60 / BPM
# Fmaj7 – Em7 – Dm7 – Cmaj7 (setiap akor 2 birama = 8 ketuk)
akor = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]]
mulai_lofi = 8.0
t = mulai_lofi
i = 0
while t < 47:
    nadas = akor[i % 4]
    dur = 8 * ketuk
    for k, m in enumerate(nadas):
        # piano listrik lembut: harmonik + peluruhan
        x = nada(hz(m), dur, (1, .28, .08, .03)) * np.exp(-np.linspace(0, 2.0, t2i(dur)))
        tambah(musik, x, t + k * .018, .055)
        # pukulan kedua di tengah akor
        x2 = nada(hz(m + 12 if k == 3 else m), dur / 2, (1, .2)) * np.exp(-np.linspace(0, 4, t2i(dur / 2)))
        tambah(musik, x2, t + 4 * ketuk + k * .02, .03)
    # bass
    b = nada(hz(nadas[0] - 12), dur + .15, (1, .15)) * env_adsr(t2i(dur + .15), .02, .2, .7, .3)
    tambah(musik, b, t, .11)
    # pad lembut yang menyambung antarakor (tumpang tindih 0.6 s) agar tidak ada celah senyap
    pad_ak = sum(nada(hz(m + 12), dur + .6, (1, .1)) for m in nadas[1:]) / 3
    tambah(musik, pad_ak * env_adsr(t2i(dur + .6), .6, .1, 1, .6), t, .035)
    t += dur
    i += 1

# drum lembut (kick, snare berdesir, hi-hat) — berhenti saat napas kotak agar tenang
def kick():
    n = t2i(.35); tt = np.arange(n) / SR
    f = 110 * np.exp(-tt * 18) + 45
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9)

def snare():
    n = t2i(.22)
    x = rng.normal(0, 1, n) * np.exp(-np.linspace(0, 7, n))
    return np.convolve(x, np.ones(6) / 6, "same")

def hat():
    n = t2i(.05)
    x = rng.normal(0, 1, n) * np.exp(-np.linspace(0, 10, n))
    return x - np.convolve(x, np.ones(4) / 4, "same")

t = mulai_lofi
k = 0
while t < 46:
    drum_on = not (23.2 <= t < 39.5)
    if drum_on:
        if k % 4 in (0, 2) and not (k % 8 == 6):
            tambah(musik, kick(), t, .32)
        if k % 4 in (1, 3):
            tambah(musik, snare(), t, .10)
        tambah(musik, hat(), t + ketuk / 2, .05)
        tambah(musik, hat(), t, .035)
    t += ketuk
    k += 1

# desis vinyl tipis sepanjang lo-fi
vinyl = rng.normal(0, 1, N) * .006
vinyl[:t2i(mulai_lofi)] = 0
crackle = (rng.random(N) > .9994) * rng.normal(0, .25, N)
musik += np.convolve(vinyl + crackle * (np.arange(N) > t2i(mulai_lofi)), np.ones(3) / 3, "same")

# ---------- efek suara ----------
def pop(f=880):
    n = t2i(.12); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * (f + 900 * np.exp(-tt * 40)) * tt) * np.exp(-tt * 30)

def ding(m):
    return nada(hz(m), 1.4, (1, .4, .15, .05)) * np.exp(-np.linspace(0, 5, t2i(1.4)))

tambah(sfx, pop(700), 9.2, .35)          # gelembung bicara siswa
tambah(sfx, pop(900), 41.0, .35)         # gelembung "oke"
for j, m in enumerate([79, 76, 74, 72, 79]):   # ding tiap langkah grounding
    tambah(sfx, ding(m), 13.0 + j * 2, .16)
# langkah kaki siswa berjalan masuk (8–9.6 s)
for j in range(4):
    n = t2i(.08)
    s = rng.normal(0, 1, n) * np.exp(-np.linspace(0, 8, n))
    tambah(sfx, np.convolve(s, np.ones(25) / 25, "same"), 8.15 + j * .4, .5)

# pad napas kotak: mengembang saat tarik, tetap saat tahan, surut saat hembus
t0, T = 23.5, 16.0
n = t2i(T); tt = np.arange(n) / SR
fase = (tt % 16) / 4
vol = np.select([fase < 1, fase < 2, fase < 3], [fase, np.ones_like(fase), 3 - fase], np.zeros_like(fase))
vol = np.convolve(vol, np.ones(2000) / 2000, "same")
pad = sum(np.sin(2 * np.pi * hz(m) * tt + .3 * np.sin(2 * np.pi * .2 * tt)) for m in (60, 64, 67, 71, 74))
tambah(musik, pad * (.25 + .75 * vol) / 5, t0, .16)
# nada penanda tiap pergantian sisi kotak
for j, m in enumerate([72, 76, 67, 76]):
    tambah(sfx, ding(m) * .6, t0 + j * 4, .12)

# kilau lega (39.6 s) & chime penutup (43 s)
for j, m in enumerate([84, 88, 91, 96]):
    tambah(sfx, ding(m), 39.6 + j * .07, .09)
for j, m in enumerate([72, 76, 79, 84]):
    tambah(sfx, ding(m), 43.0 + j * .12, .12)

# ---------- campur ----------
fade = np.ones(N)
fade[-t2i(3):] = np.linspace(1, 0, t2i(3)) ** 1.5
fade[:t2i(.3)] = np.linspace(0, 1, t2i(.3))
musik *= fade

suara = np.zeros(N)
args = sys.argv[1:]
keluar = Path(args[0] if args else "reels-audio.wav")
if "--suara" in args:
    folder = Path(args[args.index("--suara") + 1])
    import subprocess, tempfile
    akhir_sebelum = 0.0
    for k, (mulai, siapa, kalimat, maks) in enumerate(DIALOG, 1):
        cocok = sorted(folder.glob(f"dialog-{k:02d}.*"))
        if not cocok:
            print(f"  (lewati) dialog-{k:02d} belum ada: {kalimat}")
            continue
        def baca(tempo=1.0):
            # konversi format apa pun (wav/m4a/mp3/ogg/mp4) ke WAV mono 44.1 kHz, opsional dipercepat
            with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(cocok[0]), "-vn", "-ac", "1", "-ar", str(SR),
                                "-af", f"atempo={tempo:.3f}", tmp.name], check=True)
                with wave.open(tmp.name) as w:
                    d = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768
            # potong hening di awal & akhir
            energi = np.convolve(np.abs(d), np.ones(441) / 441, "same")
            aktif = np.nonzero(energi > max(.003, energi.max() * .02))[0]  # ambang rendah agar akhir kata yang lembut tidak terpotong
            if len(aktif):
                d = d[max(0, aktif[0] - t2i(.05)):aktif[-1] + t2i(.15)]
            return d
        data = baca()
        # terlalu panjang? percepat halus (maks 1.15x, nada tetap) agar tidak menabrak baris berikutnya
        if len(data) / SR > maks + .05:
            tempo = min(1.15, len(data) / SR / maks)
            data = baca(tempo)
            print(f"  dialog-{k:02d} dipercepat {tempo:.2f}x -> {len(data)/SR:.1f} dtk")
        if len(data) / SR > maks + .3:
            print(f"  peringatan: dialog-{k:02d} {len(data)/SR:.1f} dtk > maks {maks} dtk ({siapa}: {kalimat})")
        # kalau baris sebelumnya belum selesai, geser sedikit (maks 0.6 dtk) agar tidak bertumpuk
        geser = max(0.0, akhir_sebelum + .1 - mulai)
        if geser > 0:
            print(f"  dialog-{k:02d} digeser +{geser:.2f} dtk" + ("  (lebih dari 0.6 dtk, sebaiknya rekam ulang lebih singkat)" if geser > .6 else ""))
            mulai += geser
        tambah(suara, data / (np.abs(data).max() + 1e-9) * .8, mulai)
        akhir_sebelum = mulai + len(data) / SR
    # ducking: musik turun saat ada suara
    env = np.convolve(np.abs(suara), np.ones(t2i(.25)) / t2i(.25), "same")
    musik *= 1 - .6 * np.clip(env / .05, 0, 1)

if "--tanpa-musik" in args:
    musik[:] = 0; sfx[:] = 0
campur = musik + sfx + suara
campur /= max(1e-9, np.abs(campur).max() / .89)
# stereo sederhana: sedikit lebar dengan delay kanal kanan
kiri = campur
kanan = np.concatenate([np.zeros(t2i(.012)), campur[:-t2i(.012)]]) * .97 + campur * .03
stereo = np.stack([kiri, kanan], axis=1)
with wave.open(str(keluar), "w") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((stereo * 32767).astype(np.int16).tobytes())
print("audio:", keluar)
