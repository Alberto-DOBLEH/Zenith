import * as habitosService from "./habitos.service.js";
import { enviarError } from "../../middleware/errorHandler.js";

export const obtenerTiposHabitos = async (req, res) => {
    try {
        const result = await habitosService.obtenerTiposHabitos();
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const crearHabito = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const result = await habitosService.crearHabito(id_usuario, req.body);
        return res.status(201).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const obtenerHabitos = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const result = await habitosService.obtenerHabitos(id_usuario);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const obtenerHabitoPorId = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_habito } = req.params;
        const result = await habitosService.obtenerHabitoPorId(id_usuario, id_habito);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const editarHabito = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_habito } = req.params;
        const result = await habitosService.editarHabito(id_usuario, id_habito, req.body);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const eliminarHabito = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_habito } = req.params;
        const result = await habitosService.eliminarHabito(id_usuario, id_habito);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};
