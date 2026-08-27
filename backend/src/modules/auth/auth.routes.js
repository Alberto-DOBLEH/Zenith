import { Router } from "express";
import {
    registro,
    login,
    verificarEmail
} from "./auth.controller.js";
import {
    validarRegistro,
    validarLogin
} from "./auth.validation.js";

const router = Router();

router.post("/register", validarRegistro, registro);
router.post("/login", validarLogin, login);
router.get("/verificar-email/:token", verificarEmail);

export default router;
