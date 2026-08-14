import * as avataresService from "./avatares.service.js";

export const obtenerAvatares = async (req, res) => {
    try {
        const result = await avataresService.obtenerAvatares();
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message
        });
    }
};