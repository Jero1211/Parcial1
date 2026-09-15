require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'parcial1_secret_key_default',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  roles: {
    ADMIN: 'Administrador',
    BASIC: 'usuario básico'
  }
};
