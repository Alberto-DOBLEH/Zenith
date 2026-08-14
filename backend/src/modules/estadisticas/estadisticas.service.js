import db from "../../config/db.js";

const fechaISO = (fecha) => {
    const offset = fecha.getTimezoneOffset();
    return new Date(fecha.getTime() - offset * 60000).toISOString().split("T")[0];
};

const obtenerFechaInicioPorPeriodo = (periodo) => {
    const ahora = new Date();
    switch (periodo) {
        case "semana":
            ahora.setDate(ahora.getDate() - 7);
            break;
        case "trimestre":
            ahora.setMonth(ahora.getMonth() - 3);
            break;
        case "semestre":
            ahora.setMonth(ahora.getMonth() - 6);
            break;
        case "anual":
            ahora.setFullYear(ahora.getFullYear() - 1);
            break;
        case "mes":
        default:
            ahora.setMonth(ahora.getMonth() - 1);
    }
    return fechaISO(ahora);
};

const calcularRacha = (fechasCompletadas) => {
    if (fechasCompletadas.length === 0) return { racha_actual: 0, racha_maxima: 0 };

    const hoy = fechaISO(new Date());
    const set = new Set(fechasCompletadas);

    let rachaActual = 0;
    let cursor = new Date(hoy + "T00:00:00");
    while (set.has(fechaISO(cursor))) {
        rachaActual++;
        cursor.setDate(cursor.getDate() - 1);
    }

    let rachaMaxima = 0;
    let rachaTemp = 1;
    for (let i = 0; i < fechasCompletadas.length; i++) {
        if (i === 0) {
            rachaTemp = 1;
        } else {
            const prev = new Date(fechasCompletadas[i - 1] + "T00:00:00");
            const curr = new Date(fechasCompletadas[i] + "T00:00:00");
            const diff = Math.round((prev - curr) / (1000 * 60 * 60 * 24));
            if (diff === 1) {
                rachaTemp++;
            } else {
                rachaTemp = 1;
            }
        }
        if (rachaTemp > rachaMaxima) rachaMaxima = rachaTemp;
    }

    return { racha_actual: rachaActual, racha_maxima: rachaMaxima };
};

export const obtenerEstadisticasGenerales = async (id_usuario, periodo) => {
    const fechaInicio = obtenerFechaInicioPorPeriodo(periodo);

    // Registros del período (solo hábitos positivos, no evitados)
    const registrosResult = await db.query(
        `SELECT rh.estado
        FROM registro_habitos rh
        INNER JOIN habitos h ON rh.habito = h.id_habito
        WHERE h.usuario = $1
            AND h.tipo_habito <> 4
            AND rh.fecha >= $2`,
        [id_usuario, fechaInicio]
    );

    const registros = registrosResult.rows;
    const total = registros.length;
    const completados = registros.filter(r => r.estado === "COMPLETADO").length;
    const noCompletados = total - completados;
    const cumplimiento = total > 0 ? Math.round((completados / total) * 100) : 0;

    // Fechas con todos los hábitos completados, para racha general
    const rachaResult = await db.query(
        `SELECT DISTINCT rh.fecha
        FROM registro_habitos rh
        INNER JOIN habitos h ON rh.habito = h.id_habito
        WHERE h.usuario = $1
            AND h.tipo_habito <> 4
            AND rh.estado = 'COMPLETADO'
        GROUP BY rh.fecha
        HAVING COUNT(DISTINCT rh.habito) = (
            SELECT COUNT(*) FROM habitos h2
            WHERE h2.usuario = $1 AND h2.estado = 'ACTIVO' AND h2.tipo_habito <> 4
        )
        ORDER BY rh.fecha DESC`,
        [id_usuario]
    );

    const fechas = rachaResult.rows.map(r => fechaISO(new Date(r.fecha)));

    const { racha_actual, racha_maxima } = calcularRacha(fechas);

    return {
        cumplimiento,
        completados,
        no_completados: noCompletados,
        racha_actual,
        racha_maxima
    };
};

export const obtenerEstadisticasHabito = async (id_usuario, id_habito) => {
    // Verificar que el hábito pertenece al usuario
    const habitoResult = await db.query(
        "SELECT id_habito, nombre FROM habitos WHERE id_habito = $1 AND usuario = $2",
        [id_habito, id_usuario]
    );

    if (habitoResult.rows.length === 0) {
        throw {
            status: 404,
            message: "Habito no encontrado"
        };
    }

    const habito = habitoResult.rows[0];

    // Registros del hábito
    const registrosResult = await db.query(
        `SELECT estado, fecha
        FROM registro_habitos
        WHERE habito = $1
        ORDER BY fecha DESC`,
        [id_habito]
    );

    const registros = registrosResult.rows;
    const total = registros.length;
    const completados = registros.filter(r => r.estado === "COMPLETADO").length;
    const cumplimiento = total > 0 ? Math.round((completados / total) * 100) : 0;

    const fechasCompletadas = registros
        .filter(r => r.estado === "COMPLETADO")
        .map(r => fechaISO(new Date(r.fecha)));

    const { racha_actual, racha_maxima } = calcularRacha(fechasCompletadas);

    return {
        id_habito: habito.id_habito,
        nombre: habito.nombre,
        cumplimiento,
        dias_registrados: total,
        racha_actual,
        racha_maxima
    };
};