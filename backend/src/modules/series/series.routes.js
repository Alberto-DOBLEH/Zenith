import { Router } from "express";
import {
    editarSerie,
    eliminarSerie
} from "./series.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import { validarId } from "../../middleware/validarId.js";

const router = Router();

router.put("/:id_serie", verifyToken, validarId, editarSerie);
router.delete("/:id_serie", verifyToken, validarId, eliminarSerie);

export default router;
