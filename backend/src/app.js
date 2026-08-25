import express from 'express';
import cors from 'cors';
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./modules/auth/auth.routes.js";
import usuariosRoutes from "./modules/usuarios/usuarios.routes.js";
import habitosRoutes from "./modules/habitos/habitos.routes.js";
import bitacoraRoutes from "./modules/bitacora/bitacora.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import estadisticasRoutes from "./modules/estadisticas/estadisticas.routes.js";
import eventosRoutes from "./modules/eventos/eventos.routes.js";
import notasRoutes from "./modules/notas/notas.routes.js";
import pomodoroRoutes from "./modules/pomodoro/pomodoro.routes.js";
import avataresRoutes from "./modules/avatares/avatares.routes.js";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());

const origenesPermitidos =
    process.env.CORS_ORIGIN?.split(",").map(s => s.trim()).filter(Boolean);
app.use(cors({
    origin: origenesPermitidos && origenesPermitidos.length
        ? origenesPermitidos
        : true
}));
app.use(express.json());

const limiteLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: process.env.RATE_LIMIT_LOGIN || 10,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Demasiados intentos de inicio de sesión. Intenta de nuevo en unos minutos." }
});

const limiteRegistro = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: process.env.RATE_LIMIT_REGISTRO || 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Demasiados registros desde esta dirección. Intenta de nuevo en unos minutos." }
});

app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));
app.use("/api/auth/login", limiteLogin);
app.use("/api/auth/register", limiteRegistro);

app.use("/api/auth", authRoutes);
app.use("/api/usuario", usuariosRoutes);
app.use("/api/habito", habitosRoutes);
app.use("/api/bitacora", bitacoraRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/estadisticas", estadisticasRoutes);
app.use("/api/eventos", eventosRoutes);
app.use("/api/notas", notasRoutes);
app.use("/api/pomodoro", pomodoroRoutes);
app.use("/api/avatares", avataresRoutes);

app.use(errorHandler);

export default app;