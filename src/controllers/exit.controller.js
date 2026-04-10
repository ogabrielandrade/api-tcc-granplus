const pool = require("../config/database.js");
const { registerAudit } = require("../services/audit.services");

const registerExit = async (req, res) => {
  try {
    const {
      pdt_id,
      loc_id,
      lcl_qtde,
      lcl_destino,
      lcl_tipo,
      lcl_justificativa,
    } = req.body;

    if (!pdt_id || !lcl_qtde) {
      return res
        .status(400)
        .json({ erro: "Produto e quantidade são obrigatórios" });
    }

    // 1. Busca o produto e estoque atual consolidado.
    const [produtoRows] = await pool.query(
      `SELECT pdt_id, pdt_estoque_atual
       FROM produto
       WHERE pdt_id = ?`,
      [pdt_id],
    );

    if (produtoRows.length === 0) {
      return res.status(404).json({ erro: "Produto não encontrado" });
    }

    const estoqueAtual = Number(produtoRows[0].pdt_estoque_atual || 0);

    // 1.5 Validação de validade - busca produtos com validade expirada ou próxima
    const [validadeRows] = await pool.query(
      `SELECT pdt_validade, ent_prod_qtde
       FROM entrada_produtos
       WHERE pdt_id = ? AND pdt_validade IS NOT NULL
       ORDER BY pdt_validade ASC`,
      [pdt_id],
    );

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const aviso = {
      tem_expirado: false,
      proximamente_vencimento: false,
      data_mais_proxima: null,
    };

    if (validadeRows.length > 0) {
      for (const row of validadeRows) {
        const dataValidade = new Date(row.pdt_validade);
        dataValidade.setHours(0, 0, 0, 0);

        if (dataValidade < hoje) {
          aviso.tem_expirado = true;
        } else if (
          dataValidade <= new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000)
        ) {
          // Se vence nos próximos 7 dias
          aviso.proximamente_vencimento = true;
        }

        if (
          !aviso.data_mais_proxima ||
          dataValidade < new Date(aviso.data_mais_proxima)
        ) {
          aviso.data_mais_proxima = row.pdt_validade;
        }
      }
    }

    // 2. Busca vínculo do produto na localização escolhida.
    const [produtoLocal] = await pool.query(
      `SELECT lp.lcl_id
       FROM localizacao_produtos lp
       WHERE lp.pdt_id = ?
         AND (? IS NULL OR lp.loc_id = ?)
       LIMIT 1`,
      [pdt_id, loc_id || null, loc_id || null],
    );

    let lcl_id = null;

    if (produtoLocal.length > 0) {
      lcl_id = produtoLocal[0].lcl_id;
    } else {
      const [locRows] = await pool.query(
        `SELECT loc_id
         FROM localizacao
         WHERE (? IS NULL OR loc_id = ?)
         ORDER BY loc_id
         LIMIT 1`,
        [loc_id || null, loc_id || null],
      );

      if (locRows.length === 0) {
        return res.status(400).json({
          erro: "Localização inválida para registrar saída",
        });
      }

      const [novoVinculo] = await pool.query(
        `INSERT INTO localizacao_produtos (lcl_prod_estoque, pdt_id, loc_id)
         VALUES (?, ?, ?)`,
        [estoqueAtual, pdt_id, locRows[0].loc_id],
      );

      lcl_id = novoVinculo.insertId;
    }

    // 3. Validação de estoque
    if (Number(lcl_qtde) > estoqueAtual) {
      return res.status(400).json({
        erro: "Estoque insuficiente",
        estoque_atual: estoqueAtual,
      });
    }

    // 4. Registrar a saída
    // ⚡ AQUI A MÁGICA ACONTECE: O INSERT dispara a Trigger no banco,
    // que vai lá na tabela 'produto' e subtrai a quantidade do 'pdt_estoque_atual'.
    const [result] = await pool.query(
      `INSERT INTO saida_produtos
      (lcl_id, lcl_qtde, lcl_data_saida, lcl_destino, lcl_tipo, lcl_justificativa)
      VALUES (?, ?, NOW(), ?, ?, ?)`,
      [
        lcl_id,
        Number(lcl_qtde),
        String(lcl_destino || "Não informado"),
        String(lcl_tipo || "Sem motivo informado"),
        String(lcl_justificativa || "Não informada"),
      ],
    );

    // 5. Registrar auditoria
    await registerAudit(
      req.user.user_id,
      "Atualização de estoque - saída",
      "saida_produtos",
      result.insertId,
    );

    res.status(201).json({
      mensagem: "Saída registrada com sucesso",
      sai_id: result.insertId,
      aviso_validade: aviso,
    });
  } catch (error) {
    console.error("Erro ao registrar saída:", error);

    res.status(500).json({
      erro: "Erro ao registrar saída",
      detalhe: error.message,
    });
  }
};

// Função para listar todas as saídas de produtos (consulta estática sem parâmetros externos, sendo imune a SQL Injection)
const getAllExits = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        s.sai_id AS sai_id,
        s.lcl_data_saida AS sai_data,
        s.lcl_qtde AS sai_quantidade,
        s.lcl_tipo AS sai_motivo,
        s.lcl_destino AS sai_destino,
        p.pdt_nome,
        l.loc_nome,
        ep.pdt_validade
      FROM saida_produtos s
      LEFT JOIN localizacao_produtos lp ON s.lcl_id = lp.lcl_id
      LEFT JOIN produto p ON lp.pdt_id = p.pdt_id
      LEFT JOIN localizacao l ON lp.loc_id = l.loc_id
      LEFT JOIN entrada_produtos ep ON p.pdt_id = ep.pdt_id
      ORDER BY s.lcl_data_saida DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error("Erro ao listar saídas:", error);
    res.status(500).json({ erro: "Erro ao listar saídas" });
  }
};

// Exportando os módulos de criação e listagem para a rota
module.exports = { registerExit, getAllExits };
