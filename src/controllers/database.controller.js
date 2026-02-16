const pool = require('../config/database');

exports.testDataBase = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT 1 + 1 AS resultado");
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            erro: "Erro ao consultar banco"
        })
    }
};