const pool = require("../config/database");

// listagem de fornecedores
exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
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
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao listar fornecedores" });
  }
};

// busca  fornecedor por id
exports.getById = async (req, res) => {
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
      return res.status(404).json({ mensagem: "Fornecedor não encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar fornecedor" });
  }
};

// criação de fornecedor
exports.create = async (req, res) => {
    const { 
    fncd_nome, fncd_documento, fncd_tel, fncd_email,
    fncd_cep, fncd_logradouro, fncd_numero, fncd_complemento, fncd_bairro, fncd_cidade, fncd_estado
  } = req.body;

   try {
    const nome = typeof fncd_nome === "string" ? fncd_nome.trim() : "";
    
    // A MÁGICA AQUI: Pega o documento e arranca pontos, barras e traços. Fica só número!
    const documento = fncd_documento ? String(fncd_documento).replace(/\D/g, "") : "";
    
    const telefone = typeof fncd_tel === "string" ? fncd_tel.trim() : "";
    const emailNormalizado = typeof fncd_email === "string" ? fncd_email.trim() : "";
    const email = emailNormalizado === "" ? null : emailNormalizado;

    const cep = typeof fncd_cep === "string" ? fncd_cep.trim() : "";
    const logradouro = typeof fncd_logradouro === "string" ? fncd_logradouro.trim() : "";
    const numero = typeof fncd_numero === "string" ? fncd_numero.trim() : "";
    const bairro = typeof fncd_bairro === "string" ? fncd_bairro.trim() : "";
    const cidade = typeof fncd_cidade === "string" ? fncd_cidade.trim() : "";
    const estado = typeof fncd_estado === "string" ? fncd_estado.trim() : "";
    
    const compNormalizado = typeof fncd_complemento === "string" ? fncd_complemento.trim() : "";
    const complemento = compNormalizado === "" ? null : compNormalizado;

    // Validação de campos em branco
    if (!nome || !documento || !telefone || !cep || !logradouro || !numero || !bairro || !cidade || !estado) {
      return res.status(400).json({ erro: "Todos os campos obrigatórios devem ser preenchidos" });
    }

    // Validação do CPF/CNPJ (Agora garantido que são só números limpos)
    if (!/^\d{11}$|^\d{14}$/.test(documento)) {
      return res.status(400).json({ erro: "CPF/CNPJ deve ter 11 ou 14 dígitos" });
    }

    const [fornecedorPorDocumento] = await pool.execute(
      "SELECT fncd_id FROM fornecedor WHERE fncd_documento = ? LIMIT 1",
      [documento],
    );

    if (fornecedorPorDocumento.length > 0) {
      return res.status(409).json({ erro: "Fornecedor já cadastrado com este CPF/CNPJ" });
    }

    const [result] = await pool.execute(
      `INSERT INTO fornecedor
      (fncd_nome, fncd_documento, fncd_cep, fncd_logradouro, fncd_numero, fncd_complemento, fncd_bairro, fncd_cidade, fncd_estado, fncd_tel, fncd_email)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nome, documento, cep, logradouro, numero, complemento, bairro, cidade, estado, telefone, email],
    );

    res.status(201).json({ mensagem: "Fornecedor criado com sucesso", id: result.insertId });
  } catch (error) {
    console.error("Erro ao criar fornecedor:", error);
    res.status(500).json({ erro: "Erro interno ao criar fornecedor" });
  }
};

// atualização de fornecedor
exports.update = async (req, res) => {
  const { id } = req.params;

  const { 
    fncd_nome, fncd_documento, fncd_tel, fncd_email,
    fncd_cep, fncd_logradouro, fncd_numero, fncd_complemento, fncd_bairro, fncd_cidade, fncd_estado
  } = req.body;

  try {
    const nome = typeof fncd_nome === "string" ? fncd_nome.trim() : "";
    
    // A MÁGICA AQUI: Pega o documento e arranca pontos, barras e traços. Fica só número!
    const documento = fncd_documento ? String(fncd_documento).replace(/\D/g, "") : "";
    
    const telefone = typeof fncd_tel === "string" ? fncd_tel.trim() : "";
    const emailNormalizado = typeof fncd_email === "string" ? fncd_email.trim() : "";
    const email = emailNormalizado === "" ? null : emailNormalizado;

    const cep = typeof fncd_cep === "string" ? fncd_cep.trim() : "";
    const logradouro = typeof fncd_logradouro === "string" ? fncd_logradouro.trim() : "";
    const numero = typeof fncd_numero === "string" ? fncd_numero.trim() : "";
    const bairro = typeof fncd_bairro === "string" ? fncd_bairro.trim() : "";
    const cidade = typeof fncd_cidade === "string" ? fncd_cidade.trim() : "";
    const estado = typeof fncd_estado === "string" ? fncd_estado.trim() : "";
    
    const compNormalizado = typeof fncd_complemento === "string" ? fncd_complemento.trim() : "";
    const complemento = compNormalizado === "" ? null : compNormalizado;

    if (!nome || !documento || !telefone || !cep || !logradouro || !numero || !bairro || !cidade || !estado) {
      return res.status(400).json({ erro: "Todos os campos obrigatórios devem ser preenchidos" });
    }

    if (!/^\d{11}$|^\d{14}$/.test(documento)) {
      return res.status(400).json({ erro: "CPF/CNPJ deve ter 11 ou 14 dígitos" });
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
      return res.status(409).json({ erro: "Já existe fornecedor com este CPF/CNPJ" });
    }

    const [result] = await pool.execute(
      `UPDATE fornecedor SET
      fncd_nome = ?, fncd_documento = ?, fncd_cep = ?, fncd_logradouro = ?, fncd_numero = ?, fncd_complemento = ?, fncd_bairro = ?, fncd_cidade = ?, fncd_estado = ?, fncd_tel = ?, fncd_email = ?
      WHERE fncd_id = ?`,
      [nome, documento, cep, logradouro, numero, complemento, bairro, cidade, estado, telefone, email, id],
    );

    res.json({ mensagem: "Fornecedor atualizado com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar fornecedor:", error);
    res.status(500).json({ erro: "Erro interno ao atualizar fornecedor" });
  }
};

// deletar fornecedor
exports.delete = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.execute("DELETE FROM fornecedor WHERE fncd_id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensagem: "Fornecedor não encontrado" });
    }

    res.json({ mensagem: "Fornecedor removido com sucesso" });
  } catch (error) {
    if (error.code === "ER_ROW_IS_REFERENCED_2" || error.errno === 1451) {
      return res.status(400).json({ erro: "Não é possível excluir o fornecedor porque existem entradas vinculadas a ele no estoque." });
    }
    res.status(500).json({ erro: "Erro ao remover fornecedor", detalhe: error.message });
  }
};