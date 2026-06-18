import express from 'express';
// import userRoutes from './routes/usuarios.routes.js';
// import tipoHabitoRoutes from './routes/tipo_habito.routes.js';
// import habitosRoutes from './routes/habitos.routes.js';
// import detallesHabitosRoutes from './routes/detalles_habitos.routes.js';

const app = express();

app.use(express.json());

// Rutas
// app.use('/api/usuarios', userRoutes);
// app.use('/api/tipo-habito', tipoHabitoRoutes);
// app.use('/api/habitos', habitosRoutes);
// app.use('/api/detalles-habitos', detallesHabitosRoutes);

export default app;