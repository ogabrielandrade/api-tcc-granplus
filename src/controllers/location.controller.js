const pool = require("../config/database");
const { registerAudit } = require("../services/audit.services");

// LISTAR LOCALIZAÇÕES
exports.listLocation = async (req, res) => {
  try {
    const [result] = await pool.query("SELECT * FROM localizacao");
    return res.status(200).json(result);
  } catch (err) {
    return res
      .status(500)
      .json({ erro: "Erro ao listar localizações", detalhe: err.message });
  }
};

// BUSCAR LOCALIZAÇÃO POR ID
exports.searchLocation = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.execute(
      "SELECT * FROM localizacao WHERE loc_id = ?",
      [id],
    );

    // Retorna 404 se não achar a localização
    if (result.length === 0) {
      return res.status(404).json({ erro: "Localização não encontrada" });
    }

    // Retorna o objeto direto, e não dentro de um array
    return res.status(200).json(result[0]);
  } catch (err) {
    return res
      .status(500)
      .json({ erro: "Erro ao buscar localização", detalhe: err.message });
  }
};

// CRIAR LOCALIZAÇÃO
exports.createLocation = async (req, res) => {
  const connection = await pool.getConnection();
  const { loc_nome, loc_desc } = req.body;
  try {
    // Tratamento de dados
    const nome = typeof loc_nome === "string" ? loc_nome.trim() : "";
    const desc = typeof loc_desc === "string" ? loc_desc.trim() : "";

    await connection.beginTransaction();

    if (!nome) {
      return res
        .status(400)
        .json({ erro: "O nome da localização é obrigatório" });
    }

    const [result] = await pool.execute(
      "INSERT INTO localizacao (loc_nome, loc_desc) VALUES (?, ?)",
      [nome, desc],
    );

    await registerAudit(
      req.user.user_id,
      `Localização ${nome} criada`,
      "localizacao",
      result.insertId,
    );

    await connection.commit();

    return res.status(201).json({
      message: "Localização criada com sucesso",
      id: result.insertId,
    });
  } catch (err) {
    await connection.rollback();
    return res
      .status(500)
      .json({ erro: "Erro ao criar localização", detalhe: err.message });
  } finally {
    connection.release();
  }
};

// ATUALIZAR LOCALIZAÇÃO
exports.updateLocation = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { loc_nome, loc_desc } = req.body;

    await connection.beginTransaction();

    const nome = typeof loc_nome === "string" ? loc_nome.trim() : "";
    const desc = typeof loc_desc === "string" ? loc_desc.trim() : "";

    if (!nome) {
      return res
        .status(400)
        .json({ erro: "O nome da localização é obrigatório" });
    }

    const [nomeAntigo] = await pool.execute(
      `
        SELECT loc_nome FROM localizacao WHERE loc_id = ? LIMIT 1
      `,
      [id],
    );

    const nomeAntigoLoc = nomeAntigo[0].loc_nome;

    const [result] = await pool.execute(
      `UPDATE localizacao SET loc_nome = ?, loc_desc = ? WHERE loc_id = ?`,
      //[loc_nome, loc_desc, id]
      [nome, desc, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: "Localização não encontrada" });
    }

    await registerAudit(
      req.user.user_id,
      `Localização ${nomeAntigoLoc} atualizada para ${nome}`,
      "localizacao",
      result.insertID,
    );

    await connection.commit();

    return res.json({
      message: "Localização atualizada com sucesso",
    });
  } catch (err) {
    await connection.rollback();
    return res
      .status(500)
      .json({ erro: "Erro ao atualizar localização", detalhe: err.message });
  } finally {
    connection.release();
  }
};

// DELETAR LOCALIZAÇÃO
exports.deleteLocation = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;

    await connection.beginTransaction();

    const [nome] = await pool.execute(
      `SELECT loc_nome FROM localizacao WHERE loc_id = ? LIMIT 1`,
      [id],
    );

    const nomeLoc = nome[0].loc_nome;

    const [result] = await pool.execute(
      "DELETE FROM localizacao WHERE loc_id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      // diferente de comando select, o delete, update e insert não retornam arrays, mas objetos com metadados
      return res.status(404).json({ erro: "Localização não encontrada" });
    }

    await registerAudit(
      req.user.user_id,
      `Localização ${nomeLoc} (ID ${id}) excluída`,
      "localizacao",
      result.insertID,
    );

    await connection.commit();

    return res.status(200).json({
      message: "Localização removida com sucesso",
    });
  } catch (err) {
    await connection.rollback();
    console.error({
      erro: "Erro ao remover localização",
      detalhe: err.message,
    });

    // Proteção de Integridade Referencial (Chave Estrangeira)
    if (err.code === "ER_ROW_IS_REFERENCED_2" || err.errno === 1451) {
      return res.status(400).json({
        erro: "Não é possível excluir esta localização pois existem produtos ou histórico vinculados a ela.",
      });
    }
    // 2º: Se não for o erro de chave estrangeira, aí sim devolve o Erro 500 genérico
    return res
      .status(500)
      .json({ erro: "Erro ao remover localização", detalhe: err.message });
  } finally {
    connection.release();
  }
};
