import 'dotenv/config';
import app from './src/app.js';

const PORT = process.env.PORT || 3000;

const requeridas = ["JWT_SECRET", "DB_USER", "DB_HOST", "DB_NAME", "DB_PASSWORD", "DB_PORT"];
const faltantes = requeridas.filter(v => !process.env[v]);
if (faltantes.length > 0) {
    console.error(`Faltan variables de entorno requeridas: ${faltantes.join(", ")}`);
    process.exit(1);
}
if (process.env.JWT_SECRET === "TU_SECRETO_LARGO_Y_ALEATORIO") {
    console.error("JWT_SECRET no configurado. Genera uno con: openssl rand -hex 32");
    process.exit(1);
}

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});