import { Router } from "express";
import {
    obtenerActividades,
    obtenerActividadPorId,
    crearActividad,
    editarActividad,
    eliminarActividad
} from "./actividades.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const router = Router();

router.get("/", verifyToken, obtenerActividades);
router.get("/:id_actividad", verifyToken, obtenerActividadPorId);
router.post("/", verifyToken, crearActividad);
router.put("/:id_actividad", verifyToken, editarActividad);
router.delete("/:id_actividad", verifyToken, eliminarActividad);

export default router;
