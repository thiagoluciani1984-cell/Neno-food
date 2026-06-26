@echo off
cd /d "%~dp0"

echo Verificando porta 3000...
netstat -ano | findstr ":3000" >nul
if %errorlevel%==0 (
  echo.
  echo ATENCAO: a porta 3000 ja esta em uso:
  netstat -ano | findstr ":3000"
  echo.
  echo Feche outros servidores Node/Next antes de continuar, se o app nao abrir.
  echo.
)

echo Iniciando Nenos Food em http://127.0.0.1:3000
echo Aguarde aparecer "Ready" nesta janela antes de abrir o navegador.
echo.
npm.cmd run dev -- -H 127.0.0.1 -p 3000
echo.
echo O servidor foi encerrado. Pressione qualquer tecla para fechar.
pause >nul
