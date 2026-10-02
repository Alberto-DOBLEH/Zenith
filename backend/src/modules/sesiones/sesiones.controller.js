import * as sesionesService from "./sesiones.service.js";
import { enviarError } from "../../middleware/errorHandler.js";

export const editarSesion = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_sesion_plan } = req.params;
        const result = await sesionesService.editarSesion(id_usuario, id_sesion_plan, req.body);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const eliminarSesion = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_sesion_plan } = req.params;
        const result = await sesionesService.eliminarSesion(id_usuario, id_sesion_plan);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const reemplazarEjercicios = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_sesion_plan } = req.params;
        const result = await sesionesService.reemplazarEjercicios(id_usuario, id_sesion_plan, req.body);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};
