import * as avataresService from "./avatares.service.js";
import { enviarError } from "../../middleware/errorHandler.js";

export const obtenerAvatares = async (req, res) => {
    try {
        const result = await avataresService.obtenerAvatares();
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};