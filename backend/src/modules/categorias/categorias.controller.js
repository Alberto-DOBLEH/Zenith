import * as categoriasService from "./categorias.service.js";
import { enviarError } from "../../middleware/errorHandler.js";

export const obtenerCategorias = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const result = await categoriasService.obtenerCategorias(id_usuario);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const crearCategoria = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const result = await categoriasService.crearCategoria(id_usuario, req.body);
        return res.status(201).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const editarCategoria = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_categoria } = req.params;
        const result = await categoriasService.editarCategoria(id_usuario, id_categoria, req.body);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};

export const eliminarCategoria = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_categoria } = req.params;
        const result = await categoriasService.eliminarCategoria(id_usuario, id_categoria);
        return res.status(200).json(result);
    } catch (error) {
        return enviarError(res, error);
    }
};
