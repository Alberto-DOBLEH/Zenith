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