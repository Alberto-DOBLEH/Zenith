import * as detalleHabitoService from "../services/detalles_habitos.services.js";

export const crearDetalleHabito = async (req, res) => {
    try {
        const detalle = await detalleHabitoService.crearDetalleHabito(req.body);
        res.status(201).json({ message: "Detalle de hábito creado exitosamente", data: detalle });
    } catch (error) {
        console.error("Error al crear detalle de hábito:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};
