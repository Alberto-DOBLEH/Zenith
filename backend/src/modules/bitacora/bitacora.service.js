import db from "../../config/db.js";

const fechaHoy = () => {
    const ahora = new Date();
    const offset = ahora.getTimezoneOffset();
    return new Date(ahora.getTime() - offset * 60000)
        .toISOString()
        .split("T")[0];
};

export const registrarProgreso = async (id_usuario, datos) => {
    const { habito, incremento, valor_realizado, estado } = datos;

    if (!habito) {
        throw {
            status: 400,
            message: "habito es obligatorio"
        };
    }

    // Verificar que el hábito pertenece al usuario y obtener tipo + meta
    const habitoResult = await db.query(
        `SELECT h.id_habito, h.meta, h.tipo_habito, t.nombre AS tipo_nombre
        FROM habitos h
        INNER JOIN tipos_habitos t ON h.tipo_habito = t.id_tipo_habito
        WHERE h.id_habito = $1 AND h.usuario = $2`,
        [habito, id_usuario]
    );

    if (habitoResult.rows.length === 0) {
        throw {
            status: 404,
            message: "Habito no encontrado"
        };
    }

    const { meta, tipo_nombre } = habitoResult.rows[0];
    const hoy = fechaHoy();

    // Obtener registro previo del día (para acumular en repeticiones)
    const previo = await db.query(
        "SELECT valor_realizado FROM registro_habitos WHERE habito = $1 AND fecha = $2",
        [habito, hoy]
    );
    const valorPrevio = previo.rows.length > 0 ? previo.rows[0].valor_realizado || 0 : 0;

    let nuevoValor = null;
    if (valor_realizado !== undefined && valor_realizado !== null) {
        nuevoValor = valor_realizado;
    } else if (incremento !== undefined && incremento !== null) {
        nuevoValor = parseFloat(valorPrevio) + parseFloat(incremento);
    }

    let nuevoEstado;

    switch (tipo_nombre) {
        case "Normal":
            nuevoEstado = estado === "NO_COMPLETADO" ? "NO_COMPLETADO" : "COMPLETADO";
            break;

        case "Repeticion": {
            if (nuevoValor === null) {
                throw {
                    status: 400,
                    message: "repeticion requiere incremento o valor_realizado"
                };
            }
            if (nuevoValor < 0) {
                throw {
                    status: 400,
                    message: "el valor de repeticiones no puede ser negativo"
                };
            }
            if (nuevoValor === 0) {
                nuevoEstado = "NO_COMPLETADO";
            } else if (meta !== null && nuevoValor >= meta) {
                nuevoEstado = "COMPLETADO";
            } else {
                nuevoEstado = "PARCIAL";
            }
            break;
        }

        case "Evitado":
            nuevoEstado = estado === "EVITADO" ? "EVITADO" : "RECAIDA";
            break;

        case "Tiempo":
            nuevoEstado = estado || "PARCIAL";
            break;

        default:
            throw {
                status: 400,
                message: "Tipo de habito no soportado"
            };
    }

    const estadosValidos = ["COMPLETADO", "PARCIAL", "NO_COMPLETADO", "EVITADO", "RECAIDA"];
    if (!estadosValidos.includes(nuevoEstado)) {
        throw {
            status: 400,
            message: "estado invalido"
        };
    }

    await db.query(
        `INSERT INTO registro_habitos (habito, fecha, estado, valor_realizado, fecha_inicio, fecha_completado)
        VALUES ($1, $2, $3::public.estado_registro_habito, $4,
            CASE WHEN $5 THEN CURRENT_TIMESTAMP ELSE NULL END,
            CASE WHEN $3::text = 'COMPLETADO' THEN CURRENT_TIMESTAMP ELSE NULL END)
        ON CONFLICT (habito, fecha) DO UPDATE SET
            estado = EXCLUDED.estado,
            valor_realizado = EXCLUDED.valor_realizado,
            fecha_completado = CASE
                WHEN EXCLUDED.estado = 'COMPLETADO'
                    THEN COALESCE(registro_habitos.fecha_completado, CURRENT_TIMESTAMP)
                ELSE NULL
            END`,
        [habito, hoy, nuevoEstado, nuevoValor, nuevoEstado === "PARCIAL"]
    );

    return { message: "registro guardado con exito", estado: nuevoEstado, valor_realizado: nuevoValor };
};

const fechaISO = (fecha) => {
    const offset = fecha.getTimezoneOffset();
    return new Date(fecha.getTime() - offset * 60000).toISOString().split("T")[0];
};

const obtenerRangoFechas = (periodo) => {
    const hoy = new Date();

    switch (periodo) {
        case "dia":
            return fechaISO(hoy);
        case "semana":
            return fechaISO(new Date(hoy.getTime() - 7 * 86400000));
        case "mes":
            return fechaISO(addMeses(hoy, -1));
        case "trimestre":
            return fechaISO(addMeses(hoy, -3));
        case "semestre":
            return fechaISO(addMeses(hoy, -6));
        case "anual":
            return fechaISO(addMeses(hoy, -12));
        default:
            throw {
                status: 400,
                message: "periodo no valido. Use: dia, semana, mes, trimestre, semestre, anual"
            };
    }
};

const addMeses = (fecha, cantidad) => {
    const nueva = new Date(fecha);
    nueva.setMonth(nueva.getMonth() + cantidad);
    return nueva;
};

export const obtenerRegistrosPorPeriodo = async (id_usuario, periodo) => {
    if (!periodo) {
        throw {
            status: 400,
            message: "El parametro periodo es obligatorio"
        };
    }

    const fechaInicio = obtenerRangoFechas(periodo);
    const hoy = fechaHoy();

    const result = await db.query(
        `SELECT
            rh.id_registro_habito,
            h.id_habito,
            h.nombre AS habito,
            rh.fecha,
            rh.valor_realizado,
            h.meta,
            rh.estado
        FROM registro_habitos rh
        INNER JOIN habitos h ON rh.habito = h.id_habito
        WHERE h.usuario = $1
            AND rh.fecha >= $2
            AND rh.fecha <= $3
        ORDER BY rh.fecha DESC`,
        [id_usuario, fechaInicio, hoy]
    );

    return result.rows;
};