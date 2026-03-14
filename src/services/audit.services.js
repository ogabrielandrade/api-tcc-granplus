const pool = require("../config/database");

exports.registerAudit = async (user_id, acao, tabela, id_evento) => {
  try {
    await pool.query(
      `INSERT INTO auditoria
      (user_id, aud_acao, aud_data, aud_time, aud_tabela_afetada, aud_id_evento)
      VALUES (?, ?, CURDATE(), CURTIME(), ?, ?)`,
      [user_id, acao, tabela, id_evento],
    );
  } catch (error) {
    console.error("Erro ao registrar auditoria:", error);
  }
};
