const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const MOVIES_FILE = path.join(DATA_DIR, 'movies.json');

// Inicializar archivos y datos semilla si no existen
async function initStore() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });

    // Verificar usuarios
    try {
      await fs.access(USERS_FILE);
    } catch {
      const defaultUsers = [
        {
          id: '1',
          username: 'admin',
          passwordHash: bcrypt.hashSync('admin123', 10),
          rol: 'Administrador',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          username: 'juan',
          passwordHash: bcrypt.hashSync('juan123', 10),
          rol: 'usuario básico',
          createdAt: new Date().toISOString()
        }
      ];
      await fs.writeFile(USERS_FILE, JSON.stringify(defaultUsers, null, 2), 'utf-8');
      console.log('✅ Archivo data/users.json creado con usuarios iniciales (admin y juan).');
    }

    // Verificar películas
    try {
      await fs.access(MOVIES_FILE);
    } catch {
      const defaultMovies = [
        {
          id: '1',
          titulo: 'Matrix',
          director: 'Hermanas Wachowski',
          anioLanzamiento: 1999,
          productora: 'Warner Bros',
          precio: 15.00,
          creadoPor: 'admin',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          titulo: 'Interstellar',
          director: 'Christopher Nolan',
          anioLanzamiento: 2014,
          productora: 'Paramount Pictures',
          precio: 25.50,
          creadoPor: 'admin',
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          titulo: 'Spider-Man: Un Nuevo Universo',
          director: 'Peter Ramsey',
          anioLanzamiento: 2018,
          productora: 'Sony Pictures',
          precio: 20.00,
          creadoPor: 'admin',
          createdAt: new Date().toISOString()
        },
        {
          id: '4',
          titulo: 'Avengers: Endgame',
          director: 'Anthony y Joe Russo',
          anioLanzamiento: 2019,
          productora: 'Marvel Studios',
          precio: 30.00,
          creadoPor: 'admin',
          createdAt: new Date().toISOString()
        },
        {
          id: '5',
          titulo: 'Oppenheimer',
          director: 'Christopher Nolan',
          anioLanzamiento: 2023,
          productora: 'Universal Pictures',
          precio: 28.00,
          creadoPor: 'admin',
          createdAt: new Date().toISOString()
        },
        {
          id: '6',
          titulo: 'Dune: Parte Dos',
          director: 'Denis Villeneuve',
          anioLanzamiento: 2024,
          productora: 'Warner Bros',
          precio: 35.00,
          creadoPor: 'admin',
          createdAt: new Date().toISOString()
        }
      ];
      await fs.writeFile(MOVIES_FILE, JSON.stringify(defaultMovies, null, 2), 'utf-8');
      console.log('✅ Archivo data/movies.json creado con películas iniciales.');
    }
  } catch (error) {
    console.error('Error al inicializar almacenamiento JSON:', error);
  }
}

// Métodos de usuarios
async function readUsers() {
  await initStore();
  const data = await fs.readFile(USERS_FILE, 'utf-8');
  return JSON.parse(data || '[]');
}

async function writeUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

async function findUserByUsername(username) {
  const users = await readUsers();
  return users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
}

async function findUserById(id) {
  const users = await readUsers();
  return users.find(u => u.id === id);
}

async function saveUser(newUser) {
  const users = await readUsers();
  users.push(newUser);
  await writeUsers(users);
  return newUser;
}

// Métodos de películas
async function readMovies() {
  await initStore();
  const data = await fs.readFile(MOVIES_FILE, 'utf-8');
  return JSON.parse(data || '[]');
}

async function writeMovies(movies) {
  await fs.writeFile(MOVIES_FILE, JSON.stringify(movies, null, 2), 'utf-8');
}

async function saveMovie(newMovie) {
  const movies = await readMovies();
  movies.push(newMovie);
  await writeMovies(movies);
  return newMovie;
}

module.exports = {
  initStore,
  readUsers,
  findUserByUsername,
  findUserById,
  saveUser,
  readMovies,
  saveMovie
};
