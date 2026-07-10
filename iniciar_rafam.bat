@echo off
title RAG RAFAM - Sistema Integrado
:: Forzar al cargador a posicionarse en la carpeta del script
cd /d "%~dp0"

echo ==========================================
echo   RAG RAFAM: Iniciando Servidores
echo ==========================================

echo [INFO] Iniciando API Back-End (FastAPI) en puerto 8000...
start "RAG RAFAM: Back-End API" cmd /k "cd /d "%~dp0" && python -u servidor_rafam.py"

echo [INFO] Iniciando React Front-End (Vite) en puerto 5173...
start "RAG RAFAM: Front-End React" cmd /k "cd /d "%~dp0" && npm run dev"

echo [INFO] ¡Ambos servidores se han lanzado en ventanas independientes!
echo [INFO] Abre http://localhost:5173 en tu navegador para ver la interfaz.
echo.
echo Presiona cualquier tecla para cerrar esta ventana cargadora...
pause
