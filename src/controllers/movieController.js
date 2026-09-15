const jsonStore = require('../storage/jsonStore');

/**
 * Helper para extraer y normalizar los campos de una película
 */
function extraerDatosPelicula(body) {
  const titulo = body.titulo || body.Titulo;
  const director = body.director || body.Director;
  const productora = body.productora || body.Productora;
  
  // Acepta diferentes nombres de propiedad para el año
  const anioLanzamiento = body.anioLanzamiento ?? body.añoLanzamiento ?? body.anio_lanzamiento ?? body.anio ?? body.año ?? body['Año lanzamiento'] ?? body['Año Lanzamiento'];
  
  // Acepta diferentes nombres de propiedad para el precio
  const precio = body.precio ?? body.Precio;

  return { titulo, director, productora, anioLanzamiento, precio };
}

/**
 * 2. (1.0) Crear película (Solo Administrador)
 * POST /api/peliculas
 */
async function createMovie(req, res) {
  try {
    const { titulo, director, productora, anioLanzamiento, precio } = extraerDatosPelicula(req.body);

    // Validar campos requeridos
    if (!titulo || !director || !productora || anioLanzamiento === undefined || precio === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son obligatorios: Titulo, Director, Año lanzamiento, Productora y Precio.'
      });
    }

    const anioNum = parseInt(anioLanzamiento, 10);
    const precioNum = parseFloat(precio);

    if (isNaN(anioNum) || anioNum < 1888 || anioNum > 2100) {
      return res.status(400).json({
        success: false,
        error: 'El campo "Año lanzamiento" debe ser un número de año válido (ej. 2024).'
      });
    }

    if (isNaN(precioNum) || precioNum < 0) {
      return res.status(400).json({
        success: false,
        error: 'El campo "Precio" debe ser un número mayor o igual a 0.'
      });
    }

    const nuevaPelicula = {
      id: Date.now().toString(),
      titulo: titulo.trim(),
      director: director.trim(),
      anioLanzamiento: anioNum,
      productora: productora.trim(),
      precio: precioNum,
      creadoPor: req.user.username,
      createdAt: new Date().toISOString()
    };

    await jsonStore.saveMovie(nuevaPelicula);

    return res.status(201).json({
      success: true,
      message: 'Película creada exitosamente.',
      pelicula: nuevaPelicula
    });
  } catch (error) {
    console.error('Error al crear película:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor al crear la película.'
    });
  }
}

/**
 * 3. (1.0) Consultar todas las películas (solo usuarios logueados: Administrador y usuario básico)
 * También soporta parámetros de consulta ?anio=X&precio=Y opcionales
 * GET /api/peliculas
 */
async function getAllMovies(req, res) {
  try {
    const peliculas = await jsonStore.readMovies();

    // Si se enviaron parámetros de filtrado en el query string, aplicar el punto 4 automáticamente
    const anioParam = req.query.anio || req.query.anioMin || req.query.year;
    const precioParam = req.query.precio || req.query.precioMax || req.query.price;

    if (anioParam !== undefined && precioParam !== undefined) {
      const anioNum = parseInt(anioParam, 10);
      const precioNum = parseFloat(precioParam);

      if (isNaN(anioNum) || isNaN(precioNum)) {
        return res.status(400).json({
          success: false,
          error: 'Los parámetros "anio" y "precio" deben ser valores numéricos.'
        });
      }

      // Requisito 4: anioLanzamiento > anioParam Y precio <= precioParam
      const filtradas = peliculas.filter(
        p => p.anioLanzamiento > anioNum && p.precio <= precioNum
      );

      return res.status(200).json({
        success: true,
        tipo: 'filtro',
        criterios: {
          anioMayorA: anioNum,
          precioMenorOIgualA: precioNum
        },
        total: filtradas.length,
        peliculas: filtradas
      });
    }

    // Requisito 3: Todas las películas
    return res.status(200).json({
      success: true,
      total: peliculas.length,
      peliculas
    });
  } catch (error) {
    console.error('Error al obtener películas:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener las películas.'
    });
  }
}

/**
 * 4. (1.5) Consultar películas filtradas:
 * Año de lanzamiento MAYOR al ingresado por parámetro
 * Precio MENOR O IGUAL al valor pasado por parámetro
 * GET /api/peliculas/filtro?anio=2015&precio=30
 */
async function getMoviesFiltered(req, res) {
  try {
    const anioParam = req.query.anio ?? req.query.anioMin ?? req.query.year;
    const precioParam = req.query.precio ?? req.query.precioMax ?? req.query.maxPrecio ?? req.query.price;

    if (anioParam === undefined || precioParam === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Debe proporcionar ambos parámetros de consulta: "anio" (año mayor a) y "precio" (precio menor o igual a). Ejemplo: /api/peliculas/filtro?anio=2015&precio=30'
      });
    }

    const anioNum = parseInt(anioParam, 10);
    const precioNum = parseFloat(precioParam);

    if (isNaN(anioNum) || isNaN(precioNum)) {
      return res.status(400).json({
        success: false,
        error: 'Los valores de "anio" y "precio" deben ser números válidos.'
      });
    }

    const peliculas = await jsonStore.readMovies();

    // Condición requerida: anio > anioNum && precio <= precioNum
    const resultado = peliculas.filter(
      p => p.anioLanzamiento > anioNum && p.precio <= precioNum
    );

    return res.status(200).json({
      success: true,
      mensaje: `Películas con año de lanzamiento > ${anioNum} y precio <= $${precioNum}`,
      criterios: {
        anioMayorA: anioNum,
        precioMenorOIgualA: precioNum
      },
      total: resultado.length,
      peliculas: resultado
    });
  } catch (error) {
    console.error('Error al filtrar películas:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor al filtrar películas.'
    });
  }
}

module.exports = {
  createMovie,
  getAllMovies,
  getMoviesFiltered
};
