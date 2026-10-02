import { Router } from "express";
import {
    obtenerSplits,
    obtenerSplit,
    crearSplit,
    editarSplit,
    activarSplit,
    eliminarSplit,
    crearSesion
} from "./splits.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import { validarId } from "../../middleware/validarId.js";

const router = Router();

router.get("/", verifyToken, obtenerSplits);
router.post("/", verifyToken, crearSplit);
router.get("/:id_split", verifyToken, validarId, obtenerSplit);
router.put("/:id_split", verifyToken, validarId, editarSplit);
router.put("/:id_split/activar", verifyToken, validarId, activarSplit);
router.delete("/:id_split", verifyToken, validarId, eliminarSplit);
router.post("/:id_split/sesiones", verifyToken, validarId, crearSesion);

export default router;
