"""
Potong lembar karakter 3D menjadi PNG transparan, dengan pemotong yang sama seperti
set 2D (BiRefNet lewat rembg, lihat ../2d/potong_2d.py).

Perlu: pip install "rembg[cpu]"
Jalankan: python3 potong_3d.py [siswi siswa ...]   (hasil di folder per karakter)
         python3 potong_3d.py --cek                 (gambar kotak potong di atas lembar, tanpa memotong)
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

DIR = Path(__file__).parent
REF = DIR / "referensi"
sys.path.insert(0, str(DIR.parent / "2d"))
from potong_2d import potong  # noqa: E402

# "menghadap-kanan" = figur berlabel "Samping Kiri" di lembar (wajahnya ke kanan gambar)
LEMBAR = {
    "siswi": {
        "utama": (10, 5, 295, 1010),
        "views": {"tampak-depan": (315, 48, 478, 568), "menghadap-kanan": (482, 48, 625, 568),
                  "menghadap-kiri": (640, 48, 785, 568), "tampak-belakang": (800, 48, 972, 568)},
        "ekspresi": [
            ((52, 230), [(998, 1122), (1132, 1257), (1267, 1392), (1402, 1526)],
             ["normal", "senang", "tertawa", "serius"]),
            ((273, 442), [(998, 1122), (1132, 1257), (1267, 1392), (1402, 1526)],
             ["terkejut", "sedih", "marah", "malu"]),
        ],
        "pose": {"salam": (275, 655, 372, 952), "memegang-buku": (372, 655, 467, 952),
                 "menunjuk": (467, 655, 558, 952), "semangat": (558, 655, 651, 952),
                 "membawa-tas": (651, 655, 758, 952), "mempresentasikan": (758, 655, 872, 952),
                 "berjalan": (865, 655, 982, 952)},
    },
    "siswa": {
        "utama": (5, 5, 295, 1010),
        "views": {"tampak-depan": (312, 48, 495, 582), "menghadap-kanan": (508, 48, 652, 582),
                  "menghadap-kiri": (660, 48, 815, 582), "tampak-belakang": (822, 48, 975, 582)},
        "ekspresi": [
            ((50, 226), [(998, 1125), (1133, 1258), (1267, 1393), (1401, 1527)],
             ["normal", "senang", "tertawa", "serius"]),
            ((268, 448), [(998, 1125), (1133, 1258), (1267, 1393), (1401, 1527)],
             ["terkejut", "sedih", "marah", "malu"]),
        ],
        "pose": {"melambaikan-tangan": (268, 660, 372, 955), "mengacungkan-jempol": (372, 660, 470, 955),
                 "menyilangkan-tangan": (470, 660, 568, 955), "menunjuk": (568, 660, 667, 955),
                 "memegang-buku": (667, 660, 767, 955), "memakai-tas": (767, 660, 871, 955),
                 "berjalan": (865, 660, 982, 955)},
    },
    "guru-bk-putri": {
        "views": {"tampak-depan": (15, 85, 218, 668), "menghadap-kanan": (232, 85, 392, 668),
                  "menghadap-kiri": (410, 85, 580, 668), "tampak-belakang": (595, 85, 785, 668)},
        "ekspresi": [
            ((57, 214), [(817, 947), (957, 1084), (1094, 1224), (1234, 1367), (1377, 1514)],
             ["normal-ramah", "senyum-terbuka", "tertawa-senang", "terkejut", "serius-profesional"]),
            ((255, 420), [(817, 949), (960, 1092), (1101, 1232), (1241, 1372), (1382, 1514)],
             ["berpikir", "empati", "tertegun-mendengar", "sedih", "tegas"]),
        ],
        "pose": {"menyapa": (815, 517, 931, 745), "memberi-arahan": (935, 517, 1041, 745),
                 "menjelaskan": (1045, 517, 1152, 745), "diskusi-konseling": (1157, 517, 1299, 745),
                 "berpikir": (1303, 517, 1409, 745), "memegang-dokumen": (1412, 517, 1522, 745)},
    },
    "guru-bk-putra": {
        "views": {"tampak-depan": (12, 68, 202, 665), "menghadap-kanan": (203, 68, 345, 665),
                  "menghadap-kiri": (352, 68, 498, 665), "tampak-belakang": (502, 68, 652, 665),
                  "tiga-perempat-depan": (655, 68, 818, 665)},
        "ekspresi": [
            ((56, 207), [(839, 964), (973, 1099), (1111, 1236), (1248, 1374), (1386, 1519)],
             ["normal-ramah", "senyum-terbuka", "tertawa-senang", "terkejut", "serius-profesional"]),
            ((257, 408), [(839, 964), (973, 1099), (1111, 1236), (1248, 1374), (1386, 1519)],
             ["berpikir", "empati", "tegas", "ragu", "semangat"]),
        ],
        "pose": {"menyapa": (836, 502, 948, 712), "memberi-arahan": (952, 502, 1068, 712),
                 "menjelaskan": (1073, 502, 1185, 712), "diskusi-konseling": (1190, 502, 1303, 712),
                 "mencari-solusi": (1308, 502, 1418, 712), "memegang-dokumen": (1422, 502, 1522, 712)},
    },
}


def daftar_tugas(L):
    tugas = {}
    if "utama" in L:
        tugas["utama"] = L["utama"]
    tugas.update(L["views"])
    for (y0, y1), xs, nama in L["ekspresi"]:
        for (x0, x1), nm in zip(xs, nama):
            tugas[f"ekspresi-{nm}"] = (x0, y0, x1, y1)
    for nm, k in L["pose"].items():
        tugas[f"pose-{nm}"] = k
    return tugas


def main():
    argumen = sys.argv[1:]
    cek = "--cek" in argumen
    pilih = [a for a in argumen if a != "--cek"] or list(LEMBAR)
    for nama in pilih:
        img = Image.open(REF / f"{nama}.webp").convert("RGB")
        tugas = daftar_tugas(LEMBAR[nama])
        if cek:
            d = ImageDraw.Draw(img)
            for k in tugas.values():
                d.rectangle(k, outline=(255, 0, 0), width=2)
            img.save(DIR / f"cek-{nama}.png")
            continue
        out = DIR / nama
        out.mkdir(exist_ok=True)
        for nm, k in tugas.items():
            potong(img, k).save(out / f"{nm}.png")
        print(nama, len(tugas), "potongan", flush=True)


if __name__ == "__main__":
    main()
