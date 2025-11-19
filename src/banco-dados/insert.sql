USE controle_estoque;

-- =============================================
-- TABELA: usuarios
-- =============================================
INSERT INTO usuarios (user_id, user_nome, user_senha, user_nivel_acesso, user_ativo) VALUES
(1, 'Administrador', 'admin123', 'admin', 1),
(2, 'João Estoquista', 'estoque123', 'user', 1),
(3, 'Maria Financeiro', 'financeiro123', 'user', 1);

-- =============================================
-- TABELA: fornecedor
-- =============================================
INSERT INTO fornecedor (fncd_id, fncd_nome, fncd_documento, fncd_endereco, fncd_tel, fncd_email) VALUES
(1, 'Higiene & Limpeza Brasil LTDA', '12345678000190', 'Av. das Indústrias, 1000 - São Paulo/SP', '(11) 4000-1000', 'contato@higienelimpeza.com.br'),
(2, 'Papelaria Central LTDA',        '22345678000191', 'Rua das Flores, 250 - Campinas/SP',        '(19) 3000-2000', 'vendas@papelariacentral.com.br'),
(3, 'Distribuidora Bom Sabor LTDA',  '32345678000192', 'Rod. BR-101, Km 200 - Curitiba/PR',        '(41) 3500-3000', 'comercial@bomsabor.com.br');

-- =============================================
-- TABELA: unidade_medida
-- =============================================
INSERT INTO unidade_medida (unid_med_id, unid_med_sigla) VALUES
(1, 'UN'),
(2, 'CX'),
(3, 'KG'),
(4, 'LT');

-- =============================================
-- TABELA: categorias
-- =============================================
INSERT INTO categorias (cat_id, cat_nome) VALUES
(1, 'Limpeza'),
(2, 'Escritório'),
(3, 'Informática'),
(4, 'Alimentos');

-- =============================================
-- TABELA: localizacao
-- =============================================
INSERT INTO localizacao (loc_id, loc_nome, loc_desc) VALUES
(1, 'Almoxarifado Central', 'Estoque principal da empresa'),
(2, 'Depósito Loja 1',      'Estoque da unidade Loja 1'),
(3, 'Depósito Loja 2',      'Estoque da unidade Loja 2');

-- =============================================
-- TABELA: produto
-- =============================================
INSERT INTO produto (pdt_id, pdt_nome, pdt_codigo, pdt_descricao, pdt_estoque_minimo, pdt_ativo, cat_id, unid_med_id) VALUES
(1, 'Detergente Neutro 5L',  'DET-5L',  'Detergente neutro para limpeza geral, galão 5L',            10, 1, 1, 4),
(2, 'Papel A4 Chamex Caixa', 'PAP-A4',  'Papel sulfite A4 75g, caixa com 10 resmas',                 5,  1, 2, 2),
(3, 'Mouse Óptico USB',      'MOU-USB', 'Mouse óptico com fio, conexão USB, resolução 1600 DPI',     8,  1, 3, 1),
(4, 'Café Torrado 500g',     'CAF-500', 'Café torrado e moído, pacote 500g',                         15, 1, 4, 3),
(5, 'Álcool 70% 1L',         'ALC-1L',  'Álcool etílico 70% líquido, frasco 1L para higienização',  20, 1, 1, 4);

-- =============================================
-- TABELA: localizacao_produtos
-- (estoque por produto e localização)
-- =============================================
INSERT INTO localizacao_produtos (lcl_id, lcl_prod_estoque, pdt_id, loc_id) VALUES
(1, 50, 1, 1),  -- Detergente Neutro 5L - Almox Central
(2, 30, 2, 1),  -- Papel A4 Caixa      - Almox Central
(3, 40, 3, 1),  -- Mouse USB           - Almox Central
(4, 20, 4, 1),  -- Café 500g           - Almox Central
(5, 10, 2, 2),  -- Papel A4 Caixa      - Depósito Loja 1
(6, 25, 5, 1),  -- Álcool 70% 1L       - Almox Central
(7, 15, 5, 2),  -- Álcool 70% 1L       - Depósito Loja 1
(8, 5,  3, 2);  -- Mouse USB           - Depósito Loja 1

-- =============================================
-- TABELA: entrada
-- (compras de fornecedores para uma localização)
-- =============================================
INSERT INTO entrada (ent_id, loc_id, fncd_id, ent_data_compra, ent_valor_compra, ent_data) VALUES
(1, 1, 1, '2025-11-01 09:00:00',  750.00, '2025-11-01 15:00:00'),  -- Compra de produtos de limpeza
(2, 1, 2, '2025-11-02 10:30:00', 1200.00, '2025-11-02 16:00:00'),  -- Compra de papel e material escritório
(3, 1, 3, '2025-11-05 08:45:00',  980.00, '2025-11-05 14:30:00');  -- Compra de café e alimentos

-- =============================================
-- TABELA: entrada_produtos
-- (itens de cada nota de entrada)
-- =============================================
INSERT INTO entrada_produtos (ent_id, pdt_id, ent_prod_qtde, ent_prod_lote) VALUES
-- Entrada 1: fornecedor de limpeza
(1, 1, 30, 1001),  -- 30 galões Detergente Neutro 5L
(1, 5, 20, 1002),  -- 20 frascos Álcool 70% 1L

-- Entrada 2: fornecedor de papelaria
(2, 2, 40, 2001),  -- 40 caixas Papel A4
(2, 3, 25, 2002),  -- 25 mouses USB

-- Entrada 3: fornecedor de alimentos
(3, 4, 50, 3001);  -- 50 pacotes de café 500g

-- =============================================
-- TABELA: saida_produtos
-- (saídas do estoque em cada localização_produtos)
-- =============================================
INSERT INTO saida_produtos (sai_id, lcl_id, lcl_qtde, lcl_data_saida, lcl_destino, lcl_tipo, lcl_justificativa) VALUES
(1, 2, 10.00, '2025-11-10 10:00:00', 'Loja 1 - Escritório', 'Transferência',   'Reposição de papel A4 na Loja 1'),
(2, 6,  5.00, '2025-11-11 09:30:00', 'Loja 2 - Operacional', 'Transferência',   'Envio de álcool 70% para Loja 2'),
(3, 3,  3.00, '2025-11-12 14:15:00', 'Setor de TI',          'Consumo interno', 'Substituição de mouses defeituosos');

-- =============================================
-- TABELA: destino_movimentacao
-- (destino das movimentações de saída)
-- Aqui estamos ligando a saída às localizações de destino
-- =============================================
INSERT INTO destino_movimentacao (sai_id, lcl_id) VALUES
(1, 5),  -- Saída 1 (Papel A4 do Almox) indo para o estoque de Papel A4 da Loja 1
(2, 7);  -- Saída 2 (Álcool do Almox) indo para o estoque de Álcool da Loja 1 (exemplo de destino intermediário)

-- =============================================
-- TABELA: auditoria
-- (registros de ações dos usuários no sistema)
-- =============================================
INSERT INTO auditoria (aud_id, user_id, aud_acao, aud_data, aud_time, aud_tabela_afetada, aud_id_evento) VALUES
(1, 1, 'LOGIN NO SISTEMA',              '2025-11-01', '08:00:00', NULL,          NULL),
(2, 1, 'CADASTRO DE ENTRADA',           '2025-11-01', '15:05:00', 'entrada',     1),
(3, 2, 'LANÇAMENTO DE SAÍDA',           '2025-11-10', '10:05:00', 'saida_produtos', 1),
(4, 2, 'LANÇAMENTO DE SAÍDA',           '2025-11-11', '09:35:00', 'saida_produtos', 2),
(5, 3, 'CONSULTA RELATÓRIO DE ESTOQUE', '2025-11-12', '16:10:00', 'produto',     NULL);
