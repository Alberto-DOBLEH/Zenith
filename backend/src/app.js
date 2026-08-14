import express from 'express';
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

app.use(express.json());

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

export default app;