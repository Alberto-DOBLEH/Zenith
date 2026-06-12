import { Router } from "express";
import { obtenerTiposHabito } from "../controllers/tipo_habito.controllers.js";

const router = Router();

router.get("/", obtenerTiposHabito);

export default router;
