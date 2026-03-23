const pool = require("../config/database");

exports.getDashboardResume = async (req, res) => {
  try {
    const [totalProdutos] = await pool.query(`
                SELECT COUNT(*) AS total_produtos
                FROM produto
                WHERE pdt_ativo = 1
        `);

    const [estoqueMinimo] = await pool.query(`
        SELECT COUNT(*) AS abaixo_minimo
      FROM produto p
      WHERE (
        (SELECT IFNULL(SUM(ent_prod_qtde),0)
         FROM entrada_produtos
         WHERE pdt_id = p.pdt_id)
        -
        (SELECT IFNULL(SUM(sp.lcl_qtde),0)
         FROM saida_produtos sp
         JOIN localizacao_produtos lp ON sp.lcl_id = lp.lcl_id
         WHERE lp.pdt_id = p.pdt_id)
      ) < p.pdt_estoque_minimo
        `);

    const [entradasHoje] = await pool.query(`
      SELECT COUNT(*) AS entradas_hoje
      FROM entrada
      WHERE DATE(ent_data) = CURDATE()
    `);

    const [saidasHoje] = await pool.query(`
      SELECT COUNT(*) AS saidas_hoje
      FROM saida_produtos
      WHERE DATE(lcl_data_saida) = CURDATE()
    `);

    res.json({
      total_produtos: totalProdutos[0].total_produtos,
      produtos_abaixo_minimo: estoqueMinimo[0].abaixo_minimo,
      entradas_hoje: entradasHoje[0].entradas_hoje,
      saidas_hoje: saidasHoje[0].saidas_hoje,
    });
  } catch (error) {
    console.error("Erro no dashboard:", error);
    res.status(500).json({ erro: "Erro ao carregar dashboard" });
  }
};
