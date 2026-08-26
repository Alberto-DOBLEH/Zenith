import * as pomodoroService from "./pomodoro.service.js";
import { enviarError } from "../../middleware/errorHandler.js";

export const crearSesion = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const result = await pomodoroService.crearSesion(id_usuario, req.body);
        return res.status(201).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const obtenerSesiones = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const result = await pomodoroService.obtenerSesiones(id_usuario);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const obtenerSesionPorId = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_sesion } = req.params;
        const result = await pomodoroService.obtenerSesionPorId(id_usuario, id_sesion);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const avanzarSesion = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_sesion } = req.params;
        const result = await pomodoroService.avanzarSesion(id_usuario, id_sesion, req.body, req.timezone);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const eliminarSesion = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_sesion } = req.params;
        const result = await pomodoroService.eliminarSesion(id_usuario, id_sesion);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};