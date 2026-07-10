@echo off
title RAG Chas: Sincronizar Android
:: Forzar posicionamiento en la carpeta del script
cd /d "%~dp0"

echo ==========================================
echo   RAG Chas: Sincronizando con Android
echo ==========================================
echo.
echo [1/3] Compilando React Frontend...
call npm run build

echo.
echo [2/3] Copiando assets de Capacitor...
call npx cap copy

echo.
echo [3/3] Abriendo Android Studio...
call npx cap open android

echo.
echo ==========================================
echo   [OK] Sincronizacion completada.
echo   Se ha abierto Android Studio. 
echo   Compila el APK en: Build -> Build Bundle(s) / APK(s) -> Build APK(s)
echo ==========================================
echo.
pause
