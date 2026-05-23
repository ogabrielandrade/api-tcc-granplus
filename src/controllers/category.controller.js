const pool = require("../config/database");
const { registerAudit } = require("../services/audit.services");

// LISTAGEM DE CATEGORIAS
exports.getAllCategory = async (req, res) => {
  try {
    const [categorias] = await pool.execute("SELECT * FROM categorias");
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao listar categorias" });
  }
};

// BUSCA CATEGORIA POR ID
exports.getCategoryById = async (req, res) => {
  const { id } = req.params;

  try {
    const [categoria] = await pool.execute(
      "SELECT * FROM categorias WHERE cat_id = ?",
      [id],
    );

    if (categoria.length === 0) {
      return res.status(404).json({
        mensagem: "Categoria não encontrada",
      });
    }

    res.json(categoria[0]);
  } catch (error) {
    res.status(500).json({
      erro: "Erro ao buscar categoria",
    });
  }
};

// CRIAÇÃO DE CATEGORIA
exports.createCategory = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { cat_nome } = req.body;
    const nomeCategoria = typeof cat_nome === "string" ? cat_nome.trim() : ""; // função .trim() usada para remover espaços em branco no início e no fim de uma string
    // uso de operador ternário para validação se o valor recebido em cat_nome é uma string

    await connection.beginTransaction();

    if (!nomeCategoria) {
      return res.status(400).json({
        erro: "O campo cat_nome é obrigatório e não pode estar em branco",
      });
    }

    const [categoriaExistente] = await pool.execute(
      "SELECT cat_id FROM categorias WHERE LOWER(TRIM(cat_nome)) = LOWER(TRIM(?)) LIMIT 1", // LOWER() = transforma em minúsculo; TRIM() = remove os espaços em branco
      [nomeCategoria],
    );

    if (categoriaExistente.length > 0) {
      return res.status(409).json({
        erro: "Categoria já cadastrada",
      });
    }

    const [result] = await pool.execute(
      "INSERT INTO categorias (cat_nome) VALUES (?)",
      [nomeCategoria],
    );

    await registerAudit(
      req.user.user_id,
      `Categoria ${nomeCategoria} criada`,
      "Categorias",
      result.insertId,
    );

    await connection.commit();

    res.status(201).json({
      mensagem: "Categoria criada com sucesso",
      id: result.insertId,
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ erro: "Erro ao criar categoria" });
  } finally {
    connection.release();
  }
};

// ATUALIZAÇÃO DE CATEGORIAS
exports.updateCategory = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { cat_nome } = req.body;
    const nomeCategoria = typeof cat_nome === "string" ? cat_nome.trim() : "";

    await connection.beginTransaction();

    if (!nomeCategoria) {
      return res.status(400).json({
        erro: "O campo cat_nome é obrigatório e não pode estar em branco",
      });
    }

    const [categoriaExistente] = await pool.execute(
      "SELECT cat_id, cat_nome FROM categorias WHERE cat_id = ? LIMIT 1",
      [id],
    );

    if (categoriaExistente.length === 0) {
      return res.status(404).json({ mensagem: "Categoria não encontrada" });
    }

    const [categoriaDuplicada] = await pool.execute(
      "SELECT cat_id FROM categorias WHERE LOWER(TRIM(cat_nome)) = LOWER(TRIM(?)) AND cat_id <> ? LIMIT 1",
      [nomeCategoria, id],
    );

    if (categoriaDuplicada.length > 0) {
      return res.status(409).json({
        erro: "Categoria já cadastrada",
      });
    }

    const nomeAnteriorCategoria = categoriaExistente[0].cat_nome;

    const [result] = await pool.execute(
      "UPDATE categorias SET cat_nome = ? WHERE cat_id = ?",
      [nomeCategoria, id],
    );

    await registerAudit(
      req.user.user_id,
      `Categoria ${nomeAnteriorCategoria} atualizada para ${nomeCategoria}`,
      "Categorias",
      result.insertId,
    );

    await connection.commit();

    res.json({ mensagem: "Categoria atualizada com sucesso" });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ erro: "Erro ao atualizar categoria" });
  } finally {
    connection.release();
  }
};

// excluir categoria
/*exports.delete = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.execute("DELETE FROM categorias WHERE cat_id = ?", [
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

exports.deleteCategory = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;

    await connection.beginTransaction();

    const [nome] = await pool.execute(
      "SELECT cat_nome FROM categorias WHERE cat_id = ? LIMIT 1",
      [id],
    );

    if (nome.length === 0) {
      return res.status(500).json({ erro: "Categoria não encontrada" });
    }

    const nomeCategoria = nome[0].cat_nome;

    const [result] = await pool.execute(
      "DELETE FROM categorias WHERE cat_id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensagem: "Categoria não encontrada" });
    }

    await registerAudit(
      req.user.user_id,
      `Categoria ${nomeCategoria} deletada`,
      "Categorias",
      result.insertId,
    );

    await connection.commit();

    res.json({ mensagem: "Categoria removida com sucesso" });
  } catch (error) {
    await connection.rollback();
    console.error("Erro ao deletar categoria:", error);

    // 1451 é o código do MySQL para "Cannot delete or update a parent row: a foreign key constraint fails"
    if (error.errno === 1451) {
      return res.status(400).json({
        erro: "Não é possível excluir esta categoria porque existem produtos vinculados a ela. Remova ou altere a categoria dos produtos primeiro.",
      });
    }

    res.status(500).json({ erro: "Erro interno ao remover categoria" });
  } finally {
    connection.release();
  }
};
