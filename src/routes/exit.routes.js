const express = require("express");
const router  = express.Router();

const exitController    = require("../controllers/exit.controller");
const authenticateToken = require("../middlewares/authenticateToken");

router.post("/", authenticateToken, exitController.registerExit);

module.exports = router;
