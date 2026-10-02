import { Router } from "express";
import {
    obtenerHoy,
    iniciarEntrenamiento,
    obtenerEntrenamientos,
    obtenerEntrenamiento,
    finalizarEntrenamiento,
    eliminarEntrenamiento
} from "./entrenamientos.controller.js";
import { crearSerie } from "../series/series.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import { validarId } from "../../middleware/validarId.js";

const router = Router();

// /hoy debe registrarse antes que /:id_entrenamiento
router.get("/hoy", verifyToken, obtenerHoy);
router.get("/", verifyToken, obtenerEntrenamientos);
router.post("/", verifyToken, iniciarEntrenamiento);
router.get("/:id_entrenamiento", verifyToken, validarId, obtenerEntrenamiento);
router.put("/:id_entrenamiento/finalizar", verifyToken, validarId, finalizarEntrenamiento);
router.delete("/:id_entrenamiento", verifyToken, validarId, eliminarEntrenamiento);
router.post("/:id_entrenamiento/series", verifyToken, validarId, crearSerie);

export default router;
