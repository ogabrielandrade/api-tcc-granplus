const pool              = require("../config/database");
const { registerAudit } = require('../services/audit.services');


// REGISTRAR PRODUTO
const registerInput = async (req, res) => {
  const connection = await pool.getConnection();

  try {

    const {
      loc_id,
      fncd_id,
      ent_data_compra,
      ent_valor_compra,
      produtos
    } = req.body;

    await connection.beginTransaction(); // começo da transição, so será interompida por um commit (se der certo) ou por um rollback (se der erro)

    // inserir entrada
    const [inputResult] = await connection.query(
      `INSERT INTO entrada 
      (loc_id, fncd_id, ent_data_compra, ent_valor_compra, ent_data)
      VALUES (?, ?, ?, ?, NOW())`,
      [loc_id, fncd_id, ent_data_compra, ent_valor_compra]
    );

    const ent_id = inputResult.insertId;

    await registerAudit(req.user.user_id, "Atualização de estoque - saída", "entrada_produtos", inputResult.insertId);

    // inserir produtos da entrada
    for (const product of produtos) {

      await connection.query(
        `INSERT INTO entrada_produtos
        (ent_id, pdt_id, ent_prod_qtde, ent_prod_lote)
        VALUES (?, ?, ?, ?)`,
        [
          ent_id,
          product.pdt_id,
          product.quantidade,
          product.lote
        ]
      );

    }

    await connection.commit();

    res.status(201).json({
      mensagem: "Entrada registrada com sucesso",
      ent_id: ent_id
    });

  } catch (error) {

    await connection.rollback();

    console.error("Erro ao registrar entrada:", error);

    res.status(500).json({
      erro: "Erro ao registrar entrada"
    });

  } finally {

    connection.release();

  }
};

module.exports = { registerInput };