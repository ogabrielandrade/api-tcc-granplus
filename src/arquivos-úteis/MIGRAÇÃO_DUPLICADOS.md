# Migração: Permitir Produtos Duplicados na Mesma Entrada

## Problema

O sistema bloqueava inserir dois produtos iguais (mesmo `pdt_id`) na mesma entrada se tivessem lotes ou validades diferentes.

Erro: `Duplicate entry '8-2' for key 'entrada_produtos.PRIMARY'`

## Causa

A chave primária da tabela `entrada_produtos` era composta por `(ent_id, pdt_id)`, impedindo repetição.

## Solução

Alteramos a PK para ser de linha individual (`ent_prod_id`), permitindo múltiplas linhas do mesmo produto.

---

## ✅ Como Aplicar

### 1️⃣ Conecte ao MySQL

```bash
mysql -u seu_usuario -p cbd_tcc_des_125_estoque
```

### 2️⃣ Execute o script de migração

```sql
SOURCE src/banco-dados/alter-entrada-produtos.sql;
```

Ou copie e cole diretamente:

```sql
USE cbd_tcc_des_125_estoque;

-- 1. Remove a PK composta antiga
ALTER TABLE entrada_produtos DROP PRIMARY KEY;

-- 2. Adiciona coluna ent_prod_id como nova PK
ALTER TABLE entrada_produtos
  ADD COLUMN ent_prod_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST;

-- 3. Cria índice de apoio
CREATE INDEX IF NOT EXISTS idx_entrada_produtos_ent_prod_lote_validade
  ON entrada_produtos (ent_id, pdt_id, ent_prod_lote, pdt_validade);
```

---

## ✔️ Verificação

Após aplicar, teste:

```sql
-- Consultando a estrutura atual
DESCRIBE entrada_produtos;
```

Deve mostrar `ent_prod_id` como PRIMARY KEY na primeira coluna.

---

## 🧪 Teste de Inserção Duplicada

Agora é possível inserir o mesmo produto duas vezes na mesma entrada:

```sql
-- Exemplo: dois lotes do produto 5 na entrada 1
INSERT INTO entrada_produtos (ent_id, pdt_id, ent_prod_qtde, ent_prod_lote, pdt_validade)
VALUES
  (1, 5, 10, 'LOTE001', '2026-12-31'),
  (1, 5, 15, 'LOTE002', '2027-06-30');

-- Deve funcionar sem erro de chave duplicada ✅
```

---

## 📝 Alterações no Código

✅ **Sem alterações no Controller** — O código da aplicação já estava correto.
✅ **Schema atualizado** — [src/banco-dados/create.sql](src/banco-dados/create.sql) reflete a nova estrutura.
✅ **Migração pronta** — [src/banco-dados/alter-entrada-produtos.sql](src/banco-dados/alter-entrada-produtos.sql) para bancos existentes.

---

## ⚙️ Próximos Passos

1. **Aplique a migração** no seu banco MySQL (desenvolvimento e produção).
2. **Teste a inserção** de dois produtos iguais com lotes diferentes.
3. **Verifique a auditoria e relatórios** — Todas as queries continuam funcionando normalmente.
