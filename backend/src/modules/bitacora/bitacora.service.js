import db from "../../config/db.js";

export const registrarProgreso = async (id_usuario, datos) => {
    const { habito, valor_realizado } = datos;

    if (!habito || valor_realizado === undefined || valor_realizado === null) {
        throw {
            status: 400,
            message: "habito y valor_realizado son obligatorios"
        };
    }

    // Verificar que el hábito pertenece al usuario y obtener su meta
    const habitoResult = await db.query(
        "SELECT id_habito, meta FROM habitos WHERE id_habito = $1 AND usuario = $2",
        [habito, id_usuario]
    );

    if (habitoResult.rows.length === 0) {
        throw {
            status: 404,
            message: "Habito no encontrado"
        };
    }

    const { meta } = habitoResult.rows[0];

    // Determinar estado: C (completado) o N (no completado)
    const estado = meta !== null && valor_realizado >= meta ? "C" : "N";

    const hoy = new Date().toISOString().split("T")[0];

    await db.query(
        `INSERT INTO registro_habitos (habito, fecha, estado, fecha_programada, valor_realizado)
        VALUES ($1, CURRENT_TIMESTAMP, $2, $3, $4)`,
        [habito, estado, hoy, valor_realizado]
    );

    return { message: "registro guardado con exito" };
};

const obtenerRangoFechas = (periodo) => {
    const ahora = new Date();
    let fechaInicio;

    switch (periodo) {
        case "dia":
            fechaInicio = new Date(ahora);
            fechaInicio.setHours(0, 0, 0, 0);
            break;
        case "semana":
            fechaInicio = new Date(ahora);
            fechaInicio.setDate(ahora.getDate() - 7);
            break;
        case "mes":
            fechaInicio = new Date(ahora);
            fechaInicio.setMonth(ahora.getMonth() - 1);
            break;
        case "trimestre":
            fechaInicio = new Date(ahora);
            fechaInicio.setMonth(ahora.getMonth() - 3);
            break;
        case "semestre":
            fechaInicio = new Date(ahora);
            fechaInicio.setMonth(ahora.getMonth() - 6);
            break;
        case "anual":
            fechaInicio = new Date(ahora);
            fechaInicio.setFullYear(ahora.getFullYear() - 1);
            break;
        default:
            throw {
                status: 400,
                message: "periodo no valido. Use: dia, semana, mes, trimestre, semestre, anual"
            };
    }

    return fechaInicio.toISOString();
};

export const obtenerRegistrosPorPeriodo = async (id_usuario, periodo) => {
    if (!periodo) {
        throw {
            status: 400,
            message: "El parametro periodo es obligatorio"
        };
    }

    const fechaInicio = obtenerRangoFechas(periodo);

    const result = await db.query(
        `SELECT
            rh.id_registro_habito,
            h.nombre AS habito,
            rh.fecha_programada,
            rh.valor_realizado,
            h.meta,
            rh.estado
        FROM registro_habitos rh
        INNER JOIN habitos h ON rh.habito = h.id_habito
        WHERE h.usuario = $1
            AND rh.fecha_registro >= $2
        ORDER BY rh.fecha_programada DESC`,
        [id_usuario, fechaInicio]
    );

    return result.rows;
};
