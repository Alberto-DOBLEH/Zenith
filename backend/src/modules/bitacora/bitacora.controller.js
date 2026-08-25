import * as bitacoraService from "./bitacora.service.js";
import { enviarError } from "../../middleware/errorHandler.js";

export const registrarProgreso = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const result = await bitacoraService.registrarProgreso(id_usuario, req.body);
        return res.status(201).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const obtenerRegistrosPorPeriodo = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { periodo } = req.query;
        const result = await bitacoraService.obtenerRegistrosPorPeriodo(id_usuario, periodo);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};
