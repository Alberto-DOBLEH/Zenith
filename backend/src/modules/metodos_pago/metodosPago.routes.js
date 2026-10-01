import { Router } from "express";
import {
    obtenerMetodosPago,
    crearMetodoPago,
    eliminarMetodoPago
} from "./metodosPago.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import { validarId } from "../../middleware/validarId.js";

const router = Router();

router.get("/", verifyToken, obtenerMetodosPago);
router.post("/", verifyToken, crearMetodoPago);
router.delete("/:id_metodo", verifyToken, validarId, eliminarMetodoPago);

export default router;
