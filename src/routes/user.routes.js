const express        = require("express");
const router         = express.Router();
const userController = require("../controllers/user.controller");

// Importar middlewares
const authenticateToken   = require("../middlewares/authenticateToken");
const requireAdmin        = require("../middlewares/requireAdmin");
const requireOwnerOrAdmin = require("../middlewares/owner");

// Rota PÚBLICA (sem autenticação)
router.post("/login", userController.loginUser);

// Rotas PROTEGIDAS (precisa estar logado)
router.get("/", authenticateToken, userController.getAllUsers);
router.get("/:id", authenticateToken, userController.getUserById);

// Rotas de ADMINISTRADOR (só admin)
router.post("/", authenticateToken, requireAdmin, userController.createUser);
router.delete("/:id", authenticateToken, requireAdmin, userController.deleteUser);

// Rota MISTA (próprio usuário OU admin)
router.put("/:id", authenticateToken, requireOwnerOrAdmin, userController.updateUser);

module.exports = router;