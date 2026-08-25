import { Router } from "express";
import {
    crearSesion,
    obtenerSesiones,
    obtenerSesionPorId,
    avanzarSesion,
    eliminarSesion
} from "./pomodoro.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import { validarId } from "../../middleware/validarId.js";

const router = Router();

router.get("/", verifyToken, obtenerSesiones);
router.get("/:id_sesion", verifyToken, validarId, obtenerSesionPorId);
router.post("/", verifyToken, crearSesion);
router.put("/:id_sesion", verifyToken, validarId, avanzarSesion);
router.delete("/:id_sesion", verifyToken, validarId, eliminarSesion);

export default router;