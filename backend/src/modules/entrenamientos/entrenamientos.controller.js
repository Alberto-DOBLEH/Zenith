import * as entrenamientosService from "./entrenamientos.service.js";
import { enviarError } from "../../middleware/errorHandler.js";

export const obtenerHoy = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const result = await entrenamientosService.obtenerHoy(id_usuario, req.timezone);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const iniciarEntrenamiento = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const result = await entrenamientosService.iniciarEntrenamiento(id_usuario, req.body, req.timezone);
        return res.status(201).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const obtenerEntrenamientos = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const filtros = {
            fecha: req.query.fecha,
            mes: req.query.mes
        };
        const result = await entrenamientosService.obtenerEntrenamientos(id_usuario, filtros, req.timezone);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const obtenerEntrenamiento = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_entrenamiento } = req.params;
        const result = await entrenamientosService.obtenerEntrenamiento(id_usuario, id_entrenamiento);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const finalizarEntrenamiento = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_entrenamiento } = req.params;
        const result = await entrenamientosService.finalizarEntrenamiento(id_usuario, id_entrenamiento);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const eliminarEntrenamiento = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_entrenamiento } = req.params;
        const result = await entrenamientosService.eliminarEntrenamiento(id_usuario, id_entrenamiento);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};
