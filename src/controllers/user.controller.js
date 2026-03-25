<<<<<<< HEAD
const supabase = require("../config/supabase");
=======
const pool   = require("../config/database");
>>>>>>> 3f7fda17bc118d6b34352f0734647d285bc1c247
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const isUserActive = (userAtivo) => {
  if (typeof userAtivo === "boolean") return userAtivo;
  if (typeof userAtivo === "number") return userAtivo === 1;
  return String(userAtivo).toLowerCase() === "true";
};

// listar todos os usuarios
exports.getAllUsers = async (req, res) => {
  try {
<<<<<<< HEAD
    const { data, error } = await supabase
      .from("usuarios")
      .select("user_id, user_nome, user_nivel_acesso, user_ativo")
      .eq("user_ativo", 1);

    if (error) throw error;
    res.json(data);
=======
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
      total: data.length,
      usuarios: data,
    });

>>>>>>> 3f7fda17bc118d6b34352f0734647d285bc1c247
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return res.status(500).json({
      erro: "Erro ao buscar usuários no banco",
    });
  }
};

// buscar usuario por id
exports.getUserById = async (req, res) => {
  const { id } = req.params;

  try {
<<<<<<< HEAD
    const { data: usuario, error } = await supabase
      .from("usuarios")
      .select("user_id, user_nome, user_nivel_acesso, user_ativo")
      .eq("user_id", id)
      .eq("user_ativo", 1);

    if (error) throw error;
=======
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
>>>>>>> 3f7fda17bc118d6b34352f0734647d285bc1c247

    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    return res.status(200).json(usuario);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return res.status(500).json({
      erro: "Erro ao buscar usuário no banco",
    });
  }
};

// criar novo usuario
exports.createUser = async (req, res) => {
  const { user_nome, user_senha, user_nivel_acesso } = req.body;

  if (!user_nome || !user_senha || !user_nivel_acesso) {
    return res.status(400).json({
      erro: "Nome, senha e nível de acesso são obrigatórios",
    });
  }

  try {
<<<<<<< HEAD
    // Verificar se de usuário já existe
    const { data: existeUsuario, error: existeError } = await supabase
      .from("usuarios")
      .select("user_id")
      .eq("user_nome", user_nome);

    if (existeError) throw existeError;
=======
    // 2. Verificar se o usuário já existe
    const [existeUsuario] = await pool.query(
      `SELECT user_id FROM usuarios WHERE user_nome = ?`,
      [user_nome] 
    );
>>>>>>> 3f7fda17bc118d6b34352f0734647d285bc1c247

    if (existeUsuario.length > 0) {
      return res.status(409).json({ erro: "Usuário já existe" });
    }

    const senhaHash = await bcrypt.hash(user_senha, 10);

<<<<<<< HEAD
    const { data: userCriado, error: createError } = await supabase
      .from("usuarios")
      .insert({
        user_nome,
        user_senha: senhaHash,
        user_nivel_acesso,
      })
      .select("user_id")
      .single();

    if (createError) throw createError;

    res.status(201).json({
      message: "Usuário criado com sucesso",
      user_id: userCriado?.user_id,
=======
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
>>>>>>> 3f7fda17bc118d6b34352f0734647d285bc1c247
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
  const isAdmin = req.user?.user_nivel_acesso === "admin";

  if (!user_nome) {
    return res.status(400).json({
      erro: "Nome é obrigatório",
    });
  }

  if (
    isAdmin &&
    (user_nivel_acesso === undefined || user_ativo === undefined)
  ) {
    return res.status(400).json({
      erro: "Admin deve informar nível de acesso e status",
    });
  }

  try {
<<<<<<< HEAD
    // Verificar se de usuário já existe
    const { data: usuarioExiste, error: usuarioExisteError } = await supabase
      .from("usuarios")
      .select("user_id")
      .eq("user_id", id);

    if (usuarioExisteError) throw usuarioExisteError;
=======
    // verificar se usuário existe
    const [usuarioExiste] = await pool.query(
      `SELECT user_id FROM usuarios WHERE user_id = ?`,
      [id]
    );

>>>>>>> 3f7fda17bc118d6b34352f0734647d285bc1c247
    if (usuarioExiste.length === 0) {
      return res.status(404).json({
        erro: "Usuário não encontrado",
      });
    }

    // Verificar se o nome de usuário já existe para outro usuário
    const { data: nomeExiste, error: nomeExisteError } = await supabase
      .from("usuarios")
      .select("user_id")
      .eq("user_nome", user_nome)
      .neq("user_id", id);

    if (nomeExisteError) throw nomeExisteError;
    if (nomeExiste.length > 0) {
      return res.status(409).json({
        erro: "Nome de usuário já existe",
      });
    }

<<<<<<< HEAD
    // Atualizar usuário
    const { data: atualizado, error: updateError } = await supabase
      .from("usuarios")
      .update({ user_nome, user_nivel_acesso, user_ativo })
      .eq("user_id", id)
      .select("user_id")
      .maybeSingle();

    if (updateError) throw updateError;
    if (!atualizado) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }
    res.json({
      message: "Usuário atualizado com sucesso",
=======
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
<<<<<<< HEAD
    //' Verificar se de usuário já existe e esta ativo
    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .select("user_id, user_ativo")
      .eq("user_id", id);

    if (usuarioError) throw usuarioError;
    if (usuario.length === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }
    if (usuario[0].user_ativo === 0 || usuario[0].user_ativo === false) {
      return res.status(400).json({ erro: "Usuário já está desativado" });
    }

    // Desativar usuário (soft delete)
    const { data: desativado, error: desativarError } = await supabase
      .from("usuarios")
      .update({ user_ativo: 0 })
      .eq("user_id", id)
      .select("user_id")
      .maybeSingle();

    if (desativarError) throw desativarError;
    if (!desativado) return res.status(404).json({ erro: "Usuário não encontrado" });

    return res.json({ message: "Usuário desativado com sucesso", user_id: id });
=======
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
      user_id: id,
    });

>>>>>>> 3f7fda17bc118d6b34352f0734647d285bc1c247
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
    if (!user_nome || !user_senha) {
      return res.status(400).json({
        erro: "Nome de usuário e senha são obrigatórios",
      });
    }

<<<<<<< HEAD
    // buscar usúario no banco 
    const { data: usuario, error } = await supabase
      .from("usuarios")
      .select("user_id, user_nome, user_senha, user_nivel_acesso, user_ativo")
      .eq("user_nome", user_nome);

    if (error) throw error;
    if (usuario.length === 0){
      return res.status(404).json({ erro: "Usuário não encontrado" });
=======
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

<<<<<<< HEAD
    // verificar se usuário está ativo
    if (user.user_ativo === 0 || user.user_ativo === false){
      return res.status(403).json({ erro: "Usuário está desativado" });
=======
    console.log("2. O banco achou:", usuarios);

    // verificar se está ativo
    if (user.user_ativo === 0) {
      return res.status(403).json({
        erro: "Usuário está desativado",
      });
    }

    const senhaValida = await bcrypt.compare(user_senha, user.user_senha);

    if (!senhaValida) {
      return res.status(401).json({
        erro: "Usuário ou senha inválidos",
      });
    }

<<<<<<< HEAD
    // gerar token JWT
    const token = jwt.sign({
      user_id: user.user_id,
      user_nome: user.user_nome,
      user_nivel_acesso: user.user_nivel_acesso
    },
    process.env.JWT_SECRET || "granplus_secret_key", // aqui deve ser uma string secreta definida no .env para assinar o token
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
=======
    // gerar token
    const token = jwt.sign(
      {
        user_id: user.user_id,
        user_nome: user.user_nome,
        user_nivel_acesso: user.user_nivel_acesso,
      },
      process.env.JWT_SECRET || "granplus_fallback_secret",
      { expiresIn: "12h" },
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
