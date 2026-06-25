import db from "../../config/db.js";

export const obtenerActividades = async (id_usuario) => {
    const result = await db.query(
        `SELECT
            id_actividad,
            titulo,
            descripcion,
            fecha_asignada,
            tiempo_estimado,
            recordatorio
        FROM actividades
        WHERE usuario = $1
        ORDER BY fecha_asignada ASC`,
        [id_usuario]
    );

    return result.rows;
};

export const obtenerActividadPorId = async (id_usuario, id_actividad) => {
    const result = await db.query(
        `SELECT
            id_actividad,
            titulo,
            descripcion,
            fecha_asignada,
            tiempo_estimado,
            recordatorio
        FROM actividades
        WHERE id_actividad = $1 AND usuario = $2`,
        [id_actividad, id_usuario]
    );

    if (result.rows.length === 0) {
        throw {
            status: 404,
            message: "Actividad no encontrada"
        };
    }

    return result.rows[0];
};

export const crearActividad = async (id_usuario, datos) => {
    const { titulo, descripcion, fecha_asignada, tiempo_estimado, recordatorio } = datos;

    if (!titulo || !fecha_asignada || !tiempo_estimado || !recordatorio) {
        throw {
            status: 400,
            message: "titulo, fecha_asignada, tiempo_estimado y recordatorio son obligatorios"
        };
    }

    await db.query(
        `INSERT INTO actividades (usuario, titulo, descripcion, fecha_asignada, tiempo_estimado, recordatorio)
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [
            id_usuario,
            titulo,
            descripcion || null,
            fecha_asignada,
            tiempo_estimado,
            recordatorio
        ]
    );

    return { message: "actividad creada con exito" };
};

export const editarActividad = async (id_usuario, id_actividad, datos) => {
    const { titulo, descripcion, tiempo_estimado, recordatorio } = datos;

    const actividad = await obtenerActividadPorId(id_usuario, id_actividad);
    if (!actividad) {
        throw {
            status: 404,
            message: "Actividad no encontrada"
        };
    }

    await db.query(
        `UPDATE actividades
        SET
            titulo = COALESCE($1, titulo),
            descripcion = COALESCE($2, descripcion),
            tiempo_estimado = COALESCE($3, tiempo_estimado),
            recordatorio = COALESCE($4, recordatorio)
        WHERE id_actividad = $5 AND usuario = $6`,
        [
            titulo || null,
            descripcion || null,
            tiempo_estimado || null,
            recordatorio || null,
            id_actividad,
            id_usuario
        ]
    );

    return { message: "Actividad modificada con exito" };
};

export const eliminarActividad = async (id_usuario, id_actividad) => {
    const result = await db.query(
        "DELETE FROM actividades WHERE id_actividad = $1 AND usuario = $2 RETURNING id_actividad",
        [id_actividad, id_usuario]
    );

    if (result.rows.length === 0) {
        throw {
            status: 404,
            message: "Actividad no encontrada"
        };
    }

    return { message: "Actividad eliminada con exito" };
};
