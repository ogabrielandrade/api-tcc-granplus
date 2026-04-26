const pool = require("../config/database");

const calculateStock = async (req, res) => {
  try {
    const { id } = req.params;

    // Retorna uma unica linha do produto com saldo consolidado.
    const [produto] = await pool.execute(
      `SELECT 
         p.pdt_id AS produto_id,
         p.pdt_nome,
         p.pdt_estoque_minimo,
         p.pdt_descricao,
         p.pdt_codigo,
         (
           COALESCE((
             SELECT SUM(ep2.ent_prod_qtde)
             FROM entrada_produtos ep2
             WHERE ep2.pdt_id = p.pdt_id
           ), 0)
           -
           COALESCE((
             SELECT SUM(sp2.lcl_qtde)
             FROM saida_produtos sp2
             JOIN localizacao_produtos lp2 ON lp2.lcl_id = sp2.lcl_id
             WHERE lp2.pdt_id = p.pdt_id
           ), 0)

         ) AS estoque_atual
       FROM produto p
       WHERE p.pdt_id = ? AND p.pdt_ativo = 1`,
      [id],
    );

    if (produto.length === 0) {
      return res.status(404).json({ erro: "Produto não encontrado" });
    }

    // Retornamos o primeiro item do array
    res.json(produto[0]);
  } catch (error) {
    console.error("Erro ao calcular estoque:", error);
    res.status(500).json({ erro: "Erro ao buscar estoque" });
  }
};

const getAllStock = async (req, res) => {
  try {
    // Retorna produtos ativos com estoque consolidado e detalhes de lote/validade
    // para montagem do modal de lotes no frontend.
    const [todoEstoque] = await pool.execute(`
      SELECT 
          p.pdt_id,
          p.pdt_nome,
          p.pdt_estoque_minimo,
          p.pdt_descricao,
          p.pdt_codigo,
          ep.ent_prod_lote AS lote,
          ep.ent_prod_qtde AS quantidade_lote,
          ep.pdt_validade,
          (
            COALESCE((
              SELECT SUM(ep2.ent_prod_qtde)
              FROM entrada_produtos ep2
              WHERE ep2.pdt_id = p.pdt_id
            ), 0)
            -
            COALESCE((
              SELECT SUM(sp2.lcl_qtde)
              FROM saida_produtos sp2
              JOIN localizacao_produtos lp2 ON lp2.lcl_id = sp2.lcl_id
              WHERE lp2.pdt_id = p.pdt_id
            ), 0)
          ) AS estoque_atual
      FROM produto p
      LEFT JOIN entrada_produtos ep ON ep.pdt_id = p.pdt_id
      WHERE p.pdt_ativo = 1
      ORDER BY p.pdt_nome ASC, ep.pdt_validade ASC
    `);

    res.json(todoEstoque);
  } catch (error) {
    console.error("Erro ao buscar estoque geral:", error);
    res.status(500).json({ erro: "Erro ao buscar estoque geral" });
  }
};

module.exports = { calculateStock, getAllStock };
