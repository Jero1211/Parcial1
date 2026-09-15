const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const movieRoutes = require('./routes/movieRoutes');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir interfaz web estática
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', authRoutes); // Alias amigable para operaciones de usuarios
app.use('/api/peliculas', movieRoutes);

// Ruta base de estado / información de la API
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    sistema: 'Parcial 1 - Desarrollo Web (Node.js)',
    version: '1.0.0',
    endpoints: {
      auth: {
        registro: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        perfil: 'GET /api/auth/me',
        usuarios: 'GET /api/auth/usuarios'
      },
      peliculas: {
        listarTodas: 'GET /api/peliculas (Requiere autenticación)',
        crear: 'POST /api/peliculas (Solo Administrador)',
        filtrar: 'GET /api/peliculas/filtro?anio=YYYY&precio=XX (Requiere autenticación)'
      }
    }
  });
});

// Manejador de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

// Manejador centralizado de errores (500)
app.use((err, req, res, next) => {
  console.error('Error no capturado:', err);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor.'
  });
});

module.exports = app;
