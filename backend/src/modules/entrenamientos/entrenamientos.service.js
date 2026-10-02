import db from "../../config/db.js";
import { fechaHoySQL, fechaEnZonaSQL, mesEnZonaSQL } from "../../config/fecha.js";

const fechaYDiaHoy = async (timezone) => {
    const result = await db.query(
        `SELECT to_char(${fechaHoySQL(timezone)}, 'YYYY-MM-DD') AS fecha,
            ((EXTRACT(DOW FROM ${fechaHoySQL(timezone)})::int + 6) % 7) + 1 AS dia_semana`
    );

    return {
        fecha: result.rows[0].fecha,
        dia_semana: Number(result.rows[0].dia_semana)
    };
};

// PR por ejercicio: peso máximo normalizado a kg (lbs × 0.45359237),
// desempate por más repeticiones. Devuelve el peso con la unidad en que se logró.
const consultarPRs = (id_usuario, ids, timezone) => db.query(
    `SELECT DISTINCT ON (s.id_ejercicio)
        s.id_ejercicio,
        s.peso,
        s.unidad_peso,
        s.repeticiones,
        to_char(${fechaEnZonaSQL("h.fecha_inicio", timezone)}, 'YYYY-MM-DD') AS fecha
    FROM series_historial s
    JOIN entrenamientos_historial h ON h.id_entrenamiento = s.id_entrenamiento
    WHERE h.id_usuario = $1 AND s.id_ejercicio = ANY($2::int[])
    ORDER BY s.id_ejercicio,
        (CASE WHEN s.unidad_peso = 'lbs' THEN s.peso * 0.45359237 ELSE s.peso END) DESC,
        s.repeticiones DESC`,
    [id_usuario, ids]
);

// Última vez que se registró cada ejercicio (excluye el entrenamiento en curso)
const consultarUltimasVeces = (id_usuario, ids, id_excluir, timezone) => {
    const parametros = [id_usuario, ids];
    let exclusion = "";

    if (id_excluir) {
        parametros.push(id_excluir);
        exclusion = `AND h.id_entrenamiento <> $${parametros.length}`;
    }

    return db.query(
        `SELECT DISTINCT ON (s.id_ejercicio)
            s.id_ejercicio,
            h.id_entrenamiento,
            to_char(${fechaEnZonaSQL("h.fecha_inicio", timezone)}, 'YYYY-MM-DD') AS fecha
        FROM series_historial s
        JOIN entrenamientos_historial h ON h.id_entrenamiento = s.id_entrenamiento
        WHERE h.id_usuario = $1 AND s.id_ejercicio = ANY($2::int[]) ${exclusion}
        ORDER BY s.id_ejercicio, h.fecha_inicio DESC`,
        parametros
    );
};

const montarEjercicios = async (id_usuario, id_sesion_plan, id_excluir, timezone) => {
    const plantilla = await db.query(
        `SELECT e.id_ejercicio, e.nombre, e.grupo_muscular, eps.orden
        FROM ejercicios_por_sesion eps
        JOIN ejercicios e ON e.id_ejercicio = eps.id_ejercicio
        WHERE eps.id_sesion_plan = $1
        ORDER BY eps.orden, e.nombre`,
        [id_sesion_plan]
    );

    const ejercicios = plantilla.rows;

    if (ejercicios.length === 0) {
        return [];
    }

    const ids = ejercicios.map((e) => e.id_ejercicio);

    const prs = await consultarPRs(id_usuario, ids, timezone);
    const mapaPR = new Map(prs.rows.map((r) => [
        r.id_ejercicio,
        {
            peso: Number(r.peso),
            unidad_peso: r.unidad_peso,
            repeticiones: Number(r.repeticiones),
            fecha: r.fecha
        }
    ]));

    const ultimas = await consultarUltimasVeces(id_usuario, ids, id_excluir, timezone);
    const mapaUltima = new Map(ultimas.rows.map((r) => [r.id_ejercicio, r]));

    const series = new Map();

    if (ultimas.rows.length > 0) {
        const seriesResult = await db.query(
            `SELECT s.id_ejercicio, s.numero_serie, s.repeticiones, s.peso, s.unidad_peso
            FROM series_historial s
            WHERE (s.id_entrenamiento, s.id_ejercicio) IN (
                SELECT * FROM unnest($1::int[], $2::int[])
            )
            ORDER BY s.id_ejercicio, s.numero_serie`,
            [
                ultimas.rows.map((r) => r.id_entrenamiento),
                ultimas.rows.map((r) => r.id_ejercicio)
            ]
        );

        for (const fila of seriesResult.rows) {
            if (!series.has(fila.id_ejercicio)) {
                series.set(fila.id_ejercicio, []);
            }
            series.get(fila.id_ejercicio).push({
                numero_serie: fila.numero_serie,
                repeticiones: Number(fila.repeticiones),
                peso: Number(fila.peso),
                unidad_peso: fila.unidad_peso
            });
        }
    }

    for (const [id_ejercicio, referencia] of mapaUltima) {
        mapaUltima.set(id_ejercicio, {
            fecha: referencia.fecha,
            series: series.get(id_ejercicio) || []
        });
    }

    return ejercicios.map((ejercicio) => ({
        id_ejercicio: ejercicio.id_ejercicio,
        nombre: ejercicio.nombre,
        grupo_muscular: ejercicio.grupo_muscular,
        orden: Number(ejercicio.orden),
        pr: mapaPR.get(ejercicio.id_ejercicio) || null,
        ultima_vez: mapaUltima.get(ejercicio.id_ejercicio) || null
    }));
};

export const obtenerHoy = async (id_usuario, timezone) => {
    const { fecha, dia_semana } = await fechaYDiaHoy(timezone);

    const activo = await db.query(
        `SELECT h.id_entrenamiento, h.id_sesion_plan, sp.nombre_sesion, sp.dia_asignado,
            h.fecha_inicio, h.fecha_fin
        FROM entrenamientos_historial h
        JOIN sesiones_plan sp ON sp.id_sesion_plan = h.id_sesion_plan
        WHERE h.id_usuario = $1 AND h.fecha_fin IS NULL
        ORDER BY h.fecha_inicio DESC
        LIMIT 1`,
        [id_usuario]
    );

    const entrenamiento_activo = activo.rows[0] || null;

    const splitResult = await db.query(
        "SELECT id_split, nombre FROM splits WHERE id_usuario = $1 AND es_activo",
        [id_usuario]
    );

    const split = splitResult.rows[0] || null;

    let sesion = null;
    let ejercicios = [];

    if (split) {
        const sesionResult = await db.query(
            "SELECT id_sesion_plan, nombre_sesion, dia_asignado FROM sesiones_plan WHERE id_split = $1 AND dia_asignado = $2",
            [split.id_split, dia_semana]
        );

        sesion = sesionResult.rows[0] || null;

        if (sesion) {
            ejercicios = await montarEjercicios(
                id_usuario,
                sesion.id_sesion_plan,
                entrenamiento_activo ? entrenamiento_activo.id_entrenamiento : null,
                timezone
            );
        }
    }

    return {
        fecha,
        dia_semana,
        split,
        sesion,
        entrenamiento_activo,
        ejercicios
    };
};

export const iniciarEntrenamiento = async (id_usuario, datos, timezone) => {
    const { id_sesion_plan } = datos;
    let idSesion;

    if (id_sesion_plan !== undefined && id_sesion_plan !== null) {
        if (!/^\d+$/.test(String(id_sesion_plan))) {
            throw {
                status: 400,
                message: "id_sesion_plan debe ser un número"
            };
        }

        const sesion = await db.query(
            `SELECT sp.id_sesion_plan
            FROM sesiones_plan sp
            JOIN splits s ON s.id_split = sp.id_split
            WHERE sp.id_sesion_plan = $1 AND s.id_usuario = $2`,
            [id_sesion_plan, id_usuario]
        );

        if (sesion.rows.length === 0) {
            throw {
                status: 404,
                message: "Sesión no encontrada"
            };
        }

        idSesion = Number(id_sesion_plan);
    } else {
        const { dia_semana } = await fechaYDiaHoy(timezone);

        const split = await db.query(
            "SELECT id_split FROM splits WHERE id_usuario = $1 AND es_activo",
            [id_usuario]
        );

        if (split.rows.length === 0) {
            throw {
                status: 400,
                message: "No tienes un split activo. Activa uno para poder entrenar"
            };
        }

        const sesion = await db.query(
            "SELECT id_sesion_plan FROM sesiones_plan WHERE id_split = $1 AND dia_asignado = $2",
            [split.rows[0].id_split, dia_semana]
        );

        if (sesion.rows.length === 0) {
            throw {
                status: 400,
                message: "Hoy no hay sesión asignada en tu split activo (día de descanso)"
            };
        }

        idSesion = sesion.rows[0].id_sesion_plan;
    }

    const activo = await db.query(
        "SELECT id_entrenamiento FROM entrenamientos_historial WHERE id_usuario = $1 AND fecha_fin IS NULL LIMIT 1",
        [id_usuario]
    );

    if (activo.rows.length > 0) {
        throw {
            status: 409,
            message: "Ya hay un entrenamiento en curso. Finalízalo antes de iniciar otro"
        };
    }

    try {
        const result = await db.query(
            `INSERT INTO entrenamientos_historial (id_usuario, id_sesion_plan)
            VALUES ($1, $2)
            RETURNING id_entrenamiento, id_sesion_plan, fecha_inicio, fecha_fin`,
            [id_usuario, idSesion]
        );

        const detalle = await db.query(
            `SELECT h.id_entrenamiento, h.id_sesion_plan, sp.nombre_sesion, h.fecha_inicio, h.fecha_fin
            FROM entrenamientos_historial h
            JOIN sesiones_plan sp ON sp.id_sesion_plan = h.id_sesion_plan
            WHERE h.id_entrenamiento = $1`,
            [result.rows[0].id_entrenamiento]
        );

        return {
            message: "Entrenamiento iniciado",
            entrenamiento: detalle.rows[0]
        };
    } catch (error) {
        if (error.code === "23505") {
            throw {
                status: 409,
                message: "Ya hay un entrenamiento en curso. Finalízalo antes de iniciar otro"
            };
        }
        throw error;
    }
};

export const obtenerEntrenamientoPropio = async (id_usuario, id_entrenamiento) => {
    const result = await db.query(
        `SELECT h.id_entrenamiento, h.id_sesion_plan, sp.nombre_sesion,
            sp.id_split, s.nombre AS nombre_split,
            h.fecha_inicio, h.fecha_fin
        FROM entrenamientos_historial h
        JOIN sesiones_plan sp ON sp.id_sesion_plan = h.id_sesion_plan
        JOIN splits s ON s.id_split = sp.id_split
        WHERE h.id_entrenamiento = $1 AND h.id_usuario = $2`,
        [id_entrenamiento, id_usuario]
    );

    if (result.rows.length === 0) {
        throw {
            status: 404,
            message: "Entrenamiento no encontrado"
        };
    }

    return result.rows[0];
};

const duracionMinutos = (entrenamiento) => {
    if (!entrenamiento.fecha_fin) {
        return null;
    }
    const inicio = new Date(entrenamiento.fecha_inicio).getTime();
    const fin = new Date(entrenamiento.fecha_fin).getTime();
    return Math.round((fin - inicio) / 60000);
};

export const obtenerEntrenamientos = async (id_usuario, filtros, timezone) => {
    const { fecha, mes } = filtros;

    const condiciones = ["h.id_usuario = $1"];
    const parametros = [id_usuario];

    if (fecha) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
            throw {
                status: 400,
                message: "fecha debe tener formato YYYY-MM-DD"
            };
        }
        parametros.push(fecha);
        condiciones.push(`${fechaEnZonaSQL("h.fecha_inicio", timezone)} = $${parametros.length}::date`);
    }

    if (mes) {
        if (!/^\d{4}-\d{2}$/.test(mes)) {
            throw {
                status: 400,
                message: "mes debe tener formato YYYY-MM"
            };
        }
        parametros.push(mes);
        condiciones.push(`${mesEnZonaSQL("h.fecha_inicio", timezone)} = $${parametros.length}`);
    }

    const result = await db.query(
        `SELECT h.id_entrenamiento, h.id_sesion_plan, sp.nombre_sesion,
            sp.id_split, s.nombre AS nombre_split,
            h.fecha_inicio, h.fecha_fin,
            (SELECT COUNT(DISTINCT se.id_ejercicio)::int
                FROM series_historial se WHERE se.id_entrenamiento = h.id_entrenamiento) AS ejercicios,
            (SELECT COUNT(*)::int
                FROM series_historial se WHERE se.id_entrenamiento = h.id_entrenamiento) AS series
        FROM entrenamientos_historial h
        JOIN sesiones_plan sp ON sp.id_sesion_plan = h.id_sesion_plan
        JOIN splits s ON s.id_split = sp.id_split
        WHERE ${condiciones.join(" AND ")}
        ORDER BY h.fecha_inicio DESC`,
        parametros
    );

    return result.rows.map((fila) => ({
        ...fila,
        duracion_minutos: duracionMinutos(fila)
    }));
};

export const obtenerEntrenamiento = async (id_usuario, id_entrenamiento) => {
    const base = await obtenerEntrenamientoPropio(id_usuario, id_entrenamiento);

    const series = await db.query(
        `SELECT se.id_serie, se.id_ejercicio, se.numero_serie, se.repeticiones, se.peso, se.unidad_peso,
            e.nombre, e.grupo_muscular, eps.orden
        FROM series_historial se
        JOIN ejercicios e ON e.id_ejercicio = se.id_ejercicio
        JOIN entrenamientos_historial h ON h.id_entrenamiento = se.id_entrenamiento
        LEFT JOIN ejercicios_por_sesion eps
            ON eps.id_sesion_plan = h.id_sesion_plan AND eps.id_ejercicio = se.id_ejercicio
        WHERE se.id_entrenamiento = $1
        ORDER BY COALESCE(eps.orden, 99999), e.nombre, se.numero_serie`,
        [id_entrenamiento]
    );

    const ejercicios = [];

    for (const fila of series.rows) {
        let actual = ejercicios.find((e) => e.id_ejercicio === fila.id_ejercicio);

        if (!actual) {
            actual = {
                id_ejercicio: fila.id_ejercicio,
                nombre: fila.nombre,
                grupo_muscular: fila.grupo_muscular,
                orden: fila.orden === null ? null : Number(fila.orden),
                series: []
            };
            ejercicios.push(actual);
        }

        actual.series.push({
            id_serie: fila.id_serie,
            numero_serie: fila.numero_serie,
            repeticiones: Number(fila.repeticiones),
            peso: Number(fila.peso),
            unidad_peso: fila.unidad_peso
        });
    }

    return {
        ...base,
        duracion_minutos: duracionMinutos(base),
        ejercicios
    };
};

export const finalizarEntrenamiento = async (id_usuario, id_entrenamiento) => {
    const entrenamiento = await obtenerEntrenamientoPropio(id_usuario, id_entrenamiento);

    if (entrenamiento.fecha_fin) {
        throw {
            status: 409,
            message: "El entrenamiento ya fue finalizado"
        };
    }

    const result = await db.query(
        `UPDATE entrenamientos_historial
        SET fecha_fin = now()
        WHERE id_entrenamiento = $1 AND id_usuario = $2
        RETURNING fecha_inicio, fecha_fin`,
        [id_entrenamiento, id_usuario]
    );

    const actualizado = result.rows[0];

    return {
        message: "Entrenamiento finalizado",
        entrenamiento: {
            id_entrenamiento: Number(id_entrenamiento),
            fecha_inicio: actualizado.fecha_inicio,
            fecha_fin: actualizado.fecha_fin,
            duracion_minutos: duracionMinutos(actualizado)
        }
    };
};

export const eliminarEntrenamiento = async (id_usuario, id_entrenamiento) => {
    const result = await db.query(
        "DELETE FROM entrenamientos_historial WHERE id_entrenamiento = $1 AND id_usuario = $2 RETURNING id_entrenamiento",
        [id_entrenamiento, id_usuario]
    );

    if (result.rows.length === 0) {
        throw {
            status: 404,
            message: "Entrenamiento no encontrado"
        };
    }

    return { message: "Entrenamiento eliminado con exito" };
};
