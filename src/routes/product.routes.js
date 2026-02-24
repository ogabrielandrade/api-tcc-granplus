// ROTAS    

const express = require("express");
const router = express.Router();
const productsController = require("../controllers/product.controller");

router.get("/produtos", productsController.products);

module.exports = router;
