import * as metodosPagoService from "./metodosPago.service.js";
import { enviarError } from "../../middleware/errorHandler.js";

export const obtenerMetodosPago = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const result = await metodosPagoService.obtenerMetodosPago(id_usuario);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const crearMetodoPago = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const result = await metodosPagoService.crearMetodoPago(id_usuario, req.body);
        return res.status(201).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const eliminarMetodoPago = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_metodo } = req.params;
        const result = await metodosPagoService.eliminarMetodoPago(id_usuario, id_metodo);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};
