import { Router } from "express";
import {
    obtenerEstadisticasGenerales,
    obtenerMapa
} from "./estadisticas.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const router = Router();

router.get("/", verifyToken, obtenerEstadisticasGenerales);
router.get("/mapa", verifyToken, obtenerMapa);

export default router;
