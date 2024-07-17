@echo off
setlocal

:: Check if Node.js is installed
where node >nul 2>nul
IF %ERRORLEVEL% EQU 0 (
    echo Node.js is already installed.
) ELSE (
    echo Node.js is not installed.
    echo Downloading and installing Node.js...

    :: Download Node.js installer using PowerShell
    powershell -Command "Invoke-WebRequest -Uri https://nodejs.org/dist/v18.16.0/node-v18.16.0-x64.msi -OutFile nodejs.msi"
    IF %ERRORLEVEL% NEQ 0 (
        echo Failed to download Node.js installer. Please check your internet connection.
        pause
        exit /b 1
    )

    :: Install Node.js silently
    msiexec /i nodejs.msi /quiet /norestart
    IF %ERRORLEVEL% NEQ 0 (
        echo Failed to install Node.js. Please run this script with administrator privileges.
        del nodejs.msi
        pause
        exit /b 1
    )

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
    exit /b 1
)

exit /b 0
