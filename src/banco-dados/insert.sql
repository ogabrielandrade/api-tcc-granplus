USE cbd_tcc_des_125_estoque;

-- =============================================
-- TABELA: usuarios
-- =============================================
-- Senhas originais: admin123, estoque123, financeiro123
INSERT INTO usuarios (user_id, user_nome, user_email, user_senha, user_nivel_acesso, user_ativo) VALUES
(1, 'Administrador', 'administrador@granplus.com.br', '$2b$10$CKLaJ1uJolMsyyvodMkPRumqjQblnbWY3hC8oxiFe8zUwIZ2j59Nq', 'admin', 1),
(2, 'Almoxarife', 'almoxarife@granplus.com.br', '$2b$10$p.ZQfRdcyvwk1tpCnq4z5u360ySuaZvKjgR4llajJmBv9WJ8ydC.S', 'user', 1),
(3, 'Tecnico de Manutencao', 'manutencao@granplus.com.br', '$2b$10$HICLujQefsPKNNYnVyjxd.1YkZIqKF2eHqKK291180gbNG./E7S.W', 'user', 1);

-- =============================================
-- TABELA: fornecedor
-- =============================================
INSERT INTO fornecedor (
	fncd_id,
	fncd_nome,
	fncd_documento,
	fncd_cep,
	fncd_logradouro,
	fncd_numero,
	fncd_complemento,
	fncd_bairro,
	fncd_cidade,
	fncd_estado,
	fncd_tel,
	fncd_email
) VALUES
(1, 'Higieniza Agro LTDA',      '12345678000190', '01001-000', 'Av. das Industrias',   '1000', NULL,       'Centro',         'Sao Paulo',  'SP', '(11) 4000-1000', 'contato@higienizaagro.com.br'),
(2, 'TecMan Pecas e Servicos',  '22345678000191', '13010-100', 'Rua das Oficinas',     '250',  'Bloco B',  'Distrito Norte', 'Campinas',    'SP', '(19) 3000-2000', 'vendas@tecmanpecas.com.br'),
(3, 'Papelaria Rural LTDA',     '32345678000192', '80010-000', 'Rodovia BR-101',       '200',  'Km 200',   'Jardim America', 'Curitiba',    'PR', '(41) 3500-3000', 'comercial@papelariarural.com.br'),
(4, 'InfoRural Tecnologia LTDA','42345678000193', '70040-010', 'Setor Comercial Sul',  '450',  'Sala 201', 'Asa Sul',        'Brasilia',    'DF', '(61) 3500-4000', 'suporte@inforural.com.br');

-- =============================================
-- TABELA: unidade_medida
-- =============================================
INSERT INTO unidade_medida (unid_med_id, unid_med_sigla) VALUES
(1, 'UN'),
(2, 'CX'),
(3, 'PCT'),
(4, 'LT'),
(5, 'KG'),
(6, 'MT'),
(7, 'RL');

-- =============================================
-- TABELA: categorias
-- =============================================
INSERT INTO categorias (cat_id, cat_nome) VALUES
(1, 'Higiene e limpeza'),
(2, 'Manutencao e pecas'),
(3, 'Escritorio'),
(4, 'Informatica'),
(5, 'EPI'),
(6, 'Material eletrico');

-- =============================================
-- TABELA: localizacao
-- =============================================
INSERT INTO localizacao (loc_id, loc_nome, loc_desc) VALUES
(1, 'Almoxarifado Central', 'Recebimento e guarda dos insumos gerais'),
(2, 'Deposito de Higiene',  'Produtos de limpeza e sanitizacao'),
(3, 'Oficina de Manutencao', 'Pecas, ferramentas e itens de reparo'),
(4, 'Sala Administrativa',  'Materiais de escritorio e apoio administrativo'),
(5, 'Sala de TI',           'Equipamentos e consumiveis de informatica');

-- =============================================
-- TABELA: produto
-- =============================================
INSERT INTO produto (pdt_id, pdt_nome, pdt_codigo, pdt_descricao, pdt_estoque_minimo, pdt_ativo, cat_id, unid_med_id) VALUES
(1,  'Desinfetante Concentrado 5L', 'DES-5L',   'Desinfetante concentrado para higienizacao de areas internas e externas', 15, 1, 1, 4),
(2,  'Detergente Neutro 1L',        'DET-1L',   'Detergente neutro para lavagem de superficies e utensilios',              20, 1, 1, 4),
(3,  'Luva Nitrilica Caixa 100',    'LUV-100',  'Luva nitrilica para uso operacional e protecao individual',               10, 1, 5, 2),
(4,  'Papel Sulfite A4 500 folhas', 'PAP-A4',   'Papel sulfite A4 para rotinas administrativas e impressao de documentos', 30, 1, 3, 2),
(5,  'Caneta Esferografica Azul',   'CAN-AZ',   'Caneta azul para uso administrativo diario',                              40, 1, 3, 2),
(6,  'Mouse USB Optico',            'MOU-USB',  'Mouse optico para estações de trabalho e postos de apoio',                8,  1, 4, 1),
(7,  'Teclado USB Padrao ABNT2',    'TEC-AB2',  'Teclado USB para estações de trabalho',                                    6,  1, 4, 1),
(8,  'Cabo de Rede Cat6 5m',        'CAB-5M',   'Cabo de rede para manutencao da infraestrutura de TI',                    12, 1, 4, 1),
(9,  'Lampada LED 18W',             'LMP-18W',  'Lampada LED para reposicao em galpoes, salas e corredores',               20, 1, 6, 1),
(10, 'Graxa Multiuso 500g',         'GRA-500',  'Graxa para manutencao de mancais, correntes e equipamentos',              12, 1, 2, 5),
(11, 'Fita Isolante 20m',           'FIT-20M',  'Fita isolante para reparos eletricos e pequenas manutencoes',             15, 1, 6, 7),
(12, 'Parafuso Zincado 1/4x1',      'PAR-114',  'Parafuso zincado para fixacoes e reparos gerais',                         50, 1, 2, 3);

-- =============================================
-- TABELA: localizacao_produtos
-- (estoque por produto e localizacao)
-- =============================================
INSERT INTO localizacao_produtos (lcl_id, lcl_prod_estoque, pdt_id, loc_id) VALUES
(1,  120, 1, 1),
(2,   40, 1, 2),
(3,   90, 2, 1),
(4,   35, 2, 2),
(5,   28, 3, 1),
(6,   16, 3, 2),
(7,   70, 4, 1),
(8,   32, 4, 4),
(9,   90, 5, 4),
(10,  18, 6, 5),
(11,  14, 7, 5),
(12,  24, 8, 5),
(13,  20, 9, 3),
(14,  22, 10, 3),
(15,  42, 11, 3),
(16, 500, 12, 3);

-- =============================================
-- TABELA: entrada
-- (compras de fornecedores para uma localizacao)
-- =============================================
INSERT INTO entrada (ent_id, loc_id, fncd_id, ent_data_compra, ent_valor_compra, ent_data) VALUES
(1, 1, 1, '2026-03-02 08:30:00', 1480.00, '2026-03-02 14:20:00'),
(2, 4, 3, '2026-03-04 09:10:00',  860.00, '2026-03-04 15:05:00'),
(3, 5, 4, '2026-03-06 10:15:00', 1920.00, '2026-03-06 16:40:00'),
(4, 3, 2, '2026-03-08 07:50:00',  975.00, '2026-03-08 13:35:00'),
(5, 2, 1, '2026-03-10 08:00:00',  790.00, '2026-03-10 12:55:00');

INSERT INTO entrada_produtos (ent_id, pdt_id, ent_prod_qtde, ent_prod_lote, pdt_validade) VALUES
-- Entrada 1: higiene e limpeza
(1, 1, 80, 26030202, '2027-03-02'),
(1, 2, 30, 26030203, '2028-12-31'),

-- Entrada 2: materiais de escritorio
(2, 4, 40, 26030401, '2028-12-31'),
(2, 5, 25, 26030402, '2029-12-31'),
(3, 8, 20, 26030603, NULL),

-- Entrada 4: manutencao e pecas
(4, 9, 18, 26030801, NULL),
(4, 10, 24, 26030802, NULL),
(4, 11, 40, 26030803, NULL),
(4, 12, 300, 26030804, NULL),

-- Entrada 5: reposicao de higiene e limpeza
(5, 1, 30, 26031001, '2028-04-01'),
(5, 2, 40, 26031002, '2027-04-01'),
(5, 3, 20, 26031003, '2028-11-30');

-- =============================================
-- TABELA: saida_produtos
-- (saidas do estoque em cada localizacao_produtos)
-- =============================================
INSERT INTO saida_produtos (sai_id, lcl_id, lcl_qtde, lcl_data_saida, lcl_destino, lcl_tipo, lcl_justificativa) VALUES
(1,  1, 18.00, '2026-03-11 09:00:00', 'Deposito de Higiene',  'Transferencia interna', 'Reposicao de desinfetante no setor de higiene'),
(2,  3, 12.00, '2026-03-11 10:20:00', 'Deposito de Higiene',  'Transferencia interna', 'Reposicao de detergente para uso no setor de higiene'),
(3,  5,  8.00, '2026-03-12 11:10:00', 'Deposito de Higiene',  'Transferencia interna', 'Distribuicao de luvas para uso operacional'),
(4,  7, 10.00, '2026-03-12 14:40:00', 'Sala Administrativa', 'Transferencia interna', 'Envio de papel A4 para setor administrativo'),
(5, 10,  3.00, '2026-03-13 08:45:00', 'Sala de TI',          'Consumo interno',      'Substituicao de mouse com defeito'),
(6, 14,  4.00, '2026-03-13 15:30:00', 'Oficina de Manutencao','Consumo interno',      'Uso de graxa em manutencao preventiva'),
(7, 16, 20.00, '2026-03-14 09:25:00', 'Oficina de Manutencao','Consumo interno',      'Aplicacao de parafusos em reparos gerais');

-- =============================================
-- TABELA: destino_movimentacao
-- (destino das movimentacoes de saida)
-- =============================================
INSERT INTO destino_movimentacao (sai_id, lcl_id) VALUES
(1, 2),
(2, 4),
(3, 6),
(4, 8);

-- =============================================
-- TABELA: auditoria
-- (registros de acoes dos usuarios no sistema)
-- =============================================
INSERT INTO auditoria (aud_id, user_id, aud_acao, aud_data, aud_time, aud_tabela_afetada, aud_id_evento) VALUES
(1, 1, 'Usuário Administrador criado',                                       '2026-03-01', '08:10:00', 'usuarios',        1),
(2, 1, 'Unidade de medida UN criada',                                         '2026-03-01', '08:15:00', 'unidade_medida',  1),
(3, 1, 'Unidade de medida CX criada',                                         '2026-03-01', '08:16:00', 'unidade_medida',  2),
(4, 1, 'Categoria Higiene e limpeza criada',                                  '2026-03-01', '08:20:00', 'Categorias',      1),
(5, 1, 'Categoria Manutencao e pecas criada',                                 '2026-03-01', '08:21:00', 'Categorias',      2),
(6, 1, 'Localização Almoxarifado Central criada',                             '2026-03-01', '08:30:00', 'localizacao',     1),
(7, 1, 'Localização Deposito de Higiene criada',                              '2026-03-01', '08:31:00', 'localizacao',     2),
(8, 1, 'Fornecedor Higieniza Agro LTDA criado',                               '2026-03-01', '08:40:00', 'fornecedor',      1),
(9, 1, 'Fornecedor TecMan Pecas e Servicos criado',                           '2026-03-01', '08:41:00', 'fornecedor',      2),
(10, 1, 'Produto Desinfetante Concentrado 5L criado',                         '2026-03-01', '09:00:00', 'produto',         1),
(11, 1, 'Produto Papel Sulfite A4 500 folhas criado',                         '2026-03-01', '09:01:00', 'produto',         4),
(12, 2, 'Produto 4 atualizado',                                               '2026-03-05', '10:00:00', 'produto',         4),
(13, 2, 'Produto 5 desativado',                                               '2026-03-05', '10:05:00', 'produto',         5),
(14, 2, 'Localização Oficina de Manutencao atualizada para Oficina de Manutenção', '2026-03-06', '11:00:00', 'localizacao',     3),
(15, 3, 'Fornecedor Papelaria Rural LTDA inativado',                          '2026-03-06', '11:10:00', 'fornecedor',      3),
(16, 2, 'Entrada no produto 1',                                               '2026-03-10', '14:20:00', 'entrada',         1),
(17, 2, 'Atualização do produto 2',                                            '2026-03-10', '14:30:00', 'entrada',         2),
(18, 2, 'Entrada 3 excluída com os produtos: Cabo de Rede Cat6 5m (qtd: 20)', '2026-03-10', '14:40:00', 'entrada',         3),
(19, 2, 'Saída no produto 1',                                                  '2026-03-11', '09:05:00', 'saida_produtos',  1),
(20, 2, 'Saída no produto 4',                                                  '2026-03-12', '14:45:00', 'saida_produtos',  4),
(21, 3, 'Saída no produto 6',                                                  '2026-03-13', '15:35:00', 'saida_produtos',  6),
(22, 1, 'Usuário Almoxarife atualizado para Almoxarife Responsável',          '2026-03-14', '16:00:00', 'usuarios',        2),
(23, 1, 'Usuário Tecnico de Manutencao desativado',                            '2026-03-14', '16:05:00', 'usuarios',        3);
