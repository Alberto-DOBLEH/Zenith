import * as usuarioService from "../services/usuarios.services.js";

export const crearUsuario = async (req, res) => {
    try {
        const usuario = await usuarioService.crearUsuario(req.body);
        res.status(201).json({ message: "Usuario creado exitosamente", data: usuario });
    } catch (error) {
        console.error("Error al crear usuario:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};
