import { Router } from "express";
import {
    editarSesion,
    eliminarSesion,
    reemplazarEjercicios
} from "./sesiones.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import { validarId } from "../../middleware/validarId.js";

const router = Router();

router.put("/:id_sesion_plan", verifyToken, validarId, editarSesion);
router.put("/:id_sesion_plan/ejercicios", verifyToken, validarId, reemplazarEjercicios);
router.delete("/:id_sesion_plan", verifyToken, validarId, eliminarSesion);

export default router;
