const pool = require("../config/database");

const updateColunaEstoqueAtual = async (pool) => {
  try {
    const [rows] = await pool.execute(`
               UPDATE produto p
               SET pdt_estoque_atual =
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
                
            ), 0); 
            `);
    return rows;
  } catch (error) {
    console.error(error);
    console.log("Falha ao atualizar a coluna de estoque");
    throw error;
  }
};

module.exports = { updateColunaEstoqueAtual };
