import { Router } from "express";
import { obtenerAvatares } from "./avatares.controller.js";

const router = Router();

router.get("/", obtenerAvatares);

export default router;