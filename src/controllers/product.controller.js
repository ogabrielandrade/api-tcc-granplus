const pool = require("../config/database.js");
const { registerAudit } = require("../services/audit.services.js");

// LISTAR TODOS OS PRODUTOS
const listAllProducts = async (req, res) => {
  try {
    // a lista principal já traz o estoque atualizado e o nome da categoria
    const [produtos] = await pool.execute(
      `SELECT p.*, c.cat_nome 
       FROM produto p 
       LEFT JOIN categorias c ON p.cat_id = c.cat_id
       WHERE p.pdt_ativo = 1
       ORDER BY p.pdt_nome ASC`,
    );
    res.status(200).json(produtos);
  } catch (error) {
    console.error("Erro ao buscar produtos", error);
    res.status(500).json({ error: "Erro ao buscar produtos" });
  }
};

// CRIAR PRODUTO
const createProduct = async (req, res) => {
  try {
    const {
      pdt_nome,
      pdt_codigo,
      pdt_descricao,
      pdt_estoque_minimo,
      pdt_ativo = 1, // Boa prática: definir um valor default caso o front não envie
      cat_id,
      unid_med_id,
    } = req.body;

    // validação Básica
    const nome = typeof pdt_nome === "string" ? pdt_nome.trim() : "";
    const codigo = typeof pdt_codigo === "string" ? pdt_codigo.trim() : "";

    if (!nome || !codigo || !cat_id || !unid_med_id) {
      return res.status(400).json({
        error: "Nome, código, categoria e unidade de medida são obrigatórios",
      });
    }
    // valida duplicidade, incluindo produtos inativos
    const [duplicados] = await pool.execute(
      `SELECT pdt_id, pdt_nome, pdt_codigo
       FROM produto
       WHERE pdt_codigo = ? OR pdt_nome = ?`,
      [codigo, nome],
    );

    const codigoJaExiste = duplicados.some((p) => p.pdt_codigo === codigo);
    const nomeJaExiste = duplicados.some((p) => p.pdt_nome === nome);

    if (codigoJaExiste && nomeJaExiste) {
      return res.status(409).json({
        error: `Já existe um produto cadastrado com o nome "${nome}" e com o código "${codigo}", inclusive entre produtos excluídos`,
      });
    }

    if (codigoJaExiste) {
      return res.status(409).json({
        error: `Já existe um produto cadastrado com o código "${codigo}", inclusive entre produtos excluídos`,
      });
    }

    if (nomeJaExiste) {
      return res.status(409).json({
        error: `Já existe um produto cadastrado com o nome "${nome}", inclusive entre produtos excluídos`,
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO produto 
       (pdt_nome, pdt_codigo, pdt_descricao, pdt_estoque_minimo, pdt_ativo, cat_id, unid_med_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        nome,
        codigo,
        pdt_descricao || "", // Evita inserir NULL, coloca string vazia
        Number(pdt_estoque_minimo) || 0, // Se não enviar, assume 0
        pdt_ativo,
        cat_id,
        unid_med_id,
      ],
    );

    try {
      await registerAudit(
        req.user.user_id,
        "Produto criado",
        "produto",
        result.insertId,
      );
    } catch (error) {
      console.error(
        "Aviso: Falha ao registrar auditoria de criação de produto",
        error,
      );
    }

    res.status(201).json({
      message: "Produto criado com sucesso",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Erro ao criar produto", error);
    res.status(500).json({ error: "Erro ao criar produto" });
  }
};

// ATUALIZAR PRODUTO
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      pdt_nome,
      pdt_codigo,
      pdt_descricao,
      pdt_estoque_minimo,
      pdt_ativo,
      cat_id,
      unid_med_id,
    } = req.body;

    const nome = typeof pdt_nome === "string" ? pdt_nome.trim() : "";
    const codigo = typeof pdt_codigo === "string" ? pdt_codigo.trim() : "";

    if (!nome || !codigo || !cat_id || !unid_med_id) {
      return res.status(400).json({
        error: "Nome, código, categoria e unidade de medida são obrigatórios",
      });
    }

    // **** PARTE COMENTADA PARA TESTE: aparentemente, nãe era possível atualização de produtos por conta desta parte
    // anti-duplicação de código na edição
    // const [codigoExiste] = await pool.execute(
    //   "SELECT pdt_id FROM produto WHERE pdt_codigo = ? AND pdt_id <> ? LIMIT 1",
    //   [codigo, id],
    // );

    // if (codigoExiste.length > 0) {
    //   return res
    //     .status(409)
    //     .json({ error: "Este código já está em uso por outro produto" });
    // }

    const [result] = await pool.execute(
      `UPDATE produto SET
        pdt_nome = ?,
        pdt_codigo = ?,
        pdt_descricao = ?,
        pdt_estoque_minimo = ?,
        pdt_ativo = ?,
        cat_id = ?,
        unid_med_id = ?
       WHERE pdt_id = ?`,
      [
        nome,
        codigo,
        pdt_descricao,
        Number(pdt_estoque_minimo) || 0,
        pdt_ativo,
        cat_id,
        unid_med_id,
        id,
      ],
    );

    // valida para auditoria
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Produto não encontrado" });
    }

    try {
      await registerAudit(
        req.user.user_id,
        `Produto ${id} atualizado`, // ********* MUDANÇA AQUI, TESTAR ************
        "produto",
        id,
      );
    } catch (e) {
      console.error(
        "Aviso: Falha ao registrar auditoria de atualização de produto",
        e,
      );
    }

    res.json({ mensagem: "Produto atualizado com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar produto", error);
    res.status(500).json({ error: "Erro ao atualizar produto" });
  }
};

// DELETAR (SOFT DELETE) PRODUTOS
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      `UPDATE produto SET pdt_ativo = 0 WHERE pdt_id = ?`,
      [id],
    );

    // valida para auditoria
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Produto não encontrado" });
    }

    try {
      await registerAudit(
        req.user.user_id,
        `Produto ${id} desativado`,
        "produto",
        id,
      );
    } catch (e) {
      console.error(
        "Aviso: Falha ao registrar auditoria de inativação de produto",
        e,
      );
    }

    res.status(200).json({ message: "Produto desativado com sucesso" });
  } catch (error) {
    console.error("Erro ao desativar o produto");
    res.status(500).json({ error: "Erro ao desativar o produto" });
  }
};

// EXTRATO DE MOVIMENTAÇÃO (TIMELINE)
const historicalMoviments = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      `SELECT 
        'entrada' AS tipo,
        ep.ent_prod_qtde AS quantidade,
        e.ent_data AS data
      FROM entrada_produtos ep
      JOIN entrada e ON ep.ent_id = e.ent_id
      WHERE ep.pdt_id = ?

      UNION ALL

      SELECT
        'saida' AS tipo,
        sp.lcl_qtde AS quantidade,
        sp.lcl_data_saida AS data
      FROM saida_produtos sp
      JOIN localizacao_produtos lp ON sp.lcl_id = lp.lcl_id
      WHERE lp.pdt_id = ?

      ORDER BY data DESC`,
      [id, id],
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao buscar histórico" });
  }
};

module.exports = {
  listAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  historicalMoviments,
};
