"""
Potong logo BK (lingkaran putih di atas latar biru muda) menjadi PNG bulat transparan.
Jalankan: python3 potong_logo.py
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

DIR = Path(__file__).parent
SUMBER = DIR / "logo-bk-smanrici-sumber.jpg"
HASIL = DIR / "logo-bk-smanrici.png"

im = Image.open(SUMBER).convert("RGB")
a = np.asarray(im).astype(int)
putih = (a > 245).all(axis=2)          # piringan putih; latar biru muda R≈228
cy0, cx0 = im.height // 2, im.width // 2
xs = np.nonzero(putih[cy0])[0]
ys = np.nonzero(putih[:, cx0])[0]
cx = (xs.min() + xs.max()) / 2
cy = (ys.min() + ys.max()) / 2
r = min(xs.max() - xs.min(), ys.max() - ys.min()) / 2 - 4

S = 4  # supersampling agar tepi halus
mask = Image.new("L", (im.width * S, im.height * S), 0)
ImageDraw.Draw(mask).ellipse([(cx - r) * S, (cy - r) * S, (cx + r) * S, (cy + r) * S], fill=255)
mask = mask.resize(im.size, Image.LANCZOS)
out = im.convert("RGBA")
out.putalpha(mask)
out = out.crop((int(cx - r), int(cy - r), int(cx + r) + 1, int(cy + r) + 1)).resize((800, 800), Image.LANCZOS)
out.save(HASIL)
print(HASIL.name, out.size, f"pusat=({cx:.0f},{cy:.0f}) r={r:.0f}")
