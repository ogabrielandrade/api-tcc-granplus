const express = require("express");
const router = express.Router();
const controller = require("../controllers/supplier.controller");
const authenticateToken = require("../middlewares/authenticateToken");
const requireAdmin = require("../middlewares/requireAdmin");

router.use(authenticateToken);

router.get("/", controller.getAllSupplier);
router.get("/:id", controller.getSupplierById);
router.post("/", controller.createSupplier);
router.put("/:id", controller.updateSupplier);
router.delete("/:id", controller.deleteSupplier);
router.patch("/:id/activate", requireAdmin, controller.activateSupplier);

module.exports = router;
