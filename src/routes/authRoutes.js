const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// 1. (1.5) Crear usuario
router.post('/register', authController.register);

// 1. (1.5) Autenticar usuario
router.post('/login', authController.login);

// 1. (1.5) Consultar información del usuario autenticado
router.get('/me', authenticateToken, authController.getProfile);

// Consultar listado de usuarios (requiere login)
router.get('/usuarios', authenticateToken, authController.getAllUsers);

module.exports = router;
