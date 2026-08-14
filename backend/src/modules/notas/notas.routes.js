import { Router } from "express";
import {
    obtenerNotas,
    obtenerNotaPorId,
    obtenerNotaPorFecha,
    crearNota,
    editarNota
} from "./notas.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const router = Router();

router.get("/", verifyToken, obtenerNotas);
router.get("/por-fecha", verifyToken, obtenerNotaPorFecha);
router.get("/:id_nota", verifyToken, obtenerNotaPorId);
router.post("/", verifyToken, crearNota);
router.put("/:id_nota", verifyToken, editarNota);

export default router;