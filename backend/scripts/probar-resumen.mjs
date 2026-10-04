// Prueba manual de los correos automáticos (resumen del día y "mañana vence").
//
// Uso (desde backend/):   node scripts/probar-resumen.mjs
//
// Prepara los pendientes reales de la BD configurada en .env y los envía SIN
// pasar por el dedup de correos_enviados, para que siempre lleguen a la bandeja.
// Los jobs en producción sí usan el dedup (un envío por usuario/día).

import 'dotenv/config';
import {
    prepararResumenes,
    prepararVencimientos,
} from '../src/jobs/resumen.job.js';
import {
    enviarResumenPendientes,
    enviarVencimientoActividad,
} from '../src/services/correo.service.js';

const LIMITE = Number(process.env.PROBAR_LIMITE || 3);

const main = async () => {
    console.log('Preparando resumenes del dia...');
    const resumenes = await prepararResumenes();
    console.log(`  ${resumenes.length} usuario(s) con pendientes de hoy`);

    for (const usuario of resumenes.slice(0, LIMITE)) {
        console.log(`  -> Enviando resumen a ${usuario.correo} (${usuario.habitos.length} habitos, ${usuario.actividades.length} actividades)`);
        await enviarResumenPendientes(usuario.correo, usuario.nombre, {
            fecha: usuario.fecha,
            habitos: usuario.habitos.slice(0, 15),
            actividades: usuario.actividades.slice(0, 15),
        });
    }

    console.log('Preparando avisos de vencimiento (manana)...');
    const vencimientos = await prepararVencimientos();
    console.log(`  ${vencimientos.length} usuario(s) con vencimientos manana`);

    for (const usuario of vencimientos.slice(0, LIMITE)) {
        console.log(`  -> Enviando aviso a ${usuario.correo} (${usuario.actividades.length} actividades)`);
        await enviarVencimientoActividad(usuario.correo, usuario.nombre, {
            fecha: usuario.fecha,
            actividades: usuario.actividades.slice(0, 15),
        });
    }

    if (resumenes.length === 0 && vencimientos.length === 0) {
        console.log('Nada pendiente: crea un hábito sin marcar o una actividad que venza hoy/manana y vuelve a correr.');
    }

    process.exit(0);
};

main().catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
});
