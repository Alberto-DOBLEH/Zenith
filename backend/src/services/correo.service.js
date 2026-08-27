import brevo from '@getbrevo/brevo';

const client = new brevo.ApiClient();
client.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

const apiInstance = new brevo.TransactionalEmailsApi(client);

export const enviarCorreo = async (opciones) => {
    const { para, asunto, html } = opciones;

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { name: 'Zenith', email: process.env.BREVO_FROM_EMAIL || 'notificaciones.zenith@gmail.com' };
    sendSmtpEmail.to = [{ email: para }];
    sendSmtpEmail.subject = asunto;
    sendSmtpEmail.htmlContent = html;

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
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
