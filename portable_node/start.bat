@echo off
REM Debug start script para Controle Acesso
setlocal

REM Determina o diretório base (onde o start.bat está)
set BASEDIR=%~dp0
echo BASEDIR = "%BASEDIR%"

REM Verifica existência de node.exe (pasta 'portable_node' está acima de dist)
if not exist "%BASEDIR%..\portable_node\node.exe" (
  echo ERRO: node.exe não encontrado em "%BASEDIR%..\portable_node"
  pause
  exit /b 1
) else (
  echo OK: Encontrado node.exe em "%BASEDIR%..\portable_node"
)

REM Verifica existência de main.js
if not exist "%BASEDIR%dist\main.js" (
  echo ERRO: main.js não encontrado em "%BASEDIR%dist"
  pause
  exit /b 1
) else (
  echo OK: Encontrado main.js
)

REM Verifica pasta data
if not exist "%BASEDIR%..\data" (
  echo Aviso: pasta data não existe em "%BASEDIR%..\data"
) else (
  echo OK: Pasta data existe em "%BASEDIR%..\data"
)

REM Muda para a pasta dist
cd /d "%BASEDIR%dist"
echo Caminho atual: %cd%

REM Executa o servidor e salva logs (node.exe acima de dist)
"%BASEDIR%..\portable_node\node.exe" main.js > server.log 2>&1

echo --- Conteúdo de server.log ---
more server.log
