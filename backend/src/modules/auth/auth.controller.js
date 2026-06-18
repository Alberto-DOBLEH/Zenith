import * as authService from "./auth.service.js";

export const registro = async (req, res) => {
    try {
        const result = await authService.registrarUsuario(req.body);

        return res.status(201).json(result);

    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message
        });
    }
};

export const login = async (req, res) => {
    try {

        const result = await authService.loginUsuario(
            req.body
        );

        return res.status(200).json(result);

    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message
        });
    }
};