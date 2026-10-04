import { Router } from "express";
import {
    obtenerActividades,
    crearActividad,
    editarActividad,
    eliminarActividad
} from "./actividades.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import { validarId } from "../../middleware/validarId.js";

const router = Router();

router.get("/", verifyToken, obtenerActividades);
router.post("/", verifyToken, crearActividad);
router.put("/:id_actividad", verifyToken, validarId, editarActividad);
router.delete("/:id_actividad", verifyToken, validarId, eliminarActividad);

export default router;
