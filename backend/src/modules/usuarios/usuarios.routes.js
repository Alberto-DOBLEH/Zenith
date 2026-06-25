import { Router } from "express";
import {
    obtenerPerfil,
    editarPerfil,
    eliminarPerfil
} from "./usuarios.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const router = Router();

router.get("/perfil", verifyToken, obtenerPerfil);
router.put("/editar_perfil", verifyToken, editarPerfil);
router.delete("/", verifyToken, eliminarPerfil);

export default router;
