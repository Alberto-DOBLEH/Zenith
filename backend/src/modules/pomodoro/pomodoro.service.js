import db from "../../config/db.js";
import { fechaHoySQL } from "../../config/fecha.js";

const MINUTOS_CICLO = 25;

const calcularCiclos = (minutos) => Math.ceil(minutos / MINUTOS_CICLO);

export const crearSesion = async (id_usuario, datos) => {
    const { habito, minutos_objetivo, modo } = datos;

    if (!minutos_objetivo || minutos_objetivo <= 0) {
        throw {
            status: 400,
            message: "minutos_objetivo es obligatorio y mayor a 0"
        };
    }

    // Validar que el hábito pertenece al usuario (si se envía)
    if (habito) {
        const habitoResult = await db.query(
            "SELECT id_habito FROM habitos WHERE id_habito = $1 AND usuario = $2",
            [habito, id_usuario]
        );
        if (habitoResult.rows.length === 0) {
            throw {
                status: 404,
                message: "Habito no encontrado"
            };
        }
    }

    const ciclos_objetivo = modo === "continuo" ? 1 : calcularCiclos(minutos_objetivo);

    const result = await db.query(
        `INSERT INTO sesiones_pomodoro
            (usuario, habito, fecha_inicio, minutos_objetivo, ciclos_objetivo)
        VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4)
        RETURNING
            id_sesion,
            habito,
            fecha_inicio,
            minutos_objetivo,
            ciclos_objetivo`,
        [id_usuario, habito || null, minutos_objetivo, ciclos_objetivo]
    );

    return { message: "Sesion pomodoro iniciada", sesion: result.rows[0] };
};

export const obtenerSesiones = async (id_usuario) => {
    const result = await db.query(
        `SELECT
            sp.id_sesion,
            sp.habito,
            h.nombre AS habito_nombre,
            sp.fecha_inicio,
            sp.fecha_fin,
            sp.minutos_objetivo,
            sp.minutos_realizados,
            sp.ciclos_objetivo,
            sp.ciclos_completados
        FROM sesiones_pomodoro sp
        LEFT JOIN habitos h ON sp.habito = h.id_habito
        WHERE sp.usuario = $1
        ORDER BY sp.fecha_inicio DESC`,
        [id_usuario]
    );

    return result.rows;
};

export const obtenerSesionPorId = async (id_usuario, id_sesion) => {
    const result = await db.query(
        `SELECT
            sp.id_sesion,
            sp.habito,
            h.nombre AS habito_nombre,
            sp.fecha_inicio,
            sp.fecha_fin,
            sp.minutos_objetivo,
            sp.minutos_realizados,
            sp.ciclos_objetivo,
            sp.ciclos_completados
        FROM sesiones_pomodoro sp
        LEFT JOIN habitos h ON sp.habito = h.id_habito
        WHERE sp.id_sesion = $1 AND sp.usuario = $2`,
        [id_sesion, id_usuario]
    );

    if (result.rows.length === 0) {
        throw {
            status: 404,
            message: "Sesion no encontrada"
        };
    }

    return result.rows[0];
};

export const avanzarSesion = async (id_usuario, id_sesion, datos, timezone) => {
    const { minutos_realizados, ciclos_completados, finalizar } = datos;

    const sesion = await obtenerSesionPorId(id_usuario, id_sesion);

    const nuevosMinutos = minutos_realizados !== undefined
        ? minutos_realizados
        : sesion.minutos_realizados;
    const nuevosCiclos = ciclos_completados !== undefined
        ? ciclos_completados
        : sesion.ciclos_completados;

    if (finalizar) {
        await db.query(
            `UPDATE sesiones_pomodoro
            SET minutos_realizados = $1, ciclos_completados = $2, fecha_fin = CURRENT_TIMESTAMP
            WHERE id_sesion = $3 AND usuario = $4`,
            [nuevosMinutos, nuevosCiclos, id_sesion, id_usuario]
        );

        // Si la sesión estaba ligada a un hábito y se completaron los ciclos,
        // se marca el hábito como completado en la bitácora de hoy
        if (sesion.habito && nuevosCiclos >= sesion.ciclos_objetivo) {
            const hoy = fechaHoySQL(timezone);
            await db.query(
                `INSERT INTO registro_habitos (habito, fecha, estado, fecha_completado)
                VALUES ($1, ${hoy}, 'COMPLETADO', CURRENT_TIMESTAMP)
                ON CONFLICT (habito, fecha) DO UPDATE SET
                    estado = 'COMPLETADO',
                    fecha_completado = COALESCE(registro_habitos.fecha_completado, CURRENT_TIMESTAMP)`,
                [sesion.habito]
            );
        }

        return { message: "Sesion finalizada", completado: nuevosCiclos >= sesion.ciclos_objetivo };
    }

    await db.query(
        `UPDATE sesiones_pomodoro
        SET minutos_realizados = $1, ciclos_completados = $2
        WHERE id_sesion = $3 AND usuario = $4`,
        [nuevosMinutos, nuevosCiclos, id_sesion, id_usuario]
    );

    return { message: "Progreso registrado", sesion: { ...sesion, minutos_realizados: nuevosMinutos, ciclos_completados: nuevosCiclos } };
};

export const eliminarSesion = async (id_usuario, id_sesion) => {
    const result = await db.query(
        "DELETE FROM sesiones_pomodoro WHERE id_sesion = $1 AND usuario = $2 RETURNING id_sesion",
        [id_sesion, id_usuario]
    );

    if (result.rows.length === 0) {
        throw {
            status: 404,
            message: "Sesion no encontrada"
        };
    }

    return { message: "Sesion eliminada con exito" };
};