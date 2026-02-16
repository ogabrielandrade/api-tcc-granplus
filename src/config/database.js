require('dotenv').config();
const mysql = require('mysql2/promise');

// Obtém as configurações do banco de dados a partir do arquivo .env
const config = {
  host: process.env.BD_SERVIDOR,
  port: process.env.BD_PORTA || 3306, // Porta padrão 3306 se não definida
  user: process.env.BD_USUARIO,
  password: process.env.BD_SENHA,
  database: process.env.BD_BANCO,
  waitForConnections: true,
  connectionLimit: 10, // Pode ajustar conforme a necessidade
  queueLimit: 0,
};

let pool;

const initializeDatabase = async () => {
  try {
    // Cria o pool de conexões
    pool = mysql.createPool(config);

    // Testa a conectividade com uma conexão simples
    const connection = await pool.getConnection();
    console.log('Conexão MySQL estabelecida com sucesso!');
    connection.release(); // Libera a conexão de volta para a pool
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error.message);
    process.exit(1); // Encerra o processo se a conexão falhar
  }
};

// Inicializa o banco de dados ao carregar o módulo
initializeDatabase();

module.exports = pool;
