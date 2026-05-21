const pool = require("../config/database");

// Função para gerar relatório de Produtos Mais Movimentados
const getMoreMovedProducts = async (req, res) => {
  try {
    // CORREÇÃO: Usando Sub-consultas para evitar a "multiplicação" do JOIN
    const [relatorio] = await pool.execute(`
      SELECT 
          p.pdt_id,
          p.pdt_nome,

          /*IFNULL(SUM(ep.ent_prod_qtde),0) AS total_entradas,

          IFNULL(SUM(sp.lcl_qtde),0) AS total_saidas,

          IFNULL(SUM(ep.ent_prod_qtde),0) +
          IFNULL(SUM(sp.lcl_qtde),0) AS total_movimentado*/

          COALESCE(e.total_entradas, 0) AS total_entradas,
          COALESCE(s.total_saidas, 0) AS total_saidas,
          (COALESCE(e.total_entradas, 0) + COALESCE(s.total_saidas, 0)) AS total_movimentado

      FROM produto p

      /*LEFT JOIN entrada_produtos ep 
      ON p.pdt_id = ep.pdt_id

      LEFT JOIN localizacao_produtos lp 
      ON p.pdt_id = lp.pdt_id

      LEFT JOIN saida_produtos sp 
      ON lp.lcl_id = sp.lcl_id*/

      -- Sub-consulta: Soma apenas as entradas antes de juntar
      LEFT JOIN (
        SELECT pdt_id, SUM(ent_prod_qtde) AS total_entradas 
        FROM entrada_produtos 
        GROUP BY pdt_id
      ) e ON p.pdt_id = e.pdt_id

      -- Sub-consulta: Soma apenas as saídas antes de juntar
      LEFT JOIN (
        SELECT lp.pdt_id, SUM(sp.lcl_qtde) AS total_saidas 
        FROM saida_produtos sp
        JOIN localizacao_produtos lp ON sp.lcl_id = lp.lcl_id
        GROUP BY lp.pdt_id
      ) s ON p.pdt_id = s.pdt_id

     -- GROUP BY p.pdt_id, p.pdt_nome

      ORDER BY total_movimentado DESC
    `);

    res.json(relatorio);
  } catch (error) {
    console.error(
      "Erro ao gerar relatório de produtos mais movimentados:",
      error,
    );
    res.status(500).json({ erro: "Erro ao gerar relatório" });
  }
};

const minimumStock = async (req, res) => {
  try {
    const [estoqueMinimo] = await pool.execute(`
      SELECT
        dados.pdt_id,
        dados.pdt_nome,
        dados.pdt_estoque_minimo,
        dados.total_estoque
      FROM (
        SELECT
          p.pdt_id,
          p.pdt_nome,
          p.pdt_estoque_minimo,
          (
            COALESCE((
              SELECT SUM(ep.ent_prod_qtde)
              FROM entrada_produtos ep
              WHERE ep.pdt_id = p.pdt_id
            ), 0)
            -
            COALESCE((
              SELECT SUM(sp.lcl_qtde)
              FROM saida_produtos sp
              JOIN localizacao_produtos lp ON lp.lcl_id = sp.lcl_id
              WHERE lp.pdt_id = p.pdt_id
            ), 0)
          ) AS total_estoque
        FROM produto p
        WHERE p.pdt_ativo = 1
      ) AS dados
      WHERE dados.total_estoque < dados.pdt_estoque_minimo
      ORDER BY dados.total_estoque ASC;
    `);

    res.json(estoqueMinimo);
  } catch (error) {
    console.error("Erro ao calcular estoque mínimo:", error);
    res.status(500).json({
      message: "Erro interno ao calcular o estoque mínimo",
    });
  }
};

// Função para listar relatórios de auditoria (com filtros de período personalizados e seguros)
const getAuditReports = async (req, res) => {
  const { startDate, endDate } = req.query; // Agora esperamos as datas exatas
  let dateFilter = "";
  const queryParams = [];

  // Se o Front-end mandar as duas datas, a gente cria o filtro seguro contra SQL Injection
  if (startDate && endDate) {
    dateFilter = "AND aud_data BETWEEN ? AND ?";
    queryParams.push(startDate, endDate);
  }

  try {
    // Passamos os queryParams no final do pool.execute para substituir os '?'
    const [reports] = await pool.execute(`
      SELECT 
        a.aud_id,
        a.aud_data,
        a.aud_time,
        a.aud_acao,
        a.aud_tabela_afetada,
        a.aud_id_evento,
        a.user_id,
        u.user_nome
      FROM auditoria a
      LEFT JOIN usuarios u ON a.user_id = u.user_id
      WHERE 1=1 ${dateFilter}
      ORDER BY a.aud_data DESC, a.aud_time DESC
    `, queryParams);

    res.json(reports);
  } catch (error) {
    console.error("Erro ao listar auditoria:", error);
    res.status(500).json({ erro: "Erro ao listar auditoria" });
  }
};

// --- NOVIDADE: A FUNÇÃO CORINGA PARA O PDF DINÂMICO ---
const getRelatorioDinamico = async (req, res) => {
  const { tipo, startDate, endDate } = req.query;

  let query = "";
  const queryParams = [];

  try {
    switch (tipo) {
      case "geral":
        if (!startDate || !endDate) return res.status(400).json({ erro: "Datas obrigatórias para este relatório." });
        query = `
          SELECT a.aud_id, a.aud_acao, a.aud_data, a.aud_time, u.user_nome 
          FROM auditoria a
          LEFT JOIN usuarios u ON a.user_id = u.user_id
          WHERE a.aud_data BETWEEN ? AND ?
          ORDER BY a.aud_data DESC, a.aud_time DESC
        `;
        // Como aud_data não tem hora, passamos a data limpa!
        queryParams.push(startDate, endDate);
        break;

      case "entradas":
        if (!startDate || !endDate) return res.status(400).json({ erro: "Datas obrigatórias para este relatório." });
        
        query = `
          SELECT 
            COALESCE(p.pdt_nome, 'Produto Excluído') AS pdt_nome, 
            ep.ent_prod_qtde AS quantidade, 
            e.ent_valor_compra AS valor_total,
            e.ent_data AS data,
            
            -- Subconsulta para pegar o nome do usuário que fez a entrada, mesmo que o produto tenha sido excluído depois da entrada. Se não encontrar, mostra "Sistema". (Subconsulta otimizada para evitar JOINs desnecessários)
            COALESCE((
              SELECT u.user_nome 
              FROM auditoria a 
              JOIN usuarios u ON a.user_id = u.user_id 
              -- Ajustado para buscar a palavra 'entrada' dentro da coluna aud_acao
              WHERE a.aud_id_evento = e.ent_id AND a.aud_acao LIKE '%entrada%' 
              LIMIT 1
            ), 'Sistema') AS usuario
            
          FROM entrada_produtos ep
          
          -- 1º JOIN: Pega a data e o valor total da entrada, mesmo que o produto tenha sido excluído depois da entrada
          JOIN entrada e ON ep.ent_id = e.ent_id

          -- 2º JOIN: Pega o nome do produto, mesmo que ele tenha sido excluído depois da entrada
          LEFT JOIN produto p ON ep.pdt_id = p.pdt_id

          WHERE DATE(e.ent_data) BETWEEN ? AND ?
          ORDER BY e.ent_data DESC
        `;
        queryParams.push(startDate, endDate);
        break;

      case "saidas":
        if (!startDate || !endDate) return res.status(400).json({ erro: "Datas obrigatórias para este relatório." });
        
        query = `
          SELECT 
            -- O nome do produto, mesmo que ele tenha sido excluído depois da saída. Se o produto tiver sido excluído, mostra "Produto Excluído" para não perder a referência da saída.
            COALESCE(p.pdt_nome, 'Produto Excluído') AS pdt_nome, 
            sp.lcl_qtde AS quantidade, 
            sp.lcl_destino AS destino, 
            sp.lcl_data_saida AS data,
            
            -- Subconsulta para pegar o nome do usuário que fez a saída, mesmo que o produto tenha sido excluído depois da saída. Se não encontrar, mostra "Sistema". (Subconsulta otimizada para evitar JOINs desnecessários) 
            COALESCE((
              SELECT u.user_nome 
              FROM auditoria a 
              JOIN usuarios u ON a.user_id = u.user_id 
              -- Ajustado para buscar a palavra 'saida' ou 'saída' dentro da coluna aud_acao
              WHERE a.aud_id_evento = sp.sai_id AND (a.aud_acao LIKE '%saida%' OR a.aud_acao LIKE '%saída%')
              LIMIT 1
            ), 'Sistema') AS usuario
            
          FROM saida_produtos sp
          
          -- 1º JOIN: Pega a data e o destino da saída, mesmo que o produto tenha sido excluído depois da saída
          LEFT JOIN localizacao_produtos lp ON sp.lcl_id = lp.lcl_id
          
          -- 2º JOIN: Pega o nome do produto, mesmo que ele tenha sido excluído depois da saída
          LEFT JOIN produto p ON lp.pdt_id = p.pdt_id
          
          WHERE DATE(sp.lcl_data_saida) BETWEEN ? AND ?
          ORDER BY sp.lcl_data_saida DESC
        `;
        queryParams.push(startDate, endDate);
        break;

      case "abaixo_estoque":
        // Este relatório não usa data, avalia o estoque atual completo
        query = `
          SELECT dados.pdt_id, dados.pdt_nome, dados.pdt_estoque_minimo, dados.total_estoque
          FROM (
            SELECT p.pdt_id, p.pdt_nome, p.pdt_estoque_minimo,
              (
                COALESCE((SELECT SUM(ep.ent_prod_qtde) FROM entrada_produtos ep WHERE ep.pdt_id = p.pdt_id), 0) -
                COALESCE((SELECT SUM(sp.lcl_qtde) FROM saida_produtos sp JOIN localizacao_produtos lp ON lp.lcl_id = sp.lcl_id WHERE lp.pdt_id = p.pdt_id), 0)
              ) AS total_estoque
            FROM produto p WHERE p.pdt_ativo = 1
          ) AS dados
          WHERE dados.total_estoque < dados.pdt_estoque_minimo
          ORDER BY dados.total_estoque ASC
        `;
        break;

      case "negativos":
        // Mesmo cálculo de estoque, mas apenas os negativos (< 0)
        query = `
          SELECT dados.pdt_id, dados.pdt_nome, dados.pdt_estoque_minimo, dados.total_estoque
          FROM (
            SELECT p.pdt_id, p.pdt_nome, p.pdt_estoque_minimo,
              (
                COALESCE((SELECT SUM(ep.ent_prod_qtde) FROM entrada_produtos ep WHERE ep.pdt_id = p.pdt_id), 0) -
                COALESCE((SELECT SUM(sp.lcl_qtde) FROM saida_produtos sp JOIN localizacao_produtos lp ON lp.lcl_id = sp.lcl_id WHERE lp.pdt_id = p.pdt_id), 0)
              ) AS total_estoque
            FROM produto p WHERE p.pdt_ativo = 1
          ) AS dados
          WHERE dados.total_estoque < 0
          ORDER BY dados.total_estoque ASC
        `;
        break;

      default:
        return res.status(400).json({ erro: "Tipo de relatório inválido" });
    }

    const [resultado] = await pool.execute(query, queryParams);
    res.json(resultado);

  } catch (error) {
    console.error("Erro no relatório dinâmico:", error);
    res.status(500).json({ erro: "Erro ao gerar os dados do relatório" });
  }
};

// Função para listar top fornecedores por valor total comprado
const getTopSuppliersBySpend = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        f.fncd_id,
        COALESCE(f.fncd_nome, 'Fornecedor nao informado') AS fncd_nome,
        COALESCE(SUM(e.ent_valor_compra), 0) AS total_gasto
      FROM entrada e
      LEFT JOIN fornecedor f ON e.fncd_id = f.fncd_id
      GROUP BY f.fncd_id, f.fncd_nome
      ORDER BY total_gasto DESC
      LIMIT 5
    `);

    res.json(rows);
  } catch (error) {
    console.error("Erro ao listar top fornecedores:", error);
    res.status(500).json({ erro: "Erro ao listar top fornecedores" });
  }
};

// Exporta os controllers para uso nas rotas
module.exports = { 
  getMoreMovedProducts, 
  minimumStock, 
  getAuditReports, 
  getRelatorioDinamico, // A nova função foi adicionada aqui
  getTopSuppliersBySpend
};