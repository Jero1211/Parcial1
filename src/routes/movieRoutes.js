const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// 4. (1.5) Filtro condicional por año y precio (requiere estar logueado)
// Se coloca antes de las rutas dinámicas si las hubiere
router.get('/filtro', authenticateToken, movieController.getMoviesFiltered);

// 3. (1.0) Consultar todas las películas (requiere estar logueado: admin o básico)
router.get('/', authenticateToken, movieController.getAllMovies);

// 2. (1.0) Crear película para la venta (SOLO Administrador)
// Si un usuario básico intenta crearla, requireAdmin responde con 403 No Autorizado
router.post('/', authenticateToken, requireAdmin, movieController.createMovie);

module.exports = router;
