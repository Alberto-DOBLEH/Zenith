import { Router } from "express";
import { crearHabito } from "../controllers/habitos.controllers.js";

const router = Router();

router.post("/", crearHabito);

export default router;