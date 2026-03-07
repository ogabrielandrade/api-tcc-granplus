const pool   = require("../config/database");
const bcrypt = require("bcrypt");
const jwt    = require("jsonwebtoken");

const login = async (req, res) => {
  try {
    const { usuario, senha } = req.body;

    // procurar usuário no banco
    const [rows] = await pool.query(
      `SELECT * FROM usuarios
       WHERE user_nome = ?
       AND user_ativo = 1`,
      [usuario],
    );

    if (rows.length === 0) {
      return res.status(401).json({
        erro: "Usuário ou senha inválidos",
      });
    }

    const user = rows[0];

    // comparar senha
    const validPassword = await bcrypt.compare(senha, user.user_senha);

    if (!validPassword) {
      return res.status(401).json({
        erro: "Usuário ou senha inválidos",
      });
    }

    // gerar token
    const token = jwt.sign(
      {
        user_id: user.user_id,
        nome: user.user_nome,
        nivel: user.user_nivel_acesso,
      },
      "segredo_super_secreto",
      {
        expiresIn: "8h",
      },
    );

    res.json({
      mensagem: "Login realizado com sucesso",
      token,
    });
  } catch (error) {
    console.error("Erro no login:", error);

    res.status(500).json({
      erro: "Erro ao realizar login",
    });
  }
};

module.exports = login;
