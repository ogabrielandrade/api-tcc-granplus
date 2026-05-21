const pool = require("../config/database");
const jwt = require("jsonwebtoken");
const crypto = require("crypto"); // gera o pin de 6 dígitos do reset de senha
const nodemailer = require("nodemailer");
const { bcryptCompare, passwordWithHash } = require("../services/bcrypt");
const { registerAudit } = require("../services/audit.services");

// ADICIONE A CONFIGURAÇÃO DO GMAIL
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// NORMALIZAR NÍVEL DE ACESSO
const normalizeAccessLevel = (level) => {
  const value = String(level || "")
    .trim()
    .toLowerCase(); // prop level é transformada em string, sem espaços em branco e em letras minúsculas

  if (value === "admin") return "admin";
    if (
      value === "user" ||
      value === "usuario" ||
      value === "operador" ||
      value === "operator"
    )
      return "user";
    return null;
};

// LISTAR TODOS OS USUÁRIOS
exports.getAllUsers = async (req, res) => {
  try {
    const [usuarios] = await pool.query(
      `SELECT
        user_id,
        user_nome,
        user_email,
        user_nivel_acesso,
        user_ativo
        FROM usuarios`,
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

// BUSCAR USUÁRIO POR ID
exports.getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const [usuario] = await pool.query(
      `
        SELECT
            user_id,
            user_nome,
            user_email,
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

// CRIAR NOVO USUARIO
exports.createUser = async (req, res) => {
  const { user_nome, user_senha, user_nivel_acesso } = req.body;
  const nivelAcessoNormalizado = normalizeAccessLevel(user_nivel_acesso);

  // validação de entrada: garante que todos os dados obrigatórios foram enviados
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
    // verificar se o usuário já existe
    const [existeUsuario] = await pool.execute(
      `SELECT user_id FROM usuarios WHERE user_nome = ?`,
      [user_nome],
    );

    if (existeUsuario.length > 0) {
      return res.status(409).json({ erro: "Usuário já existe" });
    }

    // criptografar senha (Hash)
    const senhaHash = await passwordWithHash(user_senha);
    // const senhaHash = await bcrypt.hash(user_senha, 10); // o número 10 é o custo do hash (quanto maior, mais seguro mas mais lento)

    // inserir no banco
    const [result] = await pool.execute(
      `INSERT INTO usuarios (user_nome, user_senha, user_nivel_acesso)
       VALUES (?, ?, ?)`,
      [user_nome, senhaHash, nivelAcessoNormalizado],
    );

    try {
      await registerAudit(
        req.user.user_id,
        `Usuário ${user_nome} criado`,
        "usuarios",
        result.insertId
      )
    } catch (error) {
      console.error({
        error: message
      })
    }

    // resposta de Sucesso
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

// ATUALIZAR USUÁRIO
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { user_nome, user_nivel_acesso, user_ativo, user_senha, user_email } = req.body;

  const nivelAcessoNormalizado = normalizeAccessLevel(user_nivel_acesso);
  // const ativoNormalizado = Number(user_ativo);

  // Tratamento seguro: garante que não vai dar 'NaN' se o campo vier vazio
  const ativoNormalizado =
    user_ativo !== undefined && user_ativo !== null ? Number(user_ativo) : null;

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
    const [usuarioExiste] = await pool.execute(
      `SELECT user_id FROM usuarios WHERE user_id = ?`,
      [id],
    );

    if (usuarioExiste.length === 0) {
      return res.status(404).json({
        erro: "Usuário não encontrado",
      });
    }

    // verificar se nome já está em uso
    const [nomeExiste] = await pool.execute(
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

    const [nomeUsuario] = await pool.execute("SELECT user_nome FROM usuarios WHERE user_id = ? LIMIT 1", [id]);

    const nomeUsuarioAntigo = nomeUsuario[0].user_nome;

    // verificar se quem está fazendo a requisição é admin 
    //const isAdmin = req.user.user_nivel_acesso === "admin";
    const isAdmin = req.user?.user_nivel_acesso === "admin" ? 1 : 0;

    // atualizar usuário
    let updateQuery = `UPDATE usuarios
         SET user_nome = ?,
             user_nivel_acesso = IF(?, ?, user_nivel_acesso),
             user_ativo = ?`;

    const params = [
      user_nome,
      isAdmin,
      nivelAcessoNormalizado,
      ativoNormalizado,
    ];
    
    // se o email foi preenchido, adiciona no UPDATE
    if (user_email && user_email.trim() !== "") {
      updateQuery += `, user_email = ?`;
      params.push(user_email);
    }

    // Se a senha foi preenchida, adiciona no UPDATE
    if (user_senha && user_senha.trim() !== "") {
      const hash = await passwordWithHash(user_senha);
      updateQuery += `, user_senha = ?`;
      params.push(hash);
    }

    // Finaliza a query
    updateQuery += ` WHERE user_id = ?`;
    params.push(id);

    await pool.execute(updateQuery, params);

    await registerAudit(
      req.user.user_id,
      `Usuário ${nomeUsuarioAntigo} atualizado para ${user_nome}`,
      "usuarios",
      updateQuery.insertId
    )

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

// DESATIVAR USUÁRIO (SOFT DELETE)
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {

    const [nome] = await pool.execute("SELECT user_nome FROM usuarios WHERE user_id = ? LIMIT 1", [id]);

    const nomeUsuario = nome[0].user_nome;

    const [result] = await pool.execute(
      `UPDATE usuarios
       SET user_ativo = 0
       WHERE user_id = ? AND user_ativo = 1`,
      [id],
    );

    await registerAudit(
      req.user.user_id,
      `Usuário ${nomeUsuario} desativado`,
      "usuarios",
      result.insertId
    )

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

// LOGIN DE USUÁRIO
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
    const [usuarios] = await pool.execute(
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

    console.log("3. Senha bateu com o Hash?:", senhaValida);

    if (!senhaValida) {
      return res.status(401).json({
        erro: "Usuário ou senha inválidos",
      });
    }

    // busca a chave do .env / token
    const jwtSecret = process.env.JWT_SECRET;

    // trava de segurança: impede o login se a chave não existir no ambiente
    if (!jwtSecret) {
      console.error(
        "ERRO CRÍTICO: Variável JWT_SECRET não configurada no .env!",
      );
      return res.status(500).json({
        erro: "Erro interno de configuração do servidor",
      });
    }

    // gerar token seguro
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

// EDITAR SENHA DO USUÁRIO
exports.updatePassword = async (req, res) => {
  const { id } = req.params;
  const { senhaAtual, novaSenha } = req.body;

  if (!senhaAtual || !novaSenha) {
    return res
      .status(400)
      .json({ erro: "Senha atual e nova senha são obrigatórias" });
  }

  try {
    const [usuarios] = await pool.execute(
      "SELECT user_senha FROM usuarios WHERE user_id = ?",
      [id],
    );
    if (usuarios.length === 0)
      return res.status(404).json({ erro: "Usuário não encontrado" });

    const user = usuarios[0];
    const senhaValida = await bcryptCompare(senhaAtual, user.user_senha);
    if (!senhaValida)
      return res.status(400).json({ erro: "Senha atual incorreta" });

    // const senhaHash = await bcrypt.hash(novaSenha, 10);
    const senhaHash = await passwordWithHash(novaSenha);
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

// =========================================================
// FUNÇÕES DE RECUPERAÇÃO DE SENHA (PIN DE 6 DÍGITOS)
// =========================================================

const maskEmail = (email) => {
  if (!email) return null;
  const [nome, dominio] = email.split("@");
  if (nome.length <= 3) return `***@${dominio}`;
  const finalDoNome = nome.slice(-4);
  return `****${finalDoNome}@${dominio}`;
};

// verifica se usuário existe e devolve o email escondido
exports.verifyUserForReset = async (req, res) => {
  const { user_nome } = req.body;

  if (!user_nome)
    return res.status(400).json({ erro: "Nome de usuário é obrigatório" });

  try {
    const [usuarios] = await pool.execute(
      `SELECT user_email FROM usuarios WHERE user_nome = ? AND user_ativo = 1`,
      [user_nome],
    );

    if (usuarios.length === 0 || !usuarios[0].user_email) {
      return res
        .status(404)
        .json({ erro: "Usuário não encontrado ou sem e-mail cadastrado." });
    }

    const emailMascarado = maskEmail(usuarios[0].user_email);

    return res.status(200).json({
      mensagem: "Usuário encontrado",
      emailMascarado: emailMascarado,
    });
  } catch (error) {
    console.error("Erro no verifyUserForReset:", error);
    return res.status(500).json({ erro: "Erro ao verificar usuário" });
  }
};

// gera o código de 6 dígitos e envia por e-mail
exports.sendResetPin = async (req, res) => {
  const { user_nome } = req.body;

  try {
    const [usuarios] = await pool.execute(
      `SELECT user_id, user_nome, user_email FROM usuarios WHERE user_nome = ?`,
      [user_nome],
    );

    if (usuarios.length === 0)
      return res.status(404).json({ erro: "Usuário não encontrado" });

    const user = usuarios[0];
    const pin = Math.floor(100000 + Math.random() * 900000).toString(); // PIN 6 dígitos

    const expireTime = new Date();
    expireTime.setMinutes(expireTime.getMinutes() + 15); // Vale por 15 min

    await pool.execute(
      `UPDATE usuarios SET reset_token = ?, reset_expires = ? WHERE user_id = ?`,
      [pin, expireTime, user.user_id],
    );

    await transporter.sendMail({
      from: '"Sistema de Estoque" <' + process.env.GMAIL_USER + ">", // O mesmo Gmail
      to: user.user_email,
      subject: "Seu código de recuperação de senha: " + pin,
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h2>Olá, ${user.user_nome}!</h2>
          <p>Você solicitou a redefinição da sua senha. Use o código abaixo no sistema:</p>
          <h1 style="background: #f4f4f4; padding: 15px; letter-spacing: 5px; color: #333; border-radius: 8px;">
            ${pin}
          </h1>
          <p style="color: #888; font-size: 12px;">Este código é válido por 15 minutos.</p>
        </div>
      `,
    });

    return res
      .status(200)
      .json({ mensagem: "Código enviado com sucesso para o e-mail." });
  } catch (error) {
    console.error("Erro no sendResetPin:", error);
    return res.status(500).json({ erro: "Erro ao enviar o código" });
  }
};

// recebe o PIN e a Senha Nova, e salva no banco
exports.resetPasswordWithPin = async (req, res) => {
  const { user_nome, pin, novaSenha } = req.body;

  if (!user_nome || !pin || !novaSenha) {
    return res
      .status(400)
      .json({ erro: "Usuário, código PIN e nova senha são obrigatórios" });
  }

  try {
    const [usuarios] = await pool.execute(
      `SELECT user_id FROM usuarios 
       WHERE user_nome = ? AND reset_token = ? AND reset_expires > NOW()`,
      [user_nome, pin],
    );

    if (usuarios.length === 0) {
      return res.status(400).json({ erro: "Código inválido ou expirado." });
    }

    const userId = usuarios[0].user_id;
    const senhaHash = await passwordWithHash(novaSenha);

    await pool.execute(
      `UPDATE usuarios 
       SET user_senha = ?, reset_token = NULL, reset_expires = NULL 
       WHERE user_id = ?`,
      [senhaHash, userId],
    );

    return res
      .status(200)
      .json({ mensagem: "Senha redefinida com sucesso! Pode fazer login." });
  } catch (error) {
    console.error("Erro no resetPasswordWithPin:", error);
    return res.status(500).json({ erro: "Erro ao redefinir a senha" });
  }
};
