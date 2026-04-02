const pool = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const normalizeAccessLevel = (level) => {
  const value = String(level || "").trim().toLowerCase();
  if (value === "admin") return "admin";
  if (value === "user" || value === "usuario" || value === "operador" || value === "operator") return "user";
  return null;
};

// listar todos os usuarios
exports.getAllUsers = async (req, res) => {
  try {
    const [usuarios] = await pool.query(
      `SELECT
        user_id,
        user_nome,
        user_nivel_acesso,
        user_ativo
        FROM usuarios`
    );

    return res.status(200).json({
      total: usuarios.length,
      usuarios: usuarios,
    });
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
  const nivelAcessoNormalizado = normalizeAccessLevel(user_nivel_acesso);

  // 1. Validação de Entrada: Garante que todos os dados obrigatórios foram enviados
  if (!user_nome || !user_senha || !user_nivel_acesso) {
    return res.status(400).json({
      erro: "Nome, senha e nível de acesso são obrigatórios",
    });
  }

  if (!nivelAcessoNormalizado) {
    return res.status(400).json({
      erro: "Nível de acesso inválido. Use 'admin' ou 'usuario'",
    });
  }

  try {
    // 2. Verificar se o usuário já existe
    const [existeUsuario] = await pool.query(
      `SELECT user_id FROM usuarios WHERE user_nome = ?`,
      [user_nome],
    );

    if (existeUsuario.length > 0) {
      return res.status(409).json({ erro: "Usuário já existe" });
    }

    // 3. Criptografar senha (Hash)
    const senhaHash = await bcrypt.hash(user_senha, 10); // o número 10 é o custo do hash (quanto maior, mais seguro mas mais lento)

    // 4. Inserir no banco
    const [result] = await pool.query(
      `INSERT INTO usuarios (user_nome, user_senha, user_nivel_acesso)
       VALUES (?, ?, ?)`,
      [user_nome, senhaHash, nivelAcessoNormalizado],
    );

    // 5. Resposta de Sucesso
    return res.status(201).json({
      mensage: "Usuário criado com sucesso",
      usuario: {
        user_id: result.insertId,
        user_nome,
        user_nivel_acesso: nivelAcessoNormalizado,
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
  const { user_nome, user_nivel_acesso, user_ativo, user_senha } = req.body;

  const nivelAcessoNormalizado = normalizeAccessLevel(user_nivel_acesso);
  // const ativoNormalizado = Number(user_ativo);

  // Tratamento seguro: garante que não vai dar 'NaN' se o campo vier vazio
  const ativoNormalizado = user_ativo !== undefined && user_ativo !== null ? Number(user_ativo) : null;

  // validação básica
  // if (!user_nome || !user_nivel_acesso || user_ativo === undefined)
  if (!user_nome || !user_nivel_acesso || ativoNormalizado === null) {
    return res.status(400).json({
      erro: "Nome, nível de acesso e status são obrigatórios",
    });
  }

  if (!nivelAcessoNormalizado) {
    return res.status(400).json({
      erro: "Nível de acesso inválido. Use 'admin' ou 'usuario'",
    });
  }

  if (![0, 1].includes(ativoNormalizado)) {
    return res.status(400).json({
      erro: "Status inválido. Use 0 (inativo) ou 1 (ativo)",
    });
  }

  try {
    // verificar se usuário existe
    const [usuarioExiste] = await pool.query(
      `SELECT user_id FROM usuarios WHERE user_id = ?`,
      [id],
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
      [user_nome, id],
    );

    if (nomeExiste.length > 0) {
      return res.status(409).json({
        erro: "Nome de usuário já existe",
      });
    }

    // verificar se quem está fazendo a requisição é admin (com '?' de proteção)
    //const isAdmin = req.user.user_nivel_acesso === "admin";
    const isAdmin = req.user?.user_nivel_acesso === "admin" ? 1 : 0;

    // atualizar usuário
    let updateQuery = `UPDATE usuarios
         SET user_nome = ?,
             user_nivel_acesso = IF(?, ?, user_nivel_acesso),
             user_ativo = ?`;

    const params = [user_nome, isAdmin, nivelAcessoNormalizado, ativoNormalizado];
    
    // Se a senha foi preenchida, adiciona no UPDATE
    if (user_senha && user_senha.trim() !== "") {
      const hash = await bcrypt.hash(user_senha, 10); //10 é o custo do hash (quanto maior, mais seguro porém é mais lento)
      updateQuery += `, user_senha = ?`;
      params.push(hash);
    }

    // Finaliza a query
    updateQuery += ` WHERE user_id = ?`;
    params.push(id);

    await pool.query(updateQuery, params);

    return res.status(200).json({
      mensagem: "Usuário atualizado com sucesso",
      user_id: id,
    });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);

    return res.status(500).json({
      erro: "Erro ao atualizar usuário",
      detalhe: error.message,
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
      [id],
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

  console.log("1. Chegou da tela:", user_nome, user_senha);

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
      [user_nome],
    );

    if (usuarios.length === 0) {
      return res.status(401).json({
        erro: "Usuário ou senha inválidos",
      });
    }

    const user = usuarios[0];

    console.log("2. O banco achou:", usuarios);

    // verificar se está ativo
    if (user.user_ativo === 0) {
      return res.status(403).json({
        erro: "Usuário está desativado",
      });
    }

    // verificar senha
    const senhaValida = await bcryptCompare(user_senha, user.user_senha);
    // *** const senhaValida = await bcrypt.compare(user_senha, user.user_senha);

    console.log("3. Senha bateu com o Hash?:", senhaValida);

    if (!senhaValida) {
      return res.status(401).json({
        erro: "Usuário ou senha inválidos",
      });
    }


    // 1. Busca a chave do .env / token
    const jwtSecret = process.env.JWT_SECRET;

    // 2. Trava de segurança: impede o login se a chave não existir no ambiente
    if (!jwtSecret) {
      console.error("ERRO CRÍTICO: Variável JWT_SECRET não configurada no .env!");
      return res.status(500).json({
        erro: "Erro interno de configuração do servidor",
      });
    }

    // 3. Gerar token seguro
    const token = jwt.sign(
      {
        user_id: user.user_id,
        user_nome: user.user_nome,
        user_nivel_acesso: user.user_nivel_acesso,
      },
      jwtSecret,
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
// editar senha do usuário
exports.updatePassword = async (req, res) => {
  const { id } = req.params;
  const { senhaAtual, novaSenha } = req.body;

  if (!senhaAtual || !novaSenha) {
    return res
      .status(400)
      .json({ erro: "Senha atual e nova senha são obrigatórias" });
  }

  try {
    const [usuarios] = await pool.query(
      "SELECT user_senha FROM usuarios WHERE user_id = ?",
      [id],
    );
    if (usuarios.length === 0)
      return res.status(404).json({ erro: "Usuário não encontrado" });

    const user = usuarios[0];
    const senhaValida = await bcrypt.compare(senhaAtual, user.user_senha);
    if (!senhaValida)
      return res.status(400).json({ erro: "Senha atual incorreta" });

    const senhaHash = await bcrypt.hash(novaSenha, 10);
    await pool.query("UPDATE usuarios SET user_senha = ? WHERE user_id = ?", [
      senhaHash,
      id,
    ]);

    return res.status(200).json({ mensagem: "Senha atualizada com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar senha:", error);
    return res.status(500).json({ erro: "Erro interno ao atualizar senha" });
  }
};
