const pool = require("../config/database");
const { registerAudit } = require('../services/audit.services');

// REGISTRAR PRODUTO (ENTRADA)
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

    // Começo da transação: garante que ou salva tudo, ou não salva nada
    await connection.beginTransaction(); 

    // 1. Inserir a "Capa" da Entrada (Nota Fiscal/Registro Geral)
    const [inputResult] = await connection.query(
      `INSERT INTO entrada 
      (loc_id, fncd_id, ent_data_compra, ent_valor_compra, ent_data)
      VALUES (?, ?, ?, ?, NOW())`,
      [loc_id, fncd_id, ent_data_compra, ent_valor_compra]
    );

    const ent_id = inputResult.insertId;

    // Correção: Alterado de "saída" para "entrada"
    await registerAudit(req.user.user_id, "Atualização de estoque - entrada", "entrada", ent_id);

    // 2. Inserir os produtos da entrada
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
      // ⚡ AQUI A MÁGICA ACONTECE: Ao rodar o INSERT acima, a Trigger do MySQL
      // é disparada e atualiza o 'pdt_estoque_atual' na tabela 'produto' automaticamente!
    }

    // 3. Tudo deu certo? Confirma a transação
    await connection.commit();

    res.status(201).json({
      mensagem: "Entrada registrada com sucesso",
      ent_id: ent_id
    });

  } catch (error) {
    // Deu algum erro? Desfaz tudo que foi inserido nesta tentativa
    await connection.rollback();

    console.error("Erro ao registrar entrada:", error);

    res.status(500).json({
      erro: "Erro ao registrar entrada"
    });

  } finally {
    // Libera a conexão de volta para o Pool
    connection.release();
  }
};

module.exports = { registerInput };