@echo off
set nginxPath="C:\Program Files\nginx"
set confPath="A:\Visual-Studio-Code\Go\nginx\nginx.conf"

if "%1"=="start" (
    echo Starting Nginx...
    %nginxPath%\nginx.exe -p %nginxPath% -c %confPath% -g "daemon off;"
    exit /b
)

if "%1"=="stop" (
    echo Stopping Nginx...
    taskkill /F /IM nginx.exe
    exit /b
)

echo Usage: nginx-control.bat start ^| stop
