import { Router } from "express";
import {
    crearSesion,
    obtenerSesiones,
    obtenerSesionPorId,
    avanzarSesion,
    eliminarSesion
} from "./pomodoro.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const router = Router();

router.get("/", verifyToken, obtenerSesiones);
router.get("/:id_sesion", verifyToken, obtenerSesionPorId);
router.post("/", verifyToken, crearSesion);
router.put("/:id_sesion", verifyToken, avanzarSesion);
router.delete("/:id_sesion", verifyToken, eliminarSesion);

export default router;