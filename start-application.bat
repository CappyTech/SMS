@echo off
:: Check if the script is running with administrator privileges
openfiles >nul 2>&1
if %errorlevel% neq 0 (
    echo This script requires Administrator privileges.
    echo Please wait while we attempt to restart it with elevated permissions...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo Running with administrator privileges...

:: Check if .env file exists, if not create it
IF NOT EXIST .env (
    echo .env file not found. Creating .env file...

    set /p DB_HOST="Enter DB_HOST: "
    set /p DB_USER="Enter DB_USER: "
    set /p DB_PASSWORD="Enter DB_PASSWORD: "
    set /p DB_DATABASE="Enter DB_DATABASE: "
    set /p DB_PORT="Enter DB_PORT (default 3306): "
    if "%DB_PORT%"=="" set DB_PORT=3306
    set /p SESSION_SECRET="Enter SESSION_SECRET: "
    set /p INCORPORATION_YEAR="Enter INCORPORATION_YEAR: "
    set /p ADMIN_PASSWORD="Enter ADMIN_PASSWORD: "
    set /p ADMIN_USERNAME="Enter ADMIN_USERNAME: "
    set /p ADMIN_EMAIL="Enter ADMIN_EMAIL: "
    set /p DEV="Enter DEV: <meant to be empty - press enter>"
    set /p DEBUG="Enter DEBUG: <meant to be empty - press enter>"

    echo Writing to .env file...
    (
        echo DB_HOST=%DB_HOST%
        echo DB_USER=%DB_USER%
        echo DB_PASSWORD=%DB_PASSWORD%
        echo DB_DATABASE=%DB_DATABASE%
        echo DB_PORT=%DB_PORT%
        echo SESSION_SECRET=%SESSION_SECRET%
        echo INCORPORATION_YEAR=%INCORPORATION_YEAR%
        echo ADMIN_PASSWORD=%ADMIN_PASSWORD%
        echo ADMIN_USERNAME=%ADMIN_USERNAME%
        echo ADMIN_EMAIL=%ADMIN_EMAIL%
        echo DEV=%DEV%
        echo DEBUG=%DEBUG%
    ) > .env

    echo .env file created.
) ELSE (
    echo .env file already exists.
)

setlocal enabledelayedexpansion

REM Get the current date and time for the backup filename
for /f "tokens=1-5 delims=/: " %%d in ("%date% %time%") do (
    set backupDate=%%d-%%e-%%f
    set backupTime=%%g-%%h-%%i
)
set BACKUP_FILE=%SystemRoot%\System32\drivers\etc\hosts_%backupDate%_%backupTime%.bak

set HOSTS_FILE=%SystemRoot%\System32\drivers\etc\hosts
set HOST_ENTRY=127.0.0.1 localhost

REM Backup the existing hosts file
copy "%HOSTS_FILE%" "%BACKUP_FILE%"
if %errorlevel% neq 0 (
    echo Failed to create a backup of the hosts file.
    echo Please make sure you run this script as an administrator.
    pause
    exit /b 1
) else (
    echo Backup of the hosts file created successfully: %BACKUP_FILE%
)

REM Check if the HOST_ENTRY is already in the hosts file
echo Checking if the entry "%HOST_ENTRY%" exists in the hosts file...
findstr /C:"%HOST_ENTRY%" "%HOSTS_FILE%" >nul
if %errorlevel% equ 0 (
    echo The entry "%HOST_ENTRY%" already exists in the hosts file.
) else (
    echo The entry "%HOST_ENTRY%" does not exist. Adding it now...
    echo %HOST_ENTRY% >> "%HOSTS_FILE%"
    if %errorlevel% equ 0 (
        echo Entry added successfully.
    ) else (
        echo Failed to add the entry. Please make sure you run this script as an administrator.
    )
)

endlocal

:: Start the Node.js application
cd /d "%~dp0"
powershell -Command "Start-Process 'http://localhost'"
node app.js

:: Keep the command prompt open
pause