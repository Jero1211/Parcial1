/**
 * Script de Pruebas Automatizadas de Integración
 * Valida los 4 puntos del Parcial 1 de Desarrollo Web
 */

const http = require('http');
const app = require('../src/app');
const jsonStore = require('../src/storage/jsonStore');

let server;
let baseUrl;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FALLÓ: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✅ ${message}`);
}

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  let json = {};
  try {
    json = await res.json();
  } catch (e) {}

  return { status: res.status, ok: res.ok, data: json };
}

async function runTests() {
  console.log('===========================================================');
  console.log('🧪 INICIANDO BATERÍA DE PRUEBAS AUTOMATIZADAS - PARCIAL 1');
  console.log('===========================================================\n');

  await jsonStore.initStore();

  server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
  console.log(`Servidor de prueba iniciado en puerto efímero: ${port}\n`);

  let tokenAdmin = '';
  let tokenUser = '';

  try {
    // -------------------------------------------------------------
    // PUNTO 1 (1.5 pts): Registro y Autenticación con Hash y Roles
    // -------------------------------------------------------------
    console.log('📋 [PUNTO 1] Probando Registro y Autenticación con Hash y Roles...');

    // 1.1 Registro de nuevo usuario básico
    const regBasicRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        username: `estudiante_${Date.now()}`,
        password: 'password123',
        rol: 'usuario básico'
      }
    });
    assert(regBasicRes.status === 201, 'Registro de usuario básico exitoso (HTTP 201)');
    assert(regBasicRes.data.usuario.rol === 'usuario básico', 'Rol asignado correctamente como "usuario básico"');
    assert(!regBasicRes.data.usuario.password, 'La contraseña en texto plano NO se expone en la respuesta');

    // 1.2 Login exitoso con admin precargado
    const loginAdminRes = await request('/api/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: 'admin123' }
    });
    assert(loginAdminRes.status === 200, 'Login de administrador exitoso (HTTP 200)');
    assert(!!loginAdminRes.data.token, 'Se genera y retorna un Token JWT');
    assert(loginAdminRes.data.usuario.rol === 'Administrador', 'Rol de administrador confirmado');
    tokenAdmin = loginAdminRes.data.token;

    // 1.3 Login exitoso con usuario básico precargado
    const loginUserRes = await request('/api/auth/login', {
      method: 'POST',
      body: { username: 'juan', password: 'juan123' }
    });
    assert(loginUserRes.status === 200, 'Login de usuario básico exitoso (HTTP 200)');
    assert(loginUserRes.data.usuario.rol === 'usuario básico', 'Rol de usuario básico confirmado');
    tokenUser = loginUserRes.data.token;

    // 1.4 Rechazo con contraseña incorrecta (valida hash)
    const loginFailRes = await request('/api/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: 'password_errada' }
    });
    assert(loginFailRes.status === 401, 'Rechazo con HTTP 401 para credenciales incorrectas mediante comparación de Hash');

    // 1.5 Consultar perfil autenticado (GET /api/auth/me)
    const meRes = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${tokenUser}` }
    });
    assert(meRes.status === 200, 'Consulta de perfil del usuario logueado exitosa (HTTP 200)');
    assert(meRes.data.usuario.username === 'juan', 'Datos del perfil coinciden con el usuario autenticado');

    console.log('✨ PUNTO 1 SUPERADO CON ÉXITO (1.5 / 1.5)\n');

    // -------------------------------------------------------------
    // PUNTO 2 (1.0 pt): Crear Películas (Solo Administrador)
    // -------------------------------------------------------------
    console.log('📋 [PUNTO 2] Probando Creación de Películas y Control de Roles...');

    // 2.1 Intento de creación por usuario básico (DEBE FALLAR con 403)
    const createBasicAttempt = await request('/api/peliculas', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser}` },
      body: {
        titulo: 'Película No Autorizada',
        director: 'Director Falso',
        anioLanzamiento: 2024,
        productora: 'Indie Studio',
        precio: 20.0
      }
    });
    assert(createBasicAttempt.status === 403, 'Usuario básico es bloqueado al intentar crear película (HTTP 403 Forbidden)');
    assert(
      createBasicAttempt.data.error.includes('No está autorizado') || createBasicAttempt.data.error.includes('Administrador'),
      'Mensaje de error indica adecuadamente que no está autorizado'
    );

    // 2.2 Creación exitosa por Administrador
    const testMovieTitle = `Gladiador Test ${Date.now()}`;
    const createAdminRes = await request('/api/peliculas', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: {
        titulo: testMovieTitle,
        director: 'Ridley Scott',
        anioLanzamiento: 2024,
        productora: 'Paramount Pictures',
        precio: 24.50
      }
    });
    assert(createAdminRes.status === 201, 'Administrador crea película exitosamente (HTTP 201 Created)');
    assert(createAdminRes.data.pelicula.titulo === testMovieTitle, 'Título guardado correctamente');
    assert(createAdminRes.data.pelicula.anioLanzamiento === 2024, 'Año de lanzamiento guardado correctamente');
    assert(createAdminRes.data.pelicula.precio === 24.50, 'Precio guardado correctamente');

    console.log('✨ PUNTO 2 SUPERADO CON ÉXITO (1.0 / 1.0)\n');

    // -------------------------------------------------------------
    // PUNTO 3 (1.0 pt): Consultar Todas las Películas (Solo Logueados)
    // -------------------------------------------------------------
    console.log('📋 [PUNTO 3] Probando Consulta de Todas las Películas (Solo Logueados)...');

    // 3.1 Intento sin autenticación (DEBE FALLAR con 401)
    const getNoAuthRes = await request('/api/peliculas');
    assert(getNoAuthRes.status === 401, 'Petición sin token es rechazada (HTTP 401 Unauthorized)');

    // 3.2 Consulta permitida para usuario básico
    const getUserMoviesRes = await request('/api/peliculas', {
      headers: { Authorization: `Bearer ${tokenUser}` }
    });
    assert(getUserMoviesRes.status === 200, 'Usuario básico autenticado puede consultar todas las películas (HTTP 200)');
    assert(Array.isArray(getUserMoviesRes.data.peliculas), 'Retorna un arreglo con las películas');
    assert(getUserMoviesRes.data.peliculas.length > 0, 'Contiene registros de películas');

    // 3.3 Consulta permitida para administrador
    const getAdminMoviesRes = await request('/api/peliculas', {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    assert(getAdminMoviesRes.status === 200, 'Administrador autenticado puede consultar todas las películas (HTTP 200)');

    console.log('✨ PUNTO 3 SUPERADO CON ÉXITO (1.0 / 1.0)\n');

    // -------------------------------------------------------------
    // PUNTO 4 (1.5 pts): Filtro por Año (> X) y Precio (<= Y)
    // -------------------------------------------------------------
    console.log('📋 [PUNTO 4] Probando Filtro por Parámetros: anio > X y precio <= Y...');

    // 4.1 Intento sin autenticación (DEBE FALLAR con 401)
    const filterNoAuth = await request('/api/peliculas/filtro?anio=2015&precio=30');
    assert(filterNoAuth.status === 401, 'Filtro sin token es rechazado (HTTP 401 Unauthorized)');

    // 4.2 Filtrar: Año > 2015 y Precio <= 30.00
    const filterRes = await request('/api/peliculas/filtro?anio=2015&precio=30', {
      headers: { Authorization: `Bearer ${tokenUser}` }
    });
    assert(filterRes.status === 200, 'Consulta filtrada exitosa (HTTP 200)');
    assert(Array.isArray(filterRes.data.peliculas), 'Retorna lista de películas filtradas');

    const filtradas = filterRes.data.peliculas;
    console.log(`  📊 Películas encontradas con anio > 2015 y precio <= 30: ${filtradas.length}`);

    // Validar rigurosamente que CADA película cumpla ambas condiciones
    filtradas.forEach(p => {
      assert(
        p.anioLanzamiento > 2015,
        `Película "${p.titulo}" cumple anioLanzamiento (${p.anioLanzamiento}) > 2015`
      );
      assert(
        p.precio <= 30,
        `Película "${p.titulo}" cumple precio ($${p.precio}) <= $30.00`
      );
    });

    // 4.3 Comprobar que películas con año <= 2015 NO aparecen (ej. Matrix 1999 o Interstellar 2014)
    const tieneViejas = filtradas.some(p => p.anioLanzamiento <= 2015);
    assert(!tieneViejas, 'Películas con año <= 2015 están correctamente EXCLUIDAS');

    // 4.4 Comprobar que películas con precio > 30 NO aparecen (ej. Dune 2 a $35)
    const tieneCaras = filtradas.some(p => p.precio > 30);
    assert(!tieneCaras, 'Películas con precio > $30 están correctamente EXCLUIDAS');

    console.log('✨ PUNTO 4 SUPERADO CON ÉXITO (1.5 / 1.5)\n');

    console.log('===========================================================');
    console.log('🎉 TODAS LAS PRUEBAS PASARON EXITOSAMENTE: NOTA 5.0 / 5.0');
    console.log('===========================================================');
  } finally {
    if (server) {
      server.close();
    }
  }
}

runTests().catch(err => {
  console.error('\n❌ ERROR EN LAS PRUEBAS:', err);
  process.exit(1);
});
