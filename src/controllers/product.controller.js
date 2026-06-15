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
  const connection = await pool.getConnection();

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

    await connection.beginTransaction();

    // validação Básica
    const nome = typeof pdt_nome === "string" ? pdt_nome.trim() : "";
    const codigo = typeof pdt_codigo === "string" ? pdt_codigo.trim() : "";

    if (!nome || !codigo || !cat_id || !unid_med_id) {
      return res.status(400).json({
        error: "Nome, código, categoria e unidade de medida são obrigatórios",
      });
    }
    // valida duplicidade, incluindo produtos inativos
    const [duplicados] = await connection.execute(
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

    const [result] = await connection.execute(
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

    await registerAudit(
      req.user.user_id,
      "Produto criado",
      "produto",
      result.insertId,
    );

    await connection.commit();

    res.status(201).json({
      message: "Produto criado com sucesso",
      id: result.insertId,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Erro ao criar produto", error);
    res.status(500).json({ error: "Erro ao criar produto" });
  } finally {
    connection.release();
  }
};

// ATUALIZAR PRODUTO
const updateProduct = async (req, res) => {
  const connection = await pool.getConnection();

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

    await connection.beginTransaction();

    const nome = typeof pdt_nome === "string" ? pdt_nome.trim() : "";
    const codigo = typeof pdt_codigo === "string" ? pdt_codigo.trim() : "";

    if (!nome || !codigo || !cat_id || !unid_med_id) {
      return res.status(400).json({
        error: "Nome, código, categoria e unidade de medida são obrigatórios",
      });
    }
    // valida duplicidade ao atualizar (inclui produtos inativos), exceto o próprio registro
    const [duplicadosEdicao] = await connection.execute(
      `SELECT pdt_id, pdt_nome, pdt_codigo
       FROM produto
       WHERE (pdt_codigo = ? OR pdt_nome = ?) AND pdt_id <> ?`,
      [codigo, nome, id],
    );

    const codigoJaExisteEdicao = duplicadosEdicao.some((p) => p.pdt_codigo === codigo);
    const nomeJaExisteEdicao = duplicadosEdicao.some((p) => p.pdt_nome === nome);

    if (codigoJaExisteEdicao && nomeJaExisteEdicao) {
      return res.status(409).json({
        error: `Já existe outro produto com o nome "${nome}" e com o código "${codigo}", inclusive entre produtos excluídos`,
      });
    }

    if (codigoJaExisteEdicao) {
      return res.status(409).json({
        error: `Já existe outro produto com o código "${codigo}", inclusive entre produtos excluídos`,
      });
    }

    if (nomeJaExisteEdicao) {
      return res.status(409).json({
        error: `Já existe outro produto com o nome "${nome}", inclusive entre produtos excluídos`,
      });
    }

    // Busca os dados antigos do produto para comparação
    const [produtoAntigo] = await connection.execute(
      `SELECT pdt_nome, pdt_codigo, pdt_descricao, pdt_estoque_minimo, pdt_ativo, cat_id, unid_med_id 
       FROM produto WHERE pdt_id = ? LIMIT 1`,
      [id],
    );

    if (produtoAntigo.length === 0) {
      return res.status(404).json({ message: "Produto não encontrado" });
    }

    const produto = produtoAntigo[0];

    const [result] = await connection.execute(
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

    // Compara os dados antigos com os novos e constrói a lista de alterações
    let alteracoes = [];

    if (produto.pdt_nome !== nome) {
      alteracoes.push(`nome de '${produto.pdt_nome}' para '${nome}'`);
    }

    if (produto.pdt_codigo !== codigo) {
      alteracoes.push(`código de '${produto.pdt_codigo}' para '${codigo}'`);
    }

    if (produto.pdt_descricao !== (pdt_descricao || "")) {
      alteracoes.push(`descrição atualizada`);
    }

    if (produto.pdt_estoque_minimo !== (Number(pdt_estoque_minimo) || 0)) {
      alteracoes.push(
        `estoque mínimo de ${produto.pdt_estoque_minimo} para ${Number(pdt_estoque_minimo) || 0}`,
      );
    }

    if (produto.pdt_ativo !== pdt_ativo) {
      const statusTexto = pdt_ativo === 1 ? "ATIVADO" : "DESATIVADO";
      alteracoes.push(`status para ${statusTexto}`);
    }

    if (produto.cat_id !== cat_id) {
      alteracoes.push(`categoria atualizada de ${produto.cat_id} para ${cat_id}`);
    }

    if (produto.unid_med_id !== unid_med_id) {
      alteracoes.push(`unidade de medida atualizada de ${produto.unid_med_id} para ${unid_med_id}`);
    }

    // Montagem da mensagem final
    let mensagemAuditoria = `Produto ${nome} (ID ${id}) atualizado.`;
    if (alteracoes.length > 0) {
      mensagemAuditoria += ` Alterações: ${alteracoes.join(", ")}.`;
    } else {
      mensagemAuditoria += ` Nenhuma alteração nos dados.`;
    }

    await registerAudit(
      req.user.user_id,
      mensagemAuditoria,
      "produto",
      id,
    );

    await connection.commit();

    res.json({ mensagem: "Produto atualizado com sucesso" });
  } catch (error) {
    await connection.rollback();
    console.error("Erro ao atualizar produto", error);
    res.status(500).json({ error: "Erro ao atualizar produto" });
  } finally {
    connection.release();
  }
};

// DELETAR (SOFT DELETE) PRODUTOS
const deleteProduct = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;

    await connection.beginTransaction();

    const [result] = await connection.execute(
      `UPDATE produto SET pdt_ativo = 0 WHERE pdt_id = ?`,
      [id],
    );

    // valida para auditoria
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Produto não encontrado" });
    }

    await registerAudit(
      req.user.user_id,
      `Produto ${id} desativado`,
      "produto",
      id,
    );

    await connection.commit();

    res.status(200).json({ message: "Produto desativado com sucesso" });
  } catch (error) {
    await connection.rollback();
    console.error("Erro ao desativar o produto");
    res.status(500).json({ error: "Erro ao desativar o produto" });
  } finally {
    connection.release();
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
