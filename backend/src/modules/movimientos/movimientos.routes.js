import { Router } from "express";
import {
    obtenerMovimientos,
    obtenerMovimiento,
    crearMovimiento
} from "./movimientos.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import { validarId } from "../../middleware/validarId.js";

const router = Router();

router.get("/", verifyToken, obtenerMovimientos);
router.get("/:id_movimiento", verifyToken, validarId, obtenerMovimiento);
router.post("/", verifyToken, crearMovimiento);

export default router;
