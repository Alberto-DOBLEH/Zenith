import * as actividadesService from "./actividades.service.js";
import { enviarError } from "../../middleware/errorHandler.js";

export const obtenerActividades = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const result = await actividadesService.obtenerActividades(id_usuario, req.query);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const crearActividad = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const result = await actividadesService.crearActividad(id_usuario, req.body);
        return res.status(201).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const editarActividad = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_actividad } = req.params;
        const result = await actividadesService.editarActividad(id_usuario, id_actividad, req.body);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const eliminarActividad = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_actividad } = req.params;
        const result = await actividadesService.eliminarActividad(id_usuario, id_actividad);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};
