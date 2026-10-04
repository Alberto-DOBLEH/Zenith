import cron from 'node-cron';
import db from '../config/db.js';
import { enviarAvisoEvento } from '../services/correo.service.js';

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

        if (result.rows.length === 0) {
            return;
        }

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
