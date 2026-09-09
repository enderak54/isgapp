@echo off
REM ISGAPP tek-tik guncelleme — C: / D: otomatik tespit (Windows)
REM Kullanim:  guncelle.bat  veya  guncelle.bat --dry-run
setlocal enabledelayedexpansion

set "FOUND="

REM Aday konumlar
for %%D in (
  "%~dp0"
  "%~dp0isgapp"
  "C:\isgapp"
  "D:\isgapp"
  "E:\isgapp"
  "%USERPROFILE%\isgapp"
  "C:\Users\%USERNAME%\isgapp"
  "D:\Users\%USERNAME%\isgapp"
) do (
  if exist "%%~D\self-host\update.sh" (
    set "FOUND=%%~D"
    goto :found
  )
)

REM Git Bash mount yollari da kontrol et (Git Bash icinden cagirilirsa)
if exist "C:\isgapp\self-host\update.sh" set "FOUND=C:\isgapp" & goto :found
if exist "D:\isgapp\self-host\update.sh" set "FOUND=D:\isgapp" & goto :found

:found
if "%FOUND%"=="" (
  echo HATA: isgapp bulunamadi.
  echo Aranan: C:\isgapp\self-host\update.sh ve D:\isgapp\self-host\update.sh
  pause
  exit /b 1
)

echo ==^> isgapp bulundu: %FOUND%
echo ==^> guncelleme baslatiliyor...

REM Git Bash ile update.sh calistir (Git kurulu olmali)
where bash >nul 2>nul
if %ERRORLEVEL%==0 (
  bash -c "cd ""%FOUND%/self-host"" && sh update.sh %*"
) else (
  echo HATA: bash bulunamadi. Git for Windows kurulu olmali.
  pause
  exit /b 1
)

pause
