const express = require("express");
const router = express.Router();
const databaseController = require("../controllers/database.controller");

router.get("/teste", databaseController.testDataBase);

router.get("/testebanco", (req, res) => {
  console.log("Usuário do banco:", process.env.BD_USUARIO);
  res.json({
    message: "Rota de teste funcionando",
    usuario: process.env.BD_USUARIO,
    servidor: process.env.BD_SERVIDOR,
    porta: process.env.BD_PORTA,
    banco: process.env.BD_BANCO,
  });
});

module.exports = router;
