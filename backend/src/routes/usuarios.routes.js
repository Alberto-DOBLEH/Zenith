import { Router } from "express";
import { crearUsuario } from "../controllers/usuarios.controllers.js";

const router = Router();

router.post("/", crearUsuario);

export default router;