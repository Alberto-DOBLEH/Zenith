import { Router } from "express";
import {
    obtenerEventos,
    obtenerEventoPorId,
    crearEvento,
    editarEvento,
    eliminarEvento
} from "./eventos.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import { validarId } from "../../middleware/validarId.js";

const router = Router();

router.get("/", verifyToken, obtenerEventos);
router.get("/:id_evento", verifyToken, validarId, obtenerEventoPorId);
router.post("/", verifyToken, crearEvento);
router.put("/:id_evento", verifyToken, validarId, editarEvento);
router.delete("/:id_evento", verifyToken, validarId, eliminarEvento);

export default router;