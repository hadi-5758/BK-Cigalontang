"""
Potong karakter dari lembar referensi menjadi PNG transparan.
Latar putih dihapus dengan flood-fill dari tepi gambar (garis luar karakter
menahan isian, sehingga seragam putih tetap utuh).
Jalankan: python3 potong_karakter.py
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

DIR = Path(__file__).parent
# lembar referensi -> {nama file: (x_awal, x_akhir) kolom pose}
LEMBAR = {
    "referensi-karakter-siswa.webp": {
        "siswa-putra-depan": (6, 264),
        "siswa-putra-samping-kanan": (282, 456),
        "siswa-putra-samping-kiri": (457, 630),
        "siswa-putri-depan": (892, 1124),
        "siswa-putri-samping-kanan": (1124, 1310),
        "siswa-putri-samping-kiri": (1340, 1536),
    },
    "referensi-karakter-guru.webp": {
        "guru-bk-putri-depan": (4, 216),
        "guru-bk-putri-samping-kanan": (216, 382),
        "guru-bk-putri-samping-kiri": (393, 560),
        "guru-bk-putri-belakang": (560, 755),
        "guru-bk-putra-depan": (769, 990),
        "guru-bk-putra-samping-kanan": (990, 1150),
        "guru-bk-putra-samping-kiri": (1160, 1312),
        "guru-bk-putra-belakang": (1313, 1536),
    },
}
AMBANG_PUTIH = 236


def geser(m, dy, dx):
    out = np.zeros_like(m)
    h, w = m.shape
    out[max(dy, 0):h + min(dy, 0), max(dx, 0):w + min(dx, 0)] = \
        m[max(-dy, 0):h + min(-dy, 0), max(-dx, 0):w + min(-dx, 0)]
    return out


def celah_tertutup(kandidat, a, min_luas=150, maks_luas=4000):
    """Area putih kecil yang terkurung garis (mis. celah lengan-badan) ikut dihapus.
    Area besar (kain seragam/jilbab) dibiarkan."""
    h, w = kandidat.shape
    sudah = np.zeros_like(kandidat)
    hasil = np.zeros_like(kandidat)
    for y0, x0 in zip(*np.nonzero(kandidat)):
        if sudah[y0, x0]:
            continue
        tumpukan, piksel = [(y0, x0)], []
        sudah[y0, x0] = True
        while tumpukan:
            y, x = tumpukan.pop()
            piksel.append((y, x))
            for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= yy < h and 0 <= xx < w and kandidat[yy, xx] and not sudah[yy, xx]:
                    sudah[yy, xx] = True
                    tumpukan.append((yy, xx))
        ys, xs = zip(*piksel)
        terang = a[list(ys), list(xs)].min(axis=1).mean()
        if min_luas <= len(piksel) <= maks_luas and terang >= 250:
            hasil[list(ys), list(xs)] = True
    return hasil


def komponen_terbesar(isi):
    """Ambil bagian gambar terbesar yang tersambung (karakternya), buang serpihan pose tetangga."""
    h, w = isi.shape
    label = np.zeros(isi.shape, dtype=np.int32)
    ukuran, n = [0], 0
    for y0, x0 in zip(*np.nonzero(isi)):
        if label[y0, x0]:
            continue
        n += 1
        tumpukan, jml = [(y0, x0)], 0
        label[y0, x0] = n
        while tumpukan:
            y, x = tumpukan.pop()
            jml += 1
            for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= yy < h and 0 <= xx < w and isi[yy, xx] and not label[yy, xx]:
                    label[yy, xx] = n
                    tumpukan.append((yy, xx))
        ukuran.append(jml)
    if n == 0:
        return isi
    terbesar = int(np.argmax(ukuran))
    # pertahankan juga bagian kecil yang lepas tapi cukup besar (mis. sepatu), > 2% dari terbesar
    simpan = [i for i, u in enumerate(ukuran) if i and u >= .02 * ukuran[terbesar]]
    return np.isin(label, simpan)


def potong(img, x0, x1):
    a = np.asarray(img.crop((x0, 0, x1, img.height)).convert("RGB")).astype(int)
    putih = a.min(axis=2) >= AMBANG_PUTIH
    latar = np.zeros_like(putih)
    latar[0, :] = putih[0, :]; latar[-1, :] = putih[-1, :]
    latar[:, 0] = putih[:, 0]; latar[:, -1] = putih[:, -1]
    while True:
        baru = latar | geser(latar, 1, 0) | geser(latar, -1, 0) | geser(latar, 0, 1) | geser(latar, 0, -1)
        baru &= putih
        if (baru == latar).all():
            break
        latar = baru
    latar |= celah_tertutup(putih & ~latar, a)
    latar |= ~komponen_terbesar(~latar)
    alpha = Image.fromarray(np.where(latar, 0, 255).astype("uint8"))
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    rgba = Image.fromarray(a.astype("uint8")).convert("RGBA")
    rgba.putalpha(alpha)
    return rgba.crop(rgba.getbbox())


if __name__ == "__main__":
    for sumber, pose in LEMBAR.items():
        img = Image.open(DIR / sumber)
        for nama, (x0, x1) in pose.items():
            hasil = potong(img, x0, x1)
            hasil.save(DIR / f"{nama}.png")
            print(nama, hasil.size)
