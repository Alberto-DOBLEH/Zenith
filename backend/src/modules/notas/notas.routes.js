import { Router } from "express";
import {
    obtenerNotas,
    obtenerNotaPorId,
    crearNota
} from "./notas.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const router = Router();

router.get("/", verifyToken, obtenerNotas);
router.get("/:id_nota", verifyToken, obtenerNotaPorId);
router.post("/", verifyToken, crearNota);

export default router;
