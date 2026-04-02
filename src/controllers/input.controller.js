const pool = require("../config/database");
const { registerAudit } = require("../services/audit.services");

const {
  updateColunaEstoqueAtual,
} = require("../services/updateColunaEstoqueAtual");

// REGISTRAR PRODUTO (ENTRADA)
const registerInput = async (req, res) => {
  let connection;

  try {
    const { loc_id, fncd_id, ent_data_compra, ent_valor_compra, produtos } =
      req.body;

    if (
      !loc_id ||
      !fncd_id ||
      !ent_data_compra ||
      ent_valor_compra === undefined
    ) {
      return res.status(400).json({
        erro: "loc_id, fncd_id, ent_data_compra e ent_valor_compra são obrigatórios",
      });
    }

    if (!Array.isArray(produtos) || produtos.length === 0) {
      return res.status(400).json({
        erro: "produtos deve ser um array com ao menos um item",
      });
    }

    for (const [index, product] of produtos.entries()) {
      if (!product?.pdt_id || !product?.quantidade) {
        return res.status(400).json({
          erro: `Produto na posição ${index} sem pdt_id ou quantidade`,
        });
      }

      // A coluna ent_prod_lote está como INT no schema atual.
      if (product.lote !== undefined && Number.isNaN(Number(product.lote))) {
        return res.status(400).json({
          erro: `O campo lote do produto na posição ${index} deve ser numérico (schema atual: INT)`,
        });
      }
    }

    connection = await pool.getConnection();

    // Começo da transação: garante que ou salva tudo, ou não salva nada
    await connection.beginTransaction();

    // 1. Inserir a "Capa" da Entrada (Nota Fiscal/Registro Geral)
    const [inputResult] = await connection.query(
      `INSERT INTO entrada 
      (loc_id, fncd_id, ent_data_compra, ent_valor_compra, ent_data)
      VALUES (?, ?, ?, ?, NOW())`,
      [loc_id, fncd_id, ent_data_compra, ent_valor_compra],
    );

    const ent_id = inputResult.insertId;

    // Correção: Alterado de "saída" para "entrada"
    //await registerAudit(req.user.user_id, "Atualização de estoque - entrada", "entrada", ent_id);

    // 2. Inserir os produtos da entrada
    for (const product of produtos) {
      await connection.query(
        `INSERT INTO entrada_produtos
        (ent_id, pdt_id, ent_prod_qtde, ent_prod_lote)
        VALUES (?, ?, ?, ?)`,
        [
          ent_id,
          product.pdt_id,
          product.quantidade,
          product.lote === undefined ? null : Number(product.lote),
        ],
      );
      // Ao rodar o INSERT acima, a Trigger do MySQL
      // é disparada e atualiza o 'pdt_estoque_atual' na tabela 'produto' automaticamente!
    }

    await updateColunaEstoqueAtual(connection);

    // 3. Tudo deu certo? Confirma a transação
    await connection.commit();

    // 4. AGORA SIM: Registra a auditoria com segurança de que a entrada realmente existe
    await registerAudit(req.user.user_id, "Atualização de estoque - entrada", "entrada", ent_id);

    res.status(201).json({
      mensagem: "Entrada registrada com sucesso",
      ent_id: ent_id,
    });
  } catch (error) {
    // Deu algum erro? Desfaz tudo que foi inserido nesta tentativa
    if (connection) {
      await connection.rollback();
    }

    console.error("Erro ao registrar entrada:", error);

    res.status(500).json({
      erro: "Erro ao registrar entrada",
      detalhe: error.message
    });
  } finally {
    // Libera a conexão de volta para o Pool
    if (connection) {
      connection.release();
    }
  }
};

// Função para buscar e listar todas as entradas cadastradas (seguro contra injeção SQL, pois não possui parâmetros de filtro do usuário)
const getAllInputs = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT 
        e.ent_id,
        e.ent_data,
        e.ent_data_compra,
        e.ent_valor_compra,
        f.fncd_nome AS forn_nome,
        ep.ent_prod_qtde AS ent_quantidade,
        p.pdt_nome
      FROM entrada e
      LEFT JOIN fornecedor f ON e.fncd_id = f.fncd_id
      LEFT JOIN entrada_produtos ep ON e.ent_id = ep.ent_id
      LEFT JOIN produto p ON ep.pdt_id = p.pdt_id
      ORDER BY e.ent_data DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error("Erro ao listar entradas:", error);
    res.status(500).json({ erro: "Erro ao listar entradas" });
  } finally {
    connection.release();
  }
};

// ATUALIZAR PRODUTO (ENTRADA)
const updateInput = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { loc_id, fncd_id, ent_data_compra, ent_valor_compra, produtos } = req.body;

    await connection.beginTransaction();

    await connection.query(
      `UPDATE entrada SET loc_id = ?, fncd_id = ?, ent_data_compra = ?, ent_valor_compra = ? WHERE ent_id = ?`,
       [loc_id, fncd_id, ent_data_compra, ent_valor_compra, id]
    );

    await connection.query(`DELETE FROM entrada_produtos WHERE ent_id = ?`, [id]);

    if (produtos && produtos.length > 0) {
      for (const product of produtos) {
        await connection.query(
          `INSERT INTO entrada_produtos (ent_id, pdt_id, ent_prod_qtde, ent_prod_lote) VALUES (?, ?, ?, ?)`,
           [id, product.pdt_id, product.quantidade, product.lote]
        );
      }
    }

    
    await connection.commit();

    try { await registerAudit(req.user?.user_id || 1, 'Atualizacao de estoque (edicao) - entrada', 'entrada', id); } catch(e) {
      console.error('Aviso: Erro não crítico ao salvar auditoria', e);
    }
    res.status(200).json({ mensagem: 'Entrada atualizada com sucesso' });

  } catch (error) {
    await connection.rollback();
    console.error('Erro ao atualizar entrada:', error);
    res.status(500).json({ erro: 'Erro ao atualizar a entrada', detalhe: error.message });
  } finally {
    connection.release();
  }
};

// APAGAR PRODUTO (ENTRADA)
const deleteInput = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;

    await connection.beginTransaction();

    await connection.query(`DELETE FROM entrada_produtos WHERE ent_id = ?`, [id]);

    await connection.query(`DELETE FROM entrada WHERE ent_id = ?`, [id]);

    
    await connection.commit();

    try { await registerAudit(req.user?.user_id || 1, 'Estorno de estoque (exclusao) - entrada', 'entrada', id); } catch(e) {
      console.error('Aviso: Erro não crítico ao salvar auditoria', e);
    }
    
    res.status(200).json({ mensagem: 'Entrada excluida com sucesso.' });

  } catch (error) {
    await connection.rollback();
    console.error('Erro ao excluir entrada:', error);
    res.status(500).json({ erro: 'Erro ao excluir a entrada', detalhe: error.message });
  } finally {
    connection.release();
  }
};

// Exportando funÃ§Ãµes do controller
module.exports = { registerInput, getAllInputs, updateInput, deleteInput };
