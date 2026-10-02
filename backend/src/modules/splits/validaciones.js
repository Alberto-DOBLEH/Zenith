export const validarNombreSesion = (nombre) => {
    if (nombre === undefined || nombre === null || typeof nombre !== "string" || !nombre.trim()) {
        throw {
            status: 400,
            message: "nombre_sesion es obligatorio"
        };
    }

    const limpio = nombre.trim();

    if (limpio.length > 50) {
        throw {
            status: 400,
            message: "nombre_sesion no puede superar los 50 caracteres"
        };
    }

    return limpio;
};

export const validarDia = (dia) => {
    if (!/^\d+$/.test(String(dia ?? ""))) {
        throw {
            status: 400,
            message: "dia_asignado debe ser un número del 1 (lunes) al 7 (domingo)"
        };
    }

    const numero = Number(dia);

    if (numero < 1 || numero > 7) {
        throw {
            status: 400,
            message: "dia_asignado debe estar entre 1 (lunes) y 7 (domingo)"
        };
    }

    return numero;
};

// Normaliza la receta de una sesión: [{id_ejercicio, orden}]
// - devuelve null si no se envió (para no reemplazar)
// - valida ids numéricos, repetidos y ordens duplicados (el orden auto es i+1)
export const validarReceta = (ejercicios) => {
    if (ejercicios === undefined || ejercicios === null) {
        return null;
    }

    if (!Array.isArray(ejercicios)) {
        throw {
            status: 400,
            message: "ejercicios debe ser un arreglo"
        };
    }

    if (ejercicios.length > 50) {
        throw {
            status: 400,
            message: "una sesión no puede tener más de 50 ejercicios"
        };
    }

    const vistos = new Set();
    const ordens = new Set();

    return ejercicios.map((item, indice) => {
        if (!item || typeof item !== "object") {
            throw {
                status: 400,
                message: "cada ejercicio debe ser un objeto con id_ejercicio"
            };
        }

        if (!/^\d+$/.test(String(item.id_ejercicio ?? ""))) {
            throw {
                status: 400,
                message: "id_ejercicio debe ser un número"
            };
        }

        const id_ejercicio = Number(item.id_ejercicio);

        if (vistos.has(id_ejercicio)) {
            throw {
                status: 400,
                message: "un ejercicio no puede repetirse en la misma sesión"
            };
        }
        vistos.add(id_ejercicio);

        let orden = item.orden;
        if (orden !== undefined && orden !== null) {
            if (!/^\d+$/.test(String(orden)) || Number(orden) < 1) {
                throw {
                    status: 400,
                    message: "orden debe ser un entero mayor a 0"
                };
            }
            orden = Number(orden);
        } else {
            orden = indice + 1;
        }

        if (ordens.has(orden)) {
            throw {
                status: 400,
                message: "el orden se repite dentro de la sesión"
            };
        }
        ordens.add(orden);

        return { id_ejercicio, orden };
    });
};

// Valida las sesiones enviadas al crear un split
// (nombre, día único 1-7 y receta por sesión)
export const validarSesionesPayload = (sesiones) => {
    if (sesiones === undefined || sesiones === null) {
        return null;
    }

    if (!Array.isArray(sesiones)) {
        throw {
            status: 400,
            message: "sesiones debe ser un arreglo"
        };
    }

    if (sesiones.length > 7) {
        throw {
            status: 400,
            message: "un split no puede tener más de 7 sesiones"
        };
    }

    const dias = new Set();

    return sesiones.map((sesion) => {
        if (!sesion || typeof sesion !== "object") {
            throw {
                status: 400,
                message: "cada sesión debe ser un objeto"
            };
        }

        const nombre_sesion = validarNombreSesion(sesion.nombre_sesion);
        const dia_asignado = validarDia(sesion.dia_asignado);

        if (dias.has(dia_asignado)) {
            throw {
                status: 400,
                message: `el día ${dia_asignado} está repetido en sesiones`
            };
        }
        dias.add(dia_asignado);

        return {
            nombre_sesion,
            dia_asignado,
            ejercicios: validarReceta(sesion.ejercicios) || []
        };
    });
};

// Verifica que todos los id_ejercicio existan en el catálogo (404 si falta alguno)
export const verificarEjercicios = async (client, recetas) => {
    const ids = new Set();

    for (const receta of recetas) {
        for (const ejercicio of receta) {
            ids.add(ejercicio.id_ejercicio);
        }
    }

    if (ids.size === 0) {
        return;
    }

    const result = await client.query(
        "SELECT id_ejercicio FROM ejercicios WHERE id_ejercicio = ANY($1::int[])",
        [[...ids]]
    );

    const existentes = new Set(result.rows.map((r) => r.id_ejercicio));
    const faltantes = [...ids].filter((id) => !existentes.has(id));

    if (faltantes.length > 0) {
        throw {
            status: 404,
            message: `Ejercicio(s) no encontrado(s) en el catálogo: ${faltantes.join(", ")}`
        };
    }
};
