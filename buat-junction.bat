@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
title Pemindahan BK-Cigalontang + Pembuatan Junction

REM ============================================================
REM  Skrip finalisasi pemindahan C:\BK-Cigalontang -> D:\Claude\BK-Cigalontang
REM  Membuat Directory Junction supaya path lama (C:\BK-Cigalontang)
REM  tetap berfungsi untuk VS Code / Visual Studio / tool lain.
REM  JALANKAN SEBAGAI ADMINISTRATOR.
REM ============================================================

set "SRC=C:\BK-Cigalontang"
set "DST=D:\Claude\BK-Cigalontang"

echo.
echo ================================================================
echo   Finalisasi Pemindahan BK-Cigalontang
echo ================================================================
echo.
echo   Folder lama : %SRC%
echo   Folder baru : %DST%
echo.

REM --- Cek hak administrator ---
net session >nul 2>&1
if %errorlevel% NEQ 0 (
    echo [ERROR] Skrip ini harus dijalankan sebagai Administrator.
    echo        Klik kanan file ini -^> "Run as administrator".
    echo.
    pause
    exit /b 1
)
echo [OK]   Dijalankan sebagai Administrator.

REM --- Cek folder tujuan sudah ada ---
if not exist "%DST%\" (
    echo [ERROR] Folder tujuan %DST% tidak ditemukan.
    echo        Pastikan Claude sudah menyelesaikan proses copy.
    echo.
    pause
    exit /b 1
)
echo [OK]   Folder tujuan %DST% ada.

REM --- Cek file kunci di tujuan ---
if not exist "%DST%\CLAUDE.md" (
    echo [ERROR] File kunci CLAUDE.md tidak ada di %DST%.
    echo        Copy mungkin tidak lengkap. Batalkan untuk keamanan.
    echo.
    pause
    exit /b 1
)
if not exist "%DST%\package.json" (
    echo [ERROR] File kunci package.json tidak ada di %DST%.
    echo.
    pause
    exit /b 1
)
echo [OK]   File kunci (CLAUDE.md, package.json) terverifikasi.

REM --- Cek apakah SRC sudah berupa junction / reparse point ---
dir "C:\" /AL 2>nul | findstr /I "BK-Cigalontang" >nul
if %errorlevel% EQU 0 (
    echo [INFO] %SRC% sudah berupa junction/link. Akan dihapus dan dibuat ulang.
)

echo.
echo ================================================================
echo   PERINGATAN: Folder %SRC% akan DIHAPUS, lalu diganti junction.
echo   Tutup VS Code, Visual Studio, dan terminal yang sedang
echo   berada di dalam folder tersebut sebelum lanjut.
echo ================================================================
echo.
set /p KONFIRMASI="Ketik YA untuk lanjutkan: "
if /I NOT "%KONFIRMASI%"=="YA" (
    echo Dibatalkan.
    pause
    exit /b 0
)

REM --- Bersihkan file tmp leftover rsync di tujuan (opsional, aman) ---
echo.
echo [*] Membersihkan file tmp rsync di %DST% (jika ada)...
if exist "%DST%\node_modules\codepage\dist\.cpexcel.full.js.*" del /F /Q "%DST%\node_modules\codepage\dist\.cpexcel.full.js.*" >nul 2>&1
if exist "%DST%\node_modules\xlsx\dist\.cpexcel.js.*"          del /F /Q "%DST%\node_modules\xlsx\dist\.cpexcel.js.*" >nul 2>&1

REM --- Hapus folder asli ---
echo [*] Menghapus %SRC% ...
rd /s /q "%SRC%"
if exist "%SRC%\" (
    echo [ERROR] Gagal menghapus %SRC%. Masih ada proses yang menggunakannya.
    echo        Tutup semua aplikasi yang membuka folder tersebut, lalu coba lagi.
    pause
    exit /b 1
)
echo [OK]   Folder lama terhapus.

REM --- Buat junction ---
echo [*] Membuat junction %SRC% -^> %DST% ...
mklink /J "%SRC%" "%DST%"
if %errorlevel% NEQ 0 (
    echo [ERROR] Gagal membuat junction.
    pause
    exit /b 1
)

REM --- Verifikasi ---
echo.
echo [*] Verifikasi junction:
dir "C:\" /AL | findstr /I "BK-Cigalontang"
echo.
if exist "%SRC%\CLAUDE.md" (
    echo [OK]   Junction berfungsi. CLAUDE.md dapat diakses via %SRC%.
) else (
    echo [WARN] Junction tampaknya tidak berfungsi.
)

echo.
echo ================================================================
echo   SELESAI.
echo   - File asli ada di : %DST%
echo   - Path lama        : %SRC%  (junction, transparan untuk VS Code)
echo   - Anda bisa membuka VS Code lewat salah satu path,
echo     keduanya menunjuk ke data yang sama.
echo ================================================================
echo.
pause
exit /b 0
