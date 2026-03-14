const express = require("express");
const router = express.Router();

const localizacaoController = require("../controllers/localizacaoController");

router.get("/localizacoes", localizacaoController.listarLocalizacoes);

router.get("/localizacoes/:id", localizacaoController.buscarLocalizacao);

router.post("/localizacoes", localizacaoController.criarLocalizacao);

router.put("/localizacoes/:id", localizacaoController.atualizarLocalizacao);

router.delete("/localizacoes/:id", localizacaoController.deletarLocalizacao);

module.exports = router;
