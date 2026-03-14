const db = require("../db");

// LISTAR localizações
exports.listarLocalizacoes = (req, res) => {
  const sql = "SELECT * FROM localizacao";

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.status(200).json(result);
  });
};

// BUSCAR localização por ID
exports.buscarLocalizacao = (req, res) => {
  const { id } = req.params;

  const sql = "SELECT * FROM localizacao WHERE loc_id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.status(200).json(result);
  });
};

// CRIAR localização
exports.criarLocalizacao = (req, res) => {
  const { loc_nome, loc_desc } = req.body;

  const sql = "INSERT INTO localizacao (loc_nome, loc_desc) VALUES (?, ?)";

  db.query(sql, [loc_nome, loc_desc], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.status(201).json({
      message: "Localização criada com sucesso",
      id: result.insertId,
    });
  });
};

// ATUALIZAR localização
exports.atualizarLocalizacao = (req, res) => {
  const { id } = req.params;
  const { loc_nome, loc_desc } = req.body;

  const sql = `
        UPDATE localizacao 
        SET loc_nome = ?, loc_desc = ?
        WHERE loc_id = ?
    `;

  db.query(sql, [loc_nome, loc_desc, id], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.json({
      message: "Localização atualizada com sucesso",
    });
  });
};

// DELETAR localização
exports.deletarLocalizacao = (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM localizacao WHERE loc_id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.json({
      message: "Localização removida com sucesso",
    });
  });
};
