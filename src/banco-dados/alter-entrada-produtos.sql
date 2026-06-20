USE cbd_tcc_des_125_estoque;

-- ============================================================
-- MIGRAÇÃO: Permitir múltiplos lançamentos do mesmo produto
-- na mesma entrada com lotes/validades diferentes
-- ============================================================

-- 1. Desabilita verificação de chaves estrangeiras temporariamente
SET FOREIGN_KEY_CHECKS = 0;

-- 2. Remove os constraints de FK (para poder alterar a PK)
ALTER TABLE entrada_produtos DROP CONSTRAINT fk_entprod_entrada;
ALTER TABLE entrada_produtos DROP CONSTRAINT fk_entprod_produto;

-- 3. Remove a PK composta antiga (ent_id, pdt_id)
ALTER TABLE entrada_produtos DROP PRIMARY KEY;

-- 4. Adiciona coluna ent_prod_id como nova PK
ALTER TABLE entrada_produtos
  ADD COLUMN ent_prod_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST;

-- 5. Recria os constraints de FK (apontando para as chaves corretas)
ALTER TABLE entrada_produtos
  ADD CONSTRAINT fk_entprod_entrada
    FOREIGN KEY (ent_id)
    REFERENCES entrada(ent_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  ADD CONSTRAINT fk_entprod_produto
    FOREIGN KEY (pdt_id)
    REFERENCES produto(pdt_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;

-- 6. Reabilita verificação de chaves estrangeiras
SET FOREIGN_KEY_CHECKS = 1;

-- 7. Índice de apoio para consultas por lote/validade
SET @idx_exists := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'entrada_produtos'
    AND index_name = 'idx_entrada_produtos_ent_prod_lote_validade'
);

SET @idx_sql := IF(
  @idx_exists = 0,
  'CREATE INDEX idx_entrada_produtos_ent_prod_lote_validade ON entrada_produtos (ent_id, pdt_id, ent_prod_lote, pdt_validade)',
  'SELECT ''Índice idx_entrada_produtos_ent_prod_lote_validade já existe'' AS mensagem'
);

PREPARE idx_stmt FROM @idx_sql;
EXECUTE idx_stmt;
DEALLOCATE PREPARE idx_stmt;

-- ============================================================
-- Confirmação: agora é possível fazer:
--   INSERT INTO entrada_produtos (ent_id, pdt_id, ent_prod_qtde, ent_prod_lote, pdt_validade)
--   VALUES 
--     (1, 5, 10, 'LOTE001', '2026-12-31'),
--     (1, 5, 15, 'LOTE002', '2027-06-30');
-- ============================================================
