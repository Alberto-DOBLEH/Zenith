import { Router } from "express";
import {
    obtenerCategorias,
    crearCategoria,
    editarCategoria,
    eliminarCategoria
} from "./categorias.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import { validarId } from "../../middleware/validarId.js";

const router = Router();

router.get("/", verifyToken, obtenerCategorias);
router.post("/", verifyToken, crearCategoria);
router.put("/:id_categoria", verifyToken, validarId, editarCategoria);
router.delete("/:id_categoria", verifyToken, validarId, eliminarCategoria);

export default router;
