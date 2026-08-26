import * as notasService from "./notas.service.js";
import { enviarError } from "../../middleware/errorHandler.js";

export const obtenerNotas = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const result = await notasService.obtenerNotas(id_usuario);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const obtenerNotaPorId = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_nota } = req.params;
        const result = await notasService.obtenerNotaPorId(id_usuario, id_nota);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const obtenerNotaPorFecha = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { fecha } = req.query;
        if (!fecha) {
            return res.status(400).json({ message: "El parametro fecha es obligatorio" });
        }
        const result = await notasService.obtenerNotaPorFecha(id_usuario, fecha);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const crearNota = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const result = await notasService.crearNota(id_usuario, req.body, req.timezone);
        return res.status(201).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const editarNota = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_nota } = req.params;
        const result = await notasService.editarNota(id_usuario, id_nota, req.body, req.timezone);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};