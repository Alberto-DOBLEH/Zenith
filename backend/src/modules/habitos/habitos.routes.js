import { Router } from "express";
import {
    crearHabito,
    obtenerHabitos,
    obtenerHabitoPorId,
    editarHabito,
    eliminarHabito
} from "./habitos.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const router = Router();

router.post("/", verifyToken, crearHabito);
router.get("/", verifyToken, obtenerHabitos);
router.get("/:id_habito", verifyToken, obtenerHabitoPorId);
router.put("/:id_habito", verifyToken, editarHabito);
router.delete("/:id_habito", verifyToken, eliminarHabito);

export default router;
