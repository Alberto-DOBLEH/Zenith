import { Router } from "express";
import { obtenerResumen } from "./dashboard.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const router = Router();

router.get("/", verifyToken, obtenerResumen);

export default router;
