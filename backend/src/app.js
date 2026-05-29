import express from 'express';
import userRoutes from './routes/usuarios.routes.js';

const app = express();

app.use(express.json());

// Rutas
app.use('/api/usuarios', userRoutes);

export default app;