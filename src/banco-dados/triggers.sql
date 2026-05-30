-- adcionar email e campos para reset de senha
ALTER TABLE usuarios 
ADD COLUMN user_email VARCHAR(100) UNIQUE AFTER user_nome,
ADD COLUMN reset_token VARCHAR(255) NULL,
ADD COLUMN reset_expires DATETIME NULL;

UPDATE usuarios SET user_email = 'seu_email_real@gmail.com' WHERE user_id = 1;

-- triggers para o banco de dados 


ALTER TABLE produto 
ADD COLUMN pdt_estoque_atual INT NOT NULL DEFAULT 0;

DELIMITER //

CREATE TRIGGER trg_entrada_insert
AFTER INSERT ON entrada_produtos
FOR EACH ROW
BEGIN
    -- Soma a nova quantidade ao estoque
    UPDATE produto
    SET pdt_estoque_atual = pdt_estoque_atual + NEW.ent_prod_qtde
    WHERE pdt_id = NEW.pdt_id;
END //

DELIMITER ;

DELIMITER //

CREATE TRIGGER trg_entrada_delete
BEFORE DELETE ON entrada_produtos
FOR EACH ROW
BEGIN
    DECLARE v_estoque_atual INT;

    -- 1. Consulta qual é o estoque atual do produto
    SELECT pdt_estoque_atual INTO v_estoque_atual
    FROM produto
    WHERE pdt_id = OLD.pdt_id;

    -- 2. Validação: O estoque atual não pode ser menor que a quantidade que estamos tentando apagar
    IF v_estoque_atual < OLD.ent_prod_qtde THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Exclusão bloqueada: Esses produtos já tiveram saída e o estoque ficaria negativo.';
    END IF;

    -- 3. Se passar no teste, subtrai com segurança
    UPDATE produto
    SET pdt_estoque_atual = pdt_estoque_atual - OLD.ent_prod_qtde
    WHERE pdt_id = OLD.pdt_id;
END //

DELIMITER ;

DELIMITER //

CREATE TRIGGER trg_entrada_update
BEFORE UPDATE ON entrada_produtos
FOR EACH ROW
BEGIN
    DECLARE v_estoque_antigo INT;

    -- CENÁRIO 1: O usuário editou apenas a quantidade (o produto é o mesmo)
    IF OLD.pdt_id = NEW.pdt_id THEN
        
        SELECT pdt_estoque_atual INTO v_estoque_antigo FROM produto WHERE pdt_id = OLD.pdt_id;

        IF (v_estoque_antigo - OLD.ent_prod_qtde + NEW.ent_prod_qtde) < 0 THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Edição bloqueada: A redução desta entrada deixaria o estoque negativo.';
        END IF;

        UPDATE produto
        SET pdt_estoque_atual = (pdt_estoque_atual - OLD.ent_prod_qtde) + NEW.ent_prod_qtde
        WHERE pdt_id = NEW.pdt_id;

    -- CENÁRIO 2: O usuário trocou o produto inteiro na edição!
    ELSE
        
        SELECT pdt_estoque_atual INTO v_estoque_antigo FROM produto WHERE pdt_id = OLD.pdt_id;

        -- Verifica se podemos remover do produto antigo sem negativá-lo
        IF (v_estoque_antigo - OLD.ent_prod_qtde) < 0 THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Não é possível trocar o produto. O item original já teve saída e seu estoque ficaria negativo.';
        END IF;

        -- 1. Subtrai (devolve) o valor do produto antigo
        UPDATE produto
        SET pdt_estoque_atual = pdt_estoque_atual - OLD.ent_prod_qtde
        WHERE pdt_id = OLD.pdt_id;

        -- 2. Adiciona o valor no produto novo
        UPDATE produto
        SET pdt_estoque_atual = pdt_estoque_atual + NEW.ent_prod_qtde
        WHERE pdt_id = NEW.pdt_id;

    END IF;
END //

DELIMITER ;

DELIMITER //

CREATE TRIGGER trg_saida_insert
BEFORE INSERT ON saida_produtos
FOR EACH ROW
BEGIN
    DECLARE v_produto_id INT;
    DECLARE v_estoque_atual INT;

    SELECT lp.pdt_id, p.pdt_estoque_atual
    INTO v_produto_id, v_estoque_atual
    FROM localizacao_produtos lp
    JOIN produto p ON p.pdt_id = lp.pdt_id
    WHERE lp.lcl_id = NEW.lcl_id
    LIMIT 1;

    IF v_produto_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Localização inválida para registrar saída';
    END IF;

    IF v_estoque_atual < NEW.lcl_qtde THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Estoque insuficiente';
    END IF;

    UPDATE produto
    SET pdt_estoque_atual = pdt_estoque_atual - NEW.lcl_qtde
    WHERE pdt_id = v_produto_id;
END //

DELIMITER ;

DELIMITER //

CREATE TRIGGER trg_saida_delete
AFTER DELETE ON saida_produtos
FOR EACH ROW
BEGIN
    DECLARE v_produto_id INT;
    
    -- 1. Descobre qual era o produto daquela localização
    SELECT pdt_id INTO v_produto_id 
    FROM localizacao_produtos 
    WHERE lcl_id = OLD.lcl_id 
    LIMIT 1;

    -- 2. Devolve (soma) a quantidade de volta ao estoque
    UPDATE produto
    SET pdt_estoque_atual = pdt_estoque_atual + OLD.lcl_qtde
    WHERE pdt_id = v_produto_id;
END //

DELIMITER ;

DELIMITER //

CREATE TRIGGER trg_saida_update
BEFORE UPDATE ON saida_produtos
FOR EACH ROW
BEGIN
    DECLARE v_old_produto_id INT;
    DECLARE v_new_produto_id INT;
    DECLARE v_old_estoque INT;
    DECLARE v_new_estoque INT;

    SELECT lp.pdt_id, p.pdt_estoque_atual
    INTO v_old_produto_id, v_old_estoque
    FROM localizacao_produtos lp
    JOIN produto p ON p.pdt_id = lp.pdt_id
    WHERE lp.lcl_id = OLD.lcl_id
    LIMIT 1;

    SELECT lp.pdt_id, p.pdt_estoque_atual
    INTO v_new_produto_id, v_new_estoque
    FROM localizacao_produtos lp
    JOIN produto p ON p.pdt_id = lp.pdt_id
    WHERE lp.lcl_id = NEW.lcl_id
    LIMIT 1;

    IF v_old_produto_id IS NULL OR v_new_produto_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Localização inválida para atualizar saída';
    END IF;

    IF v_old_produto_id = v_new_produto_id THEN
        IF (v_new_estoque + OLD.lcl_qtde - NEW.lcl_qtde) < 0 THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Estoque insuficiente';
        END IF;

        UPDATE produto
        SET pdt_estoque_atual = pdt_estoque_atual + OLD.lcl_qtde - NEW.lcl_qtde
        WHERE pdt_id = v_new_produto_id;
    ELSE
        UPDATE produto
        SET pdt_estoque_atual = pdt_estoque_atual + OLD.lcl_qtde
        WHERE pdt_id = v_old_produto_id;

        IF v_new_estoque < NEW.lcl_qtde THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Estoque insuficiente';
        END IF;

        UPDATE produto
        SET pdt_estoque_atual = pdt_estoque_atual - NEW.lcl_qtde
        WHERE pdt_id = v_new_produto_id;
    END IF;
END //

DELIMITER ;