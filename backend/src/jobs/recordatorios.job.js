import cron from 'node-cron';
import db from '../config/db.js';
import { enviarAvisoEvento, enviarAvisoActividad } from '../services/correo.service.js';

// Función para procesar recordatorios pendientes
const procesarRecordatorios = async () => {
    try {
        // Cerrar avisos que vencieron hace más de 30 min sin enviarse:
        // se marcan como vistos sin correo para no reintentarlos para siempre.
        const descartados = await db.query(
            `UPDATE recordatorios_evento
             SET enviado = TRUE, fecha_envio = NOW()
             WHERE (enviado IS NULL OR enviado = FALSE)
               AND fecha_recordatorio < NOW() - INTERVAL '30 minutes'
             RETURNING id_recordatorio`
        );
        if (descartados.rows.length > 0) {
            console.log(`[Scheduler] Descartados ${descartados.rows.length} avisos vencidos (mas de 30 min atras)`);
        }

        const descartadosAct = await db.query(
            `UPDATE actividades_recordatorios
             SET enviado = TRUE, fecha_envio = NOW()
             WHERE (enviado IS NULL OR enviado = FALSE)
               AND fecha_recordatorio < CURRENT_DATE - INTERVAL '30 days'
             RETURNING id_recordatorio`
        );
        if (descartadosAct.rows.length > 0) {
            console.log(`[Scheduler] Descartados ${descartadosAct.rows.length} avisos de actividades vencidos`);
        }

        // Ventana de envío: dentro de los próximos 10 min o atrasados
        // hasta 30 min (margen por retrasos de ejecución del cron).
        const result = await db.query(`
            SELECT 
                re.id_recordatorio,
                re.fecha_recordatorio,
                e.id_evento,
                e.titulo,
                e.descripcion,
                e.fecha_inicio,
                e.fecha_fin,
                e.color,
                u.id_usuario,
                u.nombre,
                u.correo,
                u.email_verificado
            FROM recordatorios_evento re
            JOIN eventos e ON e.id_evento = re.evento
            JOIN usuarios u ON u.id_usuario = e.usuario
            WHERE 
                (re.enviado IS NULL OR re.enviado = FALSE)
                AND u.email_verificado = TRUE
                AND re.fecha_recordatorio <= NOW() + INTERVAL '10 minutes'
                AND re.fecha_recordatorio >= NOW() - INTERVAL '30 minutes'
            ORDER BY re.fecha_recordatorio ASC
            LIMIT 10
        `);

        if (result.rows.length > 0) {
            console.log(`[Scheduler] Procesando ${result.rows.length} recordatorios pendientes`);

            for (const recordatorio of result.rows) {
                try {
                    // Calcular duración si hay fecha_fin
                    let duracion = null;
                    if (recordatorio.fecha_fin) {
                        const inicio = new Date(recordatorio.fecha_inicio);
                        const fin = new Date(recordatorio.fecha_fin);
                        duracion = Math.round((fin - inicio) / (1000 * 60)); // minutos
                    }

                    // Enviar correo de recordatorio
                    await enviarAvisoEvento(
                        recordatorio.correo,
                        recordatorio.nombre,
                        {
                            titulo: recordatorio.titulo,
                            descripcion: recordatorio.descripcion,
                            fecha_inicio: recordatorio.fecha_inicio,
                            duracion: duracion
                        }
                    );

                    // Marcar como enviado
                    await db.query(
                        "UPDATE recordatorios_evento SET enviado = TRUE, fecha_envio = NOW() WHERE id_recordatorio = $1",
                        [recordatorio.id_recordatorio]
                    );

                    console.log(`[Scheduler] Recordatorio enviado: ${recordatorio.titulo} para ${recordatorio.correo}`);

                } catch (error) {
                    console.error(`[Scheduler] Error al enviar recordatorio ${recordatorio.id_recordatorio}:`, error);
                }
            }
        }

        const resultActividades = await db.query(`
            SELECT
                ar.id_recordatorio,
                ar.fecha_recordatorio,
                a.id_actividad,
                a.titulo,
                a.descripcion,
                a.fecha_limite,
                u.id_usuario,
                u.nombre,
                u.correo,
                u.email_verificado
            FROM actividades_recordatorios ar
            JOIN actividades a ON a.id_actividad = ar.id_actividad
            JOIN usuarios u ON u.id_usuario = ar.id_usuario
            WHERE
                (ar.enviado IS NULL OR ar.enviado = FALSE)
                AND u.email_verificado = TRUE
                AND ar.fecha_recordatorio <= CURRENT_DATE
            ORDER BY ar.fecha_recordatorio ASC, a.fecha_limite ASC
            LIMIT 10
        `);

        if (resultActividades.rows.length > 0) {
            console.log(`[Scheduler] Procesando ${resultActividades.rows.length} recordatorios de actividades pendientes`);

            for (const recordatorio of resultActividades.rows) {
                try {
                    const keyUsuario = recordatorio.id_usuario;
                    const keyTipo = 'AVISO_ACTIVIDAD';
                    const keyRef = recordatorio.id_actividad;
                    const keyFecha = recordatorio.fecha_recordatorio;

                    const yaEnviado = await db.query(
                        `SELECT 1 FROM correos_enviados WHERE usuario = $1 AND tipo = $2 AND referencia = $3 AND fecha = $4`,
                        [keyUsuario, keyTipo, keyRef, keyFecha]
                    );

                    if (yaEnviado.rows.length > 0) {
                        await db.query(
                            "UPDATE actividades_recordatorios SET enviado = TRUE, fecha_envio = NOW() WHERE id_recordatorio = $1",
                            [recordatorio.id_recordatorio]
                        );
                        continue;
                    }

                    await enviarAvisoActividad(
                        recordatorio.correo,
                        recordatorio.nombre,
                        {
                            titulo: recordatorio.titulo,
                            descripcion: recordatorio.descripcion,
                            fecha_limite: recordatorio.fecha_limite,
                            fecha_aviso: recordatorio.fecha_recordatorio
                        }
                    );

                    await db.query(
                        `INSERT INTO correos_enviados (usuario, tipo, referencia, fecha)
                         VALUES ($1, $2, $3, $4)
                         ON CONFLICT (usuario, tipo, referencia, fecha) DO NOTHING`,
                        [keyUsuario, keyTipo, keyRef, keyFecha]
                    );

                    await db.query(
                        "UPDATE actividades_recordatorios SET enviado = TRUE, fecha_envio = NOW() WHERE id_recordatorio = $1",
                        [recordatorio.id_recordatorio]
                    );

                    console.log(`[Scheduler] Recordatorio de actividad enviado: ${recordatorio.titulo} para ${recordatorio.correo}`);
                } catch (error) {
                    console.error(`[Scheduler] Error al enviar recordatorio de actividad ${recordatorio.id_recordatorio}:`, error);
                }
            }
        }

    } catch (error) {
        console.error('[Scheduler] Error al procesar recordatorios:', error);
    }
};

// Iniciar scheduler - cada 5 minutos
export const iniciarScheduler = () => {
    // Programar ejecución cada 5 minutos
    cron.schedule('*/5 * * * *', () => {
        console.log('[Scheduler] Ejecutando procesamiento de recordatorios...');
        procesarRecordatorios();
    });

    console.log('[Scheduler] Scheduler de recordatorios iniciado (cada 5 minutos)');
};
