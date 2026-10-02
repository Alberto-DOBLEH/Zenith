import db from "../../config/db.js";
import { validarNombreSesion, validarDia, validarReceta, verificarEjercicios } from "../splits/validaciones.js";

export const obtenerSesionPropia = async (id_usuario, id_sesion_plan) => {
    const result = await db.query(
        `SELECT sp.id_sesion_plan, sp.id_split, sp.nombre_sesion, sp.dia_asignado
        FROM sesiones_plan sp
        JOIN splits s ON s.id_split = sp.id_split
        WHERE sp.id_sesion_plan = $1 AND s.id_usuario = $2`,
        [id_sesion_plan, id_usuario]
    );

    if (result.rows.length === 0) {
        throw {
            status: 404,
            message: "Sesión no encontrada"
        };
    }

    return result.rows[0];
};

export const editarSesion = async (id_usuario, id_sesion_plan, datos) => {
    const sesion = await obtenerSesionPropia(id_usuario, id_sesion_plan);

    if (datos.nombre_sesion === undefined && datos.dia_asignado === undefined) {
        throw {
            status: 400,
            message: "Indica al menos nombre_sesion o dia_asignado"
        };
    }

    const nombre = datos.nombre_sesion === undefined
        ? sesion.nombre_sesion
        : validarNombreSesion(datos.nombre_sesion);

    const dia = datos.dia_asignado === undefined
        ? sesion.dia_asignado
        : validarDia(datos.dia_asignado);

    if (dia !== sesion.dia_asignado) {
        const ocupado = await db.query(
            "SELECT 1 FROM sesiones_plan WHERE id_split = $1 AND dia_asignado = $2 AND id_sesion_plan <> $3",
            [sesion.id_split, dia, id_sesion_plan]
        );

        if (ocupado.rows.length > 0) {
            throw {
                status: 409,
                message: "Ya hay otra sesión asignada a ese día en este split"
            };
        }
    }

    await db.query(
        "UPDATE sesiones_plan SET nombre_sesion = $1, dia_asignado = $2 WHERE id_sesion_plan = $3",
        [nombre, dia, id_sesion_plan]
    );

    return { message: "Sesión modificada con exito" };
};

export const eliminarSesion = async (id_usuario, id_sesion_plan) => {
    await obtenerSesionPropia(id_usuario, id_sesion_plan);

    const entrenamientos = await db.query(
        "SELECT COUNT(*)::int AS total FROM entrenamientos_historial WHERE id_sesion_plan = $1",
        [id_sesion_plan]
    );

    if (entrenamientos.rows[0].total > 0) {
        throw {
            status: 409,
            message: "La sesión tiene entrenamientos registrados y no se puede eliminar"
        };
    }

    await db.query("DELETE FROM sesiones_plan WHERE id_sesion_plan = $1", [id_sesion_plan]);

    return { message: "Sesión eliminada con exito" };
};

// Reemplaza por completo la receta de ejercicios de una sesión
export const reemplazarEjercicios = async (id_usuario, id_sesion_plan, datos) => {
    await obtenerSesionPropia(id_usuario, id_sesion_plan);

    const receta = validarReceta(datos.ejercicios);

    if (receta === null) {
        throw {
            status: 400,
            message: "ejercicios es obligatorio (usa [] para vaciar la sesión)"
        };
    }

    const client = await db.connect();

    try {
        await client.query("BEGIN");

        await verificarEjercicios(client, [receta]);

        await client.query(
            "DELETE FROM ejercicios_por_sesion WHERE id_sesion_plan = $1",
            [id_sesion_plan]
        );

        for (const ejercicio of receta) {
            await client.query(
                `INSERT INTO ejercicios_por_sesion (id_sesion_plan, id_ejercicio, orden)
                VALUES ($1, $2, $3)`,
                [id_sesion_plan, ejercicio.id_ejercicio, ejercicio.orden]
            );
        }

        await client.query("COMMIT");

        return {
            message: "Ejercicios de la sesión actualizados con exito",
            ejercicios: receta.length
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
