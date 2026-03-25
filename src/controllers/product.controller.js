// REGRA DE NEGÓCIO

const pool = require("../config/database.js");
const { registerAudit } = require("../services/audit.services.js");

const listProducts = async (req, res) => {
  try {
    // Adicionado: Agora a lista principal já traz o estoque atualizado!
    const [rows] = await pool.query(
      "SELECT *, pdt_estoque_atual FROM produto WHERE pdt_ativo = 1"
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("Erro ao buscar produtos");
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

    const [result] = await pool.query(
      `INSERT INTO produto 
       (pdt_nome, pdt_codigo, pdt_descricao, pdt_estoque_minimo, pdt_ativo, cat_id, unid_med_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        pdt_nome,
        pdt_codigo,
        pdt_descricao,
        pdt_estoque_minimo,
        pdt_ativo,
        cat_id,
        unid_med_id,
<<<<<<< HEAD
      })
      .select("pdt_id")
      .single();

    if (error) throw error;
=======
      ]
    );
>>>>>>> 3f7fda17bc118d6b34352f0734647d285bc1c247

    await registerAudit(req.user.user_id, "Produto criado", "produto", result.insertId);

    res.status(201).json({
      message: "Produto criado com sucesso",
<<<<<<< HEAD
      id: data?.pdt_id,
=======
      id: result.insertId, // CORREÇÃO: insertID -> insertId
>>>>>>> 3f7fda17bc118d6b34352f0734647d285bc1c247
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

    const [result] = await pool.query(
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
        pdt_nome,
        pdt_codigo,
        pdt_descricao,
        pdt_estoque_minimo,
        pdt_ativo,
        cat_id,
        unid_med_id,
<<<<<<< HEAD
      })
      .eq("pdt_id", id)
      .select("pdt_id")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
=======
        id,
      ]
    );

    // CORREÇÃO: Valida PRIMEIRO, audita DEPOIS.
    if (result.affectedRows === 0) {
>>>>>>> 3f7fda17bc118d6b34352f0734647d285bc1c247
      return res.status(404).json({ message: "Produto não encontrado" });
    }

    await registerAudit(req.user.user_id, "Produto atualizado", "produto", id);

    res.json({ mensagem: "Produto atualizado com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar produto");
    res.status(500).json({ error: "Erro ao atualizar produto" });
  }
};

// DELETAR (TORNÁ-LO INATIVO) PRODUTOS
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

<<<<<<< HEAD
    const { data, error } = await supabase
      .from("produto")
      .update({ pdt_ativo: 0 })
      .eq("pdt_id", id)
      .select("pdt_id")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({
        message: "Produto não encontrado",
      });
=======
    const [result] = await pool.query(
      `UPDATE produto SET pdt_ativo = 0 WHERE pdt_id = ?`,
      [id]
    );

    // CORREÇÃO: Valida PRIMEIRO, audita DEPOIS.
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Produto não encontrado" });
>>>>>>> 3f7fda17bc118d6b34352f0734647d285bc1c247
    }

    await registerAudit(req.user.user_id, "Produto inativado", "produto", id);

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

<<<<<<< HEAD
    const { data: entradas, error: entradasError } = await supabase
      .from("entrada_produtos")
      .select("ent_prod_qtde, entrada(ent_data)")
      .eq("pdt_id", id);

    if (entradasError) throw entradasError;
=======
    // Essa query está sensacional. Não mudei nada na lógica dela.
    const [rows] = await pool.query(
      `SELECT 
        'entrada' AS tipo,
        ep.ent_prod_qtde AS quantidade,
        e.ent_data AS data
      FROM entrada_produtos ep
      JOIN entrada e ON ep.ent_id = e.ent_id
      WHERE ep.pdt_id = ?
>>>>>>> 3f7fda17bc118d6b34352f0734647d285bc1c247

    const { data: saidas, error: saidasError } = await supabase
      .from("saida_produtos")
      .select("lcl_qtde, lcl_data_saida, localizacao_produtos!inner(pdt_id)")
      .eq("localizacao_produtos.pdt_id", id);

<<<<<<< HEAD
    if (saidasError) throw saidasError;

    const movimentos = [
      ...(entradas ?? []).map((row) => ({
        tipo: "entrada",
        quantidade: row.ent_prod_qtde,
        data: row.entrada?.ent_data,
      })),
      ...(saidas ?? []).map((row) => ({
        tipo: "saida",
        quantidade: row.lcl_qtde,
        data: row.lcl_data_saida,
      })),
    ].sort((a, b) => {
      const da = a.data ? new Date(a.data).getTime() : 0;
      const db = b.data ? new Date(b.data).getTime() : 0;
      return db - da;
    });

    res.json(movimentos);

=======
      SELECT
        'saida' AS tipo,
        sp.lcl_qtde AS quantidade,
        sp.lcl_data_saida AS data
      FROM saida_produtos sp
      JOIN localizacao_produtos lp ON sp.lcl_id = lp.lcl_id
      WHERE lp.pdt_id = ?

      ORDER BY data DESC`,
      [id, id]
    );

    res.json(rows);
>>>>>>> 3f7fda17bc118d6b34352f0734647d285bc1c247
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao buscar histórico" });
  }
};

module.exports = {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  historicalMoviments,
};