import * as dashboardService from "./dashboard.service.js";
import { enviarError } from "../../middleware/errorHandler.js";

export const obtenerResumen = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const result = await dashboardService.obtenerResumen(id_usuario, req.timezone);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};
