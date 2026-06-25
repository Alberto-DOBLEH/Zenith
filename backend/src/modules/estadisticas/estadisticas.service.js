import db from "../../config/db.js";

const obtenerFechaInicioPorPeriodo = (periodo) => {
    const ahora = new Date();
    switch (periodo) {
        case "semana":
            ahora.setDate(ahora.getDate() - 7);
            break;
        case "mes":
            ahora.setMonth(ahora.getMonth() - 1);
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
        default:
            ahora.setMonth(ahora.getMonth() - 1); // por defecto: mes
    }
    return ahora.toISOString().split("T")[0];
};

const calcularRacha = (fechasCompletadas) => {
    if (fechasCompletadas.length === 0) return { racha_actual: 0, racha_maxima: 0 };

    const hoy = new Date().toISOString().split("T")[0];
    let rachaActual = 0;
    let rachaMaxima = 0;
    let rachaTemp = 0;
    let diaEsperado = new Date(hoy);

    // Racha actual
    for (let i = 0; i < fechasCompletadas.length; i++) {
        const esperada = new Date(diaEsperado);
        esperada.setDate(diaEsperado.getDate() - i);
        const esperadaStr = esperada.toISOString().split("T")[0];

        if (fechasCompletadas[i] === esperadaStr) {
            rachaActual++;
        } else {
            break;
        }
    }

    // Racha máxima
    for (let i = 0; i < fechasCompletadas.length; i++) {
        if (i === 0) {
            rachaTemp = 1;
        } else {
            const prev = new Date(fechasCompletadas[i - 1]);
            const curr = new Date(fechasCompletadas[i]);
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

    // Registros del período
    const registrosResult = await db.query(
        `SELECT rh.estado
        FROM registro_habitos rh
        INNER JOIN habitos h ON rh.habito = h.id_habito
        WHERE h.usuario = $1
            AND rh.fecha_programada >= $2`,
        [id_usuario, fechaInicio]
    );

    const registros = registrosResult.rows;
    const total = registros.length;
    const completados = registros.filter(r => r.estado?.trim() === "C").length;
    const noCompletados = total - completados;
    const cumplimiento = total > 0 ? Math.round((completados / total) * 100) : 0;

    // Fechas con al menos un hábito completado (para racha)
    const rachaResult = await db.query(
        `SELECT DISTINCT fecha_programada
        FROM registro_habitos rh
        INNER JOIN habitos h ON rh.habito = h.id_habito
        WHERE h.usuario = $1
            AND rh.estado = 'C'
        ORDER BY fecha_programada DESC`,
        [id_usuario]
    );

    const fechas = rachaResult.rows.map(r =>
        new Date(r.fecha_programada).toISOString().split("T")[0]
    );

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
        `SELECT estado, fecha_programada
        FROM registro_habitos
        WHERE habito = $1
        ORDER BY fecha_programada DESC`,
        [id_habito]
    );

    const registros = registrosResult.rows;
    const total = registros.length;
    const completados = registros.filter(r => r.estado?.trim() === "C").length;
    const cumplimiento = total > 0 ? Math.round((completados / total) * 100) : 0;

    const fechasCompletadas = registros
        .filter(r => r.estado?.trim() === "C")
        .map(r => new Date(r.fecha_programada).toISOString().split("T")[0]);

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
