import * as movimientosService from "./movimientos.service.js";
import { enviarError } from "../../middleware/errorHandler.js";

export const obtenerMovimientos = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const filtros = {
            fecha: req.query.fecha,
            mes: req.query.mes,
            tipo: req.query.tipo,
            metodo: req.query.metodo
        };
        const result = await movimientosService.obtenerMovimientos(id_usuario, filtros);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const obtenerMovimiento = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_movimiento } = req.params;
        const result = await movimientosService.obtenerMovimiento(id_usuario, id_movimiento);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const crearMovimiento = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const result = await movimientosService.crearMovimiento(id_usuario, req.body);
        return res.status(201).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};
