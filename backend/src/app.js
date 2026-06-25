import express from 'express';
import authRoutes from "./modules/auth/auth.routes.js";
import usuariosRoutes from "./modules/usuarios/usuarios.routes.js";
import habitosRoutes from "./modules/habitos/habitos.routes.js";
import bitacoraRoutes from "./modules/bitacora/bitacora.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import estadisticasRoutes from "./modules/estadisticas/estadisticas.routes.js";
import actividadesRoutes from "./modules/actividades/actividades.routes.js";
import notasRoutes from "./modules/notas/notas.routes.js";

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/usuario", usuariosRoutes);
app.use("/api/habito", habitosRoutes);
app.use("/api/bitacora", bitacoraRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/estadisticas", estadisticasRoutes);
app.use("/api/actividades", actividadesRoutes);
app.use("/api/notas", notasRoutes);

export default app;