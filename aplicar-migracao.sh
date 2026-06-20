#!/bin/bash

# Script para aplicar migração de entrada_produtos
# Permite múltiplos lançamentos do mesmo produto com lotes/validades diferentes

# Configuração (altere conforme seu ambiente)
DB_HOST="localhost"
DB_USER="root"
DB_PASS=""  # deixe vazio se não tiver senha, ou defina aqui
DB_NAME="cbd_tcc_des_125_estoque"

echo "================================"
echo "Aplicando migração de entrada_produtos..."
echo "================================"

# Se houver senha, adicione -p$DB_PASS
if [ -z "$DB_PASS" ]; then
  mysql -h "$DB_HOST" -u "$DB_USER" "$DB_NAME" < src/banco-dados/alter-entrada-produtos.sql
else
  mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < src/banco-dados/alter-entrada-produtos.sql
fi

# Verifica se funcionou
if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Migração aplicada com sucesso!"
  echo ""
  echo "Próximo passo: teste inserir dois produtos iguais com lotes diferentes"
else
  echo ""
  echo "❌ Erro na migração. Verifique as credenciais do MySQL."
  exit 1
fi
