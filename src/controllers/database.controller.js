const pool = require('../config/database');

exports.testDataBase = async (req, res) => {
    try {
        const [produto] = await pool.query("SELECT * FROM produto WHERE pdt_id = ?", [1]);
        res.json(produto);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            erro: "Erro ao consultar banco"
        })
    }
};