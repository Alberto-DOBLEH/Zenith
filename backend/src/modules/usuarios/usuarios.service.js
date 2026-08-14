import bcrypt from "bcrypt";
import db from "../../config/db.js";

export const obtenerPerfil = async (id_usuario) => {
    const result = await db.query(
        `SELECT
            nombre,
            primer_apellido,
            segundo_apellido,
            correo,
            telefono,
            username,
            foto_perfil,
            avatar,
            fecha_nacimiento,
            pais,
            estado
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
    const { nombre, primer_apellido, segundo_apellido, foto_perfil, avatar, fecha_nacimiento, pais } = datos;

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
            foto_perfil = $4,
            avatar = $5,
            fecha_nacimiento = $6,
            pais = $7
        WHERE id_usuario = $8`,
        [
            nombre,
            primer_apellido,
            segundo_apellido || null,
            foto_perfil || null,
            avatar || null,
            fecha_nacimiento || null,
            pais || null,
            id_usuario
        ]
    );

    return { message: "perfil modificado con exito" };
};

export const cambiarContraseña = async (id_usuario, datos) => {
    const { contraseña_actual, contraseña_nueva } = datos;

    if (!contraseña_actual || !contraseña_nueva) {
        throw {
            status: 400,
            message: "contraseña_actual y contraseña_nueva son obligatorias"
        };
    }

    const result = await db.query(
        "SELECT contraseña FROM usuarios WHERE id_usuario = $1",
        [id_usuario]
    );

    if (result.rows.length === 0) {
        throw {
            status: 404,
            message: "Usuario no encontrado"
        };
    }

    const contraseñaValida = await bcrypt.compare(contraseña_actual, result.rows[0].contraseña);
    if (!contraseñaValida) {
        throw {
            status: 401,
            message: "La contraseña actual es incorrecta"
        };
    }

    const hashedPassword = await bcrypt.hash(contraseña_nueva, 10);

    await db.query(
        "UPDATE usuarios SET contraseña = $1 WHERE id_usuario = $2",
        [hashedPassword, id_usuario]
    );

    return { message: "Contraseña actualizada con exito" };
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