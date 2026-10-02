import db from "../../config/db.js";
import { obtenerEntrenamientoPropio } from "../entrenamientos/entrenamientos.service.js";

const UNIDADES_PESO = ["kg", "lbs"];
const LIMITE_PESO = 99999.99;

const aEntero = (valor, campo, min = 1) => {
    if (!/^\d+$/.test(String(valor ?? ""))) {
        throw {
            status: 400,
            message: `${campo} debe ser un número entero`
        };
    }

    const numero = Number(valor);

    if (numero < min) {
        throw {
            status: 400,
            message: `${campo} debe ser mayor o igual a ${min}`
        };
    }

    return numero;
};

const aPeso = (valor, campo) => {
    if (valor === undefined || valor === null || String(valor).trim() === "") {
        throw {
            status: 400,
            message: `${campo} es obligatorio`
        };
    }

    const numero = Number(valor);

    if (!Number.isFinite(numero) || numero <= 0 || numero > LIMITE_PESO) {
        throw {
            status: 400,
            message: `${campo} debe ser un número mayor a 0`
        };
    }

    return numero;
};

const aUnidad = (unidad) => {
    if (!UNIDADES_PESO.includes(unidad)) {
        throw {
            status: 400,
            message: "unidad_peso debe ser kg o lbs"
        };
    }
    return unidad;
};

const aSerie = (fila) => ({
    id_serie: fila.id_serie,
    id_ejercicio: fila.id_ejercicio,
    numero_serie: fila.numero_serie,
    repeticiones: Number(fila.repeticiones),
    peso: Number(fila.peso),
    unidad_peso: fila.unidad_peso
});

export const crearSerie = async (id_usuario, id_entrenamiento, datos) => {
    await obtenerEntrenamientoPropio(id_usuario, id_entrenamiento);

    const id_ejercicio = aEntero(datos.id_ejercicio, "id_ejercicio");
    const numero_serie = aEntero(datos.numero_serie, "numero_serie");
    const repeticiones = aEntero(datos.repeticiones, "repeticiones");
    const peso = aPeso(datos.peso, "peso");
    const unidad_peso = aUnidad(datos.unidad_peso);

    const ejercicio = await db.query(
        "SELECT 1 FROM ejercicios WHERE id_ejercicio = $1",
        [id_ejercicio]
    );

    if (ejercicio.rows.length === 0) {
        throw {
            status: 404,
            message: "Ejercicio no encontrado"
        };
    }

    try {
        const result = await db.query(
            `INSERT INTO series_historial (id_entrenamiento, id_ejercicio, numero_serie, repeticiones, peso, unidad_peso)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id_serie, id_ejercicio, numero_serie, repeticiones, peso, unidad_peso`,
            [id_entrenamiento, id_ejercicio, numero_serie, repeticiones, peso, unidad_peso]
        );

        return {
            message: "Serie registrada con exito",
            serie: aSerie(result.rows[0])
        };
    } catch (error) {
        if (error.code === "23505") {
            throw {
                status: 409,
                message: `Ya existe la serie ${numero_serie} de ese ejercicio en este entrenamiento`
            };
        }
        throw error;
    }
};

export const editarSerie = async (id_usuario, id_serie, datos) => {
    const result = await db.query(
        `SELECT s.id_serie, s.id_entrenamiento, s.numero_serie, s.repeticiones, s.peso, s.unidad_peso
        FROM series_historial s
        JOIN entrenamientos_historial h ON h.id_entrenamiento = s.id_entrenamiento
        WHERE s.id_serie = $1 AND h.id_usuario = $2`,
        [id_serie, id_usuario]
    );

    if (result.rows.length === 0) {
        throw {
            status: 404,
            message: "Serie no encontrada"
        };
    }

    const { repeticiones, peso, unidad_peso } = datos;

    if (repeticiones === undefined && peso === undefined && unidad_peso === undefined) {
        throw {
            status: 400,
            message: "Indica al menos repeticiones, peso o unidad_peso"
        };
    }

    if ((peso === undefined) !== (unidad_peso === undefined)) {
        throw {
            status: 400,
            message: "peso y unidad_peso deben enviarse juntos"
        };
    }

    const repeticionesFinal = repeticiones === undefined ? null : aEntero(repeticiones, "repeticiones");
    const pesoFinal = peso === undefined ? null : aPeso(peso, "peso");
    const unidadFinal = unidad_peso === undefined ? null : aUnidad(unidad_peso);

    await db.query(
        `UPDATE series_historial
        SET repeticiones = COALESCE($1, repeticiones),
            peso = COALESCE($2, peso),
            unidad_peso = COALESCE($3, unidad_peso)
        WHERE id_serie = $4`,
        [repeticionesFinal, pesoFinal, unidadFinal, id_serie]
    );

    return { message: "Serie modificada con exito" };
};

export const eliminarSerie = async (id_usuario, id_serie) => {
    const result = await db.query(
        `DELETE FROM series_historial s
        USING entrenamientos_historial h
        WHERE s.id_entrenamiento = h.id_entrenamiento
            AND s.id_serie = $1
            AND h.id_usuario = $2
        RETURNING s.id_serie`,
        [id_serie, id_usuario]
    );

    if (result.rows.length === 0) {
        throw {
            status: 404,
            message: "Serie no encontrada"
        };
    }

    return { message: "Serie eliminada con exito" };
};
