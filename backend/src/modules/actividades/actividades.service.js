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

const SELECT_ACTIVIDAD = `
    id_actividad,
    titulo,
    descripcion,
    to_char(fecha_limite, 'YYYY-MM-DD') AS fecha_limite,
    estado,
    created_at
`;

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
        `SELECT ${SELECT_ACTIVIDAD}
        FROM actividades a
        WHERE ${condiciones.join(" AND ")}
        ORDER BY a.fecha_limite ASC, a.id_actividad ASC`,
        parametros
    );

    return result.rows;
};

export const crearActividad = async (id_usuario, datos) => {
    const { titulo, descripcion, fecha_limite, estado } = datos;

    const tituloLimpio = validarTitulo(titulo);
    const fecha = validarFecha(fecha_limite);
    const descripcionLimpia = validarDescripcion(descripcion === undefined ? null : descripcion);

    if (estado !== undefined && !ESTADOS.includes(estado)) {
        throw {
            status: 400,
            message: "estado debe ser PENDIENTE o COMPLETADA"
        };
    }

    const result = await db.query(
        `INSERT INTO actividades (usuario, titulo, descripcion, fecha_limite, estado)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING ${SELECT_ACTIVIDAD}`,
        [id_usuario, tituloLimpio, descripcionLimpia, fecha, estado || "PENDIENTE"]
    );

    return {
        message: "Actividad creada con exito",
        actividad: result.rows[0]
    };
};

export const editarActividad = async (id_usuario, id_actividad, datos) => {
    const { titulo, descripcion, fecha_limite, estado } = datos;

    if (titulo === undefined && descripcion === undefined && fecha_limite === undefined && estado === undefined) {
        throw {
            status: 400,
            message: "Indica al menos titulo, descripcion, fecha_limite o estado"
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

    const actualizado = await db.query(
        `UPDATE actividades
        SET titulo = $1, descripcion = $2, fecha_limite = $3, estado = $4
        WHERE id_actividad = $5 AND usuario = $6
        RETURNING ${SELECT_ACTIVIDAD}`,
        [tituloFinal, descripcionFinal, fechaFinal, estadoFinal, id_actividad, id_usuario]
    );

    return {
        message: "Actividad modificada con exito",
        actividad: actualizado.rows[0]
    };
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
