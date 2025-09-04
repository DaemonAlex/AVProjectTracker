@echo off
echo ========================================
echo APEX Platform Rollback Utility
echo ========================================
echo.

echo Available backups:
echo.
dir /B APEX_Platform_v*_BACKUP.html 2>nul
if errorlevel 1 (
    echo No backups found!
    echo.
    echo To create a backup, run:
    echo   cp "APEX Platform.html" "APEX_Platform_v1.X_$(date +%%Y%%m%%d_%%H%%M%%S)_BACKUP.html"
    pause
    exit /b 1
)

echo.
echo Choose rollback option:
echo 1. Quick rollback to most recent backup
echo 2. Choose specific backup file
echo 3. Exit without changes
echo.
set /p choice="Enter choice (1-3): "

if "%choice%"=="1" (
    echo.
    echo Finding most recent backup...
    for /f "delims=" %%f in ('dir /B /O-D APEX_Platform_v*_BACKUP.html 2^>nul') do (
        set newest=%%f
        goto :found
    )
    :found
    if defined newest (
        echo Most recent backup: %newest%
        echo.
        set /p confirm="Restore this backup? (y/N): "
        if /i "%confirm%"=="y" (
            copy "%newest%" "APEX Platform.html"
            echo.
            echo ✅ Rollback completed successfully!
            echo Current version restored from: %newest%
        ) else (
            echo Rollback cancelled.
        )
    ) else (
        echo No backup files found.
    )
)

if "%choice%"=="2" (
    echo.
    echo Available backup files:
    echo.
    set count=0
    for %%f in (APEX_Platform_v*_BACKUP.html) do (
        set /a count+=1
        echo !count!. %%f
        set file!count!=%%f
    )
    echo.
    set /p filenum="Enter file number: "
    call echo Selected: %%file%filenum%%%
    set /p confirm="Restore this backup? (y/N): "
    if /i "%confirm%"=="y" (
        call copy "%%file%filenum%%%" "APEX Platform.html"
        echo.
        echo ✅ Rollback completed successfully!
    ) else (
        echo Rollback cancelled.
    )
)

if "%choice%"=="3" (
    echo Exiting without changes.
)

echo.
pause