const pool = require("../config/database");

// Função para gerar relatório de Produtos Mais Movimentados
const getMoreMovedProducts = async (req, res) => {
  try {
    // CORREÇÃO: Usando Sub-consultas para evitar a "multiplicação" do JOIN
    const [relatorio] = await pool.query(`
      SELECT 
          p.pdt_id,
          p.pdt_nome,

          /*IFNULL(SUM(ep.ent_prod_qtde),0) AS total_entradas,

          IFNULL(SUM(sp.lcl_qtde),0) AS total_saidas,

          IFNULL(SUM(ep.ent_prod_qtde),0) +
          IFNULL(SUM(sp.lcl_qtde),0) AS total_movimentado*/

          COALESCE(e.total_entradas, 0) AS total_entradas,
          COALESCE(s.total_saidas, 0) AS total_saidas,
          (COALESCE(e.total_entradas, 0) + COALESCE(s.total_saidas, 0)) AS total_movimentado

      FROM produto p

      /*LEFT JOIN entrada_produtos ep 
      ON p.pdt_id = ep.pdt_id

      LEFT JOIN localizacao_produtos lp 
      ON p.pdt_id = lp.pdt_id

      LEFT JOIN saida_produtos sp 
      ON lp.lcl_id = sp.lcl_id*/

      -- Sub-consulta: Soma apenas as entradas antes de juntar
      LEFT JOIN (
        SELECT pdt_id, SUM(ent_prod_qtde) AS total_entradas 
        FROM entrada_produtos 
        GROUP BY pdt_id
      ) e ON p.pdt_id = e.pdt_id

      -- Sub-consulta: Soma apenas as saídas antes de juntar
      LEFT JOIN (
        SELECT lp.pdt_id, SUM(sp.lcl_qtde) AS total_saidas 
        FROM saida_produtos sp
        JOIN localizacao_produtos lp ON sp.lcl_id = lp.lcl_id
        GROUP BY lp.pdt_id
      ) s ON p.pdt_id = s.pdt_id

     -- GROUP BY p.pdt_id, p.pdt_nome

      ORDER BY total_movimentado DESC
    `);

    res.json(relatorio);
  } catch (error) {
    console.error(
      "Erro ao gerar relatório de produtos mais movimentados:",
      error,
    );
    res.status(500).json({ erro: "Erro ao gerar relatório" });
  }
};

const minimumStock = async (req, res) => {
  try {
    const [estoqueMinimo] = await pool.query(`
      SELECT
        dados.pdt_id,
        dados.pdt_nome,
        dados.pdt_estoque_minimo,
        dados.total_estoque
      FROM (
        SELECT
          p.pdt_id,
          p.pdt_nome,
          p.pdt_estoque_minimo,
          (
            COALESCE((
              SELECT SUM(ep.ent_prod_qtde)
              FROM entrada_produtos ep
              WHERE ep.pdt_id = p.pdt_id
            ), 0)
            -
            COALESCE((
              SELECT SUM(sp.lcl_qtde)
              FROM saida_produtos sp
              JOIN localizacao_produtos lp ON lp.lcl_id = sp.lcl_id
              WHERE lp.pdt_id = p.pdt_id
            ), 0)
          ) AS total_estoque
        FROM produto p
        WHERE p.pdt_ativo = 1
      ) AS dados
      WHERE dados.total_estoque < dados.pdt_estoque_minimo
      ORDER BY dados.total_estoque ASC;
    `);

    res.json(estoqueMinimo);
  } catch (error) {
    console.error("Erro ao calcular estoque mínimo:", error);
    res.status(500).json({
      message: "Erro interno ao calcular o estoque mínimo",
    });
  }
};

// Função para listar relatórios de auditoria (com filtros de período seguros)
const getAuditReports = async (req, res) => {
  const { period } = req.query; // Esperado: 'semanal/weekly', 'mensal/monthly', 'anual/annual'
  let dateFilter = "";

  // Validação estrita para evitar SQL Injection (só aceita valores pré-definidos)
  if (period === "weekly") {
    dateFilter = "AND aud_data >= DATE_SUB(CURDATE(), INTERVAL 1 WEEK)";
  } else if (period === "monthly") {
    dateFilter = "AND aud_data >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)";
  } else if (period === "annual") {
    dateFilter = "AND aud_data >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)";
  }

  try {
    const [reports] = await pool.query(`
      SELECT 
        a.aud_id,
        a.aud_data,
        a.aud_time,
        a.aud_acao,
        a.aud_tabela_afetada,
        a.aud_id_evento,
        a.user_id,
        u.user_nome
      FROM auditoria a
      LEFT JOIN usuarios u ON a.user_id = u.user_id
      WHERE 1=1 ${dateFilter}
      ORDER BY a.aud_data DESC, a.aud_time DESC
    `);

    res.json(reports);
  } catch (error) {
    console.error("Erro ao listar auditoria:", error);
    res.status(500).json({ erro: "Erro ao listar auditoria" });
  }
};

// Exporta os controllers para uso nas rotas
module.exports = { getMoreMovedProducts, minimumStock, getAuditReports };
