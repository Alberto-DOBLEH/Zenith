import * as splitsService from "./splits.service.js";
import { enviarError } from "../../middleware/errorHandler.js";

export const obtenerSplits = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const result = await splitsService.obtenerSplits(id_usuario);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const obtenerSplit = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_split } = req.params;
        const result = await splitsService.obtenerSplit(id_usuario, id_split);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const crearSplit = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const result = await splitsService.crearSplit(id_usuario, req.body);
        return res.status(201).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const editarSplit = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_split } = req.params;
        const result = await splitsService.editarSplit(id_usuario, id_split, req.body);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const activarSplit = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_split } = req.params;
        const result = await splitsService.activarSplit(id_usuario, id_split);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const eliminarSplit = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_split } = req.params;
        const result = await splitsService.eliminarSplit(id_usuario, id_split);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const crearSesion = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_split } = req.params;
        const result = await splitsService.crearSesion(id_usuario, id_split, req.body);
        return res.status(201).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};
