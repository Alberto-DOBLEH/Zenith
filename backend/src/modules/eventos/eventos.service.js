import db from "../../config/db.js";

export const obtenerEventos = async (id_usuario) => {
    const result = await db.query(
        `SELECT
            e.id_evento,
            e.titulo,
            e.descripcion,
            e.fecha_inicio,
            e.fecha_fin,
            e.color,
            COALESCE(
                (SELECT json_agg(r.fecha_recordatorio ORDER BY r.fecha_recordatorio)
                 FROM recordatorios_evento r WHERE r.evento = e.id_evento),
                '[]'::json
            ) AS avisos
        FROM eventos e
        WHERE e.usuario = $1
        ORDER BY e.fecha_inicio ASC`,
        [id_usuario]
    );

    return result.rows;
};

export const obtenerEventoPorId = async (id_usuario, id_evento) => {
    const result = await db.query(
        `SELECT
            e.id_evento,
            e.titulo,
            e.descripcion,
            e.fecha_inicio,
            e.fecha_fin,
            e.color,
            COALESCE(
                (SELECT json_agg(r.fecha_recordatorio ORDER BY r.fecha_recordatorio)
                 FROM recordatorios_evento r WHERE r.evento = e.id_evento),
                '[]'::json
            ) AS avisos
        FROM eventos e
        WHERE e.id_evento = $1 AND e.usuario = $2`,
        [id_evento, id_usuario]
    );

    if (result.rows.length === 0) {
        throw {
            status: 404,
            message: "Evento no encontrado"
        };
    }

    return result.rows[0];
};

const insertarAvisos = async (client, id_evento, avisos) => {
    if (!Array.isArray(avisos)) return;
    for (const fecha of avisos) {
        if (fecha) {
            await client.query(
                "INSERT INTO recordatorios_evento (evento, fecha_recordatorio) VALUES ($1, $2)",
                [id_evento, fecha]
            );
        }
    }
};

export const crearEvento = async (id_usuario, datos) => {
    const { titulo, descripcion, fecha_inicio, fecha_fin, color, avisos } = datos;

    if (!titulo || !fecha_inicio || !fecha_fin) {
        throw {
            status: 400,
            message: "titulo, fecha_inicio y fecha_fin son obligatorios"
        };
    }

    if (new Date(fecha_fin) < new Date(fecha_inicio)) {
        throw {
            status: 400,
            message: "fecha_fin no puede ser anterior a fecha_inicio"
        };
    }

    const client = await db.connect();
    try {
        await client.query("BEGIN");

        const result = await client.query(
            `INSERT INTO eventos (usuario, titulo, descripcion, fecha_inicio, fecha_fin, color)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id_evento`,
            [
                id_usuario,
                titulo,
                descripcion || null,
                fecha_inicio,
                fecha_fin,
                color || null
            ]
        );

        const id_evento = result.rows[0].id_evento;
        await insertarAvisos(client, id_evento, avisos);

        await client.query("COMMIT");
        return { message: "Evento creado con exito", id_evento };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const editarEvento = async (id_usuario, id_evento, datos) => {
    const { titulo, descripcion, fecha_inicio, fecha_fin, color, avisos } = datos;

    await obtenerEventoPorId(id_usuario, id_evento);

    if (fecha_inicio && fecha_fin && new Date(fecha_fin) < new Date(fecha_inicio)) {
        throw {
            status: 400,
            message: "fecha_fin no puede ser anterior a fecha_inicio"
        };
    }

    const client = await db.connect();
    try {
        await client.query("BEGIN");

        await client.query(
            `UPDATE eventos
            SET
                titulo = COALESCE($1, titulo),
                descripcion = COALESCE($2, descripcion),
                fecha_inicio = COALESCE($3, fecha_inicio),
                fecha_fin = COALESCE($4, fecha_fin),
                color = COALESCE($5, color)
            WHERE id_evento = $6 AND usuario = $7`,
            [
                titulo || null,
                descripcion || null,
                fecha_inicio || null,
                fecha_fin || null,
                color || null,
                id_evento,
                id_usuario
            ]
        );

        if (avisos !== undefined) {
            await client.query(
                "DELETE FROM recordatorios_evento WHERE evento = $1",
                [id_evento]
            );
            await insertarAvisos(client, id_evento, avisos);
        }

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }

    return { message: "Evento modificado con exito" };
};

export const eliminarEvento = async (id_usuario, id_evento) => {
    const result = await db.query(
        "DELETE FROM eventos WHERE id_evento = $1 AND usuario = $2 RETURNING id_evento",
        [id_evento, id_usuario]
    );

    if (result.rows.length === 0) {
        throw {
            status: 404,
            message: "Evento no encontrado"
        };
    }

    return { message: "Evento eliminado con exito" };
};