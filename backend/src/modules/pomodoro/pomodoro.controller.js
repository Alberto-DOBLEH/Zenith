import * as pomodoroService from "./pomodoro.service.js";

export const crearSesion = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const result = await pomodoroService.crearSesion(id_usuario, req.body);
        return res.status(201).json(result);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message
        });
    }
};

export const obtenerSesiones = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const result = await pomodoroService.obtenerSesiones(id_usuario);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message
        });
    }
};

export const obtenerSesionPorId = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_sesion } = req.params;
        const result = await pomodoroService.obtenerSesionPorId(id_usuario, id_sesion);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message
        });
    }
};

export const avanzarSesion = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_sesion } = req.params;
        const result = await pomodoroService.avanzarSesion(id_usuario, id_sesion, req.body);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message
        });
    }
};

export const eliminarSesion = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_sesion } = req.params;
        const result = await pomodoroService.eliminarSesion(id_usuario, id_sesion);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message
        });
    }
};