const pool = require("../config/database.js");
const { registerAudit } = require("../services/audit.services");

const toNumber = (value) => Number(value || 0);

// formatar data
const formatDateKey = (value) => {
  //  Tenta criar o objeto de data                                         // TENTAR USAR ESSA ALTERNATIVA E TESTAR
  //const date = new Date(value);

  //  Verifica se a data é válida e retorna o formato AAAA-MM-DD ou null
  //return !isNaN(date) ? date.toISOString().slice(0, 10) : null;

  if (!value) return null;

  if (value instanceof Date) {
    // verifica se value foi criado a partir do construtor de date
    return value.toISOString().slice(0, 10); // se value for uma data, converte para o modelo ISO (AAAA-MM-DD)
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toISOString().slice(0, 10);
};

const buildLotKey = (lote, validade, locId) =>
  `${lote ?? "sem-lote"}|${formatDateKey(validade) ?? "sem-validade"}|${
    locId ?? "sem-localizacao"
  }`;

const parseLotsFromJustification = (justificationText) => {
  if (!justificationText) return [];

  const text = String(justificationText); // transformando em string garante que possamos usar indexOf sem quebrar a aplicação
  const marker = "| Lotes:";
  const markerIndex = text.indexOf(marker); // localiza ponto específico da String 'text'

  if (markerIndex === -1) return [];

  const lotesTexto = text.slice(markerIndex + marker.length).trim(); // pega somente o valor do lote após o marcador "| Lotes:"
  if (!lotesTexto) return [];

  return lotesTexto
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const matched = item.match(
        /^lote\s+(.+?)\s*\(([-+]?[0-9]*[.,]?[0-9]+)\)(?:\s+val\s+([0-9]{4}-[0-9]{2}-[0-9]{2}))?$/i,
      );

      if (!matched) return null;

      const loteRaw = matched[1]?.trim();
      const quantidadeRaw = matched[2]?.replace(",", "."); // substitui a vírgula pelo ponto (modelo americano que o JS entende) apenas na primeira ocaisão de truthy. Se quiséssemos que todas as ocasiões de vírgula fossem substituídas por ponto, teríamos que usar Regex (/,/g)
      const validadeRaw = matched[3] || null;
      const quantidade = toNumber(quantidadeRaw);

      if (quantidade <= 0) return null;

      return {
        lote: loteRaw && loteRaw.toLowerCase() !== "sem lote" ? loteRaw : null,
        validade: validadeRaw,
        quantidade,
      };
    })
    .filter(Boolean); // percorre o array e só deixa passar o que for "verdadeiro"
};

const getEstimatedAvailableLots = async (pdtId) => {
  const [produtoRows] = await pool.execute(
    `SELECT pdt_id, pdt_estoque_atual
     FROM produto
     WHERE pdt_id = ?`,
    [pdtId],
  );

  if (produtoRows.length === 0) {
    return null;
  }

  const estoqueAtual = toNumber(produtoRows[0].pdt_estoque_atual);

  const [entradaLotes] = await pool.execute(
    `SELECT
       e.loc_id,
       l.loc_nome,
       ent_prod_lote AS lote,
       pdt_validade AS validade,
       SUM(ent_prod_qtde) AS quantidade_entrada
     FROM entrada_produtos ep
     JOIN entrada e ON e.ent_id = ep.ent_id
     JOIN localizacao l ON l.loc_id = e.loc_id
     WHERE ep.pdt_id = ?
     GROUP BY e.loc_id, l.loc_nome, ep.ent_prod_lote, ep.pdt_validade
     ORDER BY
       e.loc_id ASC,
       CASE WHEN pdt_validade IS NULL THEN 1 ELSE 0 END,
       pdt_validade ASC,
       ent_prod_lote ASC`,
    [pdtId],
  );

  const lotesComEntrada = entradaLotes.map((row) => ({
    loc_id: row.loc_id,
    loc_nome: row.loc_nome,
    lote: row.lote === undefined ? null : row.lote,
    validade: formatDateKey(row.validade),
    quantidade_entrada: toNumber(row.quantidade_entrada),
  }));

  const disponibilidadePorLote = new Map(
    lotesComEntrada.map((lote) => [
      buildLotKey(lote.lote, lote.validade, lote.loc_id),
      {
        loc_id: lote.loc_id,
        loc_nome: lote.loc_nome,
        lote: lote.lote,
        validade: lote.validade,
        quantidade_entrada: toNumber(lote.quantidade_entrada),
        quantidade_disponivel: toNumber(lote.quantidade_entrada),
      },
    ]),
  );

  const [saidasRows] = await pool.execute(
    `SELECT sp.lcl_qtde, sp.lcl_justificativa, lp.loc_id
     FROM saida_produtos sp
     JOIN localizacao_produtos lp ON lp.lcl_id = sp.lcl_id
     WHERE lp.pdt_id = ?`,
    [pdtId],
  );

  const consumoSemLoteDetalhadoPorLocalizacao = new Map();

  saidasRows.forEach((saida) => {
    const quantidadeSaida = toNumber(saida.lcl_qtde);
    const locIdSaida = saida.loc_id ? Number(saida.loc_id) : null;
    const lotesDaSaida = parseLotsFromJustification(saida.lcl_justificativa);

    if (!lotesDaSaida.length) {
      const chaveLocalizacao = locIdSaida || 0;
      consumoSemLoteDetalhadoPorLocalizacao.set(
        chaveLocalizacao,
        toNumber(consumoSemLoteDetalhadoPorLocalizacao.get(chaveLocalizacao)) +
          quantidadeSaida,
      );
      return;
    }

    let totalAbatidoNaSaida = 0;

    lotesDaSaida.forEach((loteSaida) => {
      const chave = buildLotKey(loteSaida.lote, loteSaida.validade, locIdSaida);
      const loteDisponivel = disponibilidadePorLote.get(chave);

      if (!loteDisponivel) return;

      const abatimento = Math.min(
        toNumber(loteSaida.quantidade),
        toNumber(loteDisponivel.quantidade_disponivel),
      );

      loteDisponivel.quantidade_disponivel -= abatimento;
      totalAbatidoNaSaida += abatimento;
    });

    // Compatibilidade: se a saída tem diferença entre total e lotes parseados,
    // o restante é abatido por FEFO para manter consistência com estoque consolidado.
    const restanteSemDetalhe = Math.max(
      0,
      quantidadeSaida - totalAbatidoNaSaida,
    );
    if (restanteSemDetalhe > 0) {
      const lotesOrdenados = Array.from(disponibilidadePorLote.values())
        .filter((lote) => lote.loc_id === locIdSaida)
        .sort((first, second) => {
          const firstDate = formatDateKey(first.validade);
          const secondDate = formatDateKey(second.validade);

          if (!firstDate && !secondDate) return 0;
          if (!firstDate) return 1;
          if (!secondDate) return -1;

          return firstDate.localeCompare(secondDate);
        });

      let consumoRestante = restanteSemDetalhe;

      lotesOrdenados.forEach((lote) => {
        if (consumoRestante <= 0) return;

        const disponivel = toNumber(lote.quantidade_disponivel);
        const abatimento = Math.min(disponivel, consumoRestante);
        lote.quantidade_disponivel = disponivel - abatimento;
        consumoRestante -= abatimento;
      });
    }
  });

  consumoSemLoteDetalhadoPorLocalizacao.forEach(
    (consumoRestanteInicial, locId) => {
      if (consumoRestanteInicial <= 0) return;

      const lotesOrdenados = Array.from(disponibilidadePorLote.values())
        .filter((lote) => toNumber(lote.loc_id) === toNumber(locId))
        .sort((first, second) => {
          const firstDate = formatDateKey(first.validade);
          const secondDate = formatDateKey(second.validade);

          if (!firstDate && !secondDate) return 0;
          if (!firstDate) return 1;
          if (!secondDate) return -1;

          return firstDate.localeCompare(secondDate);
        });

      let consumoRestante = consumoRestanteInicial;

      lotesOrdenados.forEach((lote) => {
        if (consumoRestante <= 0) return;

        const disponivel = toNumber(lote.quantidade_disponivel);
        const abatimento = Math.min(disponivel, consumoRestante);
        lote.quantidade_disponivel = disponivel - abatimento;
        consumoRestante -= abatimento;
      });
    },
  );

  const lotesDisponiveis = Array.from(disponibilidadePorLote.values())
    .map((lote) => ({
      loc_id: lote.loc_id,
      loc_nome: lote.loc_nome,
      lote: lote.lote,
      validade: lote.validade,
      quantidade_disponivel: Number(
        toNumber(lote.quantidade_disponivel).toFixed(2),
      ),
      quantidade_entrada: Number(toNumber(lote.quantidade_entrada).toFixed(2)),
    }))
    .filter((lote) => lote.quantidade_disponivel > 0);

  return {
    produto: {
      pdt_id: produtoRows[0].pdt_id,
      pdt_estoque_atual: estoqueAtual,
    },
    lotes: lotesDisponiveis,
  };
};

const getAvailableLots = async (req, res) => {
  try {
    // const pdtId = Number(req.query.pdt_id); ************** desativei essa função, caso seja necessário, ativá-la
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ erro: "Informe o pdt_id para listar lotes" });
    }

    const disponibilidade = await getEstimatedAvailableLots(id);

    if (!disponibilidade) {
      return res.status(404).json({ erro: "Produto não encontrado" });
    }

    return res.json({
      pdt_id: disponibilidade.produto.pdt_id,
      estoque_atual: disponibilidade.produto.pdt_estoque_atual,
      lotes: disponibilidade.lotes,
    });
  } catch (error) {
    console.error("Erro ao listar lotes disponíveis:", error);
    return res.status(500).json({ erro: "Erro ao listar lotes disponíveis" });
  }
};


// REGISTRAR SAÍDA
const registerExit = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const {
      pdt_id,
      loc_id,
      lcl_qtde,
      lcl_destino,
      lcl_tipo,
      lcl_justificativa,
      lotes_selecionados,
    } = req.body;

    if (!pdt_id || !lcl_qtde) {
      return res
        .status(400)
        .json({ erro: "Produto e quantidade são obrigatórios" });
    }

    // busca o produto e estoque atual consolidado
    const [produtoRows] = await pool.execute(
      `SELECT pdt_id, pdt_estoque_atual
       FROM produto
       WHERE pdt_id = ?`,
      [pdt_id],
    );

    if (produtoRows.length === 0) {
      return res.status(404).json({ erro: "Produto não encontrado" });
    }

    const estoqueAtual = Number(produtoRows[0].pdt_estoque_atual || 0);

    const disponibilidadeLotes = await getEstimatedAvailableLots(pdt_id);

    if (!disponibilidadeLotes) {
      return res.status(404).json({ erro: "Produto não encontrado" });
    }

    const lotesSelecionados = Array.isArray(lotes_selecionados) // o método Array.isArray retorna true se um objeto é um array
      ? lotes_selecionados
      : [];

    const locIdsSelecionados = Array.from(
      new Set(
        lotesSelecionados
          .map((lote) => Number(lote.loc_id))
          .filter((value) => !Number.isNaN(value) && value > 0),
      ),
    );

    if (locIdsSelecionados.length > 1) {
      return res.status(400).json({
        erro: "Selecione lotes de uma única localização para registrar a saída.",
      });
    }

    const locIdEfetivo = loc_id || locIdsSelecionados[0] || null;

    if (lotesSelecionados.length === 0) {
      return res.status(400).json({
        erro: "Selecione ao menos um lote para confirmar a saída",
      });
    }

    const lotesDisponiveisPorChave = new Map(
      disponibilidadeLotes.lotes.map((lote) => [
        buildLotKey(lote.lote, lote.validade, lote.loc_id),
        lote,
      ]),
    );

    let totalSelecionado = 0;

    for (const lote of lotesSelecionados) {
      const quantidadeSelecionada = toNumber(lote.quantidade);

      if (quantidadeSelecionada <= 0) {
        return res.status(400).json({
          erro: "Quantidade selecionada por lote deve ser maior que zero",
        });
      }

      const chave = buildLotKey(
        lote.lote ?? null,
        lote.validade ?? null,
        lote.loc_id ?? null,
      );
      const loteDisponivel = lotesDisponiveisPorChave.get(chave);

      if (!loteDisponivel) {
        return res.status(400).json({
          erro: "Um dos lotes selecionados não está mais disponível",
        });
      }

      if (
        quantidadeSelecionada > toNumber(loteDisponivel.quantidade_disponivel)
      ) {
        return res.status(400).json({
          erro: "Quantidade selecionada excede o disponível em um dos lotes",
        });
      }

      totalSelecionado += quantidadeSelecionada;
    }

    if (Math.abs(totalSelecionado - toNumber(lcl_qtde)) > 0.0001) {
      return res.status(400).json({
        erro: "A soma das quantidades dos lotes deve ser igual à quantidade da saída",
      });
    }

    // Validação de validade - busca produtos com validade expirada ou próxima
    const [validadeRows] = await pool.query(
      `SELECT pdt_validade, ent_prod_qtde
       FROM entrada_produtos
       WHERE pdt_id = ? AND pdt_validade IS NOT NULL
       ORDER BY pdt_validade ASC`,
      [pdt_id],
    );

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const aviso = {
      tem_expirado: false,
      proximamente_vencimento: false,
      data_mais_proxima: null,
    };

    if (validadeRows.length > 0) {
      for (const row of validadeRows) {
        const dataValidade = new Date(row.pdt_validade);
        dataValidade.setHours(0, 0, 0, 0);

        if (dataValidade < hoje) {
          aviso.tem_expirado = true;
        } else if (
          dataValidade <= new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000)
        ) {
          // Se vence nos próximos 7 dias
          aviso.proximamente_vencimento = true;
        }

        if (
          !aviso.data_mais_proxima ||
          dataValidade < new Date(aviso.data_mais_proxima)
        ) {
          aviso.data_mais_proxima = row.pdt_validade;
        }
      }
    }

    // Busca vínculo do produto na localização escolhida.
    const [produtoLocal] = await pool.execute(
      `SELECT lp.lcl_id
       FROM localizacao_produtos lp
       WHERE lp.pdt_id = ?
         AND (? IS NULL OR lp.loc_id = ?)
       LIMIT 1`,
      [pdt_id, locIdEfetivo || null, locIdEfetivo || null],
    );

    let lcl_id = null;

    if (produtoLocal.length > 0) {
      lcl_id = produtoLocal[0].lcl_id;
    } else {
      const [locRows] = await pool.execute(
        `SELECT loc_id
         FROM localizacao
         WHERE (? IS NULL OR loc_id = ?)
         ORDER BY loc_id
         LIMIT 1`,
        [locIdEfetivo || null, locIdEfetivo || null],
      );

      if (locRows.length === 0) {
        return res.status(400).json({
          erro: "Localização inválida para registrar saída",
        });
      }

      const [novoVinculo] = await pool.execute(
        `INSERT INTO localizacao_produtos (lcl_prod_estoque, pdt_id, loc_id)
         VALUES (?, ?, ?)`,
        [estoqueAtual, pdt_id, locRows[0].loc_id],
      );

      lcl_id = novoVinculo.insertId;
    }

    // Validação de estoque
    if (Number(lcl_qtde) > estoqueAtual) {
      return res.status(400).json({
        erro: "Estoque insuficiente",
        estoque_atual: estoqueAtual,
      });
    }

    // Registrar a saída
    // O INSERT dispara a Trigger no banco,
    // que vai lá na tabela 'produto' e subtrai a quantidade do 'pdt_estoque_atual'.
    const lotesResumo = lotesSelecionados
      .map((lote) => {
        const validade = formatDateKey(lote.validade);
        return `lote ${lote.lote ?? "sem lote"} (${toNumber(
          lote.quantidade,
        )})${validade ? ` val ${validade}` : ""}`;
      })
      .join("; ");

    const justificativaFinal = `${String(
      lcl_justificativa || "Não informada",
    )} | Lotes: ${lotesResumo}`.slice(0, 255);

    const [result] = await pool.execute(
      `INSERT INTO saida_produtos
      (lcl_id, lcl_qtde, lcl_data_saida, lcl_destino, lcl_tipo, lcl_justificativa)
      VALUES (?, ?, NOW(), ?, ?, ?)`,
      [
        lcl_id,
        Number(lcl_qtde),
        String(lcl_destino || "Não informado"),
        String(lcl_tipo || "Sem motivo informado"),
        justificativaFinal,
      ],
    );

    //  Registrar auditoria
    await registerAudit(
      req.user.user_id,
      `Saída no produto ${pdt_id}`,
      "saida_produtos",
      result.insertId,
    );

    await connection.commit()

    res.status(201).json({
      mensagem: "Saída registrada com sucesso",
      sai_id: result.insertId,
      aviso_validade: aviso,
    });
  } catch (error) {
    await connection.rollback()
    console.error("Erro ao registrar saída:", error);

    res.status(500).json({
      erro: "Erro ao registrar saída",
      detalhe: error.message,
    });
  } finally {
    connection.release()
  }
};

// Função para listar todas as saídas de produtos (consulta estática sem parâmetros externos, sendo imune a SQL Injection)
const getAllExits = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        s.sai_id AS sai_id,
        s.lcl_data_saida AS sai_data,
        s.lcl_qtde AS sai_quantidade,
        s.lcl_tipo AS sai_motivo,
        s.lcl_destino AS sai_destino,
        p.pdt_nome,
        l.loc_nome,
        ep.pdt_validade
      FROM saida_produtos s
      LEFT JOIN localizacao_produtos lp ON s.lcl_id = lp.lcl_id
      LEFT JOIN produto p ON lp.pdt_id = p.pdt_id
      LEFT JOIN localizacao l ON lp.loc_id = l.loc_id
      LEFT JOIN (
        SELECT pdt_id, MIN(pdt_validade) AS pdt_validade
        FROM entrada_produtos
        WHERE pdt_validade IS NOT NULL
        GROUP BY pdt_id
      ) ep ON p.pdt_id = ep.pdt_id
      ORDER BY s.lcl_data_saida DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error("Erro ao listar saídas:", error);
    res.status(500).json({ erro: "Erro ao listar saídas" });
  } // LEFT JOIN entrada_produtos ep ON p.pdt_id = ep.pdt_id
};

// Exportando os módulos de criação e listagem para a rota
module.exports = { registerExit, getAllExits, getAvailableLots };
