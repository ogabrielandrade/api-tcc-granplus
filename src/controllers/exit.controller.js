const pool = require("../config/database.js");

const registerExit = async (req, res) => {
  try {
    const { lcl_id, lcl_qtde, lcl_destino, lcl_tipo, lcl_justificativa } =
      req.body;

    // descobrir qual produto está na localização
    const [produtoLocal] = await pool.query(
      `SELECT pdt_id
       FROM localizacao_produtos
       WHERE lcl_id = ?`,
       [lcl_id],
    );

    if (produtoLocal.length === 0) {
      return res.status(404).json({
        erro: "Localização não encontrada",
      });
    }

    const pdt_id = produtoLocal[0].pdt_id;

    const [entradas] = await pool.query(
      `SELECT IFNULL(SUM(ent_prod_qtde),0) AS total
       FROM entrada_produtos
       WHERE pdt_id = ?`,
      [pdt_id]
    );

    //  calcular saídas
    const [saidas] = await pool.query(
      `SELECT IFNULL(SUM(sp.lcl_qtde),0) AS total
       FROM saida_produtos sp
       JOIN localizacao_produtos lp
       ON sp.lcl_id = lp.lcl_id
       WHERE lp.pdt_id = ?`,
      [pdt_id]
    );

    const estoqueAtual =
      entradas[0].total - saidas[0].total;

      //  validação de estoque
    if (lcl_qtde > estoqueAtual) {
      return res.status(400).json({
        erro: "Estoque insuficiente",
        estoque_atual: estoqueAtual
      });
    }

    const [result] = await pool.query(
      `INSERT INTO saida_produtos
      (lcl_id, lcl_qtde, lcl_data_saida, lcl_destino, lcl_tipo, lcl_justificativa)
      VALUES (?, ?, NOW(), ?, ?, ?)`,
      [lcl_id, lcl_qtde, lcl_destino, lcl_tipo, lcl_justificativa],
    );

    res.status(201).json({
      mensagem: "Saída registrada com sucesso",
      sal_id: result.insertId,
    });
  } catch (error) {
    console.error("Erro ao registrar saída:", error);

    res.status(500).json({
      erro: "Erro ao registrar saída",
    });
  }
};

module.exports = { registerExit };
