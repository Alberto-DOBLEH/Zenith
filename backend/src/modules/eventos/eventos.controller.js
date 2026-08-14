import * as eventosService from "./eventos.service.js";

export const obtenerEventos = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const result = await eventosService.obtenerEventos(id_usuario);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message
        });
    }
};

export const obtenerEventoPorId = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_evento } = req.params;
        const result = await eventosService.obtenerEventoPorId(id_usuario, id_evento);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message
        });
    }
};

export const crearEvento = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const result = await eventosService.crearEvento(id_usuario, req.body);
        return res.status(201).json(result);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message
        });
    }
};

export const editarEvento = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_evento } = req.params;
        const result = await eventosService.editarEvento(id_usuario, id_evento, req.body);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message
        });
    }
};

export const eliminarEvento = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_evento } = req.params;
        const result = await eventosService.eliminarEvento(id_usuario, id_evento);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message
        });
    }
};