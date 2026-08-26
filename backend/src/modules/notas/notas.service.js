import db from "../../config/db.js";
import { fechaHoySQL } from "../../config/fecha.js";

export const obtenerNotas = async (id_usuario) => {
    const result = await db.query(
        `SELECT
            id_nota,
            fecha,
            contenido
        FROM notas
        WHERE usuario = $1
        ORDER BY fecha DESC`,
        [id_usuario]
    );

    return result.rows;
};

export const obtenerNotaPorId = async (id_usuario, id_nota) => {
    const result = await db.query(
        `SELECT
            id_nota,
            fecha,
            contenido
        FROM notas
        WHERE id_nota = $1 AND usuario = $2`,
        [id_nota, id_usuario]
    );

    if (result.rows.length === 0) {
        throw {
            status: 404,
            message: "Nota no encontrada"
        };
    }

    return result.rows[0];
};

export const obtenerNotaPorFecha = async (id_usuario, fecha) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        throw {
            status: 400,
            message: "La fecha debe tener el formato YYYY-MM-DD"
        };
    }
    const result = await db.query(
        `SELECT
            id_nota,
            fecha,
            contenido
        FROM notas
        WHERE usuario = $1 AND fecha = $2`,
        [id_usuario, fecha]
    );

    return result.rows[0] || null;
};

export const crearNota = async (id_usuario, datos, timezone) => {
    const { contenido } = datos;

    if (!contenido) {
        throw {
            status: 400,
            message: "El campo contenido es obligatorio"
        };
    }

    const hoy = fechaHoySQL(timezone);

    const result = await db.query(
        `INSERT INTO notas (usuario, fecha, contenido)
        VALUES ($1, ${hoy}, $2)
        ON CONFLICT (usuario, fecha) DO UPDATE SET
            contenido = EXCLUDED.contenido,
            fecha_modificacion = CURRENT_TIMESTAMP
        RETURNING id_nota, fecha, contenido`,
        [id_usuario, contenido]
    );

    return { message: "nota guardada con exito", nota: result.rows[0] };
};

export const editarNota = async (id_usuario, id_nota, datos, timezone) => {
    const { contenido } = datos;

    if (!contenido) {
        throw {
            status: 400,
            message: "El campo contenido es obligatorio"
        };
    }

    const nota = await obtenerNotaPorId(id_usuario, id_nota);

    // Solo se puede editar la nota del día actual (en la timezone del usuario)
    const hoy = fechaHoySQL(timezone);
    const esHoy = await db.query(
        `SELECT $1::date = ${hoy} AS es_hoy`,
        [nota.fecha]
    );

    if (!esHoy.rows[0].es_hoy) {
        throw {
            status: 403,
            message: "Solo es posible editar la nota del dia actual"
        };
    }

    const result = await db.query(
        `UPDATE notas
        SET contenido = $1, fecha_modificacion = CURRENT_TIMESTAMP
        WHERE id_nota = $2 AND usuario = $3
        RETURNING id_nota, fecha, contenido`,
        [contenido, id_nota, id_usuario]
    );

    return { message: "nota modificada con exito", nota: result.rows[0] };
};
