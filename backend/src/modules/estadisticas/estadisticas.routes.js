import { Router } from "express";
import {
    obtenerEstadisticasGenerales,
    obtenerEstadisticasHabito
} from "./estadisticas.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const router = Router();

router.get("/", verifyToken, obtenerEstadisticasGenerales);
router.get("/habito/:id_habito", verifyToken, obtenerEstadisticasHabito);

export default router;
