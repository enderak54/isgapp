@echo off
REM ISGAPP — Windows 10/11 cift tik kurulum
REM Git Bash gerektirir (Git for Windows ile gelir)
REM Kullanim: install.bat cift tik veya komut satirindan

setlocal

REM Git Bash ara
set "BASH_EXE=C:\Program Files\Git\bin\bash.exe"
if not exist "%BASH_EXE%" set "BASH_EXE=C:\Program Files (x86)\Git\bin\bash.exe"
if not exist "%BASH_EXE%" (
    echo HATA: Git Bash bulunamadi.
    echo Lutfen Git for Windows kurun: https://gitforwindows.org/
    echo Kurulumdan sonra bu dosyayi tekrar cift tiklayin.
    pause
    exit /b 1
)

REM install.sh var mi? (zip paketi icinde)
if exist "%~dp0install.sh" (
    echo install.sh bulundu — kurulum baslatiliyor...
    "%BASH_EXE%" -lc "cd \"$(cygpath '%~dp0')\" && sh install.sh"
    goto :end
)

REM Repo kokunde miyiz?
if exist "%~dp0self-host\kur.sh" (
    echo self-host/kur.sh bulundu — kurulum baslatiliyor...
    "%BASH_EXE%" -lc "cd \"$(cygpath '%~dp0')\" && sh self-host/kur.sh"
    goto :end
)

REM Hicbiri yoksa — GitHub'dan cek
echo GitHub'dan indiriliyor...
"%BASH_EXE%" -lc "curl -fsSL https://raw.githubusercontent.com/enderak54/isgapp/main/install.sh | sh"
if errorlevel 1 (
    echo HATA: Kurulum basarisiz. Lutfen Git Bash'i acip manuel calistirin:
    echo   sh install.sh
    pause
    exit /b 1
)

:end
echo.
echo Kurulum tamamlandi. Kapatmak icin bir tusa basin.
pause
