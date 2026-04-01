const pool = require("../config/database");

// LISTAR localizações
exports.listarLocalizacoes = async (req, res) => {
  try {
    const [result] = await pool.query("SELECT * FROM localizacao");
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ erro: "Erro ao listar localizações", detalhe: err.message });
  }
};

// BUSCAR localização por ID
exports.buscarLocalizacao = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("SELECT * FROM localizacao WHERE loc_id = ?", [id]);

    // Retorna 404 se não achar a localização
    if (result.length === 0) {
      return res.status(404).json({ erro: "Localização não encontrada" });
    }

    // Retorna o objeto direto, e não dentro de um array
    return res.status(200).json(result[0]);
  } catch (err) {
    return res.status(500).json({ erro: "Erro ao buscar localização", detalhe: err.message });
  }
};

// CRIAR localização
exports.criarLocalizacao = async (req, res) => {
  const { loc_nome, loc_desc } = req.body;
  try {
    // Tratamento defensivo de Strings
    const nome = typeof loc_nome === "string" ? loc_nome.trim() : "";
    const desc = typeof loc_desc === "string" ? loc_desc.trim() : "";

    if (!nome) {
      return res.status(400).json({ erro: "O nome da localização é obrigatório" });
    }

    const [result] = await pool.query(
      "INSERT INTO localizacao (loc_nome, loc_desc) VALUES (?, ?)",
      //[loc_nome, loc_desc]
      [nome, desc]
    );

    return res.status(201).json({
      message: "Localização criada com sucesso",
      id: result.insertId,
    });
  } catch (err) {
    return res.status(500).json({ erro: "Erro ao criar localização", detalhe: err.message });
  }
};

// ATUALIZAR localização
exports.atualizarLocalizacao = async (req, res) => {
  const { id } = req.params;
  const { loc_nome, loc_desc } = req.body;
  try {
    const nome = typeof loc_nome === "string" ? loc_nome.trim() : "";
    const desc = typeof loc_desc === "string" ? loc_desc.trim() : "";

    if (!nome) {
      return res.status(400).json({ erro: "O nome da localização é obrigatório" });
    }

    const [result] = await pool.query(
      `UPDATE localizacao SET loc_nome = ?, loc_desc = ? WHERE loc_id = ?`,
      //[loc_nome, loc_desc, id]
      [nome, desc, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: "Localização não encontrada" });
    }

    return res.json({
      message: "Localização atualizada com sucesso",
    });
  } catch (err) {
    return res.status(500).json({ erro: "Erro ao atualizar localização", detalhe: err.message });
  }
};

// DELETAR localização
exports.deletarLocalizacao = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM localizacao WHERE loc_id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: "Localização não encontrada" });
    }

    return res.status(200).json({
      message: "Localização removida com sucesso",
    });
  } catch (err) {
    console.error({ erro: "Erro ao remover localização", detalhe: err.message });
  
    // Proteção de Integridade Referencial (Chave Estrangeira)
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
      return res.status(400).json({ 
        erro: "Não é possível excluir esta localização pois existem produtos ou histórico vinculados a ela." 
      });
    }
    // 2º: Se não for o erro de chave estrangeira, aí sim devolve o Erro 500 genérico
    return res.status(500).json({ erro: "Erro ao remover localização", detalhe: err.message });
  }
};
