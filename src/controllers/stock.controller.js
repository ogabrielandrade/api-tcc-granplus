const pool = require("../config/database");

// === NOVIDADE: A nossa função para a tela de Estoque Geral ===
const listAllStock = async (req, res) => { // Essa função vai listar o estoque geral, mostrando o nome do produto, o local de estoque e a quantidade disponível. Ela é diferente da função calculateStock, que calcula o estoque atual de um produto específico. 
                                           // A função listAllStock vai devolver uma lista com todos os produtos e seus respectivos estoques, para a tela de Estoque Geral.
  try {
    const [estoque] = await pool.query(`
      SELECT 
        lp.lcl_id, 
        p.pdt_nome, 
        l.loc_nome, 
        lp.lcl_prod_estoque 
      FROM localizacao_produtos lp
      JOIN produto p ON lp.pdt_id = p.pdt_id
      JOIN localizacao l ON lp.loc_id = l.loc_id
    `);
    
    // Devolve a lista pronta para o React
    res.json(estoque);
  } catch (error) {
    console.error("Erro ao listar estoque geral:", error);
    res.status(500).json({ erro: "Erro ao buscar o estoque geral" });
  }
};

const calculateStock = async (req, res) => { // Essa função é para a tela de Dashboard, onde queremos mostrar o estoque atual de um produto específico. Ela recebe o id do produto como parâmetro, calcula o total de entradas e saídas daquele produto e devolve o estoque atual.
  try {
    const { id } = req.params;

    const [entradas] = await pool.query(
      `SELECT IFNULL(SUM(ent_prod_qtde), 0) AS total_entrada
        FROM entrada_produtos
        WHERE pdt_id = ?`,
      [id],
    );

    const [saidas] = await pool.query(
      `SELECT IFNULL(SUM(sp.lcl_qtde), 0) AS total_saida
        FROM saida_produtos sp
        JOIN localizacao_produtos lp ON sp.lcl_id = lp.lcl_id
        WHERE lp.pdt_id = ?`,
      [id],
    );

    const estoqueAtual = entradas[0].total_entrada - saidas[0].total_saida;

    res.json({
      produto_id: id,
      total_entrada: entradas[0].total_entrada,
      total_saida: saidas[0].total_saida,
      estoque_atual: estoqueAtual,
    });
  } catch (error) {
    console.error("Erro ao calcular estoque:", error);
    res.status(500).json({ erro: "Erro ao calcular estoque" });
  }
};

// Exportar as funções aqui embaixo
module.exports = { calculateStock, listAllStock };