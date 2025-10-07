@echo off
echo Configurando variables de entorno para el proyecto...

rem La siguiente linea agrega la carpeta de ejecutables de npm al PATH.
rem Esto permite ejecutar comandos como 'eas' o 'expo' sin usar npx.
set PATH=%PATH%;%~dp0node_modules\.bin

echo Variables de entorno configuradas.
echo Ahora puedes usar 'eas build:configure', 'eas build', etc. directamente.
echo.
cmd /k