-- ========================================================
-- SCRIPT DE ADIÇÃO DE ÍNDICES SECUNDÁRIOS - PROJETO GRANPLUS
-- Executar no MySQL para otimizar a performance de consultas
-- ========================================================

USE cbd_tcc_des_125_estoque;

-- 1. Otimização de Auditoria:
-- Melhora significativamente a filtragem de relatórios de auditoria por data e ordenação temporal.
CREATE INDEX idx_auditoria_data_hora 
ON auditoria (aud_data DESC, aud_time DESC);

-- 2. Otimização de Produtos:
-- Melhora a listagem rápida de produtos ativos (usada em quase todas as queries de visualização).
CREATE INDEX idx_produto_ativo 
ON produto (pdt_ativo);

-- 3. Otimização de Alertas de Validade:
-- Melhora a velocidade de varreduras do sistema buscando lotes expirados ou próximos do vencimento.
CREATE INDEX idx_entrada_produtos_validade 
ON entrada_produtos (pdt_validade);

-- 4. Otimização de Entradas por Produto/Lote/Validade:
-- Melhora consultas por entrada e detalhamento de lotes na mesma entrada.
CREATE INDEX idx_entrada_produtos_ent_prod_lote_validade
ON entrada_produtos (ent_id, pdt_id, ent_prod_lote, pdt_validade);

-- 5. Otimização de Códigos de Produto (Validações de cadastro):
-- Agiliza a verificação de duplicidade de código durante o insert e update de produtos.
CREATE INDEX idx_produto_codigo 
ON produto (pdt_codigo);
