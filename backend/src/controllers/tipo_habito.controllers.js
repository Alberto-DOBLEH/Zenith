import * as tipoHabitoService from "../services/tipo_habito.services.js";

export const obtenerTiposHabito = async (req, res) => {
    try {
        const tipos = await tipoHabitoService.obtenerTiposHabito();
        res.status(200).json({ message: "Tipos de hábito obtenidos exitosamente", data: tipos });
    } catch (error) {
        console.error("Error al obtener tipos de hábito:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};
