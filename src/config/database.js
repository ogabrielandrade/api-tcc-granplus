require("dotenv").config();
const mysql = require("mysql2/promise");

const config = {
  // Obtém as configurações do banco de dados a partir do arquivo .env
  host: process.env.BD_SERVIDOR,
  port: process.env.BD_PORTA || 3306, // Porta padrão 3306 se não definida
  user: process.env.BD_USUARIO,
  password: process.env.BD_SENHA,
  database: process.env.BD_BANCO,
  waitForConnections: true,
  connectionLimit: 10, // Pode ajustar conforme a necessidade
  queueLimit: 0,
};

let pool; // conjunto de conexões abertas

const initializeDatabase = async () => {
  try {
    pool = mysql.createPool(config); // Cria o pool de conexões

    // Testa a conectividade com uma conexão simples
    const connection = await pool.getConnection(); //pega uma conexão disponível do pool, deixa disponível para uso até ser liberada por meio do 'connection.realease()'

    console.log("Conexão MySQL estabelecida com sucesso!");
    connection.release();

    async function testQuery() {
      try {
        const [produto] = await pool.execute(
          "SELECT * FROM produto WHERE pdt_id = ?",
          [1],
        );
        console.log(produto);
      } catch (error) {
        console.log(error);
      }
    }

    testQuery();

    connection.release(); // Libera a conexão de volta para a pool
  } catch (error) {
    console.error("Erro ao conectar ao banco de dados:", error.message);
    process.exit(1); // Encerra o processo se a conexão falhar
  }
};

initializeDatabase(); // Inicializa o banco de dados ao carregar o módulo

module.exports = pool;
