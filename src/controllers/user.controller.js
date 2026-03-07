const pool = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// listar todos os usuarios
exports.getAllUsers = async (req, res) => {
  try {
    const [usuarios] = await pool.query(`
            SELECT
                user_id,
                user_nome,
                user_nivel_acesso,
                user_ativo
            FROM usuarios
            WHERE user_ativo = 1
        `);
    res.json(usuarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      erro: "Erro ao buscar usuários no banco",
    });
  }
};

// buscar usuario por id
exports.getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const [usuario] = await pool.query(
      `
        SELECT
            user_id,
            user_nome,
            user_nivel_acesso,
            user_ativo
        FROM usuarios
        WHERE user_id = ? AND user_ativo =1 
     `,
      [id], //O ? é um placeholder (protege contra SQL Injection). o valor vem do id
    );

    if (usuario.length === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }
    res.json(usuario[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      erro: "Erro ao buscar usuário no banco",
    });
  }
};

// criar novo usuario
exports.createUser = async (req, res) => {
  const { user_nome, user_senha, user_nivel_acesso } = req.body;

  try {
    // Verificar se de usuário já existe
    const [existeUsuario] = await pool.query(
      `SELECT user_id FROM usuarios WHERE user_nome = ?`,
      [user_nome],
    );

    if (existeUsuario.length > 0) {
      return res.status(400).json({ erro: "Usuário já existe" });
    }

    // criptografar senha (Hash)
    const senhaHash = await bcrypt.hash(user_senha, 10);

    const [result] = await pool.query(
      `
            INSERT INTO usuarios
            (user_nome, user_senha, user_nivel_acesso)
            VALUES (?, ?, ?)`,
      [user_nome, senhaHash, user_nivel_acesso],
    );

    res.status(201).json({
      message: "Usuário criado com sucesso",
      user_id: result.insertId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      erro: "Erro ao criar usuário ",
    });
  }
};

// atualizar usuário
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { user_nome, user_nivel_acesso, user_ativo } = req.body;

  try {
    // Verificar se de usuário já existe
    const [usuarioExiste] = await pool.query(
      `SELECT user_id FROM usuarios WHERE user_id = ?`,
      [id],
    );
    if (usuarioExiste.length === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    // Verificar se o nome de usuário já existe para outro usuário
    const [nomeExiste] = await pool.query(
      `SELECT user_id
       FROM usuarios 
       WHERE user_nome = ? AND user_id != ?`,
      [user_nome, id],
    );
    if (nomeExiste.length > 0) {
      return res.status(400).json({ erro: "Nome de usuário já existe" });
    }

    // Atualizar usuário
    const [result] = await pool.query(
      `UPDATE usuarios 
       SET user_nome = ?, user_nivel_acesso = ?, user_ativo = ?
       WHERE user_id = ?`,
      [user_nome, user_nivel_acesso, user_ativo, id],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }
    res.json({
      message: "Usuário atualizado com sucesso",
      user_id: id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      erro: "Erro ao atualizar usuário",
    });
  }
};

// desativar usuário (soft delete)
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    //' Verificar se de usuário já existe e esta ativo
    const [usuario] = await pool.query(
      `SELECT user_id, user_ativo
       FROM usuarios
       WHERE user_id = ? `,
      [id],
    );
    if (usuario.length === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }
    if (usuario[0].user_ativo === 0) {
      return res.status(400).json({ erro: "Usuário já está desativado" });
    }

    // Desativar usuário (soft delete)
    const [result] = await pool.query(
      `UPDATE usuarios
       SET user_ativo = 0
       WHERE user_id = ?`,
      [id],
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({
      erro: "Erro ao desativar usuário",
    });
  }
};

// login de usuário
exports.loginUser = async (req, res) => {
  const { user_nome, user_senha } = req.body;

  try{
    // validar se campos obrigatórios foram enviados
    if (!user_nome || !user_senha){
      return res.status(400).json({ erro: "Nome de usuário e senha são obrigatórios" });
    }

    // buscar usúario no banco 
    const [usuario] = await pool.query(
      `SELECT user_id, user_nome, user_senha, user_nivel_acesso, user_ativo
       FROM usuarios
       WHERE user_nome = ?`,
      [user_nome]
    );
    if (usuario.length === 0){
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    const user = usuario[0];

    // verificar se usuário está ativo
    if (user.user_ativo === 0){
      return res.status(403).json({ erro: "Usuário está desativado" });
    }
    // comparar senha enviada com a senha hash do banco
    const senhaValida = await bcrypt.compare(user_senha, user.user_senha);
    if(!senhaValida){
      return res.status(401).json({ erro: "Senha inválida" });
    }

    // gerar token JWT
    const token = jwt.sign({
      user_id: user.user_id,
      user_nome: user.user_nome,
      user_nivel_acesso: user.user_nivel_acesso
    },
    process.env.JWT_SECRET || "granplus_fallback_secret", // aqui deve ser uma string secreta definida no .env para assinar o token
    { expiresIn: "12h" } // token expira em 12 hora
  );
  res.json({
    message: "Login realizado com sucesso",
    token,
    usuario:{
      user_id: user.user_id,
      user_nome: user.user_nome,
      user_nivel_acesso: user.user_nivel_acesso
    }
  });

  }catch (error) {
    console.error(error);
    res.status(500).json({
      erro: "Erro ao fazer login",
    });
  }
};