const express = require('express');
const authenticateToken = require('../middlewares/authenticateToken');
const requireAdmin = require('../middlewares/requireAdmin');
const { getMoreMovedProducts, minimumStock, getAuditReports, getRelatorioDinamico } = require('../controllers/report.controller');

const router = express.Router();
router.use(authenticateToken);

// Rotas de relatório requerem autenticação (middleware authenticateToken)
router.get("/produtos-mais-movimentados", getMoreMovedProducts); // Consulta produtos
router.get("/estoque-minimo", minimumStock); // Consulta estoque mínimo

// RELATÓRIOS GERENCIAIS (Visíveis APENAS para Admin)
router.get("/auditoria", requireAdmin, getAuditReports); // Consulta histórico de auditoria (por período)
router.get('/dinamico', getRelatorioDinamico);

module.exports = router;