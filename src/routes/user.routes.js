const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");

// middlewares
const authenticateToken = require("../middlewares/authenticateToken");
const requireAdmin = require("../middlewares/requireAdmin");
const requireOwnerOrAdmin = require("../middlewares/owner");

// rota pública
router.post("/login", userController.loginUser);

// O fluxo de redefinição com PIN de 6 dígitos
router.post("/verificar-usuario", userController.verifyUserForReset); 
router.post("/enviar-pin", userController.sendResetPin);             
router.post("/redefinir-senha", userController.resetPasswordWithPin);

// aplicar autenticação nas rotas abaixo
router.use(authenticateToken);

// rotas autenticadas
// rotas admin
router.get("/", requireAdmin, userController.getAllUsers);
router.post("/", requireAdmin, userController.createUser);
router.delete("/:id", requireAdmin, userController.deleteUser);

// Rota MISTA (próprio usuário OU admin)
router.get("/:id", requireOwnerOrAdmin, userController.getUserById);
router.put("/:id", requireOwnerOrAdmin, userController.updateUser);
router.put("/:id/senha", requireOwnerOrAdmin, userController.updatePassword);

module.exports = router;