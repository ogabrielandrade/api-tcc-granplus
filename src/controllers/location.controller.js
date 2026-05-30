const pool = require("../config/database");
const { registerAudit } = require("../services/audit.services");

let ensureLocationSoftDeleteColumnPromise = null;

const ensureLocationSoftDeleteColumn = async () => {
  if (!ensureLocationSoftDeleteColumnPromise) {
    ensureLocationSoftDeleteColumnPromise = (async () => {
      const [columns] = await pool.execute(
        `SELECT COUNT(*) AS total
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'localizacao'
           AND COLUMN_NAME = 'loc_ativo'`,
      );

      if (Number(columns[0].total) === 0) {
        await pool.execute(
          `ALTER TABLE localizacao
           ADD COLUMN loc_ativo TINYINT(1) NOT NULL DEFAULT 1`,
        );
      }
    })();
  }

  return ensureLocationSoftDeleteColumnPromise;
};

// LISTAR LOCALIZAÇÕES
exports.listLocation = async (req, res) => {
  try {
    await ensureLocationSoftDeleteColumn();

    const [result] = await pool.query(
      "SELECT * FROM localizacao WHERE loc_ativo = 1 ORDER BY loc_nome",
    );
    return res.status(200).json(result);
  } catch (err) {
    return res
      .status(500)
      .json({ erro: "Erro ao listar localizações", detalhe: err.message });
  }
};

// LISTAR TODAS AS LOCALIZAÇÕES (ATIVAS E INATIVAS)
exports.listAllLocations = async (req, res) => {
  try {
    await ensureLocationSoftDeleteColumn();

    const [result] = await pool.query(
      "SELECT * FROM localizacao ORDER BY loc_ativo DESC, loc_nome",
    );
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
    await ensureLocationSoftDeleteColumn();

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
    await ensureLocationSoftDeleteColumn();

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
      "INSERT INTO localizacao (loc_nome, loc_desc, loc_ativo) VALUES (?, ?, 1)",
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
    await ensureLocationSoftDeleteColumn();

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
  const { id } = req.params;

  const connection = await pool.getConnection();
  try {
    await ensureLocationSoftDeleteColumn();
    const { id } = req.params;

    await connection.beginTransaction();

    const [localizacao] = await pool.execute(
      `SELECT loc_nome, loc_ativo
       FROM localizacao
       WHERE loc_id = ?
       LIMIT 1`,
      [id],
    );

    if (localizacao.length === 0) {
      return res.status(404).json({ erro: "Localização não encontrada" });
    }

    const { loc_nome: nomeLoc, loc_ativo: locAtivo } = localizacao[0];

    if (Number(locAtivo) === 0) {
      return res.status(400).json({ erro: "Localização já está inativa" });
    }

    const [estoqueAtualLocalizacao] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM (
         SELECT
           ep.pdt_id,
           COALESCE(SUM(ep.ent_prod_qtde), 0) AS entradas,
           COALESCE((
             SELECT SUM(sp.lcl_qtde)
             FROM saida_produtos sp
             JOIN localizacao_produtos lp ON lp.lcl_id = sp.lcl_id
             WHERE lp.loc_id = ?
               AND lp.pdt_id = ep.pdt_id
           ), 0) AS saidas
         FROM entrada e
         JOIN entrada_produtos ep ON ep.ent_id = e.ent_id
         WHERE e.loc_id = ?
         GROUP BY ep.pdt_id
       ) saldos
       WHERE (entradas - saidas) > 0`,
      [id, id],
    );

    if (Number(estoqueAtualLocalizacao[0].total) > 0) {
      return res.status(400).json({
        erro: "Não é possível desativar esta localização porque ainda existem produtos em estoque nela.",
      });
    }

    const [result] = await pool.execute(
      "UPDATE localizacao SET loc_ativo = 0 WHERE loc_id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: "Localização não encontrada" });
    }

    try {
      await registerAudit(
        req.user.user_id,
        `Localização ${nomeLoc} (ID ${id}) desativada`,
        "localizacao",
        id,
      );
    } catch (error) {
      console.error("Erro ao atualizar localização", error);
    }
    await registerAudit(
      req.user.user_id,
      `Localização ${nomeLoc} (ID ${id}) excluída`,
      "localizacao",
      result.insertID,
    );

    await connection.commit();

    return res.status(200).json({
      message: "Localização desativada com sucesso",
    });
  } catch (err) {
    await connection.rollback();
    console.error({
      erro: "Erro ao desativar localização",
      detalhe: err.message,
    });

    return res
      .status(500)
      .json({ erro: "Erro ao desativar localização", detalhe: err.message });
  }
};

// ATIVAR LOCALIZAÇÃO
exports.activateLocation = async (req, res) => {
  const { id } = req.params;

  try {
    await ensureLocationSoftDeleteColumn();

    const [localizacao] = await pool.execute(
      `SELECT loc_nome, loc_ativo
       FROM localizacao
       WHERE loc_id = ?
       LIMIT 1`,
      [id],
    );

    if (localizacao.length === 0) {
      return res.status(404).json({ erro: "Localização não encontrada" });
    }

    const { loc_nome: nomeLoc, loc_ativo: locAtivo } = localizacao[0];

    if (Number(locAtivo) === 1) {
      return res.status(400).json({ erro: "Localização já está ativa" });
    }

    const [result] = await pool.execute(
      "UPDATE localizacao SET loc_ativo = 1 WHERE loc_id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: "Localização não encontrada" });
    }

    try {
      await registerAudit(
        req.user.user_id,
        `Localização ${nomeLoc} (ID ${id}) ativada`,
        "localizacao",
        id,
      );
    } catch (error) {
      console.error("Erro ao registrar ativação de localização", error);
    }

    return res.status(200).json({
      message: "Localização ativada com sucesso",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ erro: "Erro ao ativar localização", detalhe: err.message });
      .json({ erro: "Erro ao remover localização", detalhe: err.message });
  } finally {
    connection.release();
  }
};
