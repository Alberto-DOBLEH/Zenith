import cron from 'node-cron';
import db from '../config/db.js';
import { fechaHoySQL } from '../config/fecha.js';
import { ZONA_HORARIA } from '../config/zona.js';
import { filtroFrecuencia } from '../modules/dashboard/dashboard.service.js';
import { enviarResumenPendientes, enviarVencimientoActividad } from '../services/correo.service.js';

// Cron de HORA_RESUMEN (default 08:00), en la zona fija del proyecto.
const expresionResumen = () => {
    const hora = process.env.HORA_RESUMEN || '08:00';
    const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(hora);
    if (!match) {
        console.warn(`[Resumen] HORA_RESUMEN invalida ("${hora}"), usando 08:00`);
        return '0 8 * * *';
    }
    return `${Number(match[2])} ${Number(match[1])} * * *`;
};

// Registra el envío; devuelve true solo si este proceso es quien lo insertó
// (dedup idempotente entre reinicios del servidor).
const marcarEnviado = async (usuario, tipo, referencia, fecha) => {
    const result = await db.query(
        `INSERT INTO correos_enviados (usuario, tipo, referencia, fecha)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (usuario, tipo, referencia, fecha) DO NOTHING
        RETURNING id_correo`,
        [usuario, tipo, referencia, fecha]
    );
    return result.rows.length > 0;
};

// Pendientes de hoy (hábitos programados sin completar + actividades que
// vencen hoy), agrupados por usuario con correo verificado.
export const prepararResumenes = async () => {
    const hoy = fechaHoySQL(ZONA_HORARIA);

    const habitosResult = await db.query(
        `SELECT u.id_usuario, u.nombre, u.correo, h.nombre AS habito, h.frecuencia
        FROM usuarios u
        INNER JOIN habitos h ON h.usuario = u.id_usuario AND h.estado = 'ACTIVO'
        LEFT JOIN registro_habitos rh ON rh.habito = h.id_habito AND rh.fecha = (${hoy})
        WHERE u.email_verificado = TRUE
            AND u.estado = 'ACTIVO'
            AND ${filtroFrecuencia('h', hoy)}
            AND (rh.estado IS NULL OR rh.estado IN ('NO_COMPLETADO', 'PARCIAL'))
        ORDER BY u.id_usuario, h.id_habito`,
    );

    const actividadesResult = await db.query(
        `SELECT u.id_usuario, u.nombre, u.correo, a.titulo, a.descripcion
        FROM usuarios u
        INNER JOIN actividades a ON a.usuario = u.id_usuario
            AND a.fecha_limite = (${hoy}) AND a.estado = 'PENDIENTE'
        WHERE u.email_verificado = TRUE
            AND u.estado = 'ACTIVO'
        ORDER BY u.id_usuario, a.id_actividad`,
    );

    const hoyStr = (await db.query(`SELECT (${hoy})::text AS hoy`)).rows[0].hoy;

    const porUsuario = new Map();
    const agregar = (fila, destino) => {
        if (!porUsuario.has(fila.id_usuario)) {
            porUsuario.set(fila.id_usuario, {
                id_usuario: fila.id_usuario,
                nombre: fila.nombre,
                correo: fila.correo,
                habitos: [],
                actividades: [],
            });
        }
        porUsuario.get(fila.id_usuario)[destino].push(fila);
    };

    habitosResult.rows.forEach(f => agregar(f, 'habitos'));
    actividadesResult.rows.forEach(f => agregar(f, 'actividades'));

    return [...porUsuario.values()]
        .map(u => ({
            ...u,
            habitos: u.habitos.map(h => ({ nombre: h.habito, frecuencia: h.frecuencia })),
            fecha: hoyStr,
        }))
        .filter(u => u.habitos.length > 0 || u.actividades.length > 0);
};

// Actividades que vencen mañana, agrupadas por usuario.
export const prepararVencimientos = async () => {
    const manana = `((${fechaHoySQL(ZONA_HORARIA)}) + INTERVAL '1 day')::date`;

    const result = await db.query(
        `SELECT u.id_usuario, u.nombre, u.correo,
            a.id_actividad, a.titulo, a.descripcion,
            to_char(a.fecha_limite, 'YYYY-MM-DD') AS fecha_limite
        FROM usuarios u
        INNER JOIN actividades a ON a.usuario = u.id_usuario
            AND a.fecha_limite = (${manana}) AND a.estado = 'PENDIENTE'
        WHERE u.email_verificado = TRUE
            AND u.estado = 'ACTIVO'
        ORDER BY u.id_usuario, a.id_actividad`,
    );

    const porUsuario = new Map();
    result.rows.forEach(f => {
        if (!porUsuario.has(f.id_usuario)) {
            porUsuario.set(f.id_usuario, {
                id_usuario: f.id_usuario,
                nombre: f.nombre,
                correo: f.correo,
                fecha: f.fecha_limite,
                actividades: [],
            });
        }
        porUsuario.get(f.id_usuario).actividades.push({
            titulo: f.titulo,
            descripcion: f.descripcion,
        });
    });

    return [...porUsuario.values()];
};

export const procesarResumen = async () => {
    try {
        const pendientes = await prepararResumenes();

        for (const usuario of pendientes) {
            const esNuevo = await marcarEnviado(usuario.id_usuario, 'RESUMEN_DIARIO', 0, usuario.fecha);
            if (!esNuevo) continue;

            try {
                await enviarResumenPendientes(usuario.correo, usuario.nombre, {
                    fecha: usuario.fecha,
                    habitos: usuario.habitos.slice(0, 15),
                    actividades: usuario.actividades.slice(0, 15),
                });
                console.log(`[Resumen] Enviado a ${usuario.correo} (${usuario.habitos.length} habitos, ${usuario.actividades.length} actividades)`);
            } catch (error) {
                console.error(`[Resumen] Error al enviar a ${usuario.correo}:`, error.message);
            }
        }
    } catch (error) {
        console.error('[Resumen] Error al procesar el resumen:', error);
    }
};

export const procesarVencimientos = async () => {
    try {
        const pendientes = await prepararVencimientos();

        for (const usuario of pendientes) {
            const esNuevo = await marcarEnviado(usuario.id_usuario, 'ACTIVIDAD_VENCE_MANANA', 0, usuario.fecha);
            if (!esNuevo) continue;

            try {
                await enviarVencimientoActividad(usuario.correo, usuario.nombre, {
                    fecha: usuario.fecha,
                    actividades: usuario.actividades.slice(0, 15),
                });
                console.log(`[Resumen] Aviso de vencimiento enviado a ${usuario.correo} (${usuario.actividades.length} actividades)`);
            } catch (error) {
                console.error(`[Resumen] Error al enviar vencimiento a ${usuario.correo}:`, error.message);
            }
        }
    } catch (error) {
        console.error('[Resumen] Error al procesar vencimientos:', error);
    }
};

// Ambos avisos salen a la misma hora (HORA_RESUMEN): el del día siguiente
// llega el día anterior y el resumen, el día que vence.
export const iniciarSchedulerResumen = () => {
    const expresion = expresionResumen();

    cron.schedule(expresion, () => {
        console.log('[Resumen] Ejecutando resumen del dia...');
        procesarResumen();
        procesarVencimientos();
    });

    console.log(`[Resumen] Scheduler iniciado (expresion "${expresion}", zona ${ZONA_HORARIA})`);
};
