import { BrevoClient } from '@getbrevo/brevo';
import { ZONA_HORARIA, fechaLarga } from '../config/zona.js';

const client = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });

// Escapa HTML mínimo para interpolaciones de datos del usuario en plantillas.
const esc = (valor) => String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const enviarCorreo = async (opciones) => {
    const { para, asunto, html } = opciones;

    const result = await client.transactionalEmails.sendTransacEmail({
        sender: { name: 'Zenith', email: process.env.BREVO_FROM_EMAIL },
        to: [{ email: para }],
        subject: asunto,
        htmlContent: html,
    });

    return result;
};

export const enviarVerificacion = async (correo, token) => {
    const urlVerificacion = `${process.env.FRONTEND_URL}/verificar-correo/${token}`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .header p { margin: 5px 0 0; opacity: 0.9; }
            .content { padding: 30px; text-align: center; }
            .content h2 { color: #333; margin-bottom: 15px; }
            .content p { color: #666; line-height: 1.6; }
            .boton-verificar { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 25px; font-weight: bold; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #999; font-size: 12px; }
            .token-box { background: #f8f9fa; border: 1px dashed #ddd; padding: 15px; margin: 15px 0; border-radius: 5px; word-break: break-all; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Zenith</h1>
                <p>Habit Tracker</p>
            </div>
            <div class="content">
                <h2>Verifica tu correo electronico</h2>
                <p>Gracias por registrarte en Zenith. Para completar tu registro y comenzar a usar la aplicacion, verifica tu correo electronico haciendo clic en el boton de abajo.</p>
                
                <a href="${urlVerificacion}" class="boton-verificar">Verificar Correo</a>
                
                <p>O copia y pega este enlace en tu navegador:</p>
                <div class="token-box">${urlVerificacion}</div>
                
                <p style="font-size: 14px; color: #999;">Este enlace expirara en 24 horas.</p>
            </div>
            <div class="footer">
                <p>Si no solicitaste esta cuenta, puedes ignorar este correo.</p>
                <p>2026 Zenith - Habit Tracker</p>
            </div>
        </div>
    </body>
    </html>
    `;

    return enviarCorreo({
        para: correo,
        asunto: 'Verifica tu correo electronico - Zenith',
        html,
    });
};

export const enviarAvisoEvento = async (correo, nombreUsuario, evento) => {
    const { titulo, descripcion, fecha_inicio, duracion } = evento;

    const fechaFormateada = new Date(fecha_inicio).toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: ZONA_HORARIA,
    });

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .header p { margin: 5px 0 0; opacity: 0.9; }
            .content { padding: 30px; }
            .content h2 { color: #333; margin-bottom: 15px; text-align: center; }
            .evento-card { background: #f8f9fa; border-radius: 10px; padding: 20px; margin: 15px 0; border-left: 4px solid #f5576c; }
            .evento-card h3 { margin: 0 0 10px; color: #333; }
            .evento-card p { margin: 5px 0; color: #666; }
            .evento-card .label { font-weight: bold; color: #555; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #999; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Recordatorio de Evento</h1>
                <p>Zenith - Habit Tracker</p>
            </div>
            <div class="content">
                <h2>Hola, ${nombreUsuario}</h2>
                <p>Tu evento esta proximo a comenzar:</p>
                
                <div class="evento-card">
                    <h3>${titulo}</h3>
                    ${descripcion ? `<p><span class="label">Descripcion:</span> ${descripcion}</p>` : ''}
                    <p><span class="label">Fecha:</span> ${fechaFormateada}</p>
                    ${duracion ? `<p><span class="label">Duracion:</span> ${duracion} minutos</p>` : ''}
                </div>
                
                <p style="text-align: center; margin-top: 20px;">No olvides asistir a tu evento.</p>
            </div>
            <div class="footer">
                <p>Este es un recordatorio automatico de Zenith.</p>
                <p>2026 Zenith - Habit Tracker</p>
            </div>
        </div>
    </body>
    </html>
    `;

    return enviarCorreo({
        para: correo,
        asunto: `${titulo} - Recordatorio de evento`,
        html,
    });
};

export const enviarResumenPendientes = async (correo, nombreUsuario, datos) => {
    const { fecha, habitos, actividades } = datos;

    const itemsHabitos = (habitos || [])
        .map(h => `<li>${esc(h.nombre)}${h.frecuencia ? ` <span class="etiqueta">(${esc(h.frecuencia.toLowerCase())})</span>` : ''}</li>`)
        .join('');
    const itemsActividades = (actividades || [])
        .map(a => `<li>${esc(a.titulo)}${a.descripcion ? `<p class="detalle">${esc(a.descripcion)}</p>` : ''}</li>`)
        .join('');

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .header p { margin: 5px 0 0; opacity: 0.9; }
            .content { padding: 30px; }
            .content h2 { color: #333; font-size: 18px; margin: 20px 0 10px; }
            .content h2:first-child { margin-top: 0; }
            .content ul { margin: 0; padding-left: 20px; color: #555; line-height: 1.8; }
            .content .etiqueta { color: #999; font-size: 13px; }
            .content .detalle { margin: 2px 0 8px; color: #777; font-size: 13px; }
            .fecha { text-align: center; color: #666; margin: 10px 0 20px; font-size: 15px; }
            .boton-abrir { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 40px; border-radius: 25px; font-weight: bold; margin: 20px 0 5px; text-align: center; }
            .vacio { text-align: center; color: #10B981; font-weight: bold; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #999; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Resumen del dia</h1>
                <p>Zenith - Habit Tracker</p>
            </div>
            <div class="content">
                <p class="fecha">Hola ${esc(nombreUsuario)}, esto es lo que te falta para hoy (${esc(fechaLarga(fecha))}):</p>

                @ifHabitos@
                @ifActividades@

                <div style="text-align:center;">
                    <a href="${process.env.FRONTEND_URL || ''}" class="boton-abrir">Abrir Zenith</a>
                </div>
            </div>
            <div class="footer">
                <p>Este es un recordatorio automatico de Zenith.</p>
                <p>2026 Zenith - Habit Tracker</p>
            </div>
        </div>
    </body>
    </html>
    `
        .replace('@ifHabitos@', itemsHabitos
            ? `<h2>Habitos pendientes</h2><ul>${itemsHabitos}</ul>`
            : '')
        .replace('@ifActividades@', itemsActividades
            ? `<h2>Actividades que vencen hoy</h2><ul>${itemsActividades}</ul>`
            : '');

    return enviarCorreo({
        para: correo,
        asunto: `Resumen del dia - Zenith`,
        html,
    });
};

export const enviarVencimientoActividad = async (correo, nombreUsuario, datos) => {
    const { fecha, actividades } = datos;

    const items = (actividades || [])
        .map(a => `<li>${esc(a.titulo)}${a.descripcion ? `<p class="detalle">${esc(a.descripcion)}</p>` : ''}</li>`)
        .join('');

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 26px; }
            .header p { margin: 5px 0 0; opacity: 0.9; }
            .content { padding: 30px; }
            .content h2 { color: #333; font-size: 18px; margin: 0 0 10px; }
            .content ul { margin: 0; padding-left: 20px; color: #555; line-height: 1.8; }
            .content .detalle { margin: 2px 0 8px; color: #777; font-size: 13px; }
            .fecha { text-align: center; color: #666; margin: 10px 0 15px; font-size: 15px; }
            .boton-abrir { display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; text-decoration: none; padding: 14px 40px; border-radius: 25px; font-weight: bold; margin: 20px 0 5px; text-align: center; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #999; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Manana vence</h1>
                <p>Zenith - Habit Tracker</p>
            </div>
            <div class="content">
                <p class="fecha">Hola ${esc(nombreUsuario)}, manana (${esc(fechaLarga(fecha))}) vence:</p>
                <ul>${items}</ul>
                <div style="text-align:center;">
                    <a href="${process.env.FRONTEND_URL || ''}" class="boton-abrir">Abrir Zenith</a>
                </div>
            </div>
            <div class="footer">
                <p>Este es un recordatorio automatico de Zenith.</p>
                <p>2026 Zenith - Habit Tracker</p>
            </div>
        </div>
    </body>
    </html>
    `;

    return enviarCorreo({
        para: correo,
        asunto: `Mañana vence - Zenith`,
        html,
    });
};
