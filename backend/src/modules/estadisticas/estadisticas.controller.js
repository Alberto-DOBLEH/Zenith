import * as estadisticasService from "./estadisticas.service.js";
import { enviarError } from "../../middleware/errorHandler.js";

export const obtenerEstadisticasGenerales = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { periodo } = req.query;
        const result = await estadisticasService.obtenerEstadisticasGenerales(id_usuario, periodo, req.timezone);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const obtenerEstadisticasHabito = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_habito } = req.params;
        const result = await estadisticasService.obtenerEstadisticasHabito(id_usuario, id_habito);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};
