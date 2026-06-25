import * as notasService from "./notas.service.js";

export const obtenerNotas = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const result = await notasService.obtenerNotas(id_usuario);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message
        });
    }
};

export const obtenerNotaPorId = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_nota } = req.params;
        const result = await notasService.obtenerNotaPorId(id_usuario, id_nota);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message
        });
    }
};

export const crearNota = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const result = await notasService.crearNota(id_usuario, req.body);
        return res.status(201).json(result);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message
        });
    }
};
