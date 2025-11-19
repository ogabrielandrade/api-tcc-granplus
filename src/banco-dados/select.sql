-- =============================================
-- SELECTS SIMPLES (TODAS AS TABELAS)
-- =============================================

SELECT * FROM usuarios;

SELECT * FROM auditoria;

SELECT * FROM fornecedor;

SELECT * FROM unidade_medida;

SELECT * FROM categorias;

SELECT * FROM localizacao;

SELECT * FROM produto;

SELECT * FROM localizacao_produtos;

SELECT * FROM entrada;

SELECT * FROM entrada_produtos;

SELECT * FROM saida_produtos;

SELECT * FROM destino_movimentacao;



-- =============================================
-- SELECTS COM INNER JOIN (TABELAS COM CHAVES ESTRANGEIRAS)
-- =============================================

-- 1. auditoria → usuarios
SELECT 
    a.*, 
    u.user_nome, 
    u.user_nivel_acesso
FROM auditoria a
INNER JOIN usuarios u ON a.user_id = u.user_id;


-- 2. produto → categorias + unidade_medida
SELECT 
    p.*, 
    c.cat_nome,
    u.unid_med_sigla
FROM produto p
INNER JOIN categorias c ON p.cat_id = c.cat_id
INNER JOIN unidade_medida u ON p.unid_med_id = u.unid_med_id;


-- 3. localizacao_produtos → produto + localizacao
SELECT 
    lp.*, 
    p.pdt_nome,
    l.loc_nome
FROM localizacao_produtos lp
INNER JOIN produto p ON lp.pdt_id = p.pdt_id
INNER JOIN localizacao l ON lp.loc_id = l.loc_id;


-- 4. entrada → localizacao + fornecedor
SELECT 
    e.*, 
    l.loc_nome,
    f.fncd_nome,
    f.fncd_documento
FROM entrada e
INNER JOIN localizacao l ON e.loc_id = l.loc_id
INNER JOIN fornecedor f ON e.fncd_id = f.fncd_id;


-- 5. entrada_produtos → entrada + produto
SELECT 
    ep.*, 
    e.ent_data,
    p.pdt_nome
FROM entrada_produtos ep
INNER JOIN entrada e ON ep.ent_id = e.ent_id
INNER JOIN produto p ON ep.pdt_id = p.pdt_id;


-- 6. saida_produtos → localizacao_produtos (+ produto e localização)
SELECT
    s.*,
    lp.lcl_prod_estoque,
    p.pdt_nome,
    l.loc_nome
FROM saida_produtos s
INNER JOIN localizacao_produtos lp ON s.lcl_id = lp.lcl_id
INNER JOIN produto p ON lp.pdt_id = p.pdt_id
INNER JOIN localizacao l ON lp.loc_id = l.loc_id;


-- 7. destino_movimentacao → saida_produtos + localizacao_produtos (+ produto)
SELECT
    dm.*,
    s.lcl_data_saida,
    lp.lcl_prod_estoque,
    p.pdt_nome
FROM destino_movimentacao dm
INNER JOIN saida_produtos s ON dm.sai_id = s.sai_id
INNER JOIN localizacao_produtos lp ON dm.lcl_id = lp.lcl_id
INNER JOIN produto p ON lp.pdt_id = p.pdt_id;
