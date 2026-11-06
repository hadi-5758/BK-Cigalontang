"""
Gambar jajaran karakter (tampak depan) untuk README: lineup-<set>.png di folder set.
Jalankan setelah potong_2d.py: python3 buat_lineup.py            (set 2D, folder ini)
                               python3 buat_lineup.py ../3d     (set lain)
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

DIR = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).parent
TINGGI = 620           # tinggi siswa dalam px
SKALA_GURU = 1.08      # guru sedikit lebih tinggi dari siswa (lihat README)
KARAKTER = [("siswi", "Siswi"), ("siswa", "Siswa"),
            ("guru-bk-putri", "Guru BK Putri"), ("guru-bk-putra", "Guru BK Putra")]


def huruf(ukuran):
    for f in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"]:
        if Path(f).exists():
            return ImageFont.truetype(f, ukuran)
    return ImageFont.load_default()


def main():
    figur = []
    for folder, label in KARAKTER:
        im = Image.open(DIR / folder / "tampak-depan.png")
        t = round(TINGGI * (SKALA_GURU if folder.startswith("guru") else 1))
        figur.append((im.resize((round(im.width * t / im.height), t), Image.LANCZOS), label))
    jarak, tepi, bawah = 90, 70, 90
    lebar = sum(f.width for f, _ in figur) + jarak * (len(figur) - 1) + tepi * 2
    tinggi = max(f.height for f, _ in figur) + tepi + bawah
    kanvas = Image.new("RGB", (lebar, tinggi), "#F0FDF4")
    d = ImageDraw.Draw(kanvas)
    lantai = tinggi - bawah
    d.rectangle([0, lantai, lebar, tinggi], fill="#CCFBF1")
    x, font = tepi, huruf(30)
    for f, label in figur:
        kanvas.paste(f, (x, lantai - f.height + 8), f)
        w = d.textlength(label, font=font)
        d.text((x + (f.width - w) / 2, lantai + 26), label, fill="#0F766E", font=font)
        x += f.width + jarak
    nama = f"lineup-{DIR.name}.png"
    kanvas.save(DIR / nama, optimize=True)
    print(nama, kanvas.size)


if __name__ == "__main__":
    main()
