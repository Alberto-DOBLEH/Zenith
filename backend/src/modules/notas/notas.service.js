import db from "../../config/db.js";

export const obtenerNotas = async (id_usuario) => {
    const result = await db.query(
        `SELECT
            id_nota,
            fecha_creacion,
            nota
        FROM notas
        WHERE usuario = $1
        ORDER BY fecha_creacion DESC`,
        [id_usuario]
    );

    return result.rows;
};

export const obtenerNotaPorId = async (id_usuario, id_nota) => {
    const result = await db.query(
        `SELECT
            id_nota,
            fecha_creacion,
            nota
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

export const crearNota = async (id_usuario, datos) => {
    const { nota } = datos;

    if (!nota) {
        throw {
            status: 400,
            message: "El campo nota es obligatorio"
        };
    }

    const hoy = new Date().toISOString().split("T")[0];

    await db.query(
        `INSERT INTO notas (usuario, fecha_creacion, nota)
        VALUES ($1, $2, $3)`,
        [id_usuario, hoy, nota]
    );

    return { message: "nota guardada con exito" };
};
