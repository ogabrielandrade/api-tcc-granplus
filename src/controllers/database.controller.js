const pool = require("../config/database");

exports.testDataBase = async (req, res) => {
  try {
    const [produto] = await pool.execute(
      /*   "SELECT * FROM produto WHERE pdt_id = ?",
        [1],*/
      "SELECT 1 as status",
    );
      /*  res.json(produto);
      } catch (error) {
        console.error(error);
        res.status(500).json({
          erro: "Erro ao consultar banco",
        });*/
    res.status(200).json({
      mensagem: "Conexão com o banco de dados está 100% ativa! 🚀",
      banco_status: result[0].status === 1 ? "OK" : "Desconhecido",
    });
  } catch (error) {
    console.error("Erro no teste de conexão com o banco:", error);

    res.status(500).json({
      erro: "Falha ao comunicar com o banco de dados",
      detalhe: error.message, // Ajuda a debugar se for erro de senha, porta, etc.
    });
  }
};
/* pdt_id = 1 é que, se um dia você limpar a sua tabela de produtos ou deletar esse produto número 1,
 a query vai retornar um array vazio []*/
