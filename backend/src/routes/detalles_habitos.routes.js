import { Router } from "express";
import { crearDetalleHabito } from "../controllers/detalles_habitos.controllers.js";

const router = Router();

router.post("/", crearDetalleHabito);

export default router;
