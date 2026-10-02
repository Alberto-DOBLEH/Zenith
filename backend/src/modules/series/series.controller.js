import * as seriesService from "./series.service.js";
import { enviarError } from "../../middleware/errorHandler.js";

export const crearSerie = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_entrenamiento } = req.params;
        const result = await seriesService.crearSerie(id_usuario, id_entrenamiento, req.body);
        return res.status(201).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const editarSerie = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_serie } = req.params;
        const result = await seriesService.editarSerie(id_usuario, id_serie, req.body);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const eliminarSerie = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_serie } = req.params;
        const result = await seriesService.eliminarSerie(id_usuario, id_serie);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};
