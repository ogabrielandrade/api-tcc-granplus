// ROTAS    

const express = require("express");
const router = express();
const productsController = require("../controllers/product.controller");

router.get("/", productsController.products);

module.exports = router;
