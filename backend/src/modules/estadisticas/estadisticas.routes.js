import { Router } from "express";
import {
    obtenerEstadisticasGenerales,
    obtenerEstadisticasHabito
} from "./estadisticas.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import { validarId } from "../../middleware/validarId.js";

const router = Router();

router.get("/", verifyToken, obtenerEstadisticasGenerales);
router.get("/habito/:id_habito", verifyToken, validarId, obtenerEstadisticasHabito);

export default router;
