import db from "../../config/db.js";
import { fechaHoySQL, fechaInicioSQL } from "../../config/fecha.js";

const fechaLocal = (fecha) => {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, "0");
    const d = String(fecha.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

const filtroFrecuencia = (alias, fechaExpr) => `
    (
        ${alias}.frecuencia = 'DIARIO'
        OR (${alias}.frecuencia = 'SEMANAL' AND EXISTS (
            SELECT 1 FROM habito_dias hd
            WHERE hd.habito = ${alias}.id_habito
                AND hd.dia = CASE EXTRACT(DOW FROM ${fechaExpr})
                    WHEN 0 THEN 'DOMINGO'::dia_semana
                    WHEN 1 THEN 'LUNES'::dia_semana
                    WHEN 2 THEN 'MARTES'::dia_semana
                    WHEN 3 THEN 'MIERCOLES'::dia_semana
                    WHEN 4 THEN 'JUEVES'::dia_semana
                    WHEN 5 THEN 'VIERNES'::dia_semana
                    WHEN 6 THEN 'SABADO'::dia_semana
                END
        ))
        OR (${alias}.frecuencia = 'MENSUAL' AND EXTRACT(DAY FROM ${fechaExpr}) = ${alias}.dia_del_mes)
    )
`;

const diasPorPeriodo = (periodo) => {
    switch (periodo) {
        case "semana": return 7;
        case "trimestre": return 90;
        case "semestre": return 180;
        case "anual": return 365;
        case "mes":
        default: return 30;
    }
};

const calcularRacha = (fechasCompletadas, hoy) => {
    if (fechasCompletadas.length === 0) return { racha_actual: 0, racha_maxima: 0 };

    const set = new Set(fechasCompletadas);

    let rachaActual = 0;
    let cursor = new Date(hoy + "T00:00:00");
    while (set.has(fechaLocal(cursor))) {
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

export const obtenerEstadisticasGenerales = async (id_usuario, periodo, timezone) => {
    const dias = diasPorPeriodo(periodo);
    const fechaInicio = fechaInicioSQL(timezone, dias);
    const hoy = fechaHoySQL(timezone);

    const hoyStr = (await db.query(`SELECT ${hoy}::text AS hoy`)).rows[0].hoy;

    // Generar cuadrícula de hábitos programados × fechas del período,
    // LEFT JOIN con registros reales para que los no marcados cuenten como no completados
    const registrosResult = await db.query(
        `WITH fechas AS (
            SELECT generate_series(${fechaInicio}, ${hoy}, '1 day'::interval)::date AS fecha
        ),
        habitos_programados AS (
            SELECT h.id_habito, f.fecha
            FROM habitos h
            CROSS JOIN fechas f
            WHERE h.usuario = $1
                AND h.estado = 'ACTIVO'
                AND h.tipo_habito <> 4
                AND ${filtroFrecuencia("h", "f.fecha")}
        )
        SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE rh.estado = 'COMPLETADO') AS completados
        FROM habitos_programados hp
        LEFT JOIN registro_habitos rh
            ON rh.habito = hp.id_habito AND rh.fecha = hp.fecha`,
        [id_usuario]
    );

    const { total, completados } = registrosResult.rows[0];
    const totalNum = parseInt(total, 10);
    const completadosNum = parseInt(completados, 10);
    const noCompletados = totalNum - completadosNum;
    const cumplimiento = totalNum > 0 ? Math.round((completadosNum / totalNum) * 100) : 0;

    // Fechas con todos los hábitos programados completados, para racha general
    const rachaResult = await db.query(
        `SELECT DISTINCT rh.fecha
        FROM registro_habitos rh
        INNER JOIN habitos h ON rh.habito = h.id_habito
        WHERE h.usuario = $1
            AND h.tipo_habito <> 4
            AND rh.estado = 'COMPLETADO'
            AND ${filtroFrecuencia("h", "rh.fecha::date")}
        GROUP BY rh.fecha
        HAVING COUNT(DISTINCT rh.habito) = (
            SELECT COUNT(*) FROM habitos h2
            WHERE h2.usuario = $1 AND h2.estado = 'ACTIVO' AND h2.tipo_habito <> 4
                AND ${filtroFrecuencia("h2", "rh.fecha::date")}
        )
        ORDER BY rh.fecha DESC`,
        [id_usuario]
    );

    const fechas = rachaResult.rows.map(r => fechaLocal(new Date(r.fecha)));

    const { racha_actual, racha_maxima } = calcularRacha(fechas, hoyStr);

    return {
        cumplimiento,
        completados,
        no_completados: noCompletados,
        racha_actual,
        racha_maxima
    };
};

export const obtenerEstadisticasHabito = async (id_usuario, id_habito) => {
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
        .map(r => fechaLocal(new Date(r.fecha)));

    const hoy = fechaLocal(new Date());
    const { racha_actual, racha_maxima } = calcularRacha(fechasCompletadas, hoy);

    return {
        id_habito: habito.id_habito,
        nombre: habito.nombre,
        cumplimiento,
        dias_registrados: total,
        racha_actual,
        racha_maxima
    };
};
