const pool = require("../config/database");

const calculateStock = async (req, res) => {
  try {
    const { id } = req.params;

    // Soma das entradas
    const [entradas] = await pool.query(
      // entradas seria uma 'rows', retorna dados em forma de array
      `SELECT IFNULL(SUM(ent_prod_qtde), 0) AS total_entrada
        FROM entrada_produtos
        WHERE pdt_id = ?`,
      [id],
    );

    // Soma das saídas
    const [saidas] = await pool.query(
      `SELECT IFNULL(SUM(sp.lcl_qtde), 0) AS total_saida
        FROM saida_produtos sp
        JOIN localizacao_produtos lp ON sp.lcl_id = lp.lcl_id
        WHERE lp.pdt_id = ?`,
      [id],
    );

    const estoqueAtual = entradas[0].total_entrada - saidas[0].total_saida;
    // por que precisa-se passar o índice em 'entrdas' e 'saidas'? O mysql2 retorna rows e fields(metadados), no caso vamos aproveitar apenas as rows, e as rows são sempre arrays; depois, digitamos o .total_entrada, para pegar o valor dessa propriedade

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

module.exports = { calculateStock };
