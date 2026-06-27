const pool = require("../config/database");
const { registerAudit } = require("../services/audit.services");

/// LISTAGEM DE FORNECEDORES (inclui ativos e inativos)
exports.getAllSupplier = async (req, res) => {
  try {
    const includeInactive =
      req.query.includeInactive === "1" &&
      req.user?.user_nivel_acesso === "admin";

    const whereClause = includeInactive ? "" : "WHERE f.fncd_ativo = 1";

    const [rows] = await pool.execute(`SELECT
        f.*,
        CONCAT(
          f.fncd_logradouro, ', ', f.fncd_numero,
          IF(f.fncd_complemento IS NULL OR f.fncd_complemento = '', '', CONCAT(' - ', f.fncd_complemento)),
          ' - ', f.fncd_bairro,
          ' - ', f.fncd_cidade, '/', f.fncd_estado,
          ' - CEP: ', f.fncd_cep
        ) AS fncd_endereco
      FROM fornecedor f
      ${whereClause}
      `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao listar fornecedores", error });
  }
};

// BUSCA FORNECEDOR POR ID (inclui ativos e inativos)
exports.getSupplierById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.execute(
      `
        SELECT
          f.*,
          CONCAT(
            f.fncd_logradouro, ', ', f.fncd_numero,
            IF(f.fncd_complemento IS NULL OR f.fncd_complemento = '', '', CONCAT(' - ', f.fncd_complemento)),
            ' - ', f.fncd_bairro,
            ' - ', f.fncd_cidade, '/', f.fncd_estado,
            ' - CEP: ', f.fncd_cep
          ) AS fncd_endereco
        FROM fornecedor f
          WHERE f.fncd_id = ?
      `,
      [id],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ mensagem: "Fornecedor não encontrado ou inativo" });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar fornecedor" });
  }
};

// CRIAR FORNECEDOR
exports.createSupplier = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      fncd_nome,
      fncd_documento,
      fncd_tel,
      fncd_email,
      fncd_cep,
      fncd_logradouro,
      fncd_numero,
      fncd_complemento,
      fncd_bairro,
      fncd_cidade,
      fncd_estado,
      fncd_ativo,
    } = req.body;

    await connection.beginTransaction();

    // Normalização dos dados básicos
    const nome = typeof fncd_nome === "string" ? fncd_nome.trim() : "";

    const documento =
      fncd_documento === undefined || fncd_documento === null
        ? ""
        : String(fncd_documento).trim();

    const telefone = typeof fncd_tel === "string" ? fncd_tel.trim() : "";

    const emailNormalizado =
      fncd_email === undefined || fncd_email === null
        ? null
        : typeof fncd_email === "string"
          ? fncd_email.trim()
          : "";

    const email = emailNormalizado === "" ? null : emailNormalizado;

    const cep = typeof fncd_cep === "string" ? fncd_cep.trim() : "";

    const logradouro =
      typeof fncd_logradouro === "string" ? fncd_logradouro.trim() : "";

    const numero = typeof fncd_numero === "string" ? fncd_numero.trim() : "";

    const bairro = typeof fncd_bairro === "string" ? fncd_bairro.trim() : "";

    const cidade = typeof fncd_cidade === "string" ? fncd_cidade.trim() : "";

    const estado = typeof fncd_estado === "string" ? fncd_estado.trim() : "";

    const ativoNormalizado =
      fncd_ativo !== undefined && fncd_ativo !== null ? Number(fncd_ativo) : 1;

    // Complemento é opcional (pode ser nulo)
    const compNormalizado =
      fncd_complemento === undefined || fncd_complemento === null
        ? null
        : typeof fncd_complemento === "string"
          ? fncd_complemento.trim()
          : "";

    const complemento = compNormalizado === "" ? null : compNormalizado;

    // Validação de campos em branco (Complemento não entra aqui)
    console.log("Fornecedor.create - entrando na validação obrigatória");
    if (
      !nome ||
      !documento ||
      !telefone ||
      !cep ||
      !logradouro ||
      !numero ||
      !bairro ||
      !cidade ||
      !estado
    ) {
      console.warn("Fornecedor.create - campos obrigatórios ausentes", {
        nome,
        documento,
        telefone,
        cep,
        logradouro,
        numero,
        bairro,
        cidade,
        estado,
      });
      return res.status(400).json({
        erro: "Todos os campos obrigatórios devem ser preenchidos",
      });
    }

    // Validação do CPF/CNPJ (Agora garantido que são só números limpos)
    if (!/^\d{11}$|^\d{14}$/.test(documento)) {
      // Regex
      return res.status(400).json({
        erro: "CPF/CNPJ deve conter apenas números e ter 11 ou 14 dígitos",
      });
    }

    if (![0, 1].includes(ativoNormalizado)) {
      return res.status(400).json({ erro: "Status inválido. Use 0 ou 1" });
    }

    const [fornecedorPorDocumento] = await pool.execute(
      "SELECT fncd_id FROM fornecedor WHERE fncd_documento = ? LIMIT 1",
      [documento],
    );

    if (fornecedorPorDocumento.length > 0) {
      return res
        .status(409)
        .json({ erro: "Fornecedor já cadastrado com este CPF/CNPJ" });
    }

    const [result] = await pool.execute(
      `INSERT INTO fornecedor
      (fncd_nome, fncd_documento, fncd_cep, fncd_logradouro, fncd_numero, fncd_complemento, fncd_bairro, fncd_cidade, fncd_estado, fncd_tel, fncd_email)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nome,
        documento,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        telefone,
        email,
      ],
    );

    await registerAudit(
      req.user.user_id,
      `Fornecedor ${nome} criado`,
      "fornecedor",
      result.insertId,
    );

    await connection.commit();

    res.status(201).json({
      mensagem: "Fornecedor criado com sucesso",
      id: result.insertId,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Erro ao criar fornecedor:", error);
    res.status(500).json({ erro: "Erro interno ao criar fornecedor" });
  } finally {
    connection.release();
  }
};

// ATUALIZAÇÃO DE FORNECEDOR
exports.updateSupplier = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;

    const {
      fncd_nome,
      fncd_documento,
      fncd_tel,
      fncd_email,
      fncd_cep,
      fncd_logradouro,
      fncd_numero,
      fncd_complemento,
      fncd_bairro,
      fncd_cidade,
      fncd_estado,
      fncd_ativo,
    } = req.body;

    await connection.beginTransaction();

    // Normalização dos dados básicos
    const nome = typeof fncd_nome === "string" ? fncd_nome.trim() : "";
    const documento =
      fncd_documento === undefined || fncd_documento === null
        ? ""
        : String(fncd_documento).trim();
    const telefone = typeof fncd_tel === "string" ? fncd_tel.trim() : "";

    const emailNormalizado =
      fncd_email === undefined || fncd_email === null
        ? null
        : typeof fncd_email === "string"
          ? fncd_email.trim()
          : "";
    const email = emailNormalizado === "" ? null : emailNormalizado;

    // Normalização dos dados de endereço
    const cep = typeof fncd_cep === "string" ? fncd_cep.trim() : "";
    const logradouro =
      typeof fncd_logradouro === "string" ? fncd_logradouro.trim() : "";
    const numero = typeof fncd_numero === "string" ? fncd_numero.trim() : "";
    const bairro = typeof fncd_bairro === "string" ? fncd_bairro.trim() : "";
    const cidade = typeof fncd_cidade === "string" ? fncd_cidade.trim() : "";
    const estado = typeof fncd_estado === "string" ? fncd_estado.trim() : "";
    const ativoNormalizado =
      fncd_ativo !== undefined && fncd_ativo !== null ? Number(fncd_ativo) : 1;

    // Complemento é opcional
    const compNormalizado =
      fncd_complemento === undefined || fncd_complemento === null
        ? null
        : typeof fncd_complemento === "string"
          ? fncd_complemento.trim()
          : "";
    const complemento = compNormalizado === "" ? null : compNormalizado;

    // Validação de campos obrigatórios
    if (
      !nome ||
      !documento ||
      !telefone ||
      !cep ||
      !logradouro ||
      !numero ||
      !bairro ||
      !cidade ||
      !estado
    ) {
      return res.status(400).json({
        erro: "Todos os campos obrigatórios devem ser preenchidos",
      });
    }

    if (!/^\d{11}$|^\d{14}$/.test(documento)) {
      return res
        .status(400)
        .json({ erro: "CPF/CNPJ deve ter 11 ou 14 dígitos" });
    }

    if (![0, 1].includes(ativoNormalizado)) {
      return res.status(400).json({ erro: "Status inválido. Use 0 ou 1" });
    }

    const [fornecedorExistente] = await pool.execute(
      "SELECT fncd_id FROM fornecedor WHERE fncd_id = ? LIMIT 1",
      [id],
    );

    if (fornecedorExistente.length === 0) {
      return res.status(404).json({ mensagem: "Fornecedor não encontrado" });
    }

    const [fornecedorPorDocumento] = await pool.execute(
      "SELECT fncd_id FROM fornecedor WHERE fncd_documento = ? AND fncd_id <> ? LIMIT 1",
      [documento, id],
    );

    if (fornecedorPorDocumento.length > 0) {
      return res
        .status(409)
        .json({ erro: "Já existe fornecedor com este CPF/CNPJ" });
    }

    const [result] = await pool.execute(
      `UPDATE fornecedor SET
      fncd_nome = ?, fncd_documento = ?, fncd_cep = ?, fncd_logradouro = ?, fncd_numero = ?, fncd_complemento = ?, fncd_bairro = ?, fncd_cidade = ?, fncd_estado = ?, fncd_tel = ?, fncd_email = ?, fncd_ativo = ?
      WHERE fncd_id = ?`,
      [
        nome,
        documento,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        telefone,
        email,
        ativoNormalizado,
        id,
      ],
    );

    await registerAudit(
      req.user.user_id,
      `Fornecedor ${nome} atualizado`,
      "fornecedor",
      result.insertId,
    );

    await connection.commit();

    res.json({ mensagem: "Fornecedor atualizado com sucesso" });
  } catch (error) {
    await connection.rollback();
    console.error("Erro ao atualizar fornecedor:", error);
    res.status(500).json({ erro: "Erro interno ao atualizar fornecedor" });
  } finally {
    connection.release();
  }
};

// DELETAR FORNECEDOR (Agora com SOFT DELETE)
exports.deleteSupplier = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;

    await connection.beginTransaction();

    const [fornecedorBusca] = await pool.execute(
      "SELECT fncd_nome, fncd_ativo FROM fornecedor WHERE fncd_id = ?",
      [id],
    );

    if (fornecedorBusca.length === 0) {
      return res.status(404).json({ mensagem: "Fornecedor não encontrado" });
    }

    const { fncd_nome: nomeFornecedor, fncd_ativo: isAtivo } =
      fornecedorBusca[0];

    if (isAtivo === 0) {
      return res.status(400).json({ erro: "Fornecedor já está inativo." });
    }

    // Fazendo o Soft Delete
    await pool.execute(
      "UPDATE fornecedor SET fncd_ativo = 0 WHERE fncd_id = ?",
      [id],
    );

    // Usando o 'id' ao invés de result.insertId
    await registerAudit(
      req.user.user_id,
      `Fornecedor ${nomeFornecedor} inativado`,
      "fornecedor",
      id,
    );

    await connection.commit();

    res.json({ mensagem: "Fornecedor inativado com sucesso" });
  } catch (error) {
    await connection.rollback();
    // Esse bloco do ER_ROW_IS_REFERENCED_2 agora raramente ou nunca vai ser chamado,
    // já que o UPDATE não conflita com Foreign Keys!
    res
      .status(500)
      .json({ erro: "Erro ao inativar fornecedor", detalhe: error.message });
  } finally {
    connection.release();
  }
};

// ATIVAR FORNECEDOR
exports.activateSupplier = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;

    await connection.beginTransaction();

    const [fornecedor] = await connection.execute(
      `SELECT fncd_nome, fncd_ativo FROM fornecedor WHERE fncd_id = ? LIMIT 1`,
      [id],
    );

    if (fornecedor.length === 0) {
      return res.status(404).json({ error: "Fornecedor não encontrado" });
    }

    const fornecedorAtual = fornecedor[0];

    if (Number(fornecedorAtual.fncd_ativo) === 1) {
      return res.status(400).json({ error: "Fornecedor já está ativo" });
    }

    const [result] = await connection.execute(
      `UPDATE fornecedor SET fncd_ativo = 1 WHERE fncd_id = ?`,
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Fornecedor não encontrado" });
    }

    await registerAudit(
      req.user.user_id,
      `Fornecedor ${fornecedorAtual.fncd_nome} (ID ${id}) ativado`,
      "fornecedor",
      id,
    );

    await connection.commit();

    res.status(200).json({ message: "Fornecedor ativado com sucesso" });
  } catch (error) {
    await connection.rollback();
    console.error("Erro ao ativar o fornecedor", error);
    res.status(500).json({ error: "Erro ao ativar o fornecedor" });
  } finally {
    connection.release();
  }
};
