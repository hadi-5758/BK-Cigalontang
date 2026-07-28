"""
Konversi PDF PAK (3 halaman) -> Excel, ukuran kertas F4, margin seragam.
Setiap halaman PDF -> 1 sheet Excel.
"""

from openpyxl import Workbook
from openpyxl.styles import (
    Font, Alignment, Border, Side, PatternFill
)
from openpyxl.worksheet.page import PageMargins, PrintOptions
from openpyxl.utils import get_column_letter

FONT_NAME = "Times New Roman"

# --- Styles ----------
thin = Side(style="thin", color="000000")
BORDER_ALL = Border(left=thin, right=thin, top=thin, bottom=thin)

F_TITLE = Font(name=FONT_NAME, size=14, bold=True)
F_SUBTITLE = Font(name=FONT_NAME, size=11, bold=False)
F_HEAD = Font(name=FONT_NAME, size=11, bold=True)
F_NORM = Font(name=FONT_NAME, size=10)
F_BOLD = Font(name=FONT_NAME, size=10, bold=True)
F_SMALL = Font(name=FONT_NAME, size=8)
F_SMALLI = Font(name=FONT_NAME, size=8, italic=True)

ALIGN_CENTER = Alignment(horizontal="center", vertical="center", wrap_text=True)
ALIGN_LEFT = Alignment(horizontal="left", vertical="center", wrap_text=True)
ALIGN_LEFT_TOP = Alignment(horizontal="left", vertical="top", wrap_text=True)
ALIGN_RIGHT = Alignment(horizontal="right", vertical="center", wrap_text=True)
ALIGN_CENTER_TOP = Alignment(horizontal="center", vertical="top", wrap_text=True)


def set_f4_page(ws):
    """F4 paper size ~ 215mm x 330mm, margins seragam 1.5 cm (0.59 inch)."""
    # Excel custom paper size: use paperHeight / paperWidth (string with unit)
    ws.page_setup.paperHeight = "330mm"
    ws.page_setup.paperWidth = "215mm"
    ws.page_setup.orientation = "portrait"
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True

    m = 0.59  # inch (~1.5 cm) - margin kiri/kanan/atas/bawah sama
    ws.page_margins = PageMargins(
        left=m, right=m, top=m, bottom=m, header=0.3, footer=0.3
    )
    ws.print_options = PrintOptions(horizontalCentered=True)


def border_range(ws, cell_range):
    for row in ws[cell_range]:
        for c in row:
            c.border = BORDER_ALL


def style_range(ws, cell_range, font=None, align=None, border=True, fill=None):
    for row in ws[cell_range]:
        for c in row:
            if font:
                c.font = font
            if align:
                c.alignment = align
            if border:
                c.border = BORDER_ALL
            if fill:
                c.fill = fill


def set_col_widths(ws, widths):
    for i, w in enumerate(widths, start=1):
        ws.column_dimensions[get_column_letter(i)].width = w


def write_letterhead(ws, end_col_letter):
    """Kop surat (header) identik untuk semua sheet - tidak dirubah."""
    # Baris 1 - 6 untuk kop
    ws.row_dimensions[1].height = 22
    ws.row_dimensions[2].height = 22
    ws.row_dimensions[3].height = 14
    ws.row_dimensions[4].height = 14
    ws.row_dimensions[5].height = 14
    ws.row_dimensions[6].height = 14

    ws.merge_cells(f"A1:{end_col_letter}1")
    ws["A1"] = "PEMERINTAH DAERAH PROVINSI JAWA BARAT"
    ws["A1"].font = Font(name=FONT_NAME, size=16, bold=True)
    ws["A1"].alignment = ALIGN_CENTER

    ws.merge_cells(f"A2:{end_col_letter}2")
    ws["A2"] = "DINAS PENDIDIKAN"
    ws["A2"].font = Font(name=FONT_NAME, size=16, bold=True)
    ws["A2"].alignment = ALIGN_CENTER

    ws.merge_cells(f"A3:{end_col_letter}3")
    ws["A3"] = "Jalan. Dr. Radjiman No. 6 Telp. (022) 4264813 Fax. (022) 4264881"
    ws["A3"].font = F_NORM
    ws["A3"].alignment = ALIGN_CENTER

    ws.merge_cells(f"A4:{end_col_letter}4")
    ws["A4"] = "Website : disdik.jabarprov.go.id"
    ws["A4"].font = F_NORM
    ws["A4"].alignment = ALIGN_CENTER

    ws.merge_cells(f"A5:{end_col_letter}5")
    ws["A5"] = "e-mail: disdik@jabarprov.go.id/sekretariatdisdikjabar@gmail.com"
    ws["A5"].font = F_NORM
    ws["A5"].alignment = ALIGN_CENTER

    ws.merge_cells(f"A6:{end_col_letter}6")
    ws["A6"] = "BANDUNG - 40171"
    ws["A6"].font = F_NORM
    ws["A6"].alignment = ALIGN_CENTER

    # Garis pemisah kop
    ws.row_dimensions[7].height = 6
    for col in range(1, ord(end_col_letter) - ord("A") + 2):
        cell = ws.cell(row=7, column=col)
        cell.border = Border(top=Side(style="medium", color="000000"),
                             bottom=Side(style="medium", color="000000"))


def write_footer(ws, start_row, end_col_letter):
    """Footer QR note - tidak dirubah."""
    r = start_row
    ws.row_dimensions[r].height = 14
    ws.merge_cells(f"A{r}:{end_col_letter}{r}")
    ws.cell(row=r, column=1).value = (
        "Dokumen ini telah ditandatangani secara elektronik menggunakan sertifikat "
        "elektronik yang diterbitkan oleh Balai Sertifikasi"
    )
    ws.cell(row=r, column=1).font = F_SMALL
    ws.cell(row=r, column=1).alignment = ALIGN_CENTER

    r += 1
    ws.merge_cells(f"A{r}:{end_col_letter}{r}")
    ws.cell(row=r, column=1).value = (
        "Elektronik (BSrE) Badan Siber dan Sandi Negara. Dokumen digital yang asli "
        "dapat diperoleh dengan memindai QR Code,"
    )
    ws.cell(row=r, column=1).font = F_SMALL
    ws.cell(row=r, column=1).alignment = ALIGN_CENTER

    r += 1
    ws.merge_cells(f"A{r}:{end_col_letter}{r}")
    ws.cell(row=r, column=1).value = (
        "memasukkan kode pada Aplikasi NDE Pemerintah Daerah Provinsi Jawa Barat, "
        "atau mengakses tautan berikut"
    )
    ws.cell(row=r, column=1).font = F_SMALL
    ws.cell(row=r, column=1).alignment = ALIGN_CENTER

    r += 1
    ws.merge_cells(f"A{r}:{end_col_letter}{r}")
    ws.cell(row=r, column=1).value = "https://sidebar.jabarprov.go.id/v/39E43028FA"
    ws.cell(row=r, column=1).font = Font(
        name=FONT_NAME, size=8, color="0000FF", underline="single"
    )
    ws.cell(row=r, column=1).alignment = ALIGN_CENTER

    r += 1
    ws.merge_cells(f"A{r}:{end_col_letter}{r}")
    ws.cell(row=r, column=1).value = "39E43028FA"
    ws.cell(row=r, column=1).font = F_SMALL
    ws.cell(row=r, column=1).alignment = ALIGN_CENTER
    return r


def write_tembusan(ws, start_row, end_col_letter):
    r = start_row
    ws.cell(row=r, column=1).value = "Tembusan disampaikan kepada:"
    ws.cell(row=r, column=1).font = F_NORM
    ws.cell(row=r, column=1).alignment = ALIGN_LEFT
    r += 1
    items = [
        "1. Yth. Pimpinan Instansi Pembina Jabatan Fungsional yang bersangkutan;",
        "2. Yth. Kepala Badan Kepegawaian Negara/Kepala Kantor Regional III BKN;",
        "3. Yth. Sekretaris Daerah Provinsi Jawa Barat;",
        "4. Yth. Kepala Dinas Pendidikan;",
        "5. Yth. ABDUL HADI HASANUDDIN, S.Pd..",
    ]
    for it in items:
        ws.cell(row=r, column=1).value = it
        ws.cell(row=r, column=1).font = F_NORM
        ws.cell(row=r, column=1).alignment = ALIGN_LEFT
        r += 1
    return r


def write_signature(ws, start_row, first_col, last_col):
    """Blok tanda tangan di sisi kanan."""
    r = start_row
    ws.cell(row=r, column=first_col).value = "Ditetapkan di Bandung"
    ws.cell(row=r, column=first_col).font = F_NORM
    ws.cell(row=r, column=first_col).alignment = ALIGN_LEFT
    r += 1
    ws.cell(row=r, column=first_col).value = "Pada tanggal 30 April 2025"
    ws.cell(row=r, column=first_col).font = F_NORM
    ws.cell(row=r, column=first_col).alignment = ALIGN_LEFT
    r += 2
    ws.cell(row=r, column=first_col).value = "Pejabat Penilai Kinerja"
    ws.cell(row=r, column=first_col).font = F_NORM
    ws.cell(row=r, column=first_col).alignment = ALIGN_LEFT
    r += 1
    ws.cell(row=r, column=first_col).value = "KEPALA SEKOLAH SMAN 1 CIGALONTANG"
    ws.cell(row=r, column=first_col).font = F_NORM
    ws.cell(row=r, column=first_col).alignment = ALIGN_LEFT
    r += 1
    ws.cell(row=r, column=first_col).value = "KABUPATEN TASIKMALAYA,"
    ws.cell(row=r, column=first_col).font = F_NORM
    ws.cell(row=r, column=first_col).alignment = ALIGN_LEFT
    r += 2
    ws.cell(row=r, column=first_col).value = "Ditandatangani secara elektronik oleh:"
    ws.cell(row=r, column=first_col).font = F_NORM
    ws.cell(row=r, column=first_col).alignment = ALIGN_LEFT
    r += 1
    ws.cell(row=r, column=first_col).value = "KEPALA SEKOLAH SMAN 1 CIGALONTANG"
    ws.cell(row=r, column=first_col).font = F_NORM
    ws.cell(row=r, column=first_col).alignment = ALIGN_LEFT
    r += 1
    ws.cell(row=r, column=first_col).value = "KABUPATEN TASIKMALAYA"
    ws.cell(row=r, column=first_col).font = F_NORM
    ws.cell(row=r, column=first_col).alignment = ALIGN_LEFT
    r += 2
    ws.cell(row=r, column=first_col).value = "Drs. ASEP SAEPUDIN, M.S.I"
    ws.cell(row=r, column=first_col).font = F_BOLD
    ws.cell(row=r, column=first_col).alignment = ALIGN_LEFT
    r += 1
    ws.cell(row=r, column=first_col).value = "Pembina TK.I"
    ws.cell(row=r, column=first_col).font = F_NORM
    ws.cell(row=r, column=first_col).alignment = ALIGN_LEFT
    return r


# ===================================================================
#                           SHEET 1
# ===================================================================
def build_sheet1(wb):
    ws = wb.active
    ws.title = "Konversi Predikat"
    set_f4_page(ws)

    # 8 kolom, end = H
    widths = [6, 10, 10, 16, 16, 16, 14, 14]
    set_col_widths(ws, widths)
    END = "H"

    write_letterhead(ws, END)

    # Judul dokumen
    r = 9
    ws.merge_cells(f"A{r}:{END}{r}")
    ws.cell(row=r, column=1).value = "KONVERSI PREDIKAT KINERJA KE ANGKA KREDIT"
    ws.cell(row=r, column=1).font = F_HEAD
    ws.cell(row=r, column=1).alignment = ALIGN_CENTER
    r += 1
    ws.merge_cells(f"A{r}:{END}{r}")
    ws.cell(row=r, column=1).value = "NOMOR: 218/KPG.03.03/SMAN1CGL"
    ws.cell(row=r, column=1).font = F_SUBTITLE
    ws.cell(row=r, column=1).alignment = ALIGN_CENTER

    # Instansi / Periode
    r += 2
    ws.merge_cells(f"A{r}:D{r}")
    ws.cell(row=r, column=1).value = "Instansi : Pemerintah Provinsi Jawa Barat"
    ws.cell(row=r, column=1).font = F_NORM
    ws.cell(row=r, column=1).alignment = ALIGN_LEFT

    ws.merge_cells(f"E{r}:{END}{r}")
    ws.cell(row=r, column=5).value = "Periode : 01-01-2024 s.d 31-12-2024"
    ws.cell(row=r, column=5).font = F_NORM
    ws.cell(row=r, column=5).alignment = ALIGN_RIGHT

    # Tabel PEJABAT FUNGSIONAL YANG DINILAI
    r += 2
    ws.merge_cells(f"A{r}:{END}{r}")
    c = ws.cell(row=r, column=1)
    c.value = "PEJABAT FUNGSIONAL YANG DINILAI"
    c.font = F_BOLD
    c.alignment = ALIGN_CENTER
    style_range(ws, f"A{r}:{END}{r}", font=F_BOLD, align=ALIGN_CENTER)

    data = [
        ("1", "NAMA", "ABDUL HADI HASANUDDIN, S.Pd."),
        ("2", "NIP", "199101182019031011"),
        ("3", "NOMOR SERI KARPEG", "B 03050388"),
        ("4", "TEMPAT/TGL. LAHIR", "TASIKMALAYA/18-01-1991"),
        ("5", "JENIS KELAMIN", "LAKI-LAKI"),
        ("6", "PANGKAT/GOLONGAN RUANG/TMT", "PENATA MUDA TK.I/III/b/01-08-2024"),
        ("7", "JABATAN/TMT", "GURU AHLI PERTAMA/01-03-2019"),
        ("8", "UNIT KERJA",
         "SMAN 1 CIGALONTANG KABUPATEN TASIKMALAYA SATUAN PENDIDIKAN "
         "KABUPATEN TASIKMALAYA CABANG PENDIDIKAN WILAYAH XII DINAS PENDIDIKAN"),
        ("9", "INSTANSI", "PEMERINTAH PROVINSI JAWA BARAT"),
    ]
    for no, label, val in data:
        r += 1
        ws.row_dimensions[r].height = 18
        ws.cell(row=r, column=1).value = no
        ws.cell(row=r, column=1).font = F_NORM
        ws.cell(row=r, column=1).alignment = ALIGN_CENTER

        ws.merge_cells(f"B{r}:C{r}")
        ws.cell(row=r, column=2).value = label
        ws.cell(row=r, column=2).font = F_NORM
        ws.cell(row=r, column=2).alignment = ALIGN_LEFT

        ws.cell(row=r, column=4).value = ":"
        ws.cell(row=r, column=4).font = F_NORM
        ws.cell(row=r, column=4).alignment = ALIGN_CENTER

        ws.merge_cells(f"E{r}:{END}{r}")
        ws.cell(row=r, column=5).value = val
        ws.cell(row=r, column=5).font = F_NORM
        ws.cell(row=r, column=5).alignment = ALIGN_LEFT
        if label == "UNIT KERJA":
            ws.row_dimensions[r].height = 54

        for col in range(1, 9):
            ws.cell(row=r, column=col).border = BORDER_ALL

    # Judul sub-tabel
    r += 1
    ws.merge_cells(f"A{r}:{END}{r}")
    c = ws.cell(row=r, column=1)
    c.value = "KONVERSI PREDIKAT KINERJA KE ANGKA KREDIT"
    c.font = F_BOLD
    c.alignment = ALIGN_CENTER
    style_range(ws, f"A{r}:{END}{r}", font=F_BOLD, align=ALIGN_CENTER)

    # Header tabel konversi
    r += 1
    ws.row_dimensions[r].height = 18
    ws.merge_cells(f"A{r}:C{r+1}")
    ws.cell(row=r, column=1).value = "Hasil Penilaian Kinerja"
    ws.merge_cells(f"D{r}:E{r+1}")
    ws.cell(row=r, column=4).value = "Koefisien per tahun"
    ws.merge_cells(f"F{r}:{END}{r+1}")
    ws.cell(row=r, column=6).value = "Angka Kredit yang didapat\n(Kolom 2 x kolom 3)"
    style_range(ws, f"A{r}:{END}{r+1}", font=F_BOLD, align=ALIGN_CENTER)

    r += 2
    ws.row_dimensions[r].height = 18
    ws.merge_cells(f"A{r}:B{r}")
    ws.cell(row=r, column=1).value = "PREDIKAT"
    ws.cell(row=r, column=3).value = "PROSENTASE"
    ws.merge_cells(f"D{r}:E{r}")
    ws.cell(row=r, column=4).value = ""
    ws.merge_cells(f"F{r}:{END}{r}")
    ws.cell(row=r, column=6).value = ""
    style_range(ws, f"A{r}:{END}{r}", font=F_BOLD, align=ALIGN_CENTER)

    # Kolom numerik 1..4
    r += 1
    ws.row_dimensions[r].height = 16
    ws.merge_cells(f"A{r}:B{r}")
    ws.cell(row=r, column=1).value = "1"
    ws.cell(row=r, column=3).value = "2"
    ws.merge_cells(f"D{r}:E{r}")
    ws.cell(row=r, column=4).value = "3"
    ws.merge_cells(f"F{r}:{END}{r}")
    ws.cell(row=r, column=6).value = "4"
    style_range(ws, f"A{r}:{END}{r}", font=F_BOLD, align=ALIGN_CENTER)

    # Data baris
    r += 1
    ws.row_dimensions[r].height = 18
    ws.merge_cells(f"A{r}:B{r}")
    ws.cell(row=r, column=1).value = "Sangat Baik"
    ws.cell(row=r, column=3).value = "150%"
    ws.merge_cells(f"D{r}:E{r}")
    ws.cell(row=r, column=4).value = 12.5
    ws.cell(row=r, column=4).number_format = "0.0"
    ws.merge_cells(f"F{r}:{END}{r}")
    # Formula: 150% * 12.5 = 18.750
    ws.cell(row=r, column=6).value = "=0.15*10*D{}".format(r)
    # Simpler and correct: =1.5 * 12.5 = 18.75
    ws.cell(row=r, column=6).value = "=1.5*D{}".format(r)
    ws.cell(row=r, column=6).number_format = "0.000"
    style_range(ws, f"A{r}:{END}{r}", font=F_NORM, align=ALIGN_CENTER)

    # Tanda tangan (kanan)
    r += 3
    sig_start = r
    write_signature(ws, sig_start, first_col=5, last_col=8)

    # Tembusan (kiri)
    tem_end = write_tembusan(ws, sig_start, END)

    # Pastikan footer setelah keduanya
    r_foot = max(tem_end, sig_start + 14) + 2
    write_footer(ws, r_foot, END)


# ===================================================================
#                           SHEET 2
# ===================================================================
def build_sheet2(wb):
    ws = wb.create_sheet("Akumulasi AK")
    set_f4_page(ws)

    widths = [6, 10, 12, 14, 14, 14, 14, 14]
    set_col_widths(ws, widths)
    END = "H"

    write_letterhead(ws, END)

    r = 9
    ws.merge_cells(f"A{r}:{END}{r}")
    ws.cell(row=r, column=1).value = "AKUMULASI ANGKA KREDIT"
    ws.cell(row=r, column=1).font = F_HEAD
    ws.cell(row=r, column=1).alignment = ALIGN_CENTER
    r += 1
    ws.merge_cells(f"A{r}:{END}{r}")
    ws.cell(row=r, column=1).value = "NOMOR: 219/KPG.03.03/SMAN1CGL"
    ws.cell(row=r, column=1).font = F_SUBTITLE
    ws.cell(row=r, column=1).alignment = ALIGN_CENTER

    r += 2
    ws.merge_cells(f"A{r}:D{r}")
    ws.cell(row=r, column=1).value = "Instansi : Pemerintah Provinsi Jawa Barat"
    ws.cell(row=r, column=1).font = F_NORM
    ws.cell(row=r, column=1).alignment = ALIGN_LEFT
    ws.merge_cells(f"E{r}:{END}{r}")
    ws.cell(row=r, column=5).value = "Masa Penilaian : 01-01-2024 s.d 31-12-2024"
    ws.cell(row=r, column=5).font = F_NORM
    ws.cell(row=r, column=5).alignment = ALIGN_RIGHT

    # I KETERANGAN PERORANGAN
    r += 2
    ws.cell(row=r, column=1).value = "I"
    ws.cell(row=r, column=1).font = F_BOLD
    ws.cell(row=r, column=1).alignment = ALIGN_CENTER
    ws.merge_cells(f"B{r}:{END}{r}")
    ws.cell(row=r, column=2).value = "KETERANGAN PERORANGAN"
    ws.cell(row=r, column=2).font = F_BOLD
    ws.cell(row=r, column=2).alignment = ALIGN_LEFT
    for col in range(1, 9):
        ws.cell(row=r, column=col).border = BORDER_ALL

    data = [
        ("1", "NAMA", "ABDUL HADI HASANUDDIN, S.Pd."),
        ("2", "NIP", "199101182019031011"),
        ("3", "NOMOR SERI KARPEG", "B 03050388"),
        ("4", "TEMPAT/TGL. LAHIR", "TASIKMALAYA/18-01-1991"),
        ("5", "JENIS KELAMIN", "LAKI-LAKI"),
        ("6", "PANGKAT/GOLONGAN RUANG/TMT", "PENATA MUDA TK.I/III/b/01-08-2024"),
        ("7", "JABATAN/TMT", "GURU AHLI PERTAMA/01-03-2019"),
        ("8", "UNIT KERJA",
         "SMAN 1 CIGALONTANG KABUPATEN TASIKMALAYA SATUAN PENDIDIKAN "
         "KABUPATEN TASIKMALAYA CABANG PENDIDIKAN WILAYAH XII DINAS PENDIDIKAN"),
        ("9", "INSTANSI", "PEMERINTAH PROVINSI JAWA BARAT"),
    ]
    for no, label, val in data:
        r += 1
        ws.row_dimensions[r].height = 18
        ws.cell(row=r, column=1).value = no
        ws.cell(row=r, column=1).font = F_NORM
        ws.cell(row=r, column=1).alignment = ALIGN_CENTER
        ws.merge_cells(f"B{r}:C{r}")
        ws.cell(row=r, column=2).value = label
        ws.cell(row=r, column=2).font = F_NORM
        ws.cell(row=r, column=2).alignment = ALIGN_LEFT
        ws.cell(row=r, column=4).value = ":"
        ws.cell(row=r, column=4).font = F_NORM
        ws.cell(row=r, column=4).alignment = ALIGN_CENTER
        ws.merge_cells(f"E{r}:{END}{r}")
        ws.cell(row=r, column=5).value = val
        ws.cell(row=r, column=5).font = F_NORM
        ws.cell(row=r, column=5).alignment = ALIGN_LEFT
        if label == "UNIT KERJA":
            ws.row_dimensions[r].height = 54
        for col in range(1, 9):
            ws.cell(row=r, column=col).border = BORDER_ALL

    # HASIL PENILAIAN ANGKA KREDIT (judul)
    r += 1
    ws.merge_cells(f"A{r}:{END}{r}")
    ws.cell(row=r, column=1).value = "HASIL PENILAIAN ANGKA KREDIT"
    ws.cell(row=r, column=1).font = F_BOLD
    ws.cell(row=r, column=1).alignment = ALIGN_CENTER
    style_range(ws, f"A{r}:{END}{r}", font=F_BOLD, align=ALIGN_CENTER)

    # Header tabel (2 baris)
    r += 1
    header_row1 = r
    ws.row_dimensions[r].height = 18
    ws.merge_cells(f"A{r}:D{r}")
    ws.cell(row=r, column=1).value = "HASIL PENILAIAN KINERJA"
    ws.merge_cells(f"E{r}:F{r+1}")
    ws.cell(row=r, column=5).value = "KOEFISIEN PER TAHUN"
    ws.merge_cells(f"G{r}:H{r+1}")
    ws.cell(row=r, column=7).value = "ANGKA KREDIT YANG DIDAPAT"

    r += 1
    ws.row_dimensions[r].height = 28
    ws.cell(row=r, column=1).value = "TAHUN"
    ws.merge_cells(f"B{r}:B{r}")
    ws.cell(row=r, column=2).value = "PERIODIK (BULAN)"
    ws.cell(row=r, column=3).value = "PREDIKAT"
    ws.cell(row=r, column=4).value = "PROSENTASE"
    style_range(ws, f"A{header_row1}:{END}{r}", font=F_BOLD, align=ALIGN_CENTER)

    # Baris nomor kolom 1..6
    r += 1
    ws.row_dimensions[r].height = 16
    ws.cell(row=r, column=1).value = "1"
    ws.cell(row=r, column=2).value = "2"
    ws.cell(row=r, column=3).value = "3"
    ws.cell(row=r, column=4).value = "4"
    ws.merge_cells(f"E{r}:F{r}")
    ws.cell(row=r, column=5).value = "5"
    ws.merge_cells(f"G{r}:H{r}")
    ws.cell(row=r, column=7).value = "6"
    style_range(ws, f"A{r}:{END}{r}", font=F_BOLD, align=ALIGN_CENTER)

    # Data
    rows_data = [
        ("2023", "Maret - April", "-", "-", 12.5, 47.000),
        ("2023", "Juli - Desember", "Sangat Baik", "150%", 12.5, 9.375),
        ("2024", "Januari - Desember", "Sangat Baik", "150%", 12.5, 18.750),
    ]
    for row in rows_data:
        r += 1
        ws.row_dimensions[r].height = 20
        ws.cell(row=r, column=1).value = row[0]
        ws.cell(row=r, column=2).value = row[1]
        ws.cell(row=r, column=3).value = row[2]
        ws.cell(row=r, column=4).value = row[3]
        ws.merge_cells(f"E{r}:F{r}")
        ws.cell(row=r, column=5).value = row[4]
        ws.cell(row=r, column=5).number_format = "0.0"
        ws.merge_cells(f"G{r}:H{r}")
        ws.cell(row=r, column=7).value = row[5]
        ws.cell(row=r, column=7).number_format = "0.000"
        style_range(ws, f"A{r}:{END}{r}", font=F_NORM, align=ALIGN_CENTER)

    # JUMLAH
    r += 1
    ws.row_dimensions[r].height = 20
    ws.merge_cells(f"A{r}:F{r}")
    ws.cell(row=r, column=1).value = "JUMLAH ANGKA KREDIT YANG DIPEROLEH"
    ws.cell(row=r, column=1).font = F_BOLD
    ws.cell(row=r, column=1).alignment = ALIGN_CENTER
    ws.merge_cells(f"G{r}:H{r}")
    ws.cell(row=r, column=7).value = "=SUM(G{}:G{})".format(r - 3, r - 1)
    ws.cell(row=r, column=7).number_format = "0.000"
    ws.cell(row=r, column=7).font = F_BOLD
    ws.cell(row=r, column=7).alignment = ALIGN_CENTER
    for col in range(1, 9):
        ws.cell(row=r, column=col).border = BORDER_ALL

    r += 3
    sig_start = r
    write_signature(ws, sig_start, first_col=5, last_col=8)
    tem_end = write_tembusan(ws, sig_start, END)
    r_foot = max(tem_end, sig_start + 14) + 2
    write_footer(ws, r_foot, END)


# ===================================================================
#                           SHEET 3
# ===================================================================
def build_sheet3(wb):
    ws = wb.create_sheet("Penetapan AK")
    set_f4_page(ws)

    widths = [4, 6, 24, 12, 12, 12, 14, 14]
    set_col_widths(ws, widths)
    END = "H"

    write_letterhead(ws, END)

    r = 9
    ws.merge_cells(f"A{r}:{END}{r}")
    ws.cell(row=r, column=1).value = "PENETAPAN ANGKA KREDIT"
    ws.cell(row=r, column=1).font = F_HEAD
    ws.cell(row=r, column=1).alignment = ALIGN_CENTER
    r += 1
    ws.merge_cells(f"A{r}:{END}{r}")
    ws.cell(row=r, column=1).value = "NOMOR: 220/KPG.03.03/SMAN1CGL"
    ws.cell(row=r, column=1).font = F_SUBTITLE
    ws.cell(row=r, column=1).alignment = ALIGN_CENTER

    r += 2
    ws.merge_cells(f"A{r}:D{r}")
    ws.cell(row=r, column=1).value = "Instansi : Pemerintah Provinsi Jawa Barat"
    ws.cell(row=r, column=1).font = F_NORM
    ws.cell(row=r, column=1).alignment = ALIGN_LEFT
    ws.merge_cells(f"E{r}:{END}{r}")
    ws.cell(row=r, column=5).value = "Masa Penilaian : 01-01-2024 s.d 31-12-2024"
    ws.cell(row=r, column=5).font = F_NORM
    ws.cell(row=r, column=5).alignment = ALIGN_RIGHT

    # I KETERANGAN PERORANGAN
    r += 2
    ws.cell(row=r, column=1).value = "I"
    ws.cell(row=r, column=1).font = F_BOLD
    ws.cell(row=r, column=1).alignment = ALIGN_CENTER
    ws.merge_cells(f"B{r}:{END}{r}")
    ws.cell(row=r, column=2).value = "KETERANGAN PERORANGAN"
    ws.cell(row=r, column=2).font = F_BOLD
    ws.cell(row=r, column=2).alignment = ALIGN_LEFT
    for col in range(1, 9):
        ws.cell(row=r, column=col).border = BORDER_ALL

    data = [
        ("1", "NAMA", "ABDUL HADI HASANUDDIN, S.Pd."),
        ("2", "NIP", "199101182019031011"),
        ("3", "NOMOR SERI KARPEG", "B 03050388"),
        ("4", "TEMPAT/TANGGAL LAHIR", "TASIKMALAYA/18-01-1991"),
        ("5", "JENIS KELAMIN", "LAKI-LAKI"),
        ("6", "PANGKAT/GOLONGAN RUANG/TMT", "PENATA MUDA TK.I/III/b/01-08-2024"),
        ("7", "JABATAN/TMT", "GURU AHLI PERTAMA/01-03-2019"),
        ("8", "UNIT KERJA",
         "SMAN 1 CIGALONTANG KABUPATEN TASIKMALAYA SATUAN PENDIDIKAN "
         "KABUPATEN TASIKMALAYA CABANG PENDIDIKAN WILAYAH XII DINAS PENDIDIKAN"),
        ("9", "INSTANSI", "PEMERINTAH PROVINSI JAWA BARAT"),
    ]
    for no, label, val in data:
        r += 1
        ws.row_dimensions[r].height = 18
        ws.cell(row=r, column=1).value = ""
        ws.cell(row=r, column=2).value = no
        ws.cell(row=r, column=2).font = F_NORM
        ws.cell(row=r, column=2).alignment = ALIGN_CENTER
        ws.cell(row=r, column=3).value = label
        ws.cell(row=r, column=3).font = F_NORM
        ws.cell(row=r, column=3).alignment = ALIGN_LEFT
        ws.merge_cells(f"D{r}:{END}{r}")
        ws.cell(row=r, column=4).value = val
        ws.cell(row=r, column=4).font = F_NORM
        ws.cell(row=r, column=4).alignment = ALIGN_LEFT
        if label == "UNIT KERJA":
            ws.row_dimensions[r].height = 54
        for col in range(1, 9):
            ws.cell(row=r, column=col).border = BORDER_ALL

    # HASIL PENILAIAN ANGKA KREDIT (judul)
    r += 1
    ws.merge_cells(f"A{r}:{END}{r}")
    ws.cell(row=r, column=1).value = "HASIL PENILAIAN ANGKA KREDIT"
    ws.cell(row=r, column=1).font = F_BOLD
    ws.cell(row=r, column=1).alignment = ALIGN_CENTER
    style_range(ws, f"A{r}:{END}{r}", font=F_BOLD, align=ALIGN_CENTER)

    # Header II
    r += 1
    ws.row_dimensions[r].height = 20
    ws.cell(row=r, column=1).value = "II"
    ws.merge_cells(f"B{r}:C{r}")
    ws.cell(row=r, column=2).value = "PENETAPAN ANGKA KREDIT"
    ws.cell(row=r, column=4).value = "LAMA"
    ws.cell(row=r, column=5).value = "BARU"
    ws.cell(row=r, column=6).value = "JUMLAH"
    ws.merge_cells(f"G{r}:{END}{r}")
    ws.cell(row=r, column=7).value = "KETERANGAN"
    style_range(ws, f"A{r}:{END}{r}", font=F_BOLD, align=ALIGN_CENTER)

    # Nomor kolom 1..6
    r += 1
    ws.row_dimensions[r].height = 16
    ws.cell(row=r, column=1).value = "1"
    ws.merge_cells(f"B{r}:C{r}")
    ws.cell(row=r, column=2).value = "2"
    ws.cell(row=r, column=4).value = "3"
    ws.cell(row=r, column=5).value = "4"
    ws.cell(row=r, column=6).value = "5"
    ws.merge_cells(f"G{r}:{END}{r}")
    ws.cell(row=r, column=7).value = "6"
    style_range(ws, f"A{r}:{END}{r}", font=F_BOLD, align=ALIGN_CENTER)

    # Data baris (isi penetapan)
    pen_rows = [
        ("1", "AK DASAR YANG DIBERIKAN", 50.000, None, 50.000, "-"),
        ("2", "AK JF LAMA", None, None, None, "-"),
        ("3", "AK PENYESUAIAN/ PENYETARAAN", None, None, None, "-"),
        ("4", "AK KONVERSI", None, 25.125, 25.125, "-"),
        ("5", "AK YANG DIPEROLEH DARI PENINGKATAN PENDIDIKAN", None, None, None, "-"),
        ("6", "….….. **)", None, None, None, "-"),
    ]
    first_data_row = r + 1
    for no, label, lama, baru, jum, ket in pen_rows:
        r += 1
        ws.row_dimensions[r].height = 20
        ws.cell(row=r, column=1).value = no
        ws.merge_cells(f"B{r}:C{r}")
        ws.cell(row=r, column=2).value = label
        ws.cell(row=r, column=2).alignment = ALIGN_LEFT
        ws.cell(row=r, column=4).value = lama if lama is not None else "-"
        ws.cell(row=r, column=5).value = baru if baru is not None else "-"
        # Jumlah = Lama + Baru (pakai formula)
        if lama is not None or baru is not None:
            ws.cell(row=r, column=6).value = (
                "=IFERROR(IF(AND(ISNUMBER(D{0}),ISNUMBER(E{0})),D{0}+E{0},"
                "IF(ISNUMBER(D{0}),D{0},IF(ISNUMBER(E{0}),E{0},\"-\"))),\"-\")"
            ).format(r)
        else:
            ws.cell(row=r, column=6).value = "-"
        ws.cell(row=r, column=4).number_format = "0.000"
        ws.cell(row=r, column=5).number_format = "0.000"
        ws.cell(row=r, column=6).number_format = "0.000"
        ws.merge_cells(f"G{r}:{END}{r}")
        ws.cell(row=r, column=7).value = ket
        style_range(ws, f"A{r}:{END}{r}", font=F_NORM, align=ALIGN_CENTER)
        ws.cell(row=r, column=2).alignment = ALIGN_LEFT
    last_data_row = r

    # JUMLAH ANGKA KREDIT KUMULATIF
    r += 1
    ws.row_dimensions[r].height = 22
    ws.merge_cells(f"A{r}:C{r}")
    ws.cell(row=r, column=1).value = "JUMLAH ANGKA KREDIT KUMULATIF"
    ws.cell(row=r, column=4).value = "=SUMIF(D{}:D{},\">0\")".format(first_data_row, last_data_row)
    ws.cell(row=r, column=5).value = "=SUMIF(E{}:E{},\">0\")".format(first_data_row, last_data_row)
    ws.cell(row=r, column=6).value = "=D{0}+E{0}".format(r)
    ws.cell(row=r, column=4).number_format = "0.000"
    ws.cell(row=r, column=5).number_format = "0.000"
    ws.cell(row=r, column=6).number_format = "0.000"
    ws.merge_cells(f"G{r}:{END}{r}")
    ws.cell(row=r, column=7).value = ""
    style_range(ws, f"A{r}:{END}{r}", font=F_BOLD, align=ALIGN_CENTER)

    # KETERANGAN  |  PANGKAT  |  JENJANG JABATAN
    r += 1
    ws.row_dimensions[r].height = 20
    ws.merge_cells(f"A{r}:C{r}")
    ws.cell(row=r, column=1).value = "KETERANGAN"
    ws.merge_cells(f"D{r}:E{r}")
    ws.cell(row=r, column=4).value = "PANGKAT"
    ws.merge_cells(f"F{r}:{END}{r}")
    ws.cell(row=r, column=6).value = "JENJANG JABATAN"
    style_range(ws, f"A{r}:{END}{r}", font=F_BOLD, align=ALIGN_CENTER)

    # Angka kredit minimal
    r += 1
    ws.row_dimensions[r].height = 34
    ws.merge_cells(f"A{r}:C{r}")
    ws.cell(row=r, column=1).value = (
        "ANGKA KREDIT MINIMAL YANG HARUS DIPENUHI UNTUK KENAIKAN PANGKAT/ JENJANG"
    )
    ws.cell(row=r, column=1).alignment = ALIGN_LEFT
    ws.merge_cells(f"D{r}:E{r}")
    ws.cell(row=r, column=4).value = 50.000
    ws.cell(row=r, column=4).number_format = "0.000"
    ws.merge_cells(f"F{r}:{END}{r}")
    ws.cell(row=r, column=6).value = 100.000
    ws.cell(row=r, column=6).number_format = "0.000"
    style_range(ws, f"A{r}:{END}{r}", font=F_NORM, align=ALIGN_CENTER)
    ws.cell(row=r, column=1).alignment = ALIGN_LEFT

    # Kekurangan untuk kenaikan pangkat
    r += 1
    row_pangkat = r
    ws.row_dimensions[r].height = 22
    ws.merge_cells(f"A{r}:C{r}")
    ws.cell(row=r, column=1).value = "KEKURANGAN ANGKA KREDIT YANG HARUS DICAPAI UNTUK KENAIKAN PANGKAT"
    ws.cell(row=r, column=1).alignment = ALIGN_LEFT

    # Kekurangan untuk kenaikan jenjang
    r += 1
    row_jenjang = r
    ws.row_dimensions[r].height = 22
    ws.merge_cells(f"A{r}:C{r}")
    ws.cell(row=r, column=1).value = "KEKURANGAN ANGKA KREDIT YANG HARUS DICAPAI UNTUK KENAIKAN JENJANG"
    ws.cell(row=r, column=1).alignment = ALIGN_LEFT

    # Merge kolom D-E dan F-H lintas 2 baris untuk nilai 24.875
    ws.merge_cells(f"D{row_pangkat}:E{row_jenjang}")
    ws.cell(row=row_pangkat, column=4).value = 24.875
    ws.cell(row=row_pangkat, column=4).number_format = "0.000"
    ws.merge_cells(f"F{row_pangkat}:{END}{row_jenjang}")
    ws.cell(row=row_pangkat, column=6).value = 24.875
    ws.cell(row=row_pangkat, column=6).number_format = "0.000"
    style_range(ws, f"A{row_pangkat}:{END}{row_jenjang}", font=F_NORM, align=ALIGN_CENTER)
    ws.cell(row=row_pangkat, column=1).alignment = ALIGN_LEFT
    ws.cell(row=row_jenjang, column=1).alignment = ALIGN_LEFT

    # Kalimat tidak dapat dipertimbangkan
    r = row_jenjang + 1
    ws.row_dimensions[r].height = 32
    ws.merge_cells(f"A{r}:{END}{r}")
    ws.cell(row=r, column=1).value = (
        "TIDAK DAPAT DIPERTIMBANGKAN UNTUK KENAIKAN PANGKAT SETINGKAT LEBIH TINGGI "
        "MENJADI GURU AHLI MUDA PANGKAT/GOLONGAN RUANG PENATA (III/c)."
    )
    ws.cell(row=r, column=1).font = F_NORM
    ws.cell(row=r, column=1).alignment = ALIGN_LEFT
    style_range(ws, f"A{r}:{END}{r}", font=F_NORM, align=ALIGN_LEFT)

    # ASLI + tanda tangan + tembusan
    r += 2
    sig_start = r
    ws.cell(row=r, column=1).value = "ASLI Penetapan Angka Kredit untuk:"
    ws.cell(row=r, column=1).font = F_BOLD
    ws.cell(row=r, column=1).alignment = ALIGN_LEFT
    r += 1
    ws.cell(row=r, column=1).value = "ABDUL HADI HASANUDDIN, S.Pd."
    ws.cell(row=r, column=1).font = F_NORM
    ws.cell(row=r, column=1).alignment = ALIGN_LEFT
    r += 2
    tembusan3 = [
        "Tembusan disampaikan kepada:",
        "1. Yth. Pimpinan Instansi Pembina Jabatan Fungsional yang bersangkutan;",
        "2. Yth. Kepala Badan Kepegawaian Negara/Kepala Kantor Regional III BKN;",
        "3. Yth. Sekretaris Daerah Provinsi Jawa Barat;",
        "4. Yth. Kepala Dinas Pendidikan;",
        "5. Yth. Sekretariat Tim Penilai Kinerja PNS Pemerintah Provinsi Jawa Barat.",
    ]
    for it in tembusan3:
        ws.cell(row=r, column=1).value = it
        ws.cell(row=r, column=1).font = F_NORM
        ws.cell(row=r, column=1).alignment = ALIGN_LEFT
        r += 1
    tem_end = r

    # Signature column kanan mulai dari sig_start
    write_signature(ws, sig_start, first_col=5, last_col=8)

    r_foot = max(tem_end, sig_start + 14) + 2
    write_footer(ws, r_foot, END)


def main():
    wb = Workbook()
    build_sheet1(wb)
    build_sheet2(wb)
    build_sheet3(wb)

    out = "/sessions/trusting-funny-volta/mnt/outputs/PAK_199101182019031011.xlsx"
    wb.save(out)
    print("Saved:", out)


if __name__ == "__main__":
    main()
