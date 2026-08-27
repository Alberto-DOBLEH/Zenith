import * as authService from "./auth.service.js";
import { enviarError } from "../../middleware/errorHandler.js";

export const registro = async (req, res) => {
    try {
        const result = await authService.registrarUsuario(req.body);

        return res.status(201).json(result);

    } catch (error) {
        return enviarError(res, error);
    }
};

export const verificarEmail = async (req, res) => {
    try {
        const { token } = req.params;
        const result = await authService.verificarEmail(token);

        return res.status(200).json(result);

    } catch (error) {
        return enviarError(res, error);
    }
};

export const login = async (req, res) => {
    try {

        const result = await authService.loginUsuario(
            req.body
        );

        return res.status(200).json(result);

    } catch (error) {
        return enviarError(res, error);
    }
};
