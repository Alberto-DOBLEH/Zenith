import * as prestamosService from "./prestamos.service.js";
import { enviarError } from "../../middleware/errorHandler.js";

export const obtenerPrestamos = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const result = await prestamosService.obtenerPrestamos(id_usuario, req.query);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const obtenerPrestamo = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_prestamo } = req.params;
        const result = await prestamosService.obtenerPrestamo(id_usuario, id_prestamo);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const crearPrestamo = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const result = await prestamosService.crearPrestamo(id_usuario, req.body);
        return res.status(201).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const registrarAbono = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_prestamo } = req.params;
        const result = await prestamosService.registrarAbono(id_usuario, id_prestamo, req.body);
        return res.status(201).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const obtenerAbonos = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_prestamo } = req.params;
        const result = await prestamosService.obtenerAbonos(id_usuario, id_prestamo);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};
