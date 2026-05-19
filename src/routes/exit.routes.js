const express = require("express");
const router = express.Router();
const exitController = require("../controllers/exit.controller");
const authenticateToken = require("../middlewares/authenticateToken");

router.use(authenticateToken);

// Rotas para as saídas de produtos - as requisições requerem um token de autenticação
router.get("/", exitController.getAllExits); 
router.get("/lotes-disponiveis/:id", exitController.getAvailableLots);
router.post("/", exitController.registerExit); 







module.exports = router;
