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
AFTER DELETE ON entrada_produtos
FOR EACH ROW
BEGIN
    -- Se a entrada foi cancelada/deletada, precisamos SUBTRAIR esse valor do estoque
    UPDATE produto
    SET pdt_estoque_atual = pdt_estoque_atual - OLD.ent_prod_qtde
    WHERE pdt_id = OLD.pdt_id;
END //

DELIMITER ;

DELIMITER //

CREATE TRIGGER trg_entrada_update
AFTER UPDATE ON entrada_produtos
FOR EACH ROW
BEGIN
    -- Remove o valor antigo (OLD) e adiciona o valor corrigido (NEW)
    UPDATE produto
    SET pdt_estoque_atual = (pdt_estoque_atual - OLD.ent_prod_qtde) + NEW.ent_prod_qtde
    WHERE pdt_id = NEW.pdt_id;
END //

DELIMITER ;

DELIMITER //

CREATE TRIGGER trg_saida_insert
AFTER INSERT ON saida_produtos
FOR EACH ROW
BEGIN
    DECLARE v_produto_id INT;
    
    -- 1. Descobre qual é o produto vinculado a essa localização
    SELECT pdt_id INTO v_produto_id 
    FROM localizacao_produtos 
    WHERE lcl_id = NEW.lcl_id 
    LIMIT 1;

    -- 2. Subtrai a quantidade do estoque do produto encontrado
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
AFTER UPDATE ON saida_produtos
FOR EACH ROW
BEGIN
    DECLARE v_old_produto_id INT;
    DECLARE v_new_produto_id INT;	

    -- 1. Descobre os IDs (pode ser o mesmo produto, ou produtos diferentes se a localização mudou)
    SELECT pdt_id INTO v_old_produto_id FROM localizacao_produtos WHERE lcl_id = OLD.lcl_id LIMIT 1;
    SELECT pdt_id INTO v_new_produto_id FROM localizacao_produtos WHERE lcl_id = NEW.lcl_id LIMIT 1;

    -- 2. Devolve a quantidade antiga para o produto antigo
    UPDATE produto
    SET pdt_estoque_atual = pdt_estoque_atual + OLD.lcl_qtde
    WHERE pdt_id = v_old_produto_id;

    -- 3. Subtrai a quantidade nova do produto novo
    UPDATE produto
    SET pdt_estoque_atual = pdt_estoque_atual - NEW.lcl_qtde
    WHERE pdt_id = v_new_produto_id;
END //

DELIMITER ;