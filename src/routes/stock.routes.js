const express = require("express");
const { calculateStock, listAllStock } = require("../controllers/stock.controller.js"); // Importamos as duas funções do controller: a calculateStock que já existia antes e a listAllStock que é a nova função para a tela de estoque geral.

const router = express.Router();

// Quando o React pedir o /estoque vazio, ele cai aqui e lista tudo, mostrando o nome do produto, o local de estoque e a quantidade disponível. Essa é a função nova para a tela de estoque geral.
router.get("/", listAllStock);

// Quando pedir com ID (ex: /estoque/1), ele cai na função do cálculo de estoque atual daquele produto específico, que já existia antes.
router.get("/:id", calculateStock);

module.exports = router;