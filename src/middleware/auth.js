const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Middleware para verificar que el usuario esté autenticado mediante JWT
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato: Bearer <token>

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Acceso denegado: Debe iniciar sesión y proporcionar un token Bearer válido para acceder a este recurso.'
    });
  }

  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Token inválido o expirado. Por favor, vuelva a iniciar sesión.'
      });
    }

    req.user = user;
    next();
  });
}

/**
 * Middleware para validar que el usuario tenga rol de Administrador
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Usuario no autenticado.'
    });
  }

  const rol = (req.user.rol || '').trim().toLowerCase();
  const esAdmin = rol === 'administrador' || rol === 'admin';

  if (!esAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Acceso no autorizado: Solo los usuarios con rol Administrador tienen permiso para realizar esta operación.'
    });
  }

  next();
}

module.exports = {
  authenticateToken,
  requireAdmin
};
