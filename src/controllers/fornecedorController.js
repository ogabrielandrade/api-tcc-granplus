const db = require("../config/database");

// listagem de fornecedores
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM fornecedor");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao listar fornecedores" });
  }
};

// busca  fornecedor por id
exports.getById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      "SELECT * FROM fornecedor WHERE fncd_id = ?",
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ mensagem: "Fornecedor não encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar fornecedor" });
  }
};

// criação de fornecedor
exports.create = async (req, res) => {
  const { fncd_nome, fncd_documento, fncd_endereco, fncd_tel, fncd_email } =
    req.body;

  try {
    const nome = typeof fncd_nome === "string" ? fncd_nome.trim() : "";
    const documento =
      fncd_documento === undefined || fncd_documento === null
        ? ""
        : String(fncd_documento).trim();
    const telefone = typeof fncd_tel === "string" ? fncd_tel.trim() : "";
    const endereco =
      fncd_endereco === undefined || fncd_endereco === null
        ? null
        : typeof fncd_endereco === "string"
          ? fncd_endereco.trim()
          : "";
    const emailNormalizado =
      fncd_email === undefined || fncd_email === null
        ? null
        : typeof fncd_email === "string"
          ? fncd_email.trim()
          : "";
    const email = emailNormalizado === "" ? null : emailNormalizado;

    if (!nome || !documento || !telefone) {
      return res.status(400).json({
        erro: "Campos informados não podem estar em branco",
      });
    }

    const documentoValido = /^\d{11}$|^\d{14}$/.test(documento);

    if (!documentoValido) {
      return res.status(400).json({
        erro: "CPF/CNPJ deve conter apenas números e ter 11 ou 14 dígitos",
      });
    }

    if (endereco === "") {
      return res.status(400).json({
        erro: "Campos informados não podem estar em branco",
      });
    }

    const [fornecedorPorDocumento] = await db.query(
      "SELECT fncd_id FROM fornecedor WHERE fncd_documento = ? LIMIT 1",
      [documento],
    );

    if (fornecedorPorDocumento.length > 0) {
      return res.status(409).json({
        erro: "Fornecedor já cadastrado com este CPF/CNPJ",
      });
    }

    const [result] = await db.query(
      `INSERT INTO fornecedor
      (fncd_nome, fncd_documento, fncd_endereco, fncd_tel, fncd_email)
      VALUES (?, ?, ?, ?, ?)`,
      [nome, documento, endereco, telefone, email],
    );

    res.status(201).json({
      mensagem: "Fornecedor criado com sucesso",
      id: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao criar fornecedor" });
  }
};

// atualização de fornecedor
exports.update = async (req, res) => {
  const { id } = req.params;

  const { fncd_nome, fncd_documento, fncd_endereco, fncd_tel, fncd_email } =
    req.body;

  try {
    const nome = typeof fncd_nome === "string" ? fncd_nome.trim() : "";
    const documento =
      fncd_documento === undefined || fncd_documento === null
        ? ""
        : String(fncd_documento).trim();
    const telefone = typeof fncd_tel === "string" ? fncd_tel.trim() : "";
    const endereco =
      fncd_endereco === undefined || fncd_endereco === null
        ? null
        : typeof fncd_endereco === "string"
          ? fncd_endereco.trim()
          : "";
    const emailNormalizado =
      fncd_email === undefined || fncd_email === null
        ? null
        : typeof fncd_email === "string"
          ? fncd_email.trim()
          : "";
    const email = emailNormalizado === "" ? null : emailNormalizado;

    if (!nome || !documento || !telefone) {
      return res.status(400).json({
        erro: "Campos informados não podem estar em branco",
      });
    }

    const documentoValido = /^\d{11}$|^\d{14}$/.test(documento);

    if (!documentoValido) {
      return res.status(400).json({
        erro: "CPF/CNPJ deve conter apenas números e ter 11 ou 14 dígitos",
      });
    }

    if (endereco === "") {
      return res.status(400).json({
        erro: "Campos informados não podem estar em branco",
      });
    }

    const [fornecedorExistente] = await db.query(
      "SELECT fncd_id FROM fornecedor WHERE fncd_id = ? LIMIT 1",
      [id],
    );

    if (fornecedorExistente.length === 0) {
      return res.status(404).json({ mensagem: "Fornecedor não encontrado" });
    }

    const [fornecedorPorDocumento] = await db.query(
      "SELECT fncd_id FROM fornecedor WHERE fncd_documento = ? AND fncd_id <> ? LIMIT 1",
      [documento, id],
    );

    if (fornecedorPorDocumento.length > 0) {
      return res.status(409).json({
        erro: "Já existe fornecedor com este CPF/CNPJ",
      });
    }

    const [result] = await db.query(
      `UPDATE fornecedor SET
      fncd_nome = ?,
      fncd_documento = ?,
      fncd_endereco = ?,
      fncd_tel = ?,
      fncd_email = ?
      WHERE fncd_id = ?`,
      [nome, documento, endereco, telefone, email, id],
    );

    res.json({ mensagem: "Fornecedor atualizado com sucesso" });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao atualizar fornecedor" });
  }
};

// deletar fornecedor
exports.delete = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query(
      "DELETE FROM fornecedor WHERE fncd_id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensagem: "Fornecedor não encontrado" });
    }

    res.json({ mensagem: "Fornecedor removido com sucesso" });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao remover fornecedor" });
  }
};
