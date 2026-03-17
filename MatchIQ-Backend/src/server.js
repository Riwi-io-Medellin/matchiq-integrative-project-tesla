import 'dotenv/config';
import app from './app.js';
import pool from './config/db.js';
import './config/passport.js';

const PORT = process.env.PORT || 3005;

async function startServer() {
  try {
    // Verifica conexión a la base de datos
    await pool.query('SELECT 1');
    console.log('Database connected');

    // Inicia servidor solo si la DB responde
    app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('Failed to connect to database:', error.message);
    process.exit(1); // Detiene la app si no hay DB
  }
}

startServer()