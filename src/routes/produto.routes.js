const express = require("express");
const router = express.Router();
const testeController = require("../controllers/produto.controller");

router.get("/", testeController.teste);

module.exports = router;
