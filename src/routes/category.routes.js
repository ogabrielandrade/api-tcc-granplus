const router = require("express").Router();
const controller = require("../controllers/category.controller");
// Middlewares de Segurança
const authenticateToken = require("../middlewares/authenticateToken");
const requireAdmin = require("../middlewares/requireAdmin");

router.use(authenticateToken);

router.get("/", controller.getAllCategory); 
router.get("/:id", controller.getCategoryById); 

// ROTAS GERENCIAIS (Apenas Administradores)
router.post("/", requireAdmin, controller.createCategory); 
router.put("/:id", requireAdmin, controller.updateCategory); 
router.delete("/:id", requireAdmin, controller.deleteCategory); 

module.exports = router;
