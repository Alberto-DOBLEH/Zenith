import db from "../../config/db.js";

const ESTADOS = ["PENDIENTE", "COMPLETADA"];

const validarTitulo = (titulo) => {
    if (!titulo || typeof titulo !== "string" || !titulo.trim()) {
        throw {
            status: 400,
            message: "titulo es obligatorio"
        };
    }

    const tituloLimpio = titulo.trim();

    if (tituloLimpio.length > 100) {
        throw {
            status: 400,
            message: "titulo no puede superar los 100 caracteres"
        };
    }

    return tituloLimpio;
};

const validarFecha = (fecha) => {
    if (!fecha || typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        throw {
            status: 400,
            message: "fecha_limite debe tener formato YYYY-MM-DD"
        };
    }

    const parsed = new Date(`${fecha}T00:00:00Z`);
    if (isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== fecha) {
        throw {
            status: 400,
            message: "fecha_limite no es una fecha valida"
        };
    }

    return fecha;
};

const validarDescripcion = (descripcion) => {
    if (descripcion === null) return null;
    if (descripcion === undefined) return null;
    if (typeof descripcion !== "string") {
        throw {
            status: 400,
            message: "descripcion debe ser texto"
        };
    }

    const limpia = descripcion.trim();

    if (limpia.length > 500) {
        throw {
            status: 400,
            message: "descripcion no puede superar los 500 caracteres"
        };
    }

    return limpia || null;
};

const validarAvisos = (avisos, fechaLimite) => {
    if (avisos === undefined || avisos === null) return [];
    if (!Array.isArray(avisos)) {
        throw {
            status: 400,
            message: "avisos debe ser un arreglo"
        };
    }

    const fechas = [];
    const fechaLimiteDate = new Date(`${fechaLimite}T00:00:00Z`);

    for (const aviso of avisos) {
        if (aviso === null || aviso === undefined || aviso === "") continue;
        if (typeof aviso !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(aviso)) {
            throw {
                status: 400,
                message: "avisos deben tener formato YYYY-MM-DD"
            };
        }
        const parsed = new Date(`${aviso}T00:00:00Z`);
        if (isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== aviso) {
            throw {
                status: 400,
                message: "avisos contienen una fecha no valida"
            };
        }
        if (parsed > fechaLimiteDate) {
            throw {
                status: 400,
                message: "los avisos no pueden ser posteriores a la fecha limite"
            };
        }
        fechas.push(aviso);
    }

    return [...new Set(fechas)].sort();
};

const SELECT_ACTIVIDAD = `
    id_actividad,
    titulo,
    descripcion,
    to_char(fecha_limite, 'YYYY-MM-DD') AS fecha_limite,
    estado,
    created_at
`;

const agregarAvisos = async (client, id_usuario, id_actividad, avisos) => {
    if (!Array.isArray(avisos) || avisos.length === 0) return;
    for (const fecha of avisos) {
        await client.query(
            `INSERT INTO actividades_recordatorios (id_actividad, id_usuario, fecha_recordatorio)
             VALUES ($1, $2, $3)
             ON CONFLICT (id_actividad, fecha_recordatorio) DO NOTHING`,
            [id_actividad, id_usuario, fecha]
        );
    }
};

const obtenerAvisosActividad = async (id_usuario, id_actividad) => {
    const result = await db.query(
        `SELECT to_char(fecha_recordatorio, 'YYYY-MM-DD') AS fecha
         FROM actividades_recordatorios
         WHERE id_actividad = $1 AND id_usuario = $2
         ORDER BY fecha_recordatorio ASC`,
        [id_actividad, id_usuario]
    );
    return result.rows.map(r => r.fecha);
};

export const obtenerActividades = async (id_usuario, filtros = {}) => {
    const { fecha, mes } = filtros;

    const condiciones = ["a.usuario = $1"];
    const parametros = [id_usuario];

    if (fecha) {
        parametros.push(validarFecha(fecha));
        condiciones.push(`a.fecha_limite = $${parametros.length}`);
    }

    if (mes) {
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) {
            throw {
                status: 400,
                message: "mes debe tener formato YYYY-MM"
            };
        }
        parametros.push(mes);
        condiciones.push(`to_char(a.fecha_limite, 'YYYY-MM') = $${parametros.length}`);
    }

    const result = await db.query(
        `SELECT ${SELECT_ACTIVIDAD},
                COALESCE(
                    (SELECT json_agg(to_char(ar.fecha_recordatorio, 'YYYY-MM-DD') ORDER BY ar.fecha_recordatorio)
                     FROM actividades_recordatorios ar
                     WHERE ar.id_actividad = a.id_actividad AND ar.id_usuario = $1),
                    '[]'::json
                ) AS avisos
        FROM actividades a
        WHERE ${condiciones.join(" AND ")}
        ORDER BY a.fecha_limite ASC, a.id_actividad ASC`,
        parametros
    );

    return result.rows;
};

export const crearActividad = async (id_usuario, datos) => {
    const { titulo, descripcion, fecha_limite, estado, avisos } = datos;

    const tituloLimpio = validarTitulo(titulo);
    const fecha = validarFecha(fecha_limite);
    const descripcionLimpia = validarDescripcion(descripcion);
    const avisosLimpios = validarAvisos(avisos, fecha);

    if (estado !== undefined && !ESTADOS.includes(estado)) {
        throw {
            status: 400,
            message: "estado debe ser PENDIENTE o COMPLETADA"
        };
    }

    const client = await db.connect();
    try {
        await client.query("BEGIN");

        const result = await client.query(
            `INSERT INTO actividades (usuario, titulo, descripcion, fecha_limite, estado)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING ${SELECT_ACTIVIDAD}`,
            [id_usuario, tituloLimpio, descripcionLimpia, fecha, estado || "PENDIENTE"]
        );

        const actividad = result.rows[0];
        await agregarAvisos(client, id_usuario, actividad.id_actividad, avisosLimpios);

        await client.query("COMMIT");

        actividad.avisos = avisosLimpios;
        return {
            message: "Actividad creada con exito",
            actividad
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const editarActividad = async (id_usuario, id_actividad, datos) => {
    const { titulo, descripcion, fecha_limite, estado, avisos } = datos;

    if (titulo === undefined && descripcion === undefined && fecha_limite === undefined && estado === undefined && avisos === undefined) {
        throw {
            status: 400,
            message: "Indica al menos titulo, descripcion, fecha_limite, estado o avisos"
        };
    }

    const result = await db.query(
        `SELECT ${SELECT_ACTIVIDAD}
        FROM actividades
        WHERE id_actividad = $1 AND usuario = $2`,
        [id_actividad, id_usuario]
    );

    if (result.rows.length === 0) {
        throw {
            status: 404,
            message: "Actividad no encontrada"
        };
    }

    const actual = result.rows[0];
    const tituloFinal = titulo === undefined ? actual.titulo : validarTitulo(titulo);
    const descripcionFinal = descripcion === undefined ? actual.descripcion : validarDescripcion(descripcion);
    const fechaFinal = fecha_limite === undefined ? actual.fecha_limite : validarFecha(fecha_limite);
    const estadoFinal = estado === undefined ? actual.estado : estado;

    if (!ESTADOS.includes(estadoFinal)) {
        throw {
            status: 400,
            message: "estado debe ser PENDIENTE o COMPLETADA"
        };
    }

    const avisosLimpios = avisos === undefined ? undefined : validarAvisos(avisos, fechaFinal);

    const client = await db.connect();
    try {
        await client.query("BEGIN");

        const actualizado = await client.query(
            `UPDATE actividades
            SET titulo = $1, descripcion = $2, fecha_limite = $3, estado = $4
            WHERE id_actividad = $5 AND usuario = $6
            RETURNING ${SELECT_ACTIVIDAD}`,
            [tituloFinal, descripcionFinal, fechaFinal, estadoFinal, id_actividad, id_usuario]
        );

        if (avisos !== undefined) {
            await client.query(
                "DELETE FROM actividades_recordatorios WHERE id_actividad = $1 AND id_usuario = $2",
                [id_actividad, id_usuario]
            );
            await agregarAvisos(client, id_usuario, id_actividad, avisosLimpios || []);
        }

        await client.query("COMMIT");

        const actividad = actualizado.rows[0];
        actividad.avisos = avisos === undefined ? await obtenerAvisosActividad(id_usuario, id_actividad) : (avisosLimpios || []);
        return {
            message: "Actividad modificada con exito",
            actividad
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const eliminarActividad = async (id_usuario, id_actividad) => {
    const result = await db.query(
        "DELETE FROM actividades WHERE id_actividad = $1 AND usuario = $2 RETURNING id_actividad",
        [id_actividad, id_usuario]
    );

    if (result.rows.length === 0) {
        throw {
            status: 404,
            message: "Actividad no encontrada"
        };
    }

    return { message: "Actividad eliminada con exito" };
};
