// REGRA DE NEGÓCIO

import pool from "../config/database.js";

export const listProducts = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM produto WHERE pdt_ativo = 1");
    res.status(200).json(rows);
  } catch (error) {
    console.error("Erro ao buscar produtos");
    res.status(500).json({
      error: "Erro ao buscar produtos",
    });
  }
};

export const createProduct = async (req, res) => {
  try {
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
      ],
    );

    res.status(201).json({
      message: "Produto criado com sucesso",
      id: result.insertID,
    });
  } catch (error) {
    console.error("Erro ao criar produto");
    res.status(500).json({
      error: "Erro ao criar produto",
    });
  }
};

export const updateProduct = async (req, res) => {
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
        id,
      ],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Produto não encontrado" });
    }

    res.json({ mensagem: "Produto atualizado com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar produto");
    res.status(500).json({
      error: "Erro ao atualizar produto",
    });
  }
};


export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query(`UPDATE produto SET pdt_ativo = 0 WHERE pdt_id = ?`, [id])

        if (result.affectedRows === 0){
            return res.status(404).json({
                message: "Produto não encontrado"
            })
        };

        res.status(200).json({
            message: "Produto desativado com sucesso"
        })
    } catch (error) {
        console.error("Erro ao desativar o produto");
        res.status(500).json({
            error: "Erro ao desativar o produto"
        })
    }
}