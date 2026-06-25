import { Router } from "express";
import {
    registrarProgreso,
    obtenerRegistrosPorPeriodo
} from "./bitacora.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const router = Router();

router.post("/", verifyToken, registrarProgreso);
router.get("/", verifyToken, obtenerRegistrosPorPeriodo);

export default router;
