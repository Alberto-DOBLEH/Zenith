import * as usuariosService from "./usuarios.service.js";
import { enviarError } from "../../middleware/errorHandler.js";

export const obtenerPerfil = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const result = await usuariosService.obtenerPerfil(id_usuario);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const editarPerfil = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const result = await usuariosService.editarPerfil(id_usuario, req.body);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const cambiarContraseña = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const result = await usuariosService.cambiarContraseña(id_usuario, req.body);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const eliminarPerfil = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const result = await usuariosService.eliminarPerfil(id_usuario);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};
