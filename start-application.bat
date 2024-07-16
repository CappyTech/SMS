@echo off

:: Check if Node.js is installed
where node >nul 2>nul
IF %ERRORLEVEL% EQU 0 (
    echo Node.js is already installed.
) ELSE (
    echo Node.js is not installed.
    echo Downloading and installing Node.js...

    :: Download Node.js installer using PowerShell
    powershell -Command "Invoke-WebRequest -Uri https://nodejs.org/dist/v18.16.0/node-v18.16.0-x64.msi -OutFile nodejs.msi"

    :: Install Node.js silently
    msiexec /i nodejs.msi /quiet

    :: Clean up installer
    del nodejs.msi

    echo Node.js installation complete.
)

:: Run npm install
echo Running npm install...
npm install
IF %ERRORLEVEL% NEQ 0 (
    echo npm install failed. Please check for errors.
    pause
    exit /b
)

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

:: Start the Node.js application
cd /d "%~dp0"
powershell -Command "Start-Process 'http://localhost:3000'"
node app.js

:: Keep the command prompt open
pause
