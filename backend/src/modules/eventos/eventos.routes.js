import { Router } from "express";
import {
    obtenerEventos,
    obtenerEventoPorId,
    crearEvento,
    editarEvento,
    eliminarEvento
} from "./eventos.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const router = Router();

router.get("/", verifyToken, obtenerEventos);
router.get("/:id_evento", verifyToken, obtenerEventoPorId);
router.post("/", verifyToken, crearEvento);
router.put("/:id_evento", verifyToken, editarEvento);
router.delete("/:id_evento", verifyToken, eliminarEvento);

export default router;