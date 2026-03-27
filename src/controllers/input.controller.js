const pool = require("../config/database");
const { registerAudit } = require("../services/audit.services");

const {
  updateColunaEstoqueAtual,
} = require("../services/updateColunaEstoqueAtual");

// REGISTRAR PRODUTO (ENTRADA)
const registerInput = async (req, res) => {
  let connection;

  try {
    const { loc_id, fncd_id, ent_data_compra, ent_valor_compra, produtos } =
      req.body;

    if (
      !loc_id ||
      !fncd_id ||
      !ent_data_compra ||
      ent_valor_compra === undefined
    ) {
      return res.status(400).json({
        erro: "loc_id, fncd_id, ent_data_compra e ent_valor_compra são obrigatórios",
      });
    }

    if (!Array.isArray(produtos) || produtos.length === 0) {
      return res.status(400).json({
        erro: "produtos deve ser um array com ao menos um item",
      });
    }

    for (const [index, product] of produtos.entries()) {
      if (!product?.pdt_id || !product?.quantidade) {
        return res.status(400).json({
          erro: `Produto na posição ${index} sem pdt_id ou quantidade`,
        });
      }

      // A coluna ent_prod_lote está como INT no schema atual.
      if (product.lote !== undefined && Number.isNaN(Number(product.lote))) {
        return res.status(400).json({
          erro: `O campo lote do produto na posição ${index} deve ser numérico (schema atual: INT)`,
        });
      }
    }

    connection = await pool.getConnection();

    // Começo da transação: garante que ou salva tudo, ou não salva nada
    await connection.beginTransaction();

    // 1. Inserir a "Capa" da Entrada (Nota Fiscal/Registro Geral)
    const [inputResult] = await connection.query(
      `INSERT INTO entrada 
      (loc_id, fncd_id, ent_data_compra, ent_valor_compra, ent_data)
      VALUES (?, ?, ?, ?, NOW())`,
      [loc_id, fncd_id, ent_data_compra, ent_valor_compra],
    );

    const ent_id = inputResult.insertId;

    await registerAudit(
      req.user.user_id,
      "Atualização de estoque - entrada",
      "entrada",
      ent_id,
    );

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
          product.lote === undefined ? null : Number(product.lote),
        ],
      );
      // Ao rodar o INSERT acima, a Trigger do MySQL
      // é disparada e atualiza o 'pdt_estoque_atual' na tabela 'produto' automaticamente!
    }

    await updateColunaEstoqueAtual(connection);

    // 3. Tudo deu certo? Confirma a transação
    await connection.commit();

    res.status(201).json({
      mensagem: "Entrada registrada com sucesso",
      ent_id: ent_id,
    });
  } catch (error) {
    // Deu algum erro? Desfaz tudo que foi inserido nesta tentativa
    if (connection) {
      await connection.rollback();
    }

    console.error("Erro ao registrar entrada:", error);

    res.status(500).json({
      erro: "Erro ao registrar entrada",
      detalhe: error?.sqlMessage || error?.message || "Sem detalhes",
    });
  } finally {
    // Libera a conexão de volta para o Pool
    if (connection) {
      connection.release();
    }
  }
};

module.exports = { registerInput };
