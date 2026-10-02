import * as ejerciciosService from "./ejercicios.service.js";
import { enviarError } from "../../middleware/errorHandler.js";

export const obtenerEjercicios = async (req, res) => {
    try {
        const filtros = {
            grupo: req.query.grupo,
            q: req.query.q
        };
        const result = await ejerciciosService.obtenerEjercicios(filtros);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const crearEjercicio = async (req, res) => {
    try {
        const result = await ejerciciosService.crearEjercicio(req.body);
        return res.status(201).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const editarEjercicio = async (req, res) => {
    try {
        const { id_ejercicio } = req.params;
        const result = await ejerciciosService.editarEjercicio(id_ejercicio, req.body);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const eliminarEjercicio = async (req, res) => {
    try {
        const { id_ejercicio } = req.params;
        const result = await ejerciciosService.eliminarEjercicio(id_ejercicio);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};
