import { Router } from "express";
import {
    obtenerNotas,
    obtenerNotaPorId,
    obtenerNotaPorFecha,
    crearNota,
    editarNota
} from "./notas.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import { validarId } from "../../middleware/validarId.js";

const router = Router();

router.get("/", verifyToken, obtenerNotas);
router.get("/por-fecha", verifyToken, obtenerNotaPorFecha);
router.get("/:id_nota", verifyToken, validarId, obtenerNotaPorId);
router.post("/", verifyToken, crearNota);
router.put("/:id_nota", verifyToken, validarId, editarNota);

export default router;