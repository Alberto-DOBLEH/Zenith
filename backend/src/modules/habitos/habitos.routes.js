import { Router } from "express";
import {
    crearHabito,
    obtenerHabitos,
    editarHabito,
    eliminarHabito,
    obtenerTiposHabitos
} from "./habitos.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import { validarId } from "../../middleware/validarId.js";

const router = Router();

router.get("/tipos", verifyToken, obtenerTiposHabitos);
router.post("/", verifyToken, crearHabito);
router.get("/", verifyToken, obtenerHabitos);
router.put("/:id_habito", verifyToken, validarId, editarHabito);
router.delete("/:id_habito", verifyToken, validarId, eliminarHabito);

export default router;
