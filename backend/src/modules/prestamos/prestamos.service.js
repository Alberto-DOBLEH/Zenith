import db from "../../config/db.js";

const TIPOS = ["ME_PRESTAN", "PRESTO"];
const ESTADOS = ["ACTIVO", "LIQUIDADO"];

const validarPersona = (persona) => {
    if (!persona || typeof persona !== "string" || !persona.trim()) {
        throw { status: 400, message: "persona es obligatoria" };
    }
    const limpia = persona.trim();
    if (limpia.length > 100) {
        throw { status: 400, message: "persona no puede superar los 100 caracteres" };
    }
    return limpia;
};

const validarConcepto = (concepto) => {
    if (concepto === null || concepto === undefined || concepto === "") return null;
    if (typeof concepto !== "string") {
        throw { status: 400, message: "concepto debe ser texto" };
    }
    const limpia = concepto.trim();
    if (limpia.length > 150) {
        throw { status: 400, message: "concepto no puede superar los 150 caracteres" };
    }
    return limpia || null;
};

const validarMonto = (monto) => {
    const numero = Number(monto);
    if (isNaN(numero) || numero <= 0) {
        throw { status: 400, message: "monto debe ser mayor a 0" };
    }
    return numero.toFixed(2);
};

const validarFecha = (fecha) => {
    if (!fecha || typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        throw { status: 400, message: "fecha debe tener formato YYYY-MM-DD" };
    }
    const parsed = new Date(`${fecha}T00:00:00Z`);
    if (isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== fecha) {
        throw { status: 400, message: "fecha no es valida" };
    }
    return fecha;
};

const validarMetodoPertenece = async (client, id_usuario, id_metodo_pago) => {
    const result = await client.query(
        "SELECT id_metodo FROM metodos_pago WHERE id_metodo = $1 AND id_usuario = $2",
        [id_metodo_pago, id_usuario]
    );
    if (result.rows.length === 0) {
        throw { status: 404, message: "Método de pago no encontrado" };
    }
};

const SELECT_PRESTAMO = `
    p.id_prestamo,
    p.tipo,
    p.persona,
    p.concepto,
    p.monto_total,
    p.saldo_pendiente,
    to_char(p.fecha, 'YYYY-MM-DD') AS fecha,
    p.estado,
    p.id_metodo_pago,
    mp.nombre AS metodo_nombre,
    mp.tipo AS metodo_tipo
`;

export const obtenerPrestamos = async (id_usuario, filtros = {}) => {
    const { tipo, estado } = filtros;
    const condiciones = ["p.id_usuario = $1"];
    const parametros = [id_usuario];

    if (tipo) {
        if (!TIPOS.includes(tipo)) {
            throw { status: 400, message: "tipo debe ser ME_PRESTAN o PRESTO" };
        }
        parametros.push(tipo);
        condiciones.push(`p.tipo = $${parametros.length}`);
    }
    if (estado) {
        if (!ESTADOS.includes(estado)) {
            throw { status: 400, message: "estado debe ser ACTIVO o LIQUIDADO" };
        }
        parametros.push(estado);
        condiciones.push(`p.estado = $${parametros.length}`);
    }

    const result = await db.query(
        `SELECT ${SELECT_PRESTAMO}
         FROM prestamos p
         JOIN metodos_pago mp ON mp.id_metodo = p.id_metodo_pago
         WHERE ${condiciones.join(" AND ")}
         ORDER BY p.fecha DESC, p.id_prestamo DESC`,
        parametros
    );
    return result.rows;
};

export const obtenerPrestamo = async (id_usuario, id_prestamo) => {
    const result = await db.query(
        `SELECT ${SELECT_PRESTAMO}
         FROM prestamos p
         JOIN metodos_pago mp ON mp.id_metodo = p.id_metodo_pago
         WHERE p.id_prestamo = $1 AND p.id_usuario = $2`,
        [id_prestamo, id_usuario]
    );
    if (result.rows.length === 0) {
        throw { status: 404, message: "Préstamo no encontrado" };
    }
    return result.rows[0];
};

export const crearPrestamo = async (id_usuario, datos) => {
    const { tipo, persona, concepto, monto_total, fecha, id_metodo_pago } = datos;

    if (!TIPOS.includes(tipo)) {
        throw { status: 400, message: "tipo debe ser ME_PRESTAN o PRESTO" };
    }

    const personaLimpia = validarPersona(persona);
    const conceptoLimpio = tipo === "ME_PRESTAN" ? validarConcepto(concepto) : null;
    const monto = validarMonto(monto_total);
    const fechaValida = validarFecha(fecha);
    const idMetodo = Number(id_metodo_pago);
    if (isNaN(idMetodo)) {
        throw { status: 400, message: "id_metodo_pago es obligatorio" };
    }

    const client = await db.connect();
    try {
        await client.query("BEGIN");
        await validarMetodoPertenece(client, id_usuario, idMetodo);

        const prestamoRes = await client.query(
            `INSERT INTO prestamos (id_usuario, tipo, persona, concepto, monto_total, saldo_pendiente, fecha, id_metodo_pago, estado)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVO')
             RETURNING id_prestamo`,
            [id_usuario, tipo, personaLimpia, conceptoLimpio, monto, monto, fechaValida, idMetodo]
        );
        const id_prestamo = prestamoRes.rows[0].id_prestamo;

        let id_movimiento = null;
        if (tipo === "ME_PRESTAN") {
            const desc = conceptoLimpio
                ? `Préstamo recibido de ${personaLimpia} - ${conceptoLimpio}`
                : `Préstamo recibido de ${personaLimpia}`;
            const movRes = await client.query(
                `INSERT INTO movimientos (id_usuario, id_metodo_pago, tipo_movimiento, cantidad, fecha, descripcion)
                 VALUES ($1, $2, 'ENTRADA', $3, $4, $5)
                 RETURNING id_movimiento`,
                [id_usuario, idMetodo, monto, fechaValida, desc]
            );
            id_movimiento = movRes.rows[0].id_movimiento;
            await client.query(
                "UPDATE metodos_pago SET saldo_actual = saldo_actual + $1 WHERE id_metodo = $2 AND id_usuario = $3",
                [monto, idMetodo, id_usuario]
            );
        } else {
            const desc = `Préstamo otorgado a ${personaLimpia}`;
            const movRes = await client.query(
                `INSERT INTO movimientos (id_usuario, id_metodo_pago, tipo_movimiento, cantidad, fecha, descripcion)
                 VALUES ($1, $2, 'GASTO', $3, $4, $5)
                 RETURNING id_movimiento`,
                [id_usuario, idMetodo, monto, fechaValida, desc]
            );
            id_movimiento = movRes.rows[0].id_movimiento;
            await client.query(
                "UPDATE metodos_pago SET saldo_actual = saldo_actual - $1 WHERE id_metodo = $2 AND id_usuario = $3",
                [monto, idMetodo, id_usuario]
            );
        }

        await client.query("COMMIT");
        const prestamo = await obtenerPrestamo(id_usuario, id_prestamo);
        return { message: "Préstamo creado con éxito", prestamo, id_movimiento };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const registrarAbono = async (id_usuario, id_prestamo, datos) => {
    const { monto, fecha, id_metodo_pago } = datos;
    const montoAbono = validarMonto(monto);
    const fechaValida = validarFecha(fecha || new Date().toISOString().slice(0, 10));
    const idMetodo = Number(id_metodo_pago);
    if (isNaN(idMetodo)) {
        throw { status: 400, message: "id_metodo_pago es obligatorio" };
    }

    const client = await db.connect();
    try {
        await client.query("BEGIN");
        await validarMetodoPertenece(client, id_usuario, idMetodo);

        const prestamoRes = await client.query(
            `SELECT id_prestamo, tipo, persona, saldo_pendiente, estado
             FROM prestamos
             WHERE id_prestamo = $1 AND id_usuario = $2
             FOR UPDATE`,
            [id_prestamo, id_usuario]
        );
        if (prestamoRes.rows.length === 0) {
            throw { status: 404, message: "Préstamo no encontrado" };
        }
        const prestamo = prestamoRes.rows[0];
        if (prestamo.estado === "LIQUIDADO") {
            throw { status: 400, message: "El préstamo ya está liquidado" };
        }
        if (Number(montoAbono) > Number(prestamo.saldo_pendiente)) {
            throw { status: 400, message: "El abono no puede ser mayor al saldo pendiente" };
        }

        let id_movimiento = null;
        if (prestamo.tipo === "ME_PRESTAN") {
            const desc = `Abono a préstamo de ${prestamo.persona}`;
            const movRes = await client.query(
                `INSERT INTO movimientos (id_usuario, id_metodo_pago, tipo_movimiento, cantidad, fecha, descripcion)
                 VALUES ($1, $2, 'GASTO', $3, $4, $5)
                 RETURNING id_movimiento`,
                [id_usuario, idMetodo, montoAbono, fechaValida, desc]
            );
            id_movimiento = movRes.rows[0].id_movimiento;
            await client.query(
                "UPDATE metodos_pago SET saldo_actual = saldo_actual - $1 WHERE id_metodo = $2 AND id_usuario = $3",
                [montoAbono, idMetodo, id_usuario]
            );
        } else {
            const desc = `Abono recibido de ${prestamo.persona}`;
            const movRes = await client.query(
                `INSERT INTO movimientos (id_usuario, id_metodo_pago, tipo_movimiento, cantidad, fecha, descripcion)
                 VALUES ($1, $2, 'ENTRADA', $3, $4, $5)
                 RETURNING id_movimiento`,
                [id_usuario, idMetodo, montoAbono, fechaValida, desc]
            );
            id_movimiento = movRes.rows[0].id_movimiento;
            await client.query(
                "UPDATE metodos_pago SET saldo_actual = saldo_actual + $1 WHERE id_metodo = $2 AND id_usuario = $3",
                [montoAbono, idMetodo, id_usuario]
            );
        }

        const nuevoSaldo = Number(prestamo.saldo_pendiente) - Number(montoAbono);
        const nuevoEstado = nuevoSaldo <= 0 ? "LIQUIDADO" : "ACTIVO";
        await client.query(
            "UPDATE prestamos SET saldo_pendiente = $1, estado = $2 WHERE id_prestamo = $3 AND id_usuario = $4",
            [nuevoSaldo.toFixed(2), nuevoEstado, id_prestamo, id_usuario]
        );

        await client.query(
            `INSERT INTO prestamos_pagos (id_prestamo, id_usuario, monto, fecha, id_metodo_pago, id_movimiento)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [id_prestamo, id_usuario, montoAbono, fechaValida, idMetodo, id_movimiento]
        );

        await client.query("COMMIT");
        const prestamoActualizado = await obtenerPrestamo(id_usuario, id_prestamo);
        return { message: "Abono registrado con éxito", prestamo: prestamoActualizado, id_movimiento };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const obtenerAbonos = async (id_usuario, id_prestamo) => {
    await obtenerPrestamo(id_usuario, id_prestamo);
    const result = await db.query(
        `SELECT pp.id_pago_prestamo,
                pp.monto,
                to_char(pp.fecha, 'YYYY-MM-DD') AS fecha,
                pp.id_metodo_pago,
                pp.id_movimiento,
                mp.nombre AS metodo_nombre,
                mp.tipo AS metodo_tipo
         FROM prestamos_pagos pp
         JOIN metodos_pago mp ON mp.id_metodo = pp.id_metodo_pago
         WHERE pp.id_prestamo = $1 AND pp.id_usuario = $2
         ORDER BY pp.fecha ASC, pp.id_pago_prestamo ASC`,
        [id_prestamo, id_usuario]
    );
    return result.rows;
};
