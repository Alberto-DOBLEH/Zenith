import * as bitacoraService from "./bitacora.service.js";

export const registrarProgreso = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const result = await bitacoraService.registrarProgreso(id_usuario, req.body);
        return res.status(201).json(result);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message
        });
    }
};

export const obtenerRegistrosPorPeriodo = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { periodo } = req.query;
        const result = await bitacoraService.obtenerRegistrosPorPeriodo(id_usuario, periodo);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message
        });
    }
};
