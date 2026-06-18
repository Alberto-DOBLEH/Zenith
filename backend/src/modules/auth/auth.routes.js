import { Router } from "express";
import {
    registro,
    login
} from "./auth.controller.js";
import {
    validarRegistro,
    validarLogin
} from "./auth.validation.js";

const router = Router();

router.post("/register", validarRegistro, registro);
router.post("/login", validarLogin, login);

export default router;