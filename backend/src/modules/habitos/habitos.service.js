import db from "../../config/db.js";

export const crearHabito = async (id_usuario, datos) => {
    const { tipo_habito, nombre, descripcion, meta, unidad, frecuencia } = datos;

    if (!tipo_habito || !nombre || !frecuencia) {
        throw {
            status: 400,
            message: "tipo_habito, nombre y frecuencia son obligatorios"
        };
    }

    const frecuenciasValidas = ["DIARIO", "SEMANAL", "MENSUAL"];
    if (!frecuenciasValidas.includes(frecuencia)) {
        throw {
            status: 400,
            message: "frecuencia debe ser DIARIO, SEMANAL o MENSUAL"
        };
    }

    await db.query(
        `INSERT INTO habitos (tipo_habito, usuario, nombre, descripcion, frecuencia, meta, unidad)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
            tipo_habito,
            id_usuario,
            nombre,
            descripcion || null,
            frecuencia,
            meta || null,
            unidad || null
        ]
    );

    return { message: "Habito creado con exito" };
};

export const obtenerHabitos = async (id_usuario) => {
    const result = await db.query(
        `SELECT
            id_habito,
            tipo_habito,
            nombre,
            descripcion,
            meta,
            unidad,
            frecuencia,
            estado
        FROM habitos
        WHERE usuario = $1
        ORDER BY fecha_creacion DESC`,
        [id_usuario]
    );

    return result.rows;
};

export const obtenerHabitoPorId = async (id_usuario, id_habito) => {
    const result = await db.query(
        `SELECT
            id_habito,
            tipo_habito,
            nombre,
            descripcion,
            meta,
            unidad,
            frecuencia,
            estado
        FROM habitos
        WHERE id_habito = $1 AND usuario = $2`,
        [id_habito, id_usuario]
    );

    if (result.rows.length === 0) {
        throw {
            status: 404,
            message: "Habito no encontrado"
        };
    }

    return result.rows[0];
};

export const editarHabito = async (id_usuario, id_habito, datos) => {
    const { nombre, descripcion, meta, unidad, frecuencia } = datos;

    const habito = await obtenerHabitoPorId(id_usuario, id_habito);
    if (!habito) {
        throw {
            status: 404,
            message: "Habito no encontrado"
        };
    }

    if (frecuencia) {
        const frecuenciasValidas = ["DIARIO", "SEMANAL", "MENSUAL"];
        if (!frecuenciasValidas.includes(frecuencia)) {
            throw {
                status: 400,
                message: "frecuencia debe ser DIARIO, SEMANAL o MENSUAL"
            };
        }
    }

    await db.query(
        `UPDATE habitos
        SET
            nombre = COALESCE($1, nombre),
            descripcion = COALESCE($2, descripcion),
            meta = COALESCE($3, meta),
            unidad = COALESCE($4, unidad),
            frecuencia = COALESCE($5, frecuencia)
        WHERE id_habito = $6 AND usuario = $7`,
        [
            nombre || null,
            descripcion || null,
            meta || null,
            unidad || null,
            frecuencia || null,
            id_habito,
            id_usuario
        ]
    );

    return { message: "Habito modificado con exito" };
};

export const eliminarHabito = async (id_usuario, id_habito) => {
    const result = await db.query(
        "DELETE FROM habitos WHERE id_habito = $1 AND usuario = $2 RETURNING id_habito",
        [id_habito, id_usuario]
    );

    if (result.rows.length === 0) {
        throw {
            status: 404,
            message: "Habito no encontrado"
        };
    }

    return { message: "habito eliminado con exito" };
};
