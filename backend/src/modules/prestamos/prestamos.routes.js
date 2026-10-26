import { Router } from "express";
import {
    obtenerPrestamos,
    obtenerPrestamo,
    crearPrestamo,
    registrarAbono,
    obtenerAbonos
} from "./prestamos.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import { validarId } from "../../middleware/validarId.js";

const router = Router();

router.get("/", verifyToken, obtenerPrestamos);
router.get("/:id_prestamo", verifyToken, validarId, obtenerPrestamo);
router.post("/", verifyToken, crearPrestamo);
router.post("/:id_prestamo/abonos", verifyToken, validarId, registrarAbono);
router.get("/:id_prestamo/abonos", verifyToken, validarId, obtenerAbonos);

export default router;
