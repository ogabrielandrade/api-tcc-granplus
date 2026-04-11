const pool = require("../config/database");

const getDashboardResume = async (req, res) => {
  const { pdt_id } = req.params;

  try {
    const [totalProdutos] = await pool.execute(`
                SELECT COUNT(*) AS total_produtos
                FROM produto
                WHERE pdt_ativo = 1
        `);

    const [estoqueMinimo] = await pool.execute(`
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

    const [entradasHoje] = await pool.execute(`
      SELECT COUNT(*) AS entradas_hoje
      FROM entrada
      WHERE DATE(ent_data) = CURDATE()
    `);

    const [saidasHoje] = await pool.execute(`
      SELECT COUNT(*) AS saidas_hoje
      FROM saida_produtos
      WHERE DATE(lcl_data_saida) = CURDATE()
    `);

    const [totalMovimentacoes] = await pool.execute(`
      select p.pdt_id, 
	           p.pdt_nome,
       (
              select ifnull(sum(ep.ent_prod_qtde), 0) as total_entradas
                from entrada_produtos ep
                where ep.pdt_id = p.pdt_id)
              +
              (select ifnull(sum(sp.lcl_qtde), 0) as total_saidas
                from localizacao_produtos lp
                join saida_produtos sp on lp.lcl_id = sp.lcl_id
                where lp.pdt_id = p.pdt_id ) as movimentacoes
                from produto p
                order by movimentacoes desc
                limit 0, 5; 
      `);

    res.json({
      total_produtos: totalProdutos[0].total_produtos,
      produtos_abaixo_minimo: estoqueMinimo[0].abaixo_minimo,
      entradas_hoje: entradasHoje[0].entradas_hoje,
      saidas_hoje: saidasHoje[0].saidas_hoje,
      total_movimentacoes: totalMovimentacoes,
    });
  } catch (error) {
    console.error("Erro no dashboard:", error);
    res.status(500).json({ erro: "Erro ao carregar dashboard" });
  }
};

const resumeForProduct = async (req, res) => {
  const { pdt_id } = req.params;

  try {
    const [estoqueAtualPorProduto] = await pool.execute(
      `
        SELECT pdt_id, pdt_nome, pdt_estoque_minimo, pdt_estoque_atual
          FROM produto
          WHERE pdt_id = ?
        `,
      [pdt_id],
    );

    res.status(200).json({
      estoqueAtualPorProduto
    });
  } catch (error) {
    console.error(error);
  }
};

module.exports = { getDashboardResume, resumeForProduct };
