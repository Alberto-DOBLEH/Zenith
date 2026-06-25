import * as estadisticasService from "./estadisticas.service.js";

export const obtenerEstadisticasGenerales = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { periodo } = req.query;
        const result = await estadisticasService.obtenerEstadisticasGenerales(id_usuario, periodo);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message
        });
    }
};

export const obtenerEstadisticasHabito = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_habito } = req.params;
        const result = await estadisticasService.obtenerEstadisticasHabito(id_usuario, id_habito);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message
        });
    }
};
