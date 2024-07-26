@echo off
title Starting Node.js Application Setup

:: Ensure we are in the script's directory
cd /d "%~dp0"

:: Check if .env file exists in the script's directory, if not create it and prompt for values
IF NOT EXIST "%~dp0.env" (
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
    set /p DEV="Enter DEV: "
    set /p DEBUG="Enter DEBUG: "

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
    ) > "%~dp0.env"

    echo .env file created.
) ELSE (
    echo .env file already exists.
)

:: Set the paths
set SCRIPT_PATH=%~dp0start-application.bat
set ICON_PATH=%~dp0favicon.ico

:: Create a shortcut with a custom icon using the VBS script
cscript //nologo create-shortcut.vbs "%SCRIPT_PATH%" "%ICON_PATH%"
set exitcode=%ERRORLEVEL%

:: If the shortcut already exists, start the Node.js application
IF %exitcode% EQU 0 (
    cd /d "%~dp0"
    powershell -Command "Start-Process 'http://localhost:3000'"
    node app.js
) ELSE (
    echo Shortcut created. Please use the shortcut to start the application.
)

:: Keep the command prompt open
pause
