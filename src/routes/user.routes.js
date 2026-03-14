const express        = require("express");
const router         = express.Router();
const userController = require("../controllers/user.controller");

// middlewares
const authenticateToken = require("../middlewares/authenticateToken");
const requireAdmin = require("../middlewares/requireAdmin");

const requireOwnerOrAdmin = require("../middlewares/owner");

// rota pública
router.post("/login", userController.loginUser);

// aplicar autenticação nas rotas abaixo
router.use(authenticateToken);

// rotas autenticadas
router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUserById);

// rotas admin
router.post("/", requireAdmin, userController.createUser);
router.delete("/:id", requireAdmin, userController.deleteUser);

// Rota MISTA (próprio usuário OU admin)
router.put("/:id", requireOwnerOrAdmin, userController.updateUser);

module.exports = router;