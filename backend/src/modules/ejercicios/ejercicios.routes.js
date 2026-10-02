import { Router } from "express";
import {
    obtenerEjercicios,
    crearEjercicio,
    editarEjercicio,
    eliminarEjercicio
} from "./ejercicios.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import { validarId } from "../../middleware/validarId.js";

const router = Router();

router.get("/", verifyToken, obtenerEjercicios);
router.post("/", verifyToken, crearEjercicio);
router.put("/:id_ejercicio", verifyToken, validarId, editarEjercicio);
router.delete("/:id_ejercicio", verifyToken, validarId, eliminarEjercicio);

export default router;
