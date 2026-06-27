USE cbd_tcc_des_125_estoque;

-- =============================================
-- TABELA: usuarios
-- =============================================
-- Senhas originais: admin1234, estoque123, financeiro123
INSERT INTO usuarios (user_id, user_nome, user_email, user_senha, user_nivel_acesso, user_ativo) VALUES
(1, 'Administrador', 'granplustcc@gmail.com', '$2b$10$63aToxAoECLOwWH5DcKvsepPkhDCSB1Vm7VL/o1ZR1q2diQPnbhKW', 'admin', 1),
(2, 'Almoxarife', 'almoxarife@hotmail.com', '$2a$12$UxqWDyZ/X0B.8cO7lrfvp.vEwwjuSoutDJKJ9JwVQmZYnQM8rw/gq', 'user', 1),
(3, 'Tecnico de Manutencao', 'manutencao@granplus.com.br', '$2a$12$Jx0ib7RoVk6Jy90U4tgeq.dW3DH58rr0W3WpAkgMApcRtmlBhwbU.', 'user', 1);

-- =============================================
-- TABELA: fornecedor
-- =============================================
INSERT INTO fornecedor (fncd_id, fncd_nome, fncd_documento, fncd_cep, fncd_logradouro, fncd_numero, fncd_complemento, fncd_bairro, fncd_cidade, fncd_estado, fncd_tel, fncd_email) VALUES
(1, 'Higieniza Agro LTDA',      '12345678000190', '01001-000', 'Av. das Industrias',   '1000', NULL,       'Centro',         'Sao Paulo',  'SP', '(11) 4000-1000', 'contato@higienizaagro.com.br'),
(2, 'TecMan Pecas e Servicos',  '22345678000191', '13010-100', 'Rua das Oficinas',     '250',  'Bloco B',  'Distrito Norte', 'Campinas',    'SP', '(19) 3000-2000', 'vendas@tecmanpecas.com.br'),
(3, 'Papelaria Rural LTDA',     '32345678000192', '80010-000', 'Rodovia BR-101',       '200',  'Km 200',   'Jardim America', 'Curitiba',    'PR', '(41) 3500-3000', 'comercial@papelariarural.com.br'),
(4, 'InfoRural Tecnologia LTDA','42345678000193', '70040-010', 'Setor Comercial Sul',  '450',  'Sala 201', 'Asa Sul',        'Brasilia',    'DF', '(61) 3500-4000', 'suporte@inforural.com.br');

-- =============================================
-- TABELA: unidade_medida
-- =============================================
INSERT INTO unidade_medida (unid_med_id, unid_med_sigla) VALUES
(1, 'UN'), (2, 'CX'), (3, 'PCT'), (4, 'LT'), (5, 'KG'), (6, 'MT'), (7, 'RL');

-- =============================================
-- TABELA: categorias
-- =============================================
INSERT INTO categorias (cat_id, cat_nome) VALUES
(1, 'Higiene e limpeza'), (2, 'Manutencao e pecas'), (3, 'Escritorio'), (4, 'Informatica'), (5, 'EPI'), (6, 'Material eletrico');

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
(12, 'Parafuso Zincado 1/4x1',      'PAR-114',  'Parafuso zincado para fixacoes e reparos gerais',                         50, 1, 2, 3),
-- 3 Novos Produtos Adicionados (Validade em 6 dias)
(13, 'Detergente Clorado 5L',       'DET-CL5',  'Detergente profissional para desinfecção e alvejamento de pisos',         10, 1, 1, 4),
(14, 'Alcool Gel 70% 1L',           'ALC-70',   'Alcool gel para higienizacao de maos e superficies administrativas',       15, 1, 1, 4),
(15, 'Sabonete Liquido Antissep 5L','SAB-ANT',  'Sabonete liquido antisseptico para dispensers dos banheiros',             8,  1, 1, 4);

-- =============================================
-- TABELA: localizacao_produtos
-- =============================================
INSERT INTO localizacao_produtos (lcl_id, lcl_prod_estoque, pdt_id, loc_id) VALUES
(1,  120, 1, 1),  (2,   40, 1, 2),  (3,   90, 2, 1),  (4,   35, 2, 2),
(5,   28, 3, 1),  (6,   16, 3, 2),  (7,   70, 4, 1),  (8,   32, 4, 4),
(9,   90, 5, 4),  (10,  18, 6, 5),  (11,  14, 7, 5),  (12,  24, 8, 5),
(13,  20, 9, 3),  (14,  22, 10, 3), (15,  42, 11, 3), (16, 500, 12, 3),
-- Estoques iniciais dos novos produtos:
(17,  50, 13, 2), (18,  30, 14, 4), (19,  25, 15, 2);

-- =============================================
-- TABELA: entrada (Linha do tempo: Jan a Jun/2026)
-- =============================================
INSERT INTO entrada (ent_id, loc_id, fncd_id, ent_data_compra, ent_valor_compra, ent_data) VALUES
(1, 1, 1, '2026-01-05 08:30:00', 1480.00, '2026-01-05 14:20:00'),
(2, 4, 3, '2026-01-20 09:10:00',  860.00, '2026-01-20 15:05:00'),
(3, 5, 4, '2026-02-02 10:15:00', 1920.00, '2026-02-02 16:40:00'),
(4, 3, 2, '2026-02-15 07:50:00',  975.00, '2026-02-15 13:35:00'),
(5, 2, 1, '2026-03-01 08:00:00',  790.00, '2026-03-01 12:55:00'),
(6, 3, 2, '2026-03-15 09:00:00', 1250.00, '2026-03-15 14:00:00'),
(7, 1, 1, '2026-03-28 10:30:00',  540.00, '2026-03-28 11:45:00'),
(8, 4, 3, '2026-04-05 08:15:00',  320.00, '2026-04-05 13:20:00'),
(9, 5, 4, '2026-04-18 11:00:00',  890.00, '2026-04-18 15:10:00'),
(10, 3, 2, '2026-04-30 14:20:00', 2100.00, '2026-04-30 17:30:00'),
(11, 2, 1, '2026-05-10 09:45:00',  150.00, '2026-05-10 10:50:00'),
(12, 3, 2, '2026-05-22 08:00:00',  780.00, '2026-05-22 13:15:00'),
(13, 1, 1, '2026-06-02 10:10:00',  450.00, '2026-06-02 14:00:00'),
(14, 4, 3, '2026-06-10 13:30:00',  120.00, '2026-06-10 16:40:00'),
-- Entrada 15: Registrando a compra dos itens com vencimento em 6 dias (02/07/2026)
(15, 2, 1, '2026-06-25 09:20:00', 3400.00, '2026-06-25 15:05:00'),
(16, 5, 4, '2026-06-26 11:15:00',  670.00, '2026-06-26 14:20:00'),
(17, 3, 2, '2026-06-27 08:45:00',  920.00, '2026-06-27 11:30:00'),
(18, 2, 1, '2026-06-28 10:00:00',  310.00, '2026-06-28 15:00:00'),
(19, 4, 3, '2026-06-29 09:30:00',  180.00, '2026-06-29 13:45:00'),
(20, 3, 2, '2026-06-30 14:00:00', 1450.00, '2026-06-30 16:55:00');

-- =============================================
-- TABELA: entrada_produtos
-- =============================================
INSERT INTO entrada_produtos (ent_id, pdt_id, ent_prod_qtde, ent_prod_lote, pdt_validade) VALUES
(1, 1, 80, 26010501, '2027-03-02'),
(1, 2, 30, 26010502, '2028-12-31'),
(2, 4, 40, 26012001, '2028-12-31'),
(2, 5, 25, 26012002, '2029-12-31'),
(3, 8, 20, 26020201, NULL),
(4, 9, 18, 26021501, NULL),
(4, 10, 24, 26021502, NULL),
(4, 11, 40, 26021503, NULL),
(4, 12, 300, 26021504, NULL),
(5, 1, 30, 26030101, '2028-04-01'),
(5, 2, 40, 26030102, '2027-04-01'),
(5, 3, 20, 26030103, '2028-11-30'),
(6, 10, 50, 26031501, NULL),
(6, 12, 1000, 26031502, NULL),
(7, 1, 20, 26032801, '2027-05-10'),
(8, 4, 15, 26040501, '2029-01-01'),
(9, 6, 10, 26041801, NULL),
(10, 9, 40, 26043001, NULL),
(10, 11, 100, 26043002, NULL),
(11, 2, 10, 26051001, '2028-06-15'),
(12, 10, 30, 26052201, NULL),
(13, 3, 50, 26060201, '2028-10-20'),
(14, 5, 60, 26061001, '2030-01-01'),
-- Inserindo os 3 novos produtos com validade definida para 02/07/2026 (Exatamente 6 dias)
(15, 13, 50, 26062501, '2026-07-02'),
(15, 14, 30, 26062502, '2026-07-02'),
(15, 15, 25, 26062503, '2026-07-02'),
(16, 7, 5, 26062601, NULL),
(17, 11, 50, 26062701, NULL),
(18, 1, 15, 26062801, '2027-08-30'),
(19, 4, 10, 26062901, '2029-02-28'),
(20, 9, 30, 26063001, NULL);

-- =============================================
-- TABELA: saida_produtos (Linha do tempo: Jan a Jun/2026)
-- =============================================
INSERT INTO saida_produtos (sai_id, lcl_id, lcl_qtde, lcl_data_saida, lcl_destino, lcl_tipo, lcl_justificativa) VALUES
(1,  1, 18.00, '2026-01-12 09:00:00', 'Deposito de Higiene',  'Transferencia interna', 'Reposicao de desinfetante no setor de higiene'),
(2,  3, 12.00, '2026-01-26 10:20:00', 'Deposito de Higiene',  'Transferencia interna', 'Reposicao de detergente para uso no setor de higiene'),
(3,  5,  8.00, '2026-02-10 11:10:00', 'Deposito de Higiene',  'Transferencia interna', 'Distribuicao de luvas para uso operacional'),
(4,  7, 10.00, '2026-02-22 14:40:00', 'Sala Administrativa', 'Transferencia interna', 'Envio de papel A4 para setor administrativo'),
(5, 10,  3.00, '2026-03-05 08:45:00', 'Sala de TI',          'Consumo interno',      'Substituicao de mouse com defeito'),
(6, 14,  4.00, '2026-03-12 15:30:00', 'Oficina de Manutencao','Consumo interno',      'Uso de graxa em manutencao preventiva'),
(7, 16, 20.00, '2026-03-20 09:25:00', 'Oficina de Manutencao','Consumo interno',      'Aplicacao de parafusos em reparos gerais'),
(8, 14,  2.00, '2026-03-29 10:00:00', 'Oficina de Manutencao', 'Consumo interno',     'Lubrificacao de elevador hidraulico'),
(9, 16, 15.00, '2026-04-02 14:30:00', 'Oficina de Manutencao', 'Consumo interno',     'Fixacao de prateleiras organizadoras'),
(10, 1,  5.00, '2026-04-12 09:15:00', 'Deposito de Higiene',   'Transferencia interna', 'Reposicao de rotina do estoque setorial'),
(11, 7,  3.00, '2026-04-20 11:20:00', 'Sala Administrativa',   'Consumo interno',     'Impressao de contratos de fornecedores'),
(12, 15, 6.00, '2026-05-02 08:45:00', 'Oficina de Manutencao', 'Consumo interno',     'Isolamento de fiação de bancada elétrica'),
(13, 10, 1.00, '2026-05-12 16:10:00', 'Sala de TI',            'Consumo interno',     'Substituicao de periferico danificado'),
(14, 13, 4.00, '2026-05-25 09:30:00', 'Oficina de Manutencao', 'Consumo interno',     'Substituicao de refletores internos queimados'),
(15, 14, 3.00, '2026-06-02 14:15:00', 'Oficina de Manutencao', 'Consumo interno',     'Revisao e lubrificacao preventiva de maquinario'),
(16, 3,  4.00, '2026-06-08 10:05:00', 'Deposito de Higiene',   'Transferencia interna', 'Higienizacao pesada pos-reforma do bloco b'),
(17, 16, 40.00, '2026-06-15 13:40:00', 'Oficina de Manutencao', 'Consumo interno',     'Montagem de suportes metalicos de ferramentas'),
(18, 9, 10.00, '2026-06-18 09:50:00', 'Sala Administrativa',   'Consumo interno',     'Abastecimento de materiais para o escritorio'),
(19, 13, 2.00, '2026-06-22 15:20:00', 'Oficina de Manutencao', 'Consumo interno',     'Melhoria na iluminacao do fosso de inspecao'),
(20, 12, 1.00, '2026-06-26 11:30:00', 'Sala de TI',            'Consumo interno',     'Reparos estruturais em calhas de cabeamento'),
(21, 15, 8.00, '2026-06-27 10:15:00', 'Oficina de Manutencao', 'Consumo interno',     'Manutencao eletrica do painel do compressor'),
(22, 1,  6.00, '2026-06-28 08:20:00', 'Deposito de Higiene',   'Transferencia interna', 'Garantia de estoque minimo para o feriado'),
(23, 7,  2.00, '2026-06-28 14:10:00', 'Sala Administrativa',   'Consumo interno',     'Emissao de guias fiscais e ordens de servico'),
(24, 14, 5.00, '2026-06-29 09:40:00', 'Oficina de Manutencao', 'Consumo interno',     'Engraxe geral de rolamentos de esteiras'),
(25, 16, 30.00, '2026-06-29 10:00:00', 'Oficina de Manutencao', 'Consumo interno',     'Reparos mecanicos na estrutura de elevadores'),
(26, 11, 2.00, '2026-06-30 11:15:00', 'Sala de TI',            'Consumo interno',     'Substituicao de teclados obsoletos no financeiro'),
(27, 13, 5.00, '2026-06-30 16:30:00', 'Oficina de Manutencao', 'Consumo interno',     'Substituicao de lampadas na area de soldagem');

-- =============================================
-- TABELA: destino_movimentacao
-- =============================================
INSERT INTO destino_movimentacao (sai_id, lcl_id) VALUES
(1, 2), (2, 4), (3, 6), (4, 8), (8, 3), (9, 3), (10, 2), (11, 4), (12, 3), 
(13, 5), (14, 3), (15, 3), (16, 2), (17, 3), (18, 4), (19, 3), (20, 5), (21, 3), 
(22, 2), (23, 4), (24, 3), (25, 3), (26, 5), (27, 3);

-- =============================================
-- TABELA: auditoria (Linha do tempo ajustada: Jan a Jun/2026)
-- =============================================
INSERT INTO auditoria (aud_id, user_id, aud_acao, aud_data, aud_time, aud_tabela_afetada, aud_id_evento) VALUES
(1, 1, 'Usuário Administrador criado',                                       '2026-01-01', '08:10:00', 'usuarios',        1),
(2, 1, 'Unidade de medida UN criada',                                        '2026-01-01', '08:15:00', 'unidade_medida',  1),
(3, 1, 'Unidade de medida CX criada',                                        '2026-01-01', '08:16:00', 'unidade_medida',  2),
(4, 1, 'Categoria Higiene e limpeza criada',                                  '2026-01-01', '08:20:00', 'Categorias',      1),
(5, 1, 'Categoria Manutencao e pecas criada',                                 '2026-01-01', '08:21:00', 'Categorias',      2),
(6, 1, 'Localização Almoxarifado Central criada',                             '2026-01-02', '08:30:00', 'localizacao',     1),
(7, 1, 'Localização Deposito de Higiene criada',                              '2026-01-02', '08:31:00', 'localizacao',     2),
(8, 1, 'Fornecedor Higieniza Agro LTDA criado',                               '2026-01-03', '08:40:00', 'fornecedor',      1),
(9, 1, 'Fornecedor TecMan Pecas e Servicos criado',                           '2026-01-03', '08:41:00', 'fornecedor',      2),
(10, 1, 'Produto Desinfetante Concentrado 5L criado',                         '2026-01-04', '09:00:00', 'produto',         1),
(11, 1, 'Produto Papel Sulfite A4 500 folhas criado',                         '2026-01-04', '09:01:00', 'produto',         4),
(12, 2, 'Produto 4 atualizado',                                               '2026-01-10', '10:00:00', 'produto',         4),
(13, 2, 'Produto 5 desativado',                                               '2026-01-15', '10:05:00', 'produto',         5),
(14, 2, 'Localização Oficina de Manutencao atualizada para Oficina de Manutenção', '2026-01-20', '11:00:00', 'localizacao',     3),
(15, 3, 'Fornecedor Papelaria Rural LTDA inativado',                          '2026-01-25', '11:10:00', 'fornecedor',      3),
(16, 2, 'Entrada no produto 1',                                               '2026-01-05', '14:20:00', 'entrada',         1),
(17, 2, 'Atualização do produto 2',                                           '2026-01-05', '14:30:00', 'entrada',         2),
(18, 2, 'Entrada 3 excluída com os produtos: Cabo de Rede Cat6 5m (qtd: 20)', '2026-02-02', '14:40:00', 'entrada',         3),
(19, 2, 'Saída no produto 1',                                                 '2026-01-12', '09:05:00', 'saida_produtos',  1),
(20, 2, 'Saída no produto 4',                                                 '2026-02-22', '14:45:00', 'saida_produtos',  4),
(21, 3, 'Saída no produto 6',                                                 '2026-03-05', '15:35:00', 'saida_produtos',  6),
(22, 1, 'Usuário Almoxarife atualizado para Almoxarife Responsável',          '2026-03-10', '16:00:00', 'usuarios',        2),
(23, 1, 'Usuário Tecnico de Manutencao desativado',                            '2026-03-12', '16:05:00', 'usuarios',        3),
(24, 2, 'Registrada entrada de insumos via lote 26031501',                    '2026-03-15', '14:05:00', 'entrada',         6),
(25, 3, 'Baixa de estoque por consumption interno de Graxa',                  '2026-03-15', '10:05:00', 'saida_produtos',  8),
(26, 3, 'Baixa de estoque por consumption interno de Parafusos',               '2026-03-15', '14:35:00', 'saida_produtos',  9),
(27, 2, 'Lancamento de nota fiscal e recebimento de mercadoria',              '2026-03-28', '11:50:00', 'entrada',         7),
(28, 2, 'Transferência de Desinfetante efetuada com sucesso',                 '2026-03-20', '09:20:00', 'saida_produtos',  10),
(29, 2, 'Entrada de Papel Sulfite A4 registrada no Almoxarifado',             '2026-04-05', '13:25:00', 'entrada',         8),
(30, 2, 'Saída de insumo administrativo autorizada',                          '2026-04-20', '11:25:00', 'saida_produtos',  11),
(31, 3, 'Baixa de parafusos para fixacao de trilhos e roletes mecânicos',      '2026-06-29', '10:05:00', 'saida_produtos',  25),
(32, 3, 'Retirada de Fita Isolante para manutencao predial',                  '2026-05-02', '08:50:00', 'saida_produtos',  12),
(33, 2, 'Confirmado recebimento de carga de Mouses Opticos',                  '2026-04-18', '15:15:00', 'entrada',         9),
(34, 1, 'Liberado Mouse USB para substituicao em estacao de trabalho',        '2026-05-12', '16:15:00', 'saida_produtos',  13),
(35, 3, 'Retirada de Lampadas LED para manutencao da oficina',                '2026-05-25', '09:35:00', 'saida_produtos',  14),
(36, 2, 'Entrada em lote de Lampadas e Fita Isolante processada',             '2026-04-30', '17:35:00', 'entrada',         10),
(37, 2, 'Entrada de Detergente Neutro homologada no sistema',                 '2026-05-10', '10:55:00', 'entrada',         11),
(38, 3, 'Uso de Graxa Multiuso em ordens de servico preventivas',             '2026-06-02', '14:20:00', 'saida_produtos',  15),
(39, 1, 'Troca de perifericos defeituosos na recepcao administrativa',        '2026-06-30', '11:20:00', 'saida_produtos',  26),
(40, 2, 'Saída de Detergente para o Deposito de Higiene conciliavel',         '2026-06-08', '10:10:00', 'saida_produtos',  16),
(41, 2, 'Entrada de reposicao de Graxa Multiuso no sistema',                  '2026-05-22', '13:20:00', 'entrada',         12),
(42, 2, 'Nota de fornecedor Higieniza Agro vinculada com sucesso',            '2026-06-02', '14:05:00', 'entrada',         13),
(43, 3, 'Consumo de Parafusos Zincados para fabricacao de suportes',          '2026-06-15', '13:45:00', 'saida_produtos',  17),
(44, 1, 'Nivel de acesso do Almoxarife revisado na politica de seguranca',    '2026-06-16', '08:30:00', 'usuarios',        2),
(45, 2, 'Saída de Canetas Esferograficas para uso administrativo',            '2026-06-18', '09:55:00', 'saida_produtos',  18),
(46, 2, 'Nova remessa de Canetas cadastrada no estoque central',              '2026-06-10', '16:45:00', 'entrada',         14),
(47, 3, 'Substituicao emergencial de refletores do fosso concluida',          '2026-06-22', '15:25:00', 'saida_produtos',  19),
(48, 2, 'Carga massiva de Parafusos Zincados integrada com sucesso',          '2026-06-25', '15:10:00', 'entrada',         15),
(49, 1, 'Retirada de Cabo de Rede Cat6 para expansao de ponto de TI',          '2026-06-26', '11:35:00', 'saida_produtos',  20),
(50, 2, 'Entrada de Teclados USB ABNT2 validada fisicamente',                 '2026-06-26', '14:25:00', 'entrada',         16),
(51, 3, 'Painel eletrico reestruturado com novas fitas isolantes',            '2026-06-27', '10:20:00', 'saida_produtos',  21),
(52, 2, 'Lancamento manual de ajuste de inventario de fitas isolantes',       '2026-06-27', '11:35:00', 'entrada',         17),
(53, 2, 'Despacho de Desinfetante Concentrado para os blocos',                '2026-06-28', '08:25:00', 'saida_produtos',  22),
(54, 2, 'Entrada de material sanitizante recebida e conferida',               '2026-06-28', '15:05:00', 'entrada',         18),
(55, 3, 'Substituicao de iluminacao na bancada de soldagem interna',          '2026-06-30', '16:35:00', 'saida_produtos',  27),
(56, 2, 'Impressao de relatorios do fechamento quinzenal de estoque',         '2026-06-28', '14:15:00', 'saida_produtos',  23),
(57, 2, 'Lancamento de nova compra de Papel Sulfite A4',                      '2026-06-29', '13:50:00', 'entrada',         19),
(58, 3, 'Manutencao pesada em rolamentos industriais utilizando graxa',       '2026-06-29', '09:45:00', 'saida_produtos',  24),
(59, 2, 'Recebimento de Lampadas LED para reposicao agendada',                '2026-06-30', '17:00:00', 'entrada',         20);