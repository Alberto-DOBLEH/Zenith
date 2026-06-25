import * as dashboardService from "./dashboard.service.js";

export const obtenerResumen = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const result = await dashboardService.obtenerResumen(id_usuario);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message
        });
    }
};
