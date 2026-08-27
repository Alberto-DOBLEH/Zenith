import cron from 'node-cron';
import db from '../config/db.js';
import { enviarAvisoEvento } from '../services/correo.service.js';

// Función para procesar recordatorios pendientes
const procesarRecordatorios = async () => {
    try {
        // Buscar recordatorios que están por vencer en los próximos 5 minutos
        // y que no han sido enviados
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
                re.fecha_recordatorio BETWEEN NOW() AND NOW() + INTERVAL '5 minutes'
                AND (re.enviado IS NULL OR re.enviado = FALSE)
                AND u.email_verificado = TRUE
            ORDER BY re.fecha_recordatorio ASC
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
    // Verificar si hay campo enviado en recordatorios_evento
    // Si no existe, lo agregamos (para compatibilidad con BD existente)
    db.query(`
        DO $$ 
        BEGIN 
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'recordatorios_evento' 
                AND column_name = 'enviado'
            ) THEN
                ALTER TABLE recordatorios_evento 
                ADD COLUMN enviado BOOLEAN DEFAULT FALSE,
                ADD COLUMN fecha_envio TIMESTAMP;
            END IF;
        END $$;
    `).then(() => {
        console.log('[Scheduler] Campo "enviado" verificado en recordatorios_evento');
    }).catch(error => {
        console.error('[Scheduler] Error al verificar campo enviado:', error);
    });

    // Programar ejecución cada 5 minutos
    cron.schedule('*/5 * * * *', () => {
        console.log('[Scheduler] Ejutando procesamiento de recordatorios...');
        procesarRecordatorios();
    });

    console.log('[Scheduler] Scheduler de recordatorios iniciado (cada 5 minutos)');
};
