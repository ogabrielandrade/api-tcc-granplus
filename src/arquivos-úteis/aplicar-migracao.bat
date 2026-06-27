@echo off
REM Script para aplicar migração de entrada_produtos no Windows
REM Permite múltiplos lançamentos do mesmo produto com lotes/validades diferentes

setlocal enabledelayedexpansion

REM Configuração (altere conforme seu ambiente)
set DB_HOST=localhost
set DB_USER=root
set DB_PASS=
set DB_NAME=cbd_tcc_des_125_estoque

echo ================================
echo Aplicando migracao de entrada_produtos...
echo ================================

REM Monta o comando mysql
if "%DB_PASS%"=="" (
  mysql -h %DB_HOST% -u %DB_USER% %DB_NAME% < src/banco-dados/alter-entrada-produtos.sql
) else (
  mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASS% %DB_NAME% < src/banco-dados/alter-entrada-produtos.sql
)

REM Verifica se funcionou
if %ERRORLEVEL% equ 0 (
  echo.
  echo [OK] Migracao aplicada com sucesso!
  echo.
  echo Proximo passo: teste inserir dois produtos iguais com lotes diferentes
  pause
) else (
  echo.
  echo [ERRO] Falha na migracao. Verifique as credenciais do MySQL.
  pause
  exit /b 1
)
