const db = require("../config/database");

// LISTAR TODAS AS UNIDADES
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM unidade_medida");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao listar unidades de medida" });
  }
};

// BUSCAR POR ID
exports.getById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      "SELECT * FROM unidade_medida WHERE unid_med_id = ?",
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        mensagem: "Unidade de medida não encontrada",
      });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar unidade de medida" });
  }
};

// CRIAR NOVA UNIDADE
exports.create = async (req, res) => {
  const { unid_med_sigla } = req.body;

  if (!unid_med_sigla) {
    return res.status(400).json({
      message: "O campo Sigla da unidade de medida e obrigatorio",
    });
  }

  const sql = `
    INSERT INTO unidade_medida
    (unid_med_sigla)
    VALUES (?)
  `;

  try {
    const sigla = String(unid_med_sigla).trim();

    if (!sigla) {
      return res.status(400).json({
        erro: "O campo Sigla da unidade de medida nao pode estar em branco",
      });
    }

    const [unidadeExistente] = await db.query(
      "SELECT unid_med_id FROM unidade_medida WHERE LOWER(TRIM(unid_med_sigla)) = LOWER(TRIM(?)) LIMIT 1",
      [sigla],
    );

    if (unidadeExistente.length > 0) {
      return res.status(409).json({
        erro: "Unidade de medida ja cadastrada",
      });
    }

    const [result] = await db.query(sql, [sigla]);

    res.json({
      message: "Unidade criada com sucesso",
      id: result.insertId,
    });
  } catch (error) {
    res.status(500).json({
      erro: "Erro ao criar unidade de medida, utilize até três caracteres",
    });
  }
};

// ATUALIZAR UNIDADE
exports.update = async (req, res) => {
  const { id } = req.params;
  const { unid_med_sigla } = req.body;

  if (!unid_med_sigla) {
    return res.status(400).json({
      message: "O campo Sigla da unidade de medida e obrigatorio",
    });
  }

  const sql = `
    UPDATE unidade_medida
    SET unid_med_sigla = ?
    WHERE unid_med_id = ?
  `;

  try {
    const sigla = String(unid_med_sigla).trim();

    if (!sigla) {
      return res.status(400).json({
        erro: "O campo Sigla da unidade de medida nao pode estar em branco",
      });
    }

    const [unidadeExistente] = await db.query(
      "SELECT unid_med_id FROM unidade_medida WHERE unid_med_id = ? LIMIT 1",
      [id],
    );

    if (unidadeExistente.length === 0) {
      return res.status(404).json({
        mensagem: "Unidade de medida não encontrada",
      });
    }

    const [unidadeDuplicada] = await db.query(
      "SELECT unid_med_id FROM unidade_medida WHERE LOWER(TRIM(unid_med_sigla)) = LOWER(TRIM(?)) AND unid_med_id <> ? LIMIT 1",
      [sigla, id],
    );

    if (unidadeDuplicada.length > 0) {
      return res.status(409).json({
        erro: "Unidade de medida ja cadastrada",
      });
    }

    const [result] = await db.query(sql, [sigla, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        mensagem: "Unidade de medida não encontrada",
      });
    }

    res.json({
      message: "Unidade atualizada com sucesso",
    });
  } catch (error) {
    res.status(500).json({
      erro: "Erro ao atualizar unidade de medida, utilize até três caracteres",
    });
  }
};

// DELETAR UNIDADE
exports.delete = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query(
      "DELETE FROM unidade_medida WHERE unid_med_id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        mensagem: "Unidade de medida não encontrada",
      });
    }

    res.json({
      message: "Unidade removida com sucesso",
    });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao remover unidade de medida" });
  }
};
