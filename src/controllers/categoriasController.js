const pool = require("../config/database");

// listagem de categorias
exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM categorias");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao listar categorias" });
  }
};

// busca categoria por id
exports.getById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query("SELECT * FROM categorias WHERE cat_id = ?", [
      id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({
        mensagem: "Categoria não encontrada",
      });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({
      erro: "Erro ao buscar categoria",
    });
  }
};

// criação de categoria
exports.create = async (req, res) => {
  try {
    const { cat_nome } = req.body;
    const nomeCategoria = typeof cat_nome === "string" ? cat_nome.trim() : "";

    if (!nomeCategoria) {
      return res.status(400).json({
        erro: "O campo cat_nome é obrigatório e não pode estar em branco",
      });
    }

    const [categoriaExistente] = await pool.query(
      "SELECT cat_id FROM categorias WHERE LOWER(TRIM(cat_nome)) = LOWER(TRIM(?)) LIMIT 1",
      [nomeCategoria],
    );

    if (categoriaExistente.length > 0) {
      return res.status(409).json({
        erro: "Categoria já cadastrada",
      });
    }

    const [result] = await pool.query(
      "INSERT INTO categorias (cat_nome) VALUES (?)",
      [nomeCategoria],
    );

    res.status(201).json({
      mensagem: "Categoria criada com sucesso",
      id: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao criar categoria" });
  }
};

// atualização de categoria
exports.update = async (req, res) => {
  const { id } = req.params;
  const { cat_nome } = req.body;

  try {
    const nomeCategoria = typeof cat_nome === "string" ? cat_nome.trim() : "";

    if (!nomeCategoria) {
      return res.status(400).json({
        erro: "O campo cat_nome é obrigatório e não pode estar em branco",
      });
    }

    const [categoriaExistente] = await pool.query(
      "SELECT cat_id FROM categorias WHERE cat_id = ? LIMIT 1",
      [id],
    );

    if (categoriaExistente.length === 0) {
      return res.status(404).json({ mensagem: "Categoria não encontrada" });
    }

    const [categoriaDuplicada] = await pool.query(
      "SELECT cat_id FROM categorias WHERE LOWER(TRIM(cat_nome)) = LOWER(TRIM(?)) AND cat_id <> ? LIMIT 1",
      [nomeCategoria, id],
    );

    if (categoriaDuplicada.length > 0) {
      return res.status(409).json({
        erro: "Categoria já cadastrada",
      });
    }

    await pool.query("UPDATE categorias SET cat_nome = ? WHERE cat_id = ?", [
      nomeCategoria,
      id,
    ]);

    res.json({ mensagem: "Categoria atualizada com sucesso" });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao atualizar categoria" });
  }
};

// excluir categoria
/*exports.delete = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query("DELETE FROM categorias WHERE cat_id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensagem: "Categoria não encontrada" });
    }

    res.json({ mensagem: "Categoria removida com sucesso" });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao remover categoria" });
  }
};*/

exports.delete = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query("DELETE FROM categorias WHERE cat_id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensagem: "Categoria não encontrada" });
    }

    res.json({ mensagem: "Categoria removida com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar categoria:", error);

    // 1451 é o código do MySQL para "Cannot delete or update a parent row: a foreign key constraint fails"
    if (error.errno === 1451) {
      return res.status(400).json({ 
        erro: "Não é possível excluir esta categoria porque existem produtos vinculados a ela. Remova ou altere a categoria dos produtos primeiro." 
      });
    }

    res.status(500).json({ erro: "Erro interno ao remover categoria" });
  }
};
