const pool = require("../config/database");

const calculateStock = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscamos apenas o produto e o saldo que a Trigger já calculou
    const [produto] = await pool.query(
      `SELECT 
         pdt_id AS produto_id,
         pdt_nome,
         pdt_estoque_atual AS estoque_atual
       FROM produto
       WHERE pdt_id = ? AND pdt_ativo = 1`,
      [id]
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
    // Fim dos múltiplos JOINs e SUMs perigosos. 
    // Lemos diretamente a coluna que a Trigger mantém atualizada.
    const [todoEstoque] = await pool.query(`
      SELECT 
          pdt_id,
          pdt_nome,
          pdt_estoque_minimo,
          pdt_descricao,
          pdt_codigo,
          pdt_estoque_atual AS estoque_atual
      FROM produto
      WHERE pdt_ativo = 1
      ORDER BY pdt_nome
    `);

    res.json(todoEstoque);

  } catch (error) {
    console.error("Erro ao buscar estoque geral:", error);
    res.status(500).json({ erro: "Erro ao buscar estoque geral" });
  }
};

module.exports = { calculateStock, getAllStock };