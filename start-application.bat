@echo on
cd /d "%~dp0"
powershell -Command "Start-Process 'http://localhost:3000'"
node app.js
pause