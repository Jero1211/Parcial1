const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const jsonStore = require('../storage/jsonStore');

/**
 * Normaliza y valida el rol del usuario según los requerimientos:
 * 2 roles: 'Administrador' y 'usuario básico'
 */
function normalizarRol(rolInput) {
  if (!rolInput) return null;
  const normal = rolInput.toString().trim().toLowerCase();
  if (normal === 'administrador' || normal === 'admin') {
    return 'Administrador';
  }
  if (normal === 'usuario básico' || normal === 'usuario basico' || normal === 'basico' || normal === 'básico' || normal === 'user') {
    return 'usuario básico';
  }
  return null;
}

/**
 * 1. (1.5) Crear un usuario con username, password (hasheado) y rol
 * POST /api/auth/register (o /api/usuarios)
 */
async function register(req, res) {
  try {
    const { username, password, rol } = req.body;

    if (!username || !password || !rol) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son obligatorios: username, password y rol.'
      });
    }

    const rolValido = normalizarRol(rol);
    if (!rolValido) {
      return res.status(400).json({
        success: false,
        error: 'Rol inválido. Los roles permitidos son "Administrador" y "usuario básico".'
      });
    }

    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        error: 'La contraseña debe tener al menos 4 caracteres.'
      });
    }

    const usuarioExistente = await jsonStore.findUserByUsername(username);
    if (usuarioExistente) {
      return res.status(409).json({
        success: false,
        error: `El nombre de usuario "${username}" ya se encuentra registrado.`
      });
    }

    // Hashear contraseña con bcrypt (salt = 10 rondas)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const nuevoUsuario = {
      id: Date.now().toString(),
      username: username.trim(),
      passwordHash, // Contraseña protegida con Hash
      rol: rolValido,
      createdAt: new Date().toISOString()
    };

    await jsonStore.saveUser(nuevoUsuario);

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente con contraseña cifrada (Hash).',
      usuario: {
        id: nuevoUsuario.id,
        username: nuevoUsuario.username,
        rol: nuevoUsuario.rol,
        createdAt: nuevoUsuario.createdAt,
        passwordAlmacenadoComo: 'Hash seguro (Bcrypt)'
      }
    });
  } catch (error) {
    console.error('Error en register:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor al registrar el usuario.'
    });
  }
}

/**
 * Autenticar usuario (Login)
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Debe ingresar tanto el nombre de usuario (username) como la contraseña (password).'
      });
    }

    const usuario = await jsonStore.findUserByUsername(username);
    if (!usuario) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas: el usuario no existe.'
      });
    }

    // Comparar la contraseña ingresada contra el Hash almacenado
    const passwordCorrecta = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordCorrecta) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas: contraseña incorrecta.'
      });
    }

    // Generar Token JWT
    const payload = {
      id: usuario.id,
      username: usuario.username,
      rol: usuario.rol
    };

    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn
    });

    return res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso.',
      token,
      usuario: {
        id: usuario.id,
        username: usuario.username,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor al autenticar el usuario.'
    });
  }
}

/**
 * Consultar información del usuario autenticado actual
 * GET /api/auth/me
 */
async function getProfile(req, res) {
  try {
    const usuario = await jsonStore.findUserById(req.user.id);
    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado.'
      });
    }

    return res.status(200).json({
      success: true,
      usuario: {
        id: usuario.id,
        username: usuario.username,
        rol: usuario.rol,
        createdAt: usuario.createdAt,
        passwordHashResumido: usuario.passwordHash.substring(0, 15) + '...'
      }
    });
  } catch (error) {
    console.error('Error en getProfile:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor al consultar perfil.'
    });
  }
}

/**
 * Consultar lista de todos los usuarios registrados (con información de rol y estado de hash)
 * GET /api/auth/usuarios
 */
async function getAllUsers(req, res) {
  try {
    const users = await jsonStore.readUsers();
    const sanitizados = users.map(u => ({
      id: u.id,
      username: u.username,
      rol: u.rol,
      hashSeguro: u.passwordHash ? `${u.passwordHash.substring(0, 15)}...` : null,
      createdAt: u.createdAt
    }));

    return res.status(200).json({
      success: true,
      total: sanitizados.length,
      usuarios: sanitizados
    });
  } catch (error) {
    console.error('Error en getAllUsers:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno al consultar usuarios.'
    });
  }
}

module.exports = {
  register,
  login,
  getProfile,
  getAllUsers
};
