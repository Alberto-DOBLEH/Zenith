import db from "../../config/db.js";

export const obtenerPerfil = async (id_usuario) => {
    const result = await db.query(
        `SELECT
            nombre,
            primer_apellido,
            segundo_apellido,
            correo,
            telefono,
            foto_perfil,
            username
        FROM usuarios
        WHERE id_usuario = $1`,
        [id_usuario]
    );

    if (result.rows.length === 0) {
        throw {
            status: 404,
            message: "Usuario no encontrado"
        };
    }

    return result.rows[0];
};

export const editarPerfil = async (id_usuario, datos) => {
    const { nombre, primer_apellido, segundo_apellido, foto_perfil } = datos;

    if (!nombre || !primer_apellido) {
        throw {
            status: 400,
            message: "nombre y primer_apellido son obligatorios"
        };
    }

    await db.query(
        `UPDATE usuarios
        SET
            nombre = $1,
            primer_apellido = $2,
            segundo_apellido = $3,
            foto_perfil = $4
        WHERE id_usuario = $5`,
        [
            nombre,
            primer_apellido,
            segundo_apellido || null,
            foto_perfil || null,
            id_usuario
        ]
    );

    return { message: "perfil modificado con exito" };
};

export const eliminarPerfil = async (id_usuario) => {
    const result = await db.query(
        "DELETE FROM usuarios WHERE id_usuario = $1 RETURNING id_usuario",
        [id_usuario]
    );

    if (result.rows.length === 0) {
        throw {
            status: 404,
            message: "Usuario no encontrado"
        };
    }

    return { message: "usuario eliminado con exito" };
};
