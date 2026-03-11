const pool   = require("../config/database");
const bcrypt = require("bcrypt");
const jwt    = require("jsonwebtoken");


// listar todos os usuarios
exports.getAllUsers = async (req, res) => {
  try {
    const [usuarios] = await pool.query(
      `SELECT
        user_id,
        user_nome,
        user_nivel_acesso,
        user_ativo
      FROM usuarios
      WHERE user_ativo = 1`
    );

    return res.status(200).json({
      total: usuarios.length,
      usuarios: usuarios
    });

  } catch (error) {
    console.error("Erro ao buscar usuários:", error);

    return res.status(500).json({
      erro: "Erro ao buscar usuários no banco"
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
        WHERE user_id = ? AND user_ativo = 1 
     `,
      [id], //O ? é um placeholder (protege contra SQL Injection). o valor vem do id
    );

    if (usuario.length === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    return res.status(200).json(usuario[0]);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      erro: "Erro ao buscar usuário no banco",
    });
  }
};

// criar novo usuario
exports.createUser = async (req, res) => {
  const { user_nome, user_senha, user_nivel_acesso } = req.body;

  // 1. Validação de Entrada: Garante que todos os dados obrigatórios foram enviados
  if (!user_nome || !user_senha || !user_nivel_acesso) {
    return res.status(400).json({ 
      erro: "Nome, senha e nível de acesso são obrigatórios" 
    });
  }

  try {
    // 2. Verificar se o usuário já existe
    const [existeUsuario] = await pool.query(
      `SELECT user_id FROM usuarios WHERE user_nome = ?`,
      [user_nome] 
    );

    if (existeUsuario.length > 0) {
      return res.status(409).json({ erro: "Usuário já existe" });
    }

    // 3. Criptografar senha (Hash)
    const senhaHash = await bcrypt.hash(user_senha, 10);// o número 10 é o custo do hash (quanto maior, mais seguro mas mais lento)

    // 4. Inserir no banco
    const [result] = await pool.query(
      `INSERT INTO usuarios (user_nome, user_senha, user_nivel_acesso)
       VALUES (?, ?, ?)`,
      [user_nome, senhaHash, user_nivel_acesso]
    );

    // 5. Resposta de Sucesso 
    return res.status(201).json({
      mensage: "Usuário criado com sucesso",
      usuario: {
        user_id: result.insertId,
        user_nome,
        user_nivel_acesso,
      },
    });

  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return res.status(500).json({
      erro: "Erro interno ao criar usuário",
    });
  }
};

// atualizar usuário
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { user_nome, user_nivel_acesso, user_ativo } = req.body;

  // validação básica
  if (!user_nome || !user_nivel_acesso || user_ativo === undefined) {
    return res.status(400).json({
      erro: "Nome, nível de acesso e status são obrigatórios",
    });
  }

  try {
    // verificar se usuário existe
    const [usuarioExiste] = await pool.query(
      `SELECT user_id FROM usuarios WHERE user_id = ?`,
      [id]
    );

    if (usuarioExiste.length === 0) {
      return res.status(404).json({
        erro: "Usuário não encontrado",
      });
    }

    // verificar se nome já está em uso
    const [nomeExiste] = await pool.query(
      `SELECT user_id
       FROM usuarios
       WHERE user_nome = ? AND user_id != ?`,
      [user_nome, id]
    );

    if (nomeExiste.length > 0) {
      return res.status(409).json({
        erro: "Nome de usuário já existe",
      });
    }

    // verificar se quem está fazendo a requisição é admin
    const isAdmin = req.user.user_nivel_acesso === "admin";

    // atualizar usuário
    await pool.query(
      `UPDATE usuarios
       SET user_nome = ?,
           user_nivel_acesso = IF(?, ?, user_nivel_acesso),
           user_ativo = ?
       WHERE user_id = ?`,
      [user_nome, isAdmin, user_nivel_acesso, user_ativo, id]
    );

    return res.status(200).json({
      mensagem: "Usuário atualizado com sucesso",
      user_id: id,
    });

  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);

    return res.status(500).json({
      erro: "Erro ao atualizar usuário",
    });
  }
};

// desativar usuário (soft delete)
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      `UPDATE usuarios
       SET user_ativo = 0
       WHERE user_id = ? AND user_ativo = 1`,
      [id]
    );

    // nenhum registro afetado
    if (result.affectedRows === 0) {
      return res.status(404).json({
        erro: "Usuário não encontrado ou já desativado",
      });
    }

    return res.status(200).json({
      mensagem: "Usuário desativado com sucesso",
    });

  } catch (error) {
    console.error("Erro ao desativar usuário:", error);
    return res.status(500).json({
      erro: "Erro ao desativar usuário",
    });
  }
};

// login de usuário
exports.loginUser = async (req, res) => {
  const { user_nome, user_senha } = req.body;

  try {
    // validar campos obrigatórios
    if (!user_nome || !user_senha) {
      return res.status(400).json({
        erro: "Nome de usuário e senha são obrigatórios",
      });
    }

    // buscar usuário
    const [usuarios] = await pool.query(
      `SELECT user_id, user_nome, user_senha, user_nivel_acesso, user_ativo
       FROM usuarios
       WHERE user_nome = ?`,
      [user_nome]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({
        erro: "Usuário ou senha inválidos",
      });
    }

    const user = usuarios[0];

    // verificar se está ativo
    if (user.user_ativo === 0) {
      return res.status(403).json({
        erro: "Usuário está desativado",
      });
    }

    // verificar senha
    const senhaValida = await bcrypt.compare(user_senha, user.user_senha);

    if (!senhaValida) {
      return res.status(401).json({
        erro: "Usuário ou senha inválidos",
      });
    }

    // gerar token
    const token = jwt.sign(
      {
        user_id: user.user_id,
        user_nome: user.user_nome,
        user_nivel_acesso: user.user_nivel_acesso,
      },
      process.env.JWT_SECRET || "granplus_fallback_secret",
      { expiresIn: "12h" }
    );

    return res.status(200).json({
      mensagem: "Login realizado com sucesso",
      token,
      usuario: {
        user_id: user.user_id,
        user_nome: user.user_nome,
        user_nivel_acesso: user.user_nivel_acesso,
      },
    });

  } catch (error) {
    console.error("Erro no login:", error);

    return res.status(500).json({
      erro: "Erro interno no servidor",
    });
  }
};