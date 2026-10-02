import db from "../../config/db.js";
import {
    validarNombreSesion,
    validarDia,
    validarSesionesPayload,
    verificarEjercicios
} from "./validaciones.js";

const validarNombreSplit = (nombre) => {
    if (nombre === undefined || nombre === null || typeof nombre !== "string" || !nombre.trim()) {
        throw {
            status: 400,
            message: "nombre es obligatorio"
        };
    }

    const limpio = nombre.trim();

    if (limpio.length > 50) {
        throw {
            status: 400,
            message: "nombre no puede superar los 50 caracteres"
        };
    }

    return limpio;
};

export const obtenerSplits = async (id_usuario) => {
    const result = await db.query(
        `SELECT s.id_split, s.nombre, s.es_activo,
            COUNT(sp.id_sesion_plan)::int AS sesiones
        FROM splits s
        LEFT JOIN sesiones_plan sp ON sp.id_split = s.id_split
        WHERE s.id_usuario = $1
        GROUP BY s.id_split
        ORDER BY s.es_activo DESC, s.id_split ASC`,
        [id_usuario]
    );

    return result.rows;
};

export const obtenerSplit = async (id_usuario, id_split) => {
    const split = await db.query(
        "SELECT id_split, nombre, es_activo FROM splits WHERE id_split = $1 AND id_usuario = $2",
        [id_split, id_usuario]
    );

    if (split.rows.length === 0) {
        throw {
            status: 404,
            message: "Split no encontrado"
        };
    }

    const sesiones = await db.query(
        `SELECT id_sesion_plan, nombre_sesion, dia_asignado
        FROM sesiones_plan
        WHERE id_split = $1
        ORDER BY dia_asignado, id_sesion_plan`,
        [id_split]
    );

    const ejercicios = await db.query(
        `SELECT eps.id_sesion_plan, e.id_ejercicio, e.nombre, e.grupo_muscular, eps.orden
        FROM ejercicios_por_sesion eps
        JOIN ejercicios e ON e.id_ejercicio = eps.id_ejercicio
        JOIN sesiones_plan sp ON sp.id_sesion_plan = eps.id_sesion_plan
        WHERE sp.id_split = $1
        ORDER BY eps.orden, e.nombre`,
        [id_split]
    );

    const porSesion = new Map();
    for (const fila of ejercicios.rows) {
        if (!porSesion.has(fila.id_sesion_plan)) {
            porSesion.set(fila.id_sesion_plan, []);
        }
        porSesion.get(fila.id_sesion_plan).push({
            id_ejercicio: fila.id_ejercicio,
            nombre: fila.nombre,
            grupo_muscular: fila.grupo_muscular,
            orden: fila.orden
        });
    }

    return {
        ...split.rows[0],
        sesiones: sesiones.rows.map((sesion) => ({
            ...sesion,
            ejercicios: porSesion.get(sesion.id_sesion_plan) || []
        }))
    };
};

export const crearSplit = async (id_usuario, datos) => {
    const nombre = validarNombreSplit(datos.nombre);

    if (datos.es_activo !== undefined && typeof datos.es_activo !== "boolean") {
        throw {
            status: 400,
            message: "es_activo debe ser booleano"
        };
    }

    const esActivo = datos.es_activo === true;
    const sesiones = validarSesionesPayload(datos.sesiones);

    const client = await db.connect();

    try {
        await client.query("BEGIN");

        if (esActivo) {
            await client.query(
                "UPDATE splits SET es_activo = FALSE WHERE id_usuario = $1 AND es_activo",
                [id_usuario]
            );
        }

        const split = await client.query(
            "INSERT INTO splits (id_usuario, nombre, es_activo) VALUES ($1, $2, $3) RETURNING id_split, nombre, es_activo",
            [id_usuario, nombre, esActivo]
        );

        const id_split = split.rows[0].id_split;
        const creadas = [];

        if (sesiones) {
            for (const sesion of sesiones) {
                const insertada = await client.query(
                    `INSERT INTO sesiones_plan (id_split, nombre_sesion, dia_asignado)
                    VALUES ($1, $2, $3)
                    RETURNING id_sesion_plan, nombre_sesion, dia_asignado`,
                    [id_split, sesion.nombre_sesion, sesion.dia_asignado]
                );

                await verificarEjercicios(client, [sesion.ejercicios]);

                for (const ejercicio of sesion.ejercicios) {
                    await client.query(
                        `INSERT INTO ejercicios_por_sesion (id_sesion_plan, id_ejercicio, orden)
                        VALUES ($1, $2, $3)`,
                        [insertada.rows[0].id_sesion_plan, ejercicio.id_ejercicio, ejercicio.orden]
                    );
                }

                creadas.push(insertada.rows[0]);
            }
        }

        await client.query("COMMIT");

        return {
            message: "Split creado con exito",
            id_split,
            sesiones: creadas
        };
    } catch (error) {
        await client.query("ROLLBACK");
        if (error.code === "23505" && error.constraint === "sesiones_plan_split_dia_unico") {
            throw {
                status: 409,
                message: "Ya hay una sesión asignada a ese día en este split"
            };
        }
        throw error;
    } finally {
        client.release();
    }
};

export const editarSplit = async (id_usuario, id_split, datos) => {
    if (datos.nombre === undefined) {
        throw {
            status: 400,
            message: "Indica el nombre del split"
        };
    }

    const nombre = validarNombreSplit(datos.nombre);

    const result = await db.query(
        "UPDATE splits SET nombre = $1 WHERE id_split = $2 AND id_usuario = $3 RETURNING id_split",
        [nombre, id_split, id_usuario]
    );

    if (result.rows.length === 0) {
        throw {
            status: 404,
            message: "Split no encontrado"
        };
    }

    return { message: "Split modificado con exito" };
};

export const activarSplit = async (id_usuario, id_split) => {
    const client = await db.connect();

    try {
        await client.query("BEGIN");

        const split = await client.query(
            "SELECT id_split FROM splits WHERE id_split = $1 AND id_usuario = $2",
            [id_split, id_usuario]
        );

        if (split.rows.length === 0) {
            throw {
                status: 404,
                message: "Split no encontrado"
            };
        }

        await client.query(
            "UPDATE splits SET es_activo = FALSE WHERE id_usuario = $1 AND es_activo AND id_split <> $2",
            [id_usuario, id_split]
        );

        await client.query(
            "UPDATE splits SET es_activo = TRUE WHERE id_split = $1 AND id_usuario = $2",
            [id_split, id_usuario]
        );

        await client.query("COMMIT");

        return { message: "Split activado con exito" };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const eliminarSplit = async (id_usuario, id_split) => {
    const split = await db.query(
        "SELECT id_split FROM splits WHERE id_split = $1 AND id_usuario = $2",
        [id_split, id_usuario]
    );

    if (split.rows.length === 0) {
        throw {
            status: 404,
            message: "Split no encontrado"
        };
    }

    const entrenamientos = await db.query(
        `SELECT COUNT(*)::int AS total
        FROM entrenamientos_historial h
        JOIN sesiones_plan sp ON sp.id_sesion_plan = h.id_sesion_plan
        WHERE sp.id_split = $1`,
        [id_split]
    );

    if (entrenamientos.rows[0].total > 0) {
        throw {
            status: 409,
            message: "El split tiene entrenamientos registrados y no se puede eliminar"
        };
    }

    await db.query("DELETE FROM splits WHERE id_split = $1 AND id_usuario = $2", [id_split, id_usuario]);

    return { message: "Split eliminado con exito" };
};

export const crearSesion = async (id_usuario, id_split, datos) => {
    const split = await db.query(
        "SELECT id_split FROM splits WHERE id_split = $1 AND id_usuario = $2",
        [id_split, id_usuario]
    );

    if (split.rows.length === 0) {
        throw {
            status: 404,
            message: "Split no encontrado"
        };
    }

    const nombre_sesion = validarNombreSesion(datos.nombre_sesion);
    const dia_asignado = validarDia(datos.dia_asignado);

    const ocupado = await db.query(
        "SELECT 1 FROM sesiones_plan WHERE id_split = $1 AND dia_asignado = $2",
        [id_split, dia_asignado]
    );

    if (ocupado.rows.length > 0) {
        throw {
            status: 409,
            message: "Ya hay una sesión asignada a ese día en este split"
        };
    }

    const result = await db.query(
        `INSERT INTO sesiones_plan (id_split, nombre_sesion, dia_asignado)
        VALUES ($1, $2, $3)
        RETURNING id_sesion_plan, nombre_sesion, dia_asignado`,
        [id_split, nombre_sesion, dia_asignado]
    );

    return {
        message: "Sesión creada con exito",
        sesion: result.rows[0]
    };
};
