const express = require("express");
const router = express.Router();
const localizacaoController = require("../controllers/location.controller");
const authenticateToken = require("../middlewares/authenticateToken");
const requireAdmin = require("../middlewares/requireAdmin");

router.use(authenticateToken);

router.get("/", localizacaoController.listLocation);
router.get("/all", localizacaoController.listAllLocations);
router.get("/:id", localizacaoController.searchLocation);

// ROTAS GERENCIAIS (Apenas Administradores)
router.post("/", requireAdmin, localizacaoController.createLocation);
router.put("/:id", requireAdmin, localizacaoController.updateLocation);
router.delete("/:id", requireAdmin, localizacaoController.deleteLocation);
router.patch(
  "/:id/activate",
  requireAdmin,
  localizacaoController.activateLocation,
);

module.exports = router;
