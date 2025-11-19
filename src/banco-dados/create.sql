
USE cbd_tcc_des_125_estoque;

-- =========================
-- TABELA: usuarios
-- =========================
CREATE TABLE usuarios (
    user_id           INT AUTO_INCREMENT PRIMARY KEY,
    user_nome         VARCHAR(50)   NOT NULL,
    user_senha        VARCHAR(20)   NOT NULL,
    user_nivel_acesso ENUM('admin','user') NOT NULL,
    user_ativo        TINYINT(1)    NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- =========================
-- TABELA: auditoria
-- =========================
CREATE TABLE auditoria (
    aud_id             INT AUTO_INCREMENT PRIMARY KEY,
    user_id            INT          NOT NULL,
    aud_acao           VARCHAR(255),
    aud_data           DATE,
    aud_time           TIME,
    aud_tabela_afetada VARCHAR(20),
    aud_id_evento      INT,
    CONSTRAINT fk_auditoria_usuarios
        FOREIGN KEY (user_id)
        REFERENCES usuarios(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

-- =========================
-- TABELA: fornecedor
-- =========================
CREATE TABLE fornecedor (
    fncd_id         INT AUTO_INCREMENT PRIMARY KEY,
    fncd_nome       VARCHAR(100) NOT NULL,
    fncd_documento  VARCHAR(14)  NOT NULL,
    fncd_endereco   VARCHAR(255),
    fncd_tel        VARCHAR(20)  NOT NULL,
    fncd_email      VARCHAR(100)
) ENGINE=InnoDB;

-- =========================
-- TABELA: unidade_medida
-- =========================
CREATE TABLE unidade_medida (
    unid_med_id    INT AUTO_INCREMENT PRIMARY KEY,
    unid_med_sigla VARCHAR(3) NOT NULL
) ENGINE=InnoDB;

-- =========================
-- TABELA: categorias
-- =========================
CREATE TABLE categorias (
    cat_id   INT AUTO_INCREMENT PRIMARY KEY,
    cat_nome VARCHAR(50) NOT NULL
) ENGINE=InnoDB;

-- =========================
-- TABELA: localizacao
-- =========================
CREATE TABLE localizacao (
    loc_id    INT AUTO_INCREMENT PRIMARY KEY,
    loc_nome  VARCHAR(30)  NOT NULL,
    loc_desc  VARCHAR(255)
) ENGINE=InnoDB;

-- =========================
-- TABELA: produto
-- =========================
CREATE TABLE produto (
    pdt_id             INT AUTO_INCREMENT PRIMARY KEY,
    pdt_nome           VARCHAR(100) NOT NULL,
    pdt_codigo         VARCHAR(50),
    pdt_descricao      VARCHAR(255),
    pdt_estoque_minimo INT,
    pdt_ativo          TINYINT(1) NOT NULL DEFAULT 1,
    cat_id             INT        NOT NULL,
    unid_med_id        INT        NOT NULL,
    CONSTRAINT fk_produto_categorias
        FOREIGN KEY (cat_id)
        REFERENCES categorias(cat_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_produto_unidade_medida
        FOREIGN KEY (unid_med_id)
        REFERENCES unidade_medida(unid_med_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

-- =========================
-- TABELA: localizacao_produtos
-- =========================
CREATE TABLE localizacao_produtos (
    lcl_id          INT AUTO_INCREMENT PRIMARY KEY,
    lcl_prod_estoque INT        NOT NULL,
    pdt_id          INT        NOT NULL,
    loc_id          INT        NOT NULL,
    CONSTRAINT fk_lclprod_produto
        FOREIGN KEY (pdt_id)
        REFERENCES produto(pdt_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_lclprod_localizacao
        FOREIGN KEY (loc_id)
        REFERENCES localizacao(loc_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

-- =========================
-- TABELA: entrada
-- =========================
CREATE TABLE entrada (
    ent_id           INT AUTO_INCREMENT PRIMARY KEY,
    loc_id           INT        NOT NULL,
    fncd_id          INT        NOT NULL,
    ent_data_compra  DATETIME   NOT NULL,
    ent_valor_compra DECIMAL(10,2) NOT NULL,
    ent_data         DATETIME   NOT NULL,
    CONSTRAINT fk_entrada_localizacao
        FOREIGN KEY (loc_id)
        REFERENCES localizacao(loc_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_entrada_fornecedor
        FOREIGN KEY (fncd_id)
        REFERENCES fornecedor(fncd_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

-- =========================
-- TABELA: entrada_produtos
-- (tabela de relação N:N entre entrada e produto)
-- =========================
CREATE TABLE entrada_produtos (
    ent_id        INT NOT NULL,
    pdt_id        INT NOT NULL,
    ent_prod_qtde INT NOT NULL,
    ent_prod_lote INT,
    PRIMARY KEY (ent_id, pdt_id),
    CONSTRAINT fk_entprod_entrada
        FOREIGN KEY (ent_id)
        REFERENCES entrada(ent_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_entprod_produto
        FOREIGN KEY (pdt_id)
        REFERENCES produto(pdt_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

-- =========================
-- TABELA: saida_produtos
-- =========================
CREATE TABLE saida_produtos (
    sai_id          INT AUTO_INCREMENT PRIMARY KEY,
    lcl_id          INT          NOT NULL,
    lcl_qtde        DECIMAL(10,2) NOT NULL,
    lcl_data_saida  DATETIME     NOT NULL,
    lcl_destino     VARCHAR(100) NOT NULL,
    lcl_tipo        VARCHAR(100) NOT NULL,
    lcl_justificativa VARCHAR(255) NOT NULL,
    CONSTRAINT fk_saida_lclprod
        FOREIGN KEY (lcl_id)
        REFERENCES localizacao_produtos(lcl_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

-- =========================
-- TABELA: destino_movimentacao
-- (relação entre saída e localização_produtos)
-- =========================
CREATE TABLE destino_movimentacao (
    sai_id INT NOT NULL,
    lcl_id INT NOT NULL,
    PRIMARY KEY (sai_id, lcl_id),
    CONSTRAINT fk_destmov_saida
        FOREIGN KEY (sai_id)
        REFERENCES saida_produtos(sai_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_destmov_lclprod
        FOREIGN KEY (lcl_id)
        REFERENCES localizacao_produtos(lcl_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;
