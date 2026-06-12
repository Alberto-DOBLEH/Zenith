import * as habitoService from "../services/habitos.services.js";

export const crearHabito = async (req, res) => {
    try {
        const habito = await habitoService.crearHabito(req.body);
        res.status(201).json({ message: "Hábito creado exitosamente", data: habito });
    } catch (error) {
        console.error("Error al crear hábito:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};
