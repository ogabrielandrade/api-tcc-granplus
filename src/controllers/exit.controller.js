const pool = require("../config/database.js");
const { registerAudit } = require('../services/audit.services');

const registerExit = async (req, res) => {
  try {
    const { lcl_id, lcl_qtde, lcl_destino, lcl_tipo, lcl_justificativa } = req.body;

    // 1. Descobrir qual produto está na localização E pegar o saldo global pronto
    // Trocamos as 3 queries antigas por 1 único JOIN super rápido
    const [produtoLocal] = await pool.query(
      `SELECT lp.pdt_id, p.pdt_estoque_atual
       FROM localizacao_produtos lp
       JOIN produto p ON lp.pdt_id = p.pdt_id
       WHERE lp.lcl_id = ?`,
       [lcl_id]
    );

    if (produtoLocal.length === 0) {
      return res.status(404).json({
        erro: "Produto não encontrado nesta localização",
      });
    }

    // Pegamos o estoque atual que a Trigger já calculou e salvou na tabela 'produto'
    const estoqueAtual = produtoLocal[0].pdt_estoque_atual;

    // 2. Validação de estoque
    if (lcl_qtde > estoqueAtual) {
      return res.status(400).json({
        erro: "Estoque insuficiente",
        estoque_atual: estoqueAtual
      });
    }

    // 3. Registrar a saída
    // ⚡ AQUI A MÁGICA ACONTECE: O INSERT dispara a Trigger no banco,
    // que vai lá na tabela 'produto' e subtrai a quantidade do 'pdt_estoque_atual'.
    const [result] = await pool.query(
      `INSERT INTO saida_produtos
      (lcl_id, lcl_qtde, lcl_data_saida, lcl_destino, lcl_tipo, lcl_justificativa)
      VALUES (?, ?, NOW(), ?, ?, ?)`,
      [lcl_id, lcl_qtde, lcl_destino, lcl_tipo, lcl_justificativa]
    );

    // 4. Registrar auditoria (Ficou no lugar perfeito!)
    await registerAudit(
      req.user.user_id, 
      "Atualização de estoque - saída", 
      "saida_produtos", 
      result.insertId
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