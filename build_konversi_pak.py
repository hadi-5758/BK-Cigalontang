"""
APLIKASI KONVERSI ANGKA KREDIT OTOMATIS - Guru JF
Berdasarkan PerBKN No. 3/2023 dan Panduan PAK Guru (Permen PANRB 21/2024).

Struktur:
- DATA MASTER  : tabel referensi (predikat %, koefisien, AK minimal, AK dasar)
- DATA PEGAWAI : database guru (satu baris per guru, 4 periode kinerja)
- SK KONVERSI  : pilih NIP+periode -> identitas & AK auto
- SK AKUMULASI : pilih NIP -> semua periode otomatis + jumlah
- SK PENETAPAN : pilih NIP -> AK Lama/Baru/Jumlah + sisa pangkat/jenjang
"""

from openpyxl import load_workbook, Workbook
from openpyxl.styles import (
    Font, Alignment, Border, Side, PatternFill, Protection
)
from openpyxl.worksheet.page import PageMargins, PrintOptions
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.utils import get_column_letter
from openpyxl.workbook.defined_name import DefinedName
from copy import copy

# ------------------------- STYLE ------------------------------------
FONT = "Times New Roman"
thin = Side(style="thin", color="000000")
medium = Side(style="medium", color="000000")
BA = Border(left=thin, right=thin, top=thin, bottom=thin)
BM = Border(left=medium, right=medium, top=medium, bottom=medium)

def F(sz=10, **kw): return Font(name=FONT, size=sz, **kw)
AC = Alignment(horizontal="center", vertical="center", wrap_text=True)
AL = Alignment(horizontal="left", vertical="center", wrap_text=True)
AR = Alignment(horizontal="right", vertical="center", wrap_text=True)
ALT = Alignment(horizontal="left", vertical="top", wrap_text=True)

FILL_HEAD = PatternFill("solid", start_color="FFF2CC")  # krem
FILL_INPUT = PatternFill("solid", start_color="E2EFDA") # hijau muda untuk input
FILL_SECTION = PatternFill("solid", start_color="D9E1F2")


def set_f4(ws):
    ws.page_setup.paperHeight = "330mm"
    ws.page_setup.paperWidth = "215mm"
    ws.page_setup.orientation = "portrait"
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    m = 0.59
    ws.page_margins = PageMargins(left=m, right=m, top=m, bottom=m,
                                  header=0.3, footer=0.3)
    ws.print_options = PrintOptions(horizontalCentered=True)


def border_range(ws, rng, border=BA):
    for row in ws[rng]:
        for c in row:
            c.border = border


def merge_value(ws, rng, value, font=None, align=AC, fill=None, border=True):
    ws.merge_cells(rng)
    # anchor cell
    top_left = rng.split(":")[0]
    c = ws[top_left]
    c.value = value
    if font: c.font = font
    if align: c.alignment = align
    if fill: c.fill = fill
    if border:
        border_range(ws, rng)


def widths(ws, w_list):
    for i, w in enumerate(w_list, 1):
        ws.column_dimensions[get_column_letter(i)].width = w


# ==================================================================
#                       DATA MASTER
# ==================================================================
def build_master(wb):
    if "DATA MASTER" in wb.sheetnames:
        del wb["DATA MASTER"]
    ws = wb.create_sheet("DATA MASTER", 0)
    widths(ws, [22, 14, 14, 14, 14, 14])

    ws["A1"] = "DATA MASTER / TABEL REFERENSI"
    ws["A1"].font = F(14, bold=True)
    ws.merge_cells("A1:F1")
    ws["A1"].alignment = AC
    ws["A1"].fill = FILL_SECTION

    # ----- Tabel Predikat -----
    r = 3
    merge_value(ws, f"A{r}:B{r}", "TABEL PREDIKAT KINERJA", F(11, bold=True),
                fill=FILL_HEAD)
    r += 1
    ws[f"A{r}"], ws[f"B{r}"] = "PREDIKAT", "PROSENTASE"
    for c in (ws[f"A{r}"], ws[f"B{r}"]):
        c.font = F(10, bold=True); c.alignment = AC; c.fill = FILL_HEAD
        c.border = BA
    predikat = [
        ("Sangat Baik", 1.50),
        ("Baik", 1.00),
        ("Butuh Perbaikan", 0.75),
        ("Kurang", 0.50),
        ("Sangat Kurang", 0.25),
        ("-", 0.00),
    ]
    start_pr = r + 1
    for nm, pct in predikat:
        r += 1
        ws[f"A{r}"] = nm; ws[f"A{r}"].alignment = AL
        ws[f"B{r}"] = pct; ws[f"B{r}"].alignment = AC
        ws[f"B{r}"].number_format = "0%"
        ws[f"A{r}"].font = F(10); ws[f"B{r}"].font = F(10)
        ws[f"A{r}"].border = BA; ws[f"B{r}"].border = BA
    end_pr = r

    # named range PREDIKAT (names) & PREDIKAT_PCT (lookup)
    wb.defined_names["tbl_predikat_nama"] = DefinedName(
        "tbl_predikat_nama",
        attr_text=f"'DATA MASTER'!$A${start_pr}:$A${end_pr}"
    )
    wb.defined_names["tbl_predikat"] = DefinedName(
        "tbl_predikat",
        attr_text=f"'DATA MASTER'!$A${start_pr}:$B${end_pr}"
    )

    # ----- Tabel Jenjang & Koefisien -----
    r += 2
    merge_value(ws, f"A{r}:B{r}", "TABEL JENJANG & KOEFISIEN",
                F(11, bold=True), fill=FILL_HEAD)
    r += 1
    ws[f"A{r}"], ws[f"B{r}"] = "JENJANG JABATAN", "KOEFISIEN/TH"
    for c in (ws[f"A{r}"], ws[f"B{r}"]):
        c.font = F(10, bold=True); c.alignment = AC; c.fill = FILL_HEAD
        c.border = BA
    jenjang = [
        ("Ahli Pertama", 12.5),
        ("Ahli Muda", 25.0),
        ("Ahli Madya", 37.5),
        ("Ahli Utama", 50.0),
    ]
    start_jn = r + 1
    for nm, kf in jenjang:
        r += 1
        ws[f"A{r}"] = nm; ws[f"A{r}"].alignment = AL
        ws[f"B{r}"] = kf; ws[f"B{r}"].alignment = AC
        ws[f"B{r}"].number_format = "0.0"
        ws[f"A{r}"].font = F(10); ws[f"B{r}"].font = F(10)
        ws[f"A{r}"].border = BA; ws[f"B{r}"].border = BA
    end_jn = r

    wb.defined_names["tbl_jenjang_nama"] = DefinedName(
        "tbl_jenjang_nama",
        attr_text=f"'DATA MASTER'!$A${start_jn}:$A${end_jn}"
    )
    wb.defined_names["tbl_jenjang"] = DefinedName(
        "tbl_jenjang",
        attr_text=f"'DATA MASTER'!$A${start_jn}:$B${end_jn}"
    )

    # ----- Tabel AK Minimal KP -----
    r += 2
    merge_value(ws, f"A{r}:C{r}", "AK MINIMAL KENAIKAN PANGKAT",
                F(11, bold=True), fill=FILL_HEAD)
    r += 1
    ws[f"A{r}"], ws[f"B{r}"], ws[f"C{r}"] = "GOLONGAN", "KE GOL.", "AK MINIMAL"
    for c in (ws[f"A{r}"], ws[f"B{r}"], ws[f"C{r}"]):
        c.font = F(10, bold=True); c.alignment = AC; c.fill = FILL_HEAD
        c.border = BA
    ak_kp = [
        ("III/a", "III/b", 50),
        ("III/b", "III/c", 50),
        ("III/c", "III/d", 100),
        ("III/d", "IV/a", 100),
        ("IV/a", "IV/b", 150),
        ("IV/b", "IV/c", 150),
        ("IV/c", "IV/d", 450),
        ("IV/d", "IV/e", 450),
    ]
    start_kp = r + 1
    for g1, g2, ak in ak_kp:
        r += 1
        ws[f"A{r}"], ws[f"B{r}"], ws[f"C{r}"] = g1, g2, ak
        for col in "ABC":
            c = ws[f"{col}{r}"]
            c.font = F(10); c.alignment = AC; c.border = BA
        ws[f"C{r}"].number_format = "0"
    end_kp = r

    wb.defined_names["tbl_ak_kp"] = DefinedName(
        "tbl_ak_kp",
        attr_text=f"'DATA MASTER'!$A${start_kp}:$C${end_kp}"
    )

    # ----- Tabel AK Minimal Jenjang -----
    r += 2
    merge_value(ws, f"A{r}:B{r}", "AK MINIMAL KENAIKAN JENJANG",
                F(11, bold=True), fill=FILL_HEAD)
    r += 1
    ws[f"A{r}"], ws[f"B{r}"] = "DARI JENJANG", "AK MINIMAL"
    for c in (ws[f"A{r}"], ws[f"B{r}"]):
        c.font = F(10, bold=True); c.alignment = AC; c.fill = FILL_HEAD
        c.border = BA
    ak_jn = [
        ("Ahli Pertama", 100),
        ("Ahli Muda", 200),
        ("Ahli Madya", 450),
        ("Ahli Utama", 0),
    ]
    start_akjn = r + 1
    for nm, ak in ak_jn:
        r += 1
        ws[f"A{r}"] = nm; ws[f"B{r}"] = ak
        for col in "AB":
            c = ws[f"{col}{r}"]
            c.font = F(10); c.alignment = AC; c.border = BA
    end_akjn = r

    wb.defined_names["tbl_ak_jenjang"] = DefinedName(
        "tbl_ak_jenjang",
        attr_text=f"'DATA MASTER'!$A${start_akjn}:$B${end_akjn}"
    )

    # ----- Tabel AK Dasar (Panduan Tabel 2) -----
    r += 2
    merge_value(ws, f"A{r}:C{r}", "AK DASAR (Tabel 2 Panduan)",
                F(11, bold=True), fill=FILL_HEAD)
    r += 1
    ws[f"A{r}"], ws[f"B{r}"], ws[f"C{r}"] = "JENJANG", "GOLONGAN", "AK DASAR"
    for c in (ws[f"A{r}"], ws[f"B{r}"], ws[f"C{r}"]):
        c.font = F(10, bold=True); c.alignment = AC; c.fill = FILL_HEAD
        c.border = BA
    ak_dasar = [
        ("Ahli Pertama", "III/a", 0),
        ("Ahli Pertama", "III/b", 50),
        ("Ahli Muda", "III/c", 0),
        ("Ahli Muda", "III/d", 100),
        ("Ahli Madya", "IV/a", 0),
        ("Ahli Madya", "IV/b", 150),
        ("Ahli Madya", "IV/c", 300),
        ("Ahli Utama", "IV/d", 0),
        ("Ahli Utama", "IV/e", 0),
    ]
    start_akd = r + 1
    for j, g, ak in ak_dasar:
        r += 1
        ws[f"A{r}"], ws[f"B{r}"], ws[f"C{r}"] = j, g, ak
        for col in "ABC":
            c = ws[f"{col}{r}"]
            c.font = F(10); c.alignment = AC; c.border = BA
        ws[f"C{r}"].number_format = "0"
    end_akd = r

    wb.defined_names["tbl_ak_dasar"] = DefinedName(
        "tbl_ak_dasar",
        attr_text=f"'DATA MASTER'!$A${start_akd}:$C${end_akd}"
    )

    # Freeze + zoom
    ws.sheet_view.zoomScale = 100


# ==================================================================
#                       DATA PEGAWAI
# ==================================================================
# Kolom A..AD (30 kolom)
PEGAWAI_HEADERS = [
    ("A", "NO", 4),
    ("B", "NIP", 22),
    ("C", "NAMA", 30),
    ("D", "NOMOR SERI KARPEG", 18),
    ("E", "TEMPAT/TGL LAHIR", 22),
    ("F", "JENIS KELAMIN", 14),
    ("G", "PANGKAT/GOL RUANG/TMT", 30),
    ("H", "GOLONGAN", 10),
    ("I", "JABATAN/TMT", 28),
    ("J", "JENJANG", 14),
    ("K", "UNIT KERJA", 40),
    ("L", "INSTANSI", 30),
    ("M", "AK DASAR (LAMA)", 12),
    ("N", "AK JF LAMA", 12),
    ("O", "AK PENYESUAIAN", 12),
    ("P", "AK LAMA TOTAL", 14),
    ("Q", "P1 TAHUN", 10),
    ("R", "P1 BULAN", 10),
    ("S", "P1 PREDIKAT", 16),
    ("T", "P2 TAHUN", 10),
    ("U", "P2 BULAN", 10),
    ("V", "P2 PREDIKAT", 16),
    ("W", "P3 TAHUN", 10),
    ("X", "P3 BULAN", 10),
    ("Y", "P3 PREDIKAT", 16),
    ("Z", "P4 TAHUN", 10),
    ("AA", "P4 BULAN", 10),
    ("AB", "P4 PREDIKAT", 16),
    ("AC", "PENANDATANGAN", 30),
    ("AD", "NIP PENANDATANGAN", 22),
]


def build_pegawai(wb, n_rows=30):
    if "DATA PEGAWAI" in wb.sheetnames:
        del wb["DATA PEGAWAI"]
    # rename jika ada DATA PEGAWA (typo existing)
    if "DATA PEGAWA" in wb.sheetnames:
        del wb["DATA PEGAWA"]
    ws = wb.create_sheet("DATA PEGAWAI", 1)

    # Widths
    for col, _, w in PEGAWAI_HEADERS:
        ws.column_dimensions[col].width = w

    # Judul
    ws["A1"] = "DATABASE PEGAWAI (GURU)"
    ws["A1"].font = F(14, bold=True)
    ws.merge_cells("A1:AD1"); ws["A1"].alignment = AC
    ws["A1"].fill = FILL_SECTION

    ws["A2"] = ("Petunjuk: isi satu baris per guru. Kolom berwarna hijau adalah "
                "isian. JENJANG & GOLONGAN pakai dropdown. Tambahkan periode kinerja "
                "pada kolom P1..P4. Sheet SK memilih guru lewat dropdown NIP.")
    ws.merge_cells("A2:AD2"); ws["A2"].alignment = AL
    ws["A2"].font = F(9, italic=True)

    # Header
    hr = 4
    for col, label, _ in PEGAWAI_HEADERS:
        c = ws[f"{col}{hr}"]; c.value = label
        c.font = F(10, bold=True); c.alignment = AC
        c.fill = FILL_HEAD; c.border = BA
    ws.row_dimensions[hr].height = 30

    # Data rows
    data_start = hr + 1
    data_end = hr + n_rows

    # seed baris pertama dengan contoh dari PDF
    ws[f"A{data_start}"] = 1
    ws[f"B{data_start}"] = "199101182019031011"
    ws[f"C{data_start}"] = "ABDUL HADI HASANUDDIN, S.Pd."
    ws[f"D{data_start}"] = "B 03050388"
    ws[f"E{data_start}"] = "TASIKMALAYA/18-01-1991"
    ws[f"F{data_start}"] = "LAKI-LAKI"
    ws[f"G{data_start}"] = "PENATA MUDA TK.I/III/b/01-08-2024"
    ws[f"H{data_start}"] = "III/b"
    ws[f"I{data_start}"] = "GURU AHLI PERTAMA/01-03-2019"
    ws[f"J{data_start}"] = "Ahli Pertama"
    ws[f"K{data_start}"] = ("SMAN 1 CIGALONTANG KABUPATEN TASIKMALAYA "
                            "SATUAN PENDIDIKAN KABUPATEN TASIKMALAYA "
                            "CABANG PENDIDIKAN WILAYAH XII DINAS PENDIDIKAN")
    ws[f"L{data_start}"] = "PEMERINTAH PROVINSI JAWA BARAT"
    ws[f"M{data_start}"] = 50
    ws[f"N{data_start}"] = 0
    ws[f"O{data_start}"] = 0
    # AK Lama Total formula
    ws[f"P{data_start}"] = f"=M{data_start}+N{data_start}+O{data_start}"
    # P1 = 2023 Maret-April (tetapi contoh PDF baris pertama TANPA predikat -> AK Lama)
    # Untuk contoh aktual PAK PDF:
    # P1: 2023 Juli-Desember (6 bulan) Sangat Baik
    # P2: 2024 Januari-Desember (12 bulan) Sangat Baik
    ws[f"Q{data_start}"] = 2023
    ws[f"R{data_start}"] = 6
    ws[f"S{data_start}"] = "Sangat Baik"
    ws[f"T{data_start}"] = 2024
    ws[f"U{data_start}"] = 12
    ws[f"V{data_start}"] = "Sangat Baik"
    ws[f"AC{data_start}"] = "Drs. ASEP SAEPUDIN, M.S.I"
    ws[f"AD{data_start}"] = "196608121990031007"

    # sisanya kosong - hanya nomor urut + formula AK Lama Total
    for i in range(1, n_rows):
        r = data_start + i
        ws[f"A{r}"] = i + 1
        ws[f"P{r}"] = (
            f"=IF(AND(M{r}=\"\",N{r}=\"\",O{r}=\"\"),\"\","
            f"IFERROR(N({f'M{r}'})+N({f'N{r}'})+N({f'O{r}'}),\"\"))"
        )

    # Border + styling semua data area
    for r in range(data_start, data_end + 1):
        for col, _, _ in PEGAWAI_HEADERS:
            c = ws[f"{col}{r}"]
            c.font = F(10)
            c.alignment = AL if col in ("C","E","G","I","K","L","AC") else AC
            c.border = BA
        ws.row_dimensions[r].height = 28

    # warnai kolom input (hijau muda) - supaya operator tahu mana yg boleh diisi
    input_cols = ["B","C","D","E","F","G","H","I","J","K","L","M","N","O",
                  "Q","R","S","T","U","V","W","X","Y","Z","AA","AB","AC","AD"]
    for r in range(data_start, data_end + 1):
        for col in input_cols:
            ws[f"{col}{r}"].fill = FILL_INPUT

    # Kolom AK Lama Total (P) - light blue (formula)
    for r in range(data_start, data_end + 1):
        ws[f"P{r}"].fill = PatternFill("solid", start_color="DEEBF7")
        ws[f"P{r}"].number_format = "0.000"

    # Number formats
    for r in range(data_start, data_end + 1):
        for col in ["M","N","O"]:
            ws[f"{col}{r}"].number_format = "0.000"
        for col in ["Q","T","W","Z"]:
            ws[f"{col}{r}"].number_format = "0"
        for col in ["R","U","X","AA"]:
            ws[f"{col}{r}"].number_format = "0"

    # Data validations
    # Dropdown Jenjang
    dv_jenjang = DataValidation(
        type="list",
        formula1="=tbl_jenjang_nama",
        allow_blank=True
    )
    dv_jenjang.add(f"J{data_start}:J{data_end}")
    ws.add_data_validation(dv_jenjang)

    # Dropdown Predikat (S, V, Y, AB)
    dv_pred = DataValidation(
        type="list",
        formula1="=tbl_predikat_nama",
        allow_blank=True
    )
    dv_pred.add(f"S{data_start}:S{data_end}")
    dv_pred.add(f"V{data_start}:V{data_end}")
    dv_pred.add(f"Y{data_start}:Y{data_end}")
    dv_pred.add(f"AB{data_start}:AB{data_end}")
    ws.add_data_validation(dv_pred)

    # Dropdown Golongan
    dv_gol = DataValidation(
        type="list",
        formula1='"III/a,III/b,III/c,III/d,IV/a,IV/b,IV/c,IV/d,IV/e"',
        allow_blank=True
    )
    dv_gol.add(f"H{data_start}:H{data_end}")
    ws.add_data_validation(dv_gol)

    # Dropdown Jenis Kelamin
    dv_jk = DataValidation(
        type="list",
        formula1='"LAKI-LAKI,PEREMPUAN"',
        allow_blank=True
    )
    dv_jk.add(f"F{data_start}:F{data_end}")
    ws.add_data_validation(dv_jk)

    # Dropdown Bulan 0-12
    dv_bulan = DataValidation(
        type="whole", operator="between",
        formula1=0, formula2=12,
        allow_blank=True,
        error="Bulan harus 0-12", errorTitle="Input salah"
    )
    for col in ["R","U","X","AA"]:
        dv_bulan.add(f"{col}{data_start}:{col}{data_end}")
    ws.add_data_validation(dv_bulan)

    # Freeze pane
    ws.freeze_panes = "D5"

    # Named range: daftar NIP (seluruh kolom B area data)
    # pakai B5:B{data_end} saja - tidak ambil header
    wb.defined_names["tbl_pegawai"] = DefinedName(
        "tbl_pegawai",
        attr_text=f"'DATA PEGAWAI'!$B${data_start}:$AD${data_end}"
    )
    wb.defined_names["tbl_nip"] = DefinedName(
        "tbl_nip",
        attr_text=f"'DATA PEGAWAI'!$B${data_start}:$B${data_end}"
    )

    return data_start, data_end


# ==================================================================
# Helper: buat formula lookup via INDEX/MATCH (cari NIP pegawai)
# col_idx = index kolom dalam tbl_pegawai (B=1, C=2, dst.)
# ==================================================================
def lookup_formula(nip_cell, col_idx):
    # IFERROR -> "" supaya NIP kosong tidak error
    return (f'=IFERROR(INDEX(tbl_pegawai,MATCH({nip_cell},tbl_nip,0),{col_idx}),"")')


# ==================================================================
#                 KOP SURAT (untuk sheet SK)
# ==================================================================
def kop_surat(ws, end_col):
    ws.row_dimensions[1].height = 22
    ws.row_dimensions[2].height = 22

    merge_value(ws, f"A1:{end_col}1",
                "PEMERINTAH DAERAH PROVINSI JAWA BARAT",
                F(16, bold=True), align=AC, border=False)
    merge_value(ws, f"A2:{end_col}2",
                "DINAS PENDIDIKAN",
                F(16, bold=True), align=AC, border=False)
    merge_value(ws, f"A3:{end_col}3",
                "Jalan. Dr. Radjiman No. 6 Telp. (022) 4264813 Fax. (022) 4264881",
                F(10), align=AC, border=False)
    merge_value(ws, f"A4:{end_col}4",
                "Website : disdik.jabarprov.go.id",
                F(10), align=AC, border=False)
    merge_value(ws, f"A5:{end_col}5",
                "e-mail: disdik@jabarprov.go.id/sekretariatdisdikjabar@gmail.com",
                F(10), align=AC, border=False)
    merge_value(ws, f"A6:{end_col}6",
                "BANDUNG - 40171",
                F(10), align=AC, border=False)

    # garis pemisah
    ws.row_dimensions[7].height = 5
    for col in range(1, ord(end_col) - ord("A") + 2):
        ws.cell(row=7, column=col).border = Border(
            top=Side(style="medium", color="000000"),
            bottom=Side(style="medium", color="000000")
        )


# ==================================================================
#            FOOTER (catatan BSrE) - tidak diubah
# ==================================================================
def footer_note(ws, start_row, end_col):
    lines = [
        "Dokumen ini telah ditandatangani secara elektronik menggunakan sertifikat elektronik yang diterbitkan oleh Balai Sertifikasi",
        "Elektronik (BSrE) Badan Siber dan Sandi Negara. Dokumen digital yang asli dapat diperoleh dengan memindai QR Code,",
        "memasukkan kode pada Aplikasi NDE Pemerintah Daerah Provinsi Jawa Barat, atau mengakses tautan berikut",
        "https://sidebar.jabarprov.go.id/v/XXXXXXXX",
        "XXXXXXXX",
    ]
    r = start_row
    for i, txt in enumerate(lines):
        ws.merge_cells(f"A{r}:{end_col}{r}")
        c = ws.cell(row=r, column=1)
        c.value = txt
        c.font = F(8) if i != 3 else Font(name=FONT, size=8, color="0000FF", underline="single")
        c.alignment = AC
        r += 1
    return r


# ==================================================================
#      SHEET: KONVERSI PREDIKAT KINERJA
# ==================================================================
def build_konversi(wb):
    if "KONVERSI PREDIKAT KINERJA" in wb.sheetnames:
        del wb["KONVERSI PREDIKAT KINERJA"]
    ws = wb.create_sheet("KONVERSI PREDIKAT KINERJA")
    set_f4(ws)
    widths(ws, [6, 10, 10, 2, 16, 16, 16, 16])
    END = "H"
    kop_surat(ws, END)

    # ---- Panel input (dropdown NIP & Periode) di atas ----
    r = 8
    ws.row_dimensions[r].height = 20
    ws.merge_cells(f"A{r}:B{r}"); ws[f"A{r}"] = "PILIH NIP:"
    ws[f"A{r}"].font = F(11, bold=True); ws[f"A{r}"].alignment = AL
    ws.merge_cells(f"C{r}:E{r}")
    ws[f"C{r}"] = "199101182019031011"
    ws[f"C{r}"].font = F(11, bold=True); ws[f"C{r}"].alignment = AL
    ws[f"C{r}"].fill = FILL_INPUT
    ws[f"C{r}"].border = BA

    ws.merge_cells(f"F{r}:G{r}"); ws[f"F{r}"] = "PERIODE KE-:"
    ws[f"F{r}"].font = F(11, bold=True); ws[f"F{r}"].alignment = AR
    ws[f"H{r}"] = 2  # default periode 2 = 2024
    ws[f"H{r}"].font = F(11, bold=True); ws[f"H{r}"].alignment = AC
    ws[f"H{r}"].fill = FILL_INPUT
    ws[f"H{r}"].border = BA

    # Data validations
    dv_nip = DataValidation(type="list", formula1="=tbl_nip", allow_blank=False)
    dv_nip.add(f"C{r}")
    ws.add_data_validation(dv_nip)

    dv_per = DataValidation(type="list", formula1='"1,2,3,4"', allow_blank=False)
    dv_per.add(f"H{r}")
    ws.add_data_validation(dv_per)

    NIP = f"$C${r}"     # cell referensi NIP
    PER = f"$H${r}"     # cell referensi nomor periode

    # ---- Judul dokumen ----
    r = 10
    merge_value(ws, f"A{r}:{END}{r}",
                "KONVERSI PREDIKAT KINERJA KE ANGKA KREDIT",
                F(13, bold=True), border=False)
    r += 1
    # Nomor SK otomatis - pakai nomor NIP untuk jaga unik
    merge_value(ws, f"A{r}:{END}{r}",
                f'=CONCATENATE("NOMOR: 218/KPG.03.03/SMAN1CGL-",{NIP})',
                F(11), border=False)

    # ---- Instansi/Periode ----
    r += 2
    merge_value(ws, f"A{r}:D{r}",
                f'=CONCATENATE("Instansi : ",{lookup_formula(NIP, 11)[1:]})',
                F(10), align=AL, border=False)
    merge_value(ws, f"E{r}:{END}{r}",
                f'=CONCATENATE("Periode : ",'
                f'CHOOSE({PER},Q_P1_BULAN,Q_P2_BULAN,Q_P3_BULAN,Q_P4_BULAN))',
                F(10), align=AR, border=False)

    # ---- Tabel PEJABAT FUNGSIONAL ----
    r += 2
    merge_value(ws, f"A{r}:{END}{r}", "PEJABAT FUNGSIONAL YANG DINILAI",
                F(11, bold=True), fill=FILL_HEAD)

    # Baris-baris identitas
    # Kolom B: looked-up from DATA PEGAWAI. Index column in tbl_pegawai:
    # B=1(NIP),C=2(NAMA),D=3(KARPEG),E=4(TTL),F=5(JK),G=6(PANGKAT/TMT),
    # H=7(GOL),I=8(JABATAN/TMT),J=9(JENJANG),K=10(UNIT),L=11(INSTANSI)
    identitas = [
        ("1", "NAMA", 2),
        ("2", "NIP", 1),
        ("3", "NOMOR SERI KARPEG", 3),
        ("4", "TEMPAT/TGL. LAHIR", 4),
        ("5", "JENIS KELAMIN", 5),
        ("6", "PANGKAT/GOLONGAN RUANG/TMT", 6),
        ("7", "JABATAN/TMT", 8),
        ("8", "UNIT KERJA", 10),
        ("9", "INSTANSI", 11),
    ]
    for no, label, idx in identitas:
        r += 1
        ws.row_dimensions[r].height = 20
        ws[f"A{r}"] = no; ws[f"A{r}"].alignment = AC
        ws.merge_cells(f"B{r}:C{r}")
        ws[f"B{r}"] = label; ws[f"B{r}"].alignment = AL
        ws[f"D{r}"] = ":"; ws[f"D{r}"].alignment = AC
        ws.merge_cells(f"E{r}:{END}{r}")
        ws[f"E{r}"] = lookup_formula(NIP, idx)
        ws[f"E{r}"].alignment = AL
        if label == "UNIT KERJA":
            ws.row_dimensions[r].height = 54
        for col in range(1, 9):
            c = ws.cell(row=r, column=col)
            c.border = BA
            if not c.font or c.font.name != FONT:
                c.font = F(10)

    # ---- Header sub-tabel KONVERSI ----
    r += 1
    merge_value(ws, f"A{r}:{END}{r}",
                "KONVERSI PREDIKAT KINERJA KE ANGKA KREDIT",
                F(11, bold=True), fill=FILL_HEAD)

    # Baris header 2-tingkat
    r += 1
    hdr1 = r
    ws.row_dimensions[r].height = 20
    merge_value(ws, f"A{r}:C{r+1}", "Hasil Penilaian Kinerja", F(10, bold=True))
    merge_value(ws, f"D{r}:E{r+1}", "Koefisien per tahun", F(10, bold=True))
    merge_value(ws, f"F{r}:{END}{r+1}",
                "Angka Kredit yang didapat\n(Kolom 2 x Kolom 3 x (Bulan/12))",
                F(10, bold=True))

    r += 2
    ws.row_dimensions[r].height = 20
    merge_value(ws, f"A{r}:B{r}", "PREDIKAT", F(10, bold=True))
    ws[f"C{r}"] = "PROSENTASE"; ws[f"C{r}"].font = F(10, bold=True)
    ws[f"C{r}"].alignment = AC; ws[f"C{r}"].border = BA
    merge_value(ws, f"D{r}:E{r}", "", F(10, bold=True))  # kosong (koefisien)
    merge_value(ws, f"F{r}:{END}{r}", "", F(10, bold=True))

    # Baris nomor kolom 1..4
    r += 1
    ws.row_dimensions[r].height = 16
    merge_value(ws, f"A{r}:B{r}", "1", F(10, bold=True))
    ws[f"C{r}"] = "2"; ws[f"C{r}"].font = F(10, bold=True); ws[f"C{r}"].alignment = AC; ws[f"C{r}"].border = BA
    merge_value(ws, f"D{r}:E{r}", "3", F(10, bold=True))
    merge_value(ws, f"F{r}:{END}{r}", "4", F(10, bold=True))

    # Baris data
    r += 1
    ws.row_dimensions[r].height = 22
    # Predikat -> dari DATA PEGAWAI berdasarkan periode
    # Col indexes: P1=Predikat S=18, P2=V=21, P3=Y=24, P4=AB=27
    predikat_formula = (
        f'=CHOOSE({PER},'
        f'{lookup_formula(NIP, 18)[1:]},'
        f'{lookup_formula(NIP, 21)[1:]},'
        f'{lookup_formula(NIP, 24)[1:]},'
        f'{lookup_formula(NIP, 27)[1:]})'
    )
    merge_value(ws, f"A{r}:B{r}", predikat_formula, F(10))

    # Prosentase
    prosentase_formula = (
        f'=IFERROR(VLOOKUP('
        f'CHOOSE({PER},'
        f'{lookup_formula(NIP, 18)[1:]},'
        f'{lookup_formula(NIP, 21)[1:]},'
        f'{lookup_formula(NIP, 24)[1:]},'
        f'{lookup_formula(NIP, 27)[1:]})'
        f',tbl_predikat,2,FALSE),0)'
    )
    ws[f"C{r}"] = prosentase_formula
    ws[f"C{r}"].font = F(10); ws[f"C{r}"].alignment = AC; ws[f"C{r}"].border = BA
    ws[f"C{r}"].number_format = "0%"

    # Koefisien per tahun (dari jenjang)
    koefisien_formula = (
        f'=IFERROR(VLOOKUP({lookup_formula(NIP, 9)[1:]},tbl_jenjang,2,FALSE),0)'
    )
    merge_value(ws, f"D{r}:E{r}", koefisien_formula, F(10))
    ws[f"D{r}"].number_format = "0.0"

    # AK = Prosentase * Koefisien * (Bulan/12)
    # Bulan: R=17 (P1), U=20 (P2), X=23 (P3), AA=26 (P4)
    bulan_formula = (
        f'CHOOSE({PER},'
        f'{lookup_formula(NIP, 17)[1:]},'
        f'{lookup_formula(NIP, 20)[1:]},'
        f'{lookup_formula(NIP, 23)[1:]},'
        f'{lookup_formula(NIP, 26)[1:]})'
    )
    ak_formula = (
        f'=IFERROR(C{r}*D{r}*IFERROR(VALUE({bulan_formula}),12)/12,0)'
    )
    merge_value(ws, f"F{r}:{END}{r}", ak_formula, F(10, bold=True))
    ws[f"F{r}"].number_format = "0.000"

    # Simpan referensi AK Baru (di sheet konversi) untuk lookup Penetapan -- pakai defined name
    # Kita perlu angka PERIODE total - tapi periode berubah-ubah.
    # Cukup defined name yang pointing ke sel AK = F{r}
    wb.defined_names["ak_konversi_periode"] = DefinedName(
        "ak_konversi_periode",
        attr_text=f"'KONVERSI PREDIKAT KINERJA'!$F${r}"
    )

    # ---- Tanda tangan & Tembusan ----
    r += 3
    sig_start = r
    # Kanan (F..H)
    ws[f"F{r}"] = f'="Ditetapkan di Bandung"'
    ws[f"F{r}"].font = F(10); ws[f"F{r}"].alignment = AL
    r += 1
    ws[f"F{r}"] = 'Pada tanggal 30 April 2025'
    ws[f"F{r}"].font = F(10); ws[f"F{r}"].alignment = AL
    r += 2
    ws[f"F{r}"] = "Pejabat Penilai Kinerja"
    ws[f"F{r}"].font = F(10); ws[f"F{r}"].alignment = AL
    r += 1
    ws[f"F{r}"] = "KEPALA SEKOLAH SMAN 1 CIGALONTANG"
    ws[f"F{r}"].font = F(10); ws[f"F{r}"].alignment = AL
    r += 1
    ws[f"F{r}"] = "KABUPATEN TASIKMALAYA,"
    ws[f"F{r}"].font = F(10); ws[f"F{r}"].alignment = AL
    r += 4
    ws[f"F{r}"] = lookup_formula(NIP, 28)  # penandatangan
    ws[f"F{r}"].font = F(10, bold=True); ws[f"F{r}"].alignment = AL
    r += 1
    ws[f"F{r}"] = "Pembina TK.I"
    ws[f"F{r}"].font = F(10); ws[f"F{r}"].alignment = AL

    # Tembusan (kolom A..E)
    rt = sig_start
    tembusan = [
        "Tembusan disampaikan kepada:",
        "1. Yth. Pimpinan Instansi Pembina Jabatan Fungsional yang bersangkutan;",
        "2. Yth. Kepala Badan Kepegawaian Negara/Kepala Kantor Regional III BKN;",
        "3. Yth. Sekretaris Daerah Provinsi Jawa Barat;",
        "4. Yth. Kepala Dinas Pendidikan;",
    ]
    for t in tembusan:
        ws[f"A{rt}"] = t
        ws[f"A{rt}"].font = F(10); ws[f"A{rt}"].alignment = AL
        ws.merge_cells(f"A{rt}:E{rt}")
        rt += 1
    # Baris terakhir = dinamis (nama pegawai)
    ws[f"A{rt}"] = (
        f'=CONCATENATE("5. Yth. ",{lookup_formula(NIP, 2)[1:]},".")'
    )
    ws[f"A{rt}"].font = F(10); ws[f"A{rt}"].alignment = AL
    ws.merge_cells(f"A{rt}:E{rt}")
    rt += 1

    # Footer BSrE
    foot_start = max(r, rt) + 2
    footer_note(ws, foot_start, END)


# Placeholder defined names yang dipakai di formula CONCATENATE periode
# (supaya formula "Q_P1_BULAN" bisa resolve)
def add_periode_names(wb, data_start):
    # Q=17(P1 Tahun), R=18(P1 Bulan), S=19(P1 Pred), ...
    # Kita mau string periode: "2023 Juli - Desember" bukan cuma angka bulan
    # Untuk kesederhanaan, saya bikin helper: "TAHUN BULAN (teks)"
    # Tapi DATA PEGAWAI hanya simpan jumlah bulan (angka). Kita buat:
    # periode string = Tahun & " (" & Bulan & " bulan)"
    ds = data_start
    # Q=P1Tahun, R=P1Bulan
    wb.defined_names["Q_P1_BULAN"] = DefinedName(
        "Q_P1_BULAN",
        attr_text=(
            f'CONCATENATE(INDEX(tbl_pegawai,MATCH('
            f"'KONVERSI PREDIKAT KINERJA'!$C$8,tbl_nip,0),16),"
            f'" (",INDEX(tbl_pegawai,MATCH('
            f"'KONVERSI PREDIKAT KINERJA'!$C$8,tbl_nip,0),17),\" bulan)\")"
        )
    )
    wb.defined_names["Q_P2_BULAN"] = DefinedName(
        "Q_P2_BULAN",
        attr_text=(
            f'CONCATENATE(INDEX(tbl_pegawai,MATCH('
            f"'KONVERSI PREDIKAT KINERJA'!$C$8,tbl_nip,0),19),"
            f'" (",INDEX(tbl_pegawai,MATCH('
            f"'KONVERSI PREDIKAT KINERJA'!$C$8,tbl_nip,0),20),\" bulan)\")"
        )
    )
    wb.defined_names["Q_P3_BULAN"] = DefinedName(
        "Q_P3_BULAN",
        attr_text=(
            f'CONCATENATE(INDEX(tbl_pegawai,MATCH('
            f"'KONVERSI PREDIKAT KINERJA'!$C$8,tbl_nip,0),22),"
            f'" (",INDEX(tbl_pegawai,MATCH('
            f"'KONVERSI PREDIKAT KINERJA'!$C$8,tbl_nip,0),23),\" bulan)\")"
        )
    )
    wb.defined_names["Q_P4_BULAN"] = DefinedName(
        "Q_P4_BULAN",
        attr_text=(
            f'CONCATENATE(INDEX(tbl_pegawai,MATCH('
            f"'KONVERSI PREDIKAT KINERJA'!$C$8,tbl_nip,0),25),"
            f'" (",INDEX(tbl_pegawai,MATCH('
            f"'KONVERSI PREDIKAT KINERJA'!$C$8,tbl_nip,0),26),\" bulan)\")"
        )
    )


# ==================================================================
#      SHEET: AKUMULASI ANGKA KREDIT
# ==================================================================
def build_akumulasi(wb):
    if "AKUMULASI ANGKA KREDIT" in wb.sheetnames:
        del wb["AKUMULASI ANGKA KREDIT"]
    ws = wb.create_sheet("AKUMULASI ANGKA KREDIT")
    set_f4(ws)
    widths(ws, [4, 6, 14, 14, 4, 18, 14, 14, 14, 14])
    END = "J"
    kop_surat(ws, END)

    # ---- Panel input (dropdown NIP) ----
    r = 8
    ws.row_dimensions[r].height = 20
    ws.merge_cells(f"A{r}:B{r}"); ws[f"A{r}"] = "PILIH NIP:"
    ws[f"A{r}"].font = F(11, bold=True); ws[f"A{r}"].alignment = AL
    ws.merge_cells(f"C{r}:F{r}")
    ws[f"C{r}"] = "199101182019031011"
    ws[f"C{r}"].font = F(11, bold=True); ws[f"C{r}"].alignment = AL
    ws[f"C{r}"].fill = FILL_INPUT; ws[f"C{r}"].border = BA

    dv_nip = DataValidation(type="list", formula1="=tbl_nip", allow_blank=False)
    dv_nip.add(f"C{r}")
    ws.add_data_validation(dv_nip)

    NIP = f"$C${r}"

    # ---- Judul ----
    r = 10
    merge_value(ws, f"A{r}:{END}{r}", "AKUMULASI ANGKA KREDIT",
                F(13, bold=True), border=False)
    r += 1
    merge_value(ws, f"A{r}:{END}{r}",
                f'=CONCATENATE("NOMOR: 219/KPG.03.03/SMAN1CGL-",{NIP})',
                F(11), border=False)

    r += 2
    merge_value(ws, f"A{r}:E{r}",
                f'=CONCATENATE("Instansi : ",{lookup_formula(NIP, 11)[1:]})',
                F(10), align=AL, border=False)
    merge_value(ws, f"F{r}:{END}{r}",
                '"Masa Penilaian : 2023 s.d saat ini"',
                F(10), align=AR, border=False)

    # ---- I KETERANGAN PERORANGAN ----
    r += 2
    ws[f"A{r}"] = "I"
    ws[f"A{r}"].font = F(11, bold=True); ws[f"A{r}"].alignment = AC
    ws[f"A{r}"].border = BA; ws[f"A{r}"].fill = FILL_HEAD
    merge_value(ws, f"B{r}:{END}{r}", "KETERANGAN PERORANGAN",
                F(11, bold=True), align=AL, fill=FILL_HEAD)

    identitas = [
        ("1", "NAMA", 2),
        ("2", "NIP", 1),
        ("3", "NOMOR SERI KARPEG", 3),
        ("4", "TEMPAT/TGL. LAHIR", 4),
        ("5", "JENIS KELAMIN", 5),
        ("6", "PANGKAT/GOLONGAN RUANG/TMT", 6),
        ("7", "JABATAN/TMT", 8),
        ("8", "UNIT KERJA", 10),
        ("9", "INSTANSI", 11),
    ]
    for no, label, idx in identitas:
        r += 1
        ws.row_dimensions[r].height = 20
        ws[f"A{r}"] = ""
        ws[f"B{r}"] = no; ws[f"B{r}"].alignment = AC
        ws.merge_cells(f"C{r}:D{r}")
        ws[f"C{r}"] = label; ws[f"C{r}"].alignment = AL
        ws[f"E{r}"] = ":"; ws[f"E{r}"].alignment = AC
        ws.merge_cells(f"F{r}:{END}{r}")
        ws[f"F{r}"] = lookup_formula(NIP, idx)
        ws[f"F{r}"].alignment = AL
        if label == "UNIT KERJA":
            ws.row_dimensions[r].height = 54
        for col in range(1, 11):
            c = ws.cell(row=r, column=col)
            c.border = BA
            if not c.font or c.font.name != FONT:
                c.font = F(10)

    # ---- HASIL PENILAIAN ANGKA KREDIT ----
    r += 1
    merge_value(ws, f"A{r}:{END}{r}",
                "HASIL PENILAIAN ANGKA KREDIT",
                F(11, bold=True), fill=FILL_HEAD)

    # Header tabel (2 baris)
    r += 1
    ws.row_dimensions[r].height = 20
    merge_value(ws, f"A{r}:D{r}", "HASIL PENILAIAN KINERJA", F(10, bold=True))
    merge_value(ws, f"E{r}:H{r+1}", "KOEFISIEN PER TAHUN", F(10, bold=True))
    # simpan koefisien di kolom E..F, AK di G..H lebih pas: kita pakai E..F koef, G..J AK
    # Ubah: E..G koefisien, H..J AK
    # Reset the merge above (already merged). We'll just use E..F as koefisien, G..J as AK below.
    # Sebenarnya lebih mudah: E..F = KOEFISIEN, G..J = AK YANG DIDAPAT
    ws.unmerge_cells(f"E{r}:H{r+1}")
    merge_value(ws, f"E{r}:F{r+1}", "KOEFISIEN PER TAHUN", F(10, bold=True))
    merge_value(ws, f"G{r}:{END}{r+1}", "ANGKA KREDIT YANG DIDAPAT",
                F(10, bold=True))

    r += 1
    ws.row_dimensions[r].height = 28
    # Header row: A=TAHUN | B=PERIODIK(BULAN) | C=PREDIKAT | D=PROSENTASE | E:F=KOEFISIEN | G:J=AK
    ws[f"A{r}"] = "TAHUN"
    ws[f"B{r}"] = "PERIODIK (BULAN)"
    ws[f"C{r}"] = "PREDIKAT"
    ws[f"D{r}"] = "PROSENTASE"
    for col in "ABCD":
        c = ws[f"{col}{r}"]
        c.font = F(10, bold=True); c.alignment = AC; c.border = BA

    # Baris nomor kolom
    r += 1
    ws.row_dimensions[r].height = 16
    ws[f"A{r}"] = "1"; ws[f"B{r}"] = "2"; ws[f"C{r}"] = "3"; ws[f"D{r}"] = "4"
    merge_value(ws, f"E{r}:F{r}", "5", F(10, bold=True))
    merge_value(ws, f"G{r}:{END}{r}", "6", F(10, bold=True))
    for col in "ABCD":
        c = ws[f"{col}{r}"]
        c.font = F(10, bold=True); c.alignment = AC; c.border = BA

    # Baris data - 4 periode
    data_start = r + 1
    for p in range(1, 5):
        r += 1
        ws.row_dimensions[r].height = 22
        # indeks di tbl_pegawai:
        # P1: Tahun=16, Bulan=17, Pred=18
        # P2: Tahun=19, Bulan=20, Pred=21
        # P3: Tahun=22, Bulan=23, Pred=24
        # P4: Tahun=25, Bulan=26, Pred=27
        tahun_idx = 16 + (p - 1) * 3
        bulan_idx = 17 + (p - 1) * 3
        pred_idx  = 18 + (p - 1) * 3

        tahun_ref = lookup_formula(NIP, tahun_idx)[1:]
        bulan_ref = lookup_formula(NIP, bulan_idx)[1:]
        pred_ref  = lookup_formula(NIP, pred_idx)[1:]
        jenj_ref  = lookup_formula(NIP, 9)[1:]
        # "kosong" jika tahun tidak terisi
        empty_cond = f'OR({tahun_ref}="",{tahun_ref}=0)'

        ws[f"A{r}"] = f'=IF({empty_cond},"",{tahun_ref})'
        ws[f"B{r}"] = (f'=IF({empty_cond},"",'
                       f'IF({bulan_ref}="","",'
                       f'CONCATENATE({bulan_ref}," Bulan")))')
        ws[f"C{r}"] = f'=IF({empty_cond},"",{pred_ref})'
        ws[f"D{r}"] = (f'=IF({empty_cond},"",'
                       f'IFERROR(VLOOKUP({pred_ref},tbl_predikat,2,FALSE),""))')
        ws[f"D{r}"].number_format = "0%"

        # Koefisien per tahun = dari Jenjang
        koef_f = (f'=IF({empty_cond},"",'
                  f'IFERROR(VLOOKUP({jenj_ref},tbl_jenjang,2,FALSE),""))')
        merge_value(ws, f"E{r}:F{r}", koef_f, F(10))
        ws[f"E{r}"].number_format = "0.0"

        # AK = koef * prosentase * (bulan/12)
        ak_f = (f'=IF({empty_cond},"",'
                f'IFERROR(IF(OR({pred_ref}="",{bulan_ref}=""),"",'
                f'VLOOKUP({jenj_ref},tbl_jenjang,2,FALSE)*'
                f'VLOOKUP({pred_ref},tbl_predikat,2,FALSE)*'
                f'{bulan_ref}/12),""))')
        merge_value(ws, f"G{r}:{END}{r}", ak_f, F(10, bold=True))
        ws[f"G{r}"].number_format = "0.000"

        # Format cells
        for col in "ABCD":
            c = ws[f"{col}{r}"]
            c.font = F(10); c.alignment = AC; c.border = BA
    data_end = r

    # Baris JUMLAH
    r += 1
    ws.row_dimensions[r].height = 22
    merge_value(ws, f"A{r}:F{r}", "JUMLAH ANGKA KREDIT YANG DIPEROLEH",
                F(11, bold=True))
    jumlah_f = (
        f'=SUMPRODUCT(IFERROR(VALUE(G{data_start}:G{data_end}),0))+'
        f'SUMPRODUCT(--(ISNUMBER(G{data_start}:G{data_end})),G{data_start}:G{data_end})'
    )
    # simpler: sum only numbers
    jumlah_f = f'=SUMPRODUCT(--ISNUMBER(G{data_start}:G{data_end}),G{data_start}:G{data_end})'
    merge_value(ws, f"G{r}:{END}{r}", jumlah_f, F(11, bold=True))
    ws[f"G{r}"].number_format = "0.000"

    # Simpan defined name AK BARU utk dipakai Penetapan
    wb.defined_names["ak_baru"] = DefinedName(
        "ak_baru",
        attr_text=f"'AKUMULASI ANGKA KREDIT'!$G${r}"
    )

    # Tanda tangan & tembusan
    r += 3
    sig_start = r
    ws[f"H{r}"] = "Ditetapkan di Bandung"; ws[f"H{r}"].font = F(10); ws[f"H{r}"].alignment = AL
    r += 1
    ws[f"H{r}"] = "Pada tanggal 30 April 2025"; ws[f"H{r}"].font = F(10); ws[f"H{r}"].alignment = AL
    r += 2
    ws[f"H{r}"] = "Pejabat Penilai Kinerja"; ws[f"H{r}"].font = F(10); ws[f"H{r}"].alignment = AL
    r += 1
    ws[f"H{r}"] = "KEPALA SEKOLAH SMAN 1 CIGALONTANG"; ws[f"H{r}"].font = F(10); ws[f"H{r}"].alignment = AL
    r += 1
    ws[f"H{r}"] = "KABUPATEN TASIKMALAYA,"; ws[f"H{r}"].font = F(10); ws[f"H{r}"].alignment = AL
    r += 4
    ws[f"H{r}"] = lookup_formula(NIP, 28); ws[f"H{r}"].font = F(10, bold=True); ws[f"H{r}"].alignment = AL
    r += 1
    ws[f"H{r}"] = "Pembina TK.I"; ws[f"H{r}"].font = F(10); ws[f"H{r}"].alignment = AL

    rt = sig_start
    tembusan = [
        "Tembusan disampaikan kepada:",
        "1. Yth. Pimpinan Instansi Pembina Jabatan Fungsional yang bersangkutan;",
        "2. Yth. Kepala Badan Kepegawaian Negara/Kepala Kantor Regional III BKN;",
        "3. Yth. Sekretaris Daerah Provinsi Jawa Barat;",
        "4. Yth. Kepala Dinas Pendidikan;",
    ]
    for t in tembusan:
        ws.merge_cells(f"A{rt}:G{rt}")
        ws[f"A{rt}"] = t; ws[f"A{rt}"].font = F(10); ws[f"A{rt}"].alignment = AL
        rt += 1
    ws.merge_cells(f"A{rt}:G{rt}")
    ws[f"A{rt}"] = f'=CONCATENATE("5. Yth. ",{lookup_formula(NIP, 2)[1:]},".")'
    ws[f"A{rt}"].font = F(10); ws[f"A{rt}"].alignment = AL
    rt += 1

    foot_start = max(r, rt) + 2
    footer_note(ws, foot_start, END)


# ==================================================================
#      SHEET: PENETAPAN ANGKA KREDIT
# ==================================================================
def build_penetapan(wb):
    if "PENETAPAN ANGKA KREDIT" in wb.sheetnames:
        del wb["PENETAPAN ANGKA KREDIT"]
    ws = wb.create_sheet("PENETAPAN ANGKA KREDIT")
    set_f4(ws)
    widths(ws, [4, 6, 24, 12, 12, 12, 4, 14, 14, 14])
    END = "J"
    kop_surat(ws, END)

    # Panel input NIP
    r = 8
    ws.row_dimensions[r].height = 20
    ws.merge_cells(f"A{r}:B{r}"); ws[f"A{r}"] = "PILIH NIP:"
    ws[f"A{r}"].font = F(11, bold=True); ws[f"A{r}"].alignment = AL
    ws.merge_cells(f"C{r}:F{r}")
    ws[f"C{r}"] = "199101182019031011"
    ws[f"C{r}"].font = F(11, bold=True); ws[f"C{r}"].alignment = AL
    ws[f"C{r}"].fill = FILL_INPUT; ws[f"C{r}"].border = BA

    dv_nip = DataValidation(type="list", formula1="=tbl_nip", allow_blank=False)
    dv_nip.add(f"C{r}")
    ws.add_data_validation(dv_nip)

    NIP = f"$C${r}"

    # Judul
    r = 10
    merge_value(ws, f"A{r}:{END}{r}", "PENETAPAN ANGKA KREDIT",
                F(13, bold=True), border=False)
    r += 1
    merge_value(ws, f"A{r}:{END}{r}",
                f'=CONCATENATE("NOMOR: 220/KPG.03.03/SMAN1CGL-",{NIP})',
                F(11), border=False)

    r += 2
    merge_value(ws, f"A{r}:E{r}",
                f'=CONCATENATE("Instansi : ",{lookup_formula(NIP, 11)[1:]})',
                F(10), align=AL, border=False)
    merge_value(ws, f"F{r}:{END}{r}",
                '"Masa Penilaian : 01-01-2024 s.d 31-12-2024"',
                F(10), align=AR, border=False)

    # I KETERANGAN PERORANGAN
    r += 2
    ws[f"A{r}"] = "I"
    ws[f"A{r}"].font = F(11, bold=True); ws[f"A{r}"].alignment = AC
    ws[f"A{r}"].border = BA; ws[f"A{r}"].fill = FILL_HEAD
    merge_value(ws, f"B{r}:{END}{r}", "KETERANGAN PERORANGAN",
                F(11, bold=True), align=AL, fill=FILL_HEAD)

    identitas = [
        ("1", "NAMA", 2),
        ("2", "NIP", 1),
        ("3", "NOMOR SERI KARPEG", 3),
        ("4", "TEMPAT/TANGGAL LAHIR", 4),
        ("5", "JENIS KELAMIN", 5),
        ("6", "PANGKAT/GOLONGAN RUANG/TMT", 6),
        ("7", "JABATAN/TMT", 8),
        ("8", "UNIT KERJA", 10),
        ("9", "INSTANSI", 11),
    ]
    for no, label, idx in identitas:
        r += 1
        ws.row_dimensions[r].height = 20
        ws[f"B{r}"] = no; ws[f"B{r}"].alignment = AC
        ws[f"C{r}"] = label; ws[f"C{r}"].alignment = AL
        ws.merge_cells(f"D{r}:{END}{r}")
        ws[f"D{r}"] = lookup_formula(NIP, idx); ws[f"D{r}"].alignment = AL
        if label == "UNIT KERJA":
            ws.row_dimensions[r].height = 54
        for col in range(1, 11):
            c = ws.cell(row=r, column=col)
            c.border = BA
            if not c.font or c.font.name != FONT:
                c.font = F(10)

    # HASIL PENILAIAN ANGKA KREDIT
    r += 1
    merge_value(ws, f"A{r}:{END}{r}", "HASIL PENILAIAN ANGKA KREDIT",
                F(11, bold=True), fill=FILL_HEAD)

    # Header II
    r += 1
    ws.row_dimensions[r].height = 22
    ws[f"A{r}"] = "II"
    merge_value(ws, f"B{r}:C{r}", "PENETAPAN ANGKA KREDIT", F(10, bold=True))
    ws[f"D{r}"] = "LAMA"; ws[f"E{r}"] = "BARU"
    merge_value(ws, f"F{r}:G{r}", "JUMLAH", F(10, bold=True))
    merge_value(ws, f"H{r}:{END}{r}", "KETERANGAN", F(10, bold=True))
    for col in "ADE":
        c = ws[f"{col}{r}"]
        c.font = F(10, bold=True); c.alignment = AC; c.border = BA

    # Nomor kolom 1..6
    r += 1
    ws.row_dimensions[r].height = 16
    ws[f"A{r}"] = "1"
    merge_value(ws, f"B{r}:C{r}", "2", F(10, bold=True))
    ws[f"D{r}"] = "3"; ws[f"E{r}"] = "4"
    merge_value(ws, f"F{r}:G{r}", "5", F(10, bold=True))
    merge_value(ws, f"H{r}:{END}{r}", "6", F(10, bold=True))
    for col in "ADE":
        c = ws[f"{col}{r}"]
        c.font = F(10, bold=True); c.alignment = AC; c.border = BA

    # Data baris
    first_data = r + 1
    # row 1: AK DASAR YANG DIBERIKAN -> Lama dari DATA PEGAWAI kolom 12 (M=AK DASAR)
    pen_rows = [
        ("1", "AK DASAR YANG DIBERIKAN",
            lookup_formula(NIP, 12),   # 12 = M (AK Dasar)
            '""', "-"),
        ("2", "AK JF LAMA",
            lookup_formula(NIP, 13),   # 13 = N (AK JF Lama)
            '""', "-"),
        ("3", "AK PENYESUAIAN/ PENYETARAAN",
            lookup_formula(NIP, 14),   # 14 = O (AK Penyesuaian)
            '""', "-"),
        ("4", "AK KONVERSI",
            '""', "=ak_baru", "-"),
        ("5", "AK YANG DIPEROLEH DARI PENINGKATAN PENDIDIKAN",
            '""', '""', "-"),
        ("6", "…....... **)",
            '""', '""', "-"),
    ]
    for no, label, lama_f, baru_f, ket in pen_rows:
        r += 1
        ws.row_dimensions[r].height = 22
        ws[f"A{r}"] = no
        merge_value(ws, f"B{r}:C{r}", label, F(10), align=AL)
        ws[f"D{r}"] = lama_f if lama_f.startswith("=") else f"={lama_f}" if lama_f != '""' else "-"
        # Careful: if lama_f starts with '=', keep; else wrap. Handle all cases:
        if lama_f == '""':
            ws[f"D{r}"] = "-"
        else:
            ws[f"D{r}"] = lama_f  # already =IFERROR(...)
        if baru_f == '""':
            ws[f"E{r}"] = "-"
        else:
            ws[f"E{r}"] = baru_f
        # Jumlah
        ws[f"F{r}"] = (
            f'=IFERROR(IF(AND(ISNUMBER(D{r}),ISNUMBER(E{r})),D{r}+E{r},'
            f'IF(ISNUMBER(D{r}),D{r},IF(ISNUMBER(E{r}),E{r},"-"))),"-")'
        )
        ws.merge_cells(f"F{r}:G{r}")
        ws.merge_cells(f"H{r}:{END}{r}")
        ws[f"H{r}"] = ket
        # format numerik
        for col in ["D","E","F"]:
            c = ws[f"{col}{r}"]
            c.number_format = "0.000"
            c.font = F(10); c.alignment = AC; c.border = BA
        ws[f"A{r}"].font = F(10); ws[f"A{r}"].alignment = AC; ws[f"A{r}"].border = BA
        ws[f"H{r}"].font = F(10); ws[f"H{r}"].alignment = AC; ws[f"H{r}"].border = BA
        ws[f"G{r}"].border = BA  # for merged F:G
        for cc in ["I","J"]:
            ws[f"{cc}{r}"].border = BA
    last_data = r

    # JUMLAH AK KUMULATIF
    r += 1
    ws.row_dimensions[r].height = 22
    merge_value(ws, f"A{r}:C{r}", "JUMLAH ANGKA KREDIT KUMULATIF",
                F(11, bold=True))
    ws[f"D{r}"] = f"=SUMPRODUCT(--ISNUMBER(D{first_data}:D{last_data}),D{first_data}:D{last_data})"
    ws[f"E{r}"] = f"=SUMPRODUCT(--ISNUMBER(E{first_data}:E{last_data}),E{first_data}:E{last_data})"
    ws[f"F{r}"] = f"=D{r}+E{r}"
    ws.merge_cells(f"F{r}:G{r}")
    ws.merge_cells(f"H{r}:{END}{r}")
    for col in "DEF":
        c = ws[f"{col}{r}"]
        c.number_format = "0.000"; c.font = F(11, bold=True)
        c.alignment = AC; c.border = BA
    ws[f"H{r}"].border = BA
    ws[f"G{r}"].border = BA
    for cc in ["I","J"]:
        ws[f"{cc}{r}"].border = BA

    row_jumlah = r

    # KETERANGAN | PANGKAT | JENJANG JABATAN
    r += 1
    ws.row_dimensions[r].height = 22
    merge_value(ws, f"A{r}:C{r}", "KETERANGAN", F(11, bold=True), fill=FILL_HEAD)
    merge_value(ws, f"D{r}:E{r}", "PANGKAT", F(11, bold=True), fill=FILL_HEAD)
    merge_value(ws, f"F{r}:{END}{r}", "JENJANG JABATAN",
                F(11, bold=True), fill=FILL_HEAD)

    # AK Minimal
    r += 1
    ws.row_dimensions[r].height = 34
    merge_value(ws, f"A{r}:C{r}",
                "ANGKA KREDIT MINIMAL YANG HARUS DIPENUHI UNTUK KENAIKAN PANGKAT/ JENJANG",
                F(10), align=AL)
    # AK Min Pangkat: VLOOKUP dari tbl_ak_kp (kolom 3=AK MINIMAL)
    merge_value(ws, f"D{r}:E{r}",
                f'=IFERROR(VLOOKUP({lookup_formula(NIP, 7)[1:]},tbl_ak_kp,3,FALSE),"-")',
                F(11, bold=True))
    ws[f"D{r}"].number_format = "0.000"
    # AK Min Jenjang
    merge_value(ws, f"F{r}:{END}{r}",
                f'=IFERROR(VLOOKUP({lookup_formula(NIP, 9)[1:]},tbl_ak_jenjang,2,FALSE),"-")',
                F(11, bold=True))
    ws[f"F{r}"].number_format = "0.000"

    row_min = r

    # Kekurangan KP (baris 1)
    r += 1
    row_kurang_kp = r
    ws.row_dimensions[r].height = 22
    merge_value(ws, f"A{r}:C{r}",
                "KEKURANGAN ANGKA KREDIT YANG HARUS DICAPAI UNTUK KENAIKAN PANGKAT",
                F(10), align=AL)

    # Kekurangan Jenjang (baris 2)
    r += 1
    row_kurang_jn = r
    ws.row_dimensions[r].height = 22
    merge_value(ws, f"A{r}:C{r}",
                "KEKURANGAN ANGKA KREDIT YANG HARUS DICAPAI UNTUK KENAIKAN JENJANG",
                F(10), align=AL)

    # Merge D-E dan F-J lintas 2 baris untuk angka sisa
    ws.merge_cells(f"D{row_kurang_kp}:E{row_kurang_jn}")
    ws[f"D{row_kurang_kp}"] = (
        f'=IFERROR(MAX(D{row_min}-F{row_jumlah},0),"-")'
    )
    ws[f"D{row_kurang_kp}"].number_format = "0.000"
    ws[f"D{row_kurang_kp}"].font = F(11, bold=True)
    ws[f"D{row_kurang_kp}"].alignment = AC
    for rr in (row_kurang_kp, row_kurang_jn):
        for col in "DE":
            ws[f"{col}{rr}"].border = BA

    ws.merge_cells(f"F{row_kurang_kp}:{END}{row_kurang_jn}")
    ws[f"F{row_kurang_kp}"] = (
        f'=IFERROR(MAX(F{row_min}-F{row_jumlah},0),"-")'
    )
    ws[f"F{row_kurang_kp}"].number_format = "0.000"
    ws[f"F{row_kurang_kp}"].font = F(11, bold=True)
    ws[f"F{row_kurang_kp}"].alignment = AC
    for rr in (row_kurang_kp, row_kurang_jn):
        for col in "FGHIJ":
            ws[f"{col}{rr}"].border = BA

    # Kalimat dapat/tidak dapat
    r = row_kurang_jn + 1
    ws.row_dimensions[r].height = 40
    merge_value(ws, f"A{r}:{END}{r}",
                f'=IF(F{row_jumlah}>=D{row_min},"DAPAT DIPERTIMBANGKAN UNTUK KENAIKAN PANGKAT",'
                f'"TIDAK DAPAT DIPERTIMBANGKAN UNTUK KENAIKAN PANGKAT SETINGKAT LEBIH TINGGI")',
                F(10, bold=True), align=AL)

    # ASLI + Tembusan + Tanda tangan
    r += 2
    sig_start = r
    ws[f"A{r}"] = "ASLI Penetapan Angka Kredit untuk:"
    ws[f"A{r}"].font = F(10, bold=True); ws[f"A{r}"].alignment = AL
    r += 1
    ws[f"A{r}"] = lookup_formula(NIP, 2)
    ws[f"A{r}"].font = F(10); ws[f"A{r}"].alignment = AL
    r += 2
    tembusan = [
        "Tembusan disampaikan kepada:",
        "1. Yth. Pimpinan Instansi Pembina Jabatan Fungsional yang bersangkutan;",
        "2. Yth. Kepala Badan Kepegawaian Negara/Kepala Kantor Regional III BKN;",
        "3. Yth. Sekretaris Daerah Provinsi Jawa Barat;",
        "4. Yth. Kepala Dinas Pendidikan;",
        "5. Yth. Sekretariat Tim Penilai Kinerja PNS Pemerintah Provinsi Jawa Barat.",
    ]
    for t in tembusan:
        ws.merge_cells(f"A{r}:F{r}")
        ws[f"A{r}"] = t; ws[f"A{r}"].font = F(10); ws[f"A{r}"].alignment = AL
        r += 1
    rt = r

    # Signature column kanan (H..J) mulai dari sig_start
    rs = sig_start
    ws[f"H{rs}"] = "Ditetapkan di Bandung"; ws[f"H{rs}"].font = F(10); ws[f"H{rs}"].alignment = AL
    rs += 1
    ws[f"H{rs}"] = "Pada tanggal 30 April 2025"; ws[f"H{rs}"].font = F(10); ws[f"H{rs}"].alignment = AL
    rs += 2
    ws[f"H{rs}"] = "Pejabat Penilai Kinerja"; ws[f"H{rs}"].font = F(10); ws[f"H{rs}"].alignment = AL
    rs += 1
    ws[f"H{rs}"] = "KEPALA SEKOLAH SMAN 1 CIGALONTANG"; ws[f"H{rs}"].font = F(10); ws[f"H{rs}"].alignment = AL
    rs += 1
    ws[f"H{rs}"] = "KABUPATEN TASIKMALAYA,"; ws[f"H{rs}"].font = F(10); ws[f"H{rs}"].alignment = AL
    rs += 4
    ws[f"H{rs}"] = lookup_formula(NIP, 28); ws[f"H{rs}"].font = F(10, bold=True); ws[f"H{rs}"].alignment = AL
    rs += 1
    ws[f"H{rs}"] = "Pembina TK.I"; ws[f"H{rs}"].font = F(10); ws[f"H{rs}"].alignment = AL

    foot_start = max(rt, rs) + 2
    footer_note(ws, foot_start, END)


# ==================================================================
# MAIN
# ==================================================================
def main():
    src = "/sessions/trusting-funny-volta/mnt/uploads/Konversi PAK.xlsx"
    wb = load_workbook(src)

    # Hapus defined names bawaan (jaga-jaga konflik)
    for name in list(wb.defined_names):
        del wb.defined_names[name]

    build_master(wb)
    data_start, data_end = build_pegawai(wb, n_rows=30)

    # Hapus sheet SK lama (akan dibangun ulang bersih)
    for sn in ["KONVERSI PREDIKAT KINERJA", "AKUMULASI ANGKA KREDIT",
               "PENETAPAN ANGKA KREDIT"]:
        if sn in wb.sheetnames:
            del wb[sn]

    build_konversi(wb)
    add_periode_names(wb, data_start)
    build_akumulasi(wb)
    build_penetapan(wb)

    # Urut sheet: MASTER, PEGAWAI, KONVERSI, AKUMULASI, PENETAPAN
    desired = ["DATA MASTER", "DATA PEGAWAI",
               "KONVERSI PREDIKAT KINERJA",
               "AKUMULASI ANGKA KREDIT",
               "PENETAPAN ANGKA KREDIT"]
    wb._sheets = [wb[n] for n in desired if n in wb.sheetnames]

    # Set active = PEGAWAI
    wb.active = wb.sheetnames.index("DATA PEGAWAI")

    out = "/sessions/trusting-funny-volta/mnt/outputs/Konversi PAK Otomatis.xlsx"
    wb.save(out)
    print("Saved:", out)


if __name__ == "__main__":
    main()
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             