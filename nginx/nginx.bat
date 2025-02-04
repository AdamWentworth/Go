@echo off
set nginxPath="C:\Program Files\nginx"
set confPath="A:\Visual-Studio-Code\Go\nginx\nginx.conf"

if "%1"=="start" (
    echo Starting Nginx...
    start "" %nginxPath%\nginx.exe -p %nginxPath% -c %confPath% -g "daemon off;"
    exit
)

if "%1"=="stop" (
    echo Stopping Nginx...
    taskkill /F /IM nginx.exe
    exit
)

echo Usage: nginx-control.bat start ^| stop
