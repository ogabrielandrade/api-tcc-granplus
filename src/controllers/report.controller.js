const pool = require("../config/database");

const getMoreMovedProducts = async (req, res) => {
  try {

    const [relatorio] = await pool.query(`
      SELECT 
          p.pdt_id,
          p.pdt_nome,

          IFNULL(SUM(ep.ent_prod_qtde),0) AS total_entradas,

          IFNULL(SUM(sp.lcl_qtde),0) AS total_saidas,

          IFNULL(SUM(ep.ent_prod_qtde),0) +
          IFNULL(SUM(sp.lcl_qtde),0) AS total_movimentado

      FROM produto p

      LEFT JOIN entrada_produtos ep 
      ON p.pdt_id = ep.pdt_id

      LEFT JOIN localizacao_produtos lp 
      ON p.pdt_id = lp.pdt_id

      LEFT JOIN saida_produtos sp 
      ON lp.lcl_id = sp.lcl_id

      GROUP BY p.pdt_id, p.pdt_nome

      ORDER BY total_movimentado DESC
    `);

    res.json(relatorio);

  } catch (error) {

    console.error("Erro ao gerar relatório:", error);
    res.status(500).json({ erro: "Erro ao gerar relatório" });

  }
};

const minimumStock = async (req, res) => {
    try {
        const [estoqueMinimo] = await pool.query(`
    SELECT 
		p.pdt_id,
        p.pdt_nome,
        p.pdt_estoque_minimo,
        
        IFNULL(SUM(ep.ent_prod_qtde), 0) - IFNULL(SUM(sp.lcl_qtde), 0) AS total_estoque
	  
      FROM produto p
      
      JOIN entrada_produtos ep ON p.pdt_id = ep.pdt_id
      
      JOIN localizacao_produtos lp ON p.pdt_id = lp.pdt_id
      
      JOIN saida_produtos sp ON lp.lcl_id = sp.lcl_id
      
      GROUP BY p.pdt_nome, p.pdt_id, p.pdt_estoque_minimo
      
      HAVING total_estoque < p.pdt_estoque_minimo
      
      ORDER BY total_estoque DESC;
    `)

    res.json(estoqueMinimo)

    } catch (error) {
        console.error(error)
        res.json({
            message: "Erro ao calcular o estoque mínimo"
        })
    }
}
    
    
module.exports = { getMoreMovedProducts, minimumStock };