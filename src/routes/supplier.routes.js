const express = require("express");
const router = express.Router();
const controller = require("../controllers/supplier.controller");
const authenticateToken = require("../middlewares/authenticateToken");
const requireAdmin = require("../middlewares/requireAdmin");

router.use(authenticateToken);

router.get("/", controller.getAllSupplier);
router.get("/:id",  controller.getSupplierById);

// ROTAS GERENCIAIS (Apenas Administradores)
router.post("/", requireAdmin, controller.createSupplier);
router.put("/:id", requireAdmin, controller.updateSupplier);
router.delete("/:id", requireAdmin, controller.deleteSupplier);

module.exports = router;
