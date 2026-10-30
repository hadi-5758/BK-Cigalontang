"""
Potong lembar karakter 2D (latar berwarna/bergradasi) menjadi PNG transparan.

Cara kerja: tiap kotak dipotong dari lembar, latarnya dihapus model segmentasi
BiRefNet (lewat rembg), lalu hanya bagian terbesar (karakternya) yang disimpan.
Latar lembar berwarna pucat/bergradasi terlalu mirip seragam & jilbab putih untuk
isian warna biasa, jadi dipakai model.

Perlu: pip install "rembg[cpu]"  (model ~1 GB diunduh otomatis saat pertama jalan)
Jalankan: python3 potong_2d.py [siswi siswa ...]   (hasil di folder per karakter)
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

DIR = Path(__file__).parent
REF = DIR / "referensi"

# kotak (x0, y0, x1, y1) pada lembar referensi
VIEWS = ["tampak-depan", "menghadap-kanan", "menghadap-kiri", "tampak-belakang"]
LEMBAR = {
    "siswi": {
        "hero": (12, 8, 286, 1005),
        "views": [(312, 52, 478, 568), (482, 52, 615, 568), (628, 52, 778, 568), (788, 52, 962, 568)],
        "ekspresi_y": [(56, 226), (266, 436)],
        "ekspresi_x": [(990, 1115), (1128, 1251), (1265, 1388), (1400, 1522)],
        "ekspresi": ["normal", "senang", "tertawa", "serius", "terkejut", "sedih", "marah", "malu"],
        "pose_y": (660, 946),
        "pose_x": [278, 362, 447, 533, 620, 707, 793, 880, 976],
        "pose": ["salam", "memegang-buku", "menunjuk", "semangat", "peace",
                 "membawa-tas", "membawa-tablet", "mempresentasikan"],
    },
    "siswa": {
        "hero": (8, 10, 288, 1000),
        "views": [(310, 50, 480, 576), (492, 50, 612, 576), (636, 50, 772, 576), (788, 50, 962, 576)],
        "ekspresi_y": [(56, 229), (276, 451)],
        "ekspresi_x": [(988, 1115), (1125, 1252), (1262, 1388), (1398, 1522)],
        "ekspresi": ["normal", "senang", "tertawa", "serius", "terkejut", "sedih", "marah", "malu"],
        "pose_y": (664, 956),
        "pose_x": [258, 358, 443, 528, 612, 700, 782, 882, 972],
        "pose": ["melambaikan-tangan", "mengacungkan-jempol", "menyilangkan-tangan", "menunjuk",
                 "memegang-buku", "memakai-tas", "berjalan", "sikap-santai"],
    },
    "guru-bk-putri": {
        "views": [(28, 104, 214, 664), (222, 104, 368, 664), (416, 104, 558, 664), (582, 104, 762, 664)],
        "ekspresi_y": [(288, 440), (488, 652)],
        "ekspresi_x": [(806, 925), (930, 1048), (1052, 1170), (1176, 1296)],
        "ekspresi": ["normal-ramah", "senyum-terbuka", "tertawa-senang", "terkejut",
                     "serius-profesional", "berpikir", "sedih-empati", "tertegun-mendengar"],
        "pose_tiles": [(20, 742, 192, 930), (197, 742, 362, 930), (367, 742, 545, 930), (548, 742, 722, 930),
                       (727, 742, 903, 930), (905, 742, 1087, 930), (1090, 742, 1296, 930)],
        "pose": ["menyapa", "memberi-arahan", "menjelaskan", "diskusi-konseling",
                 "berpikir", "memegang-dokumen", "memegang-tablet"],
    },
    "guru-bk-putra": {
        "views": [(22, 90, 214, 652), (246, 90, 368, 652), (400, 90, 528, 652), (566, 90, 768, 652)],
        "ekspresi_y": [(273, 422), (473, 626)],
        "ekspresi_x": [(809, 928), (932, 1052), (1055, 1175), (1178, 1298)],
        "ekspresi": ["normal-ramah", "senyum-terbuka", "tertawa-senang", "terkejut",
                     "serius-profesional", "berpikir", "empati", "tegas"],
        "pose_tiles": [(22, 728, 205, 918), (210, 728, 382, 918), (387, 728, 570, 918), (575, 728, 760, 918),
                       (765, 728, 935, 918), (940, 728, 1108, 918), (1113, 728, 1292, 918)],
        "pose": ["menyapa", "memberi-arahan", "menjelaskan", "diskusi-konseling",
                 "mencari-solusi", "tegas-profesional", "memegang-dokumen"],
    },
}

def label_komponen(mask):
    """Label komponen 4-tetangga (tanpa scipy). Kembalikan (label, ukuran)."""
    h, w = mask.shape
    lab = np.zeros(mask.shape, dtype=np.int32)
    ukuran = [0]
    for y0, x0 in zip(*np.nonzero(mask)):
        if lab[y0, x0]:
            continue
        n = len(ukuran)
        lab[y0, x0] = n
        tumpuk, jml = [(y0, x0)], 0
        while tumpuk:
            y, x = tumpuk.pop()
            jml += 1
            for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= yy < h and 0 <= xx < w and mask[yy, xx] and not lab[yy, xx]:
                    lab[yy, xx] = n
                    tumpuk.append((yy, xx))
        ukuran.append(jml)
    return lab, ukuran


_sesi = None


def potong(img, kotak, benih=None):
    """Hapus latar dengan model segmentasi BiRefNet (rembg), lalu simpan bagian terbesar.
    `benih` tidak dipakai lagi (sisa metode isian warna lama)."""
    global _sesi
    from rembg import new_session, remove
    if _sesi is None:
        import onnxruntime as ort
        opsi = ort.SessionOptions()
        # tanpa arena memori: BiRefNet bisa menghabiskan >9 GB RAM bila arena dibiarkan tumbuh
        opsi.enable_cpu_mem_arena = False
        opsi.enable_mem_pattern = False
        _sesi = new_session("birefnet-general", sess_opts=opsi)
    potongan = img.crop(kotak).convert("RGB")
    hasil = remove(potongan, session=_sesi)
    a = np.asarray(hasil.getchannel("A"))
    # buang bercak lepas (sisa bayangan/garis kartu): simpan komponen terbesar + yang cukup besar
    lab, ukuran = label_komponen(a > 128)
    if len(ukuran) > 1:
        besar = max(ukuran[1:])
        simpan = [i for i, u in enumerate(ukuran) if i and u >= .03 * besar]
        a = np.where(np.isin(lab, simpan) | ((a > 0) & (a <= 128)), a, 0)
        # tepi lembut di sekitar bercak yang dibuang juga ikut hilang
        dekat = np.asarray(Image.fromarray(np.isin(lab, simpan).astype("uint8") * 255)
                           .filter(ImageFilter.MaxFilter(5))) > 0
        a = np.where(dekat, a, 0).astype("uint8")
    hasil.putalpha(Image.fromarray(a))
    return hasil.crop(hasil.getbbox())


def main():
    pilih = sys.argv[1:] or list(LEMBAR)
    for nama, L in LEMBAR.items():
        if nama not in pilih:
            continue
        img = Image.open(REF / f"{nama}.webp")
        out = DIR / nama
        out.mkdir(exist_ok=True)
        tugas = {}
        if "hero" in L:
            tugas["utama"] = L["hero"]
        for v, k in zip(VIEWS, L["views"]):
            tugas[v] = k
        i = 0
        for y0, y1 in L["ekspresi_y"]:
            for x0, x1 in L["ekspresi_x"]:
                # sedikit di dalam kartu agar tepi potongan tidak menyentuh latar panel
                tugas[f"ekspresi-{L['ekspresi'][i]}"] = ((x0 + 4, y0 + 2, x1 - 4, y1 - 6), "atas")
                i += 1
        if "pose_tiles" in L:
            for nm, k in zip(L["pose"], L["pose_tiles"]):
                tugas[f"pose-{nm}"] = ((k[0] + 4, k[1] + 2, k[2] - 4, k[3] - 4), "atas")
        else:
            y0, y1 = L["pose_y"]
            xs = L["pose_x"]
            for j, nm in enumerate(L["pose"]):
                tugas[f"pose-{nm}"] = (xs[j], y0, xs[j + 1], y1)
        for nm, k in tugas.items():
            kotak, benih = k if isinstance(k[0], tuple) else (k, "semua")
            potong(img, kotak, benih).save(out / f"{nm}.png")
        print(nama, len(tugas), "potongan")


if __name__ == "__main__":
    main()
