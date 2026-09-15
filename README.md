# CinemaStore Enterprise - Sistema de Gestión Cinematográfica (Parcial 1)

**Institución:** Corporación Universitaria Lasallista  
**Facultad:** Ingeniería Informática  
**Asignatura:** Desarrollo Web  
**Docente:** Néstor Vélez Vargas  
**Fecha de Entrega:** Septiembre 2026  

---

## Integrantes del Grupo

1. **[Nombre Completo Integrante 1]** - Código: `[Código Estudiantil]`
2. **[Nombre Completo Integrante 2]** - Código: `[Código Estudiantil]`
3. **[Nombre Completo Integrante 3]** - Código: `[Código Estudiantil]`

---

## Descripción del Sistema

**CinemaStore Enterprise** es una plataforma web desarrollada en **Node.js** con arquitectura RESTful y el framework **Express**, construida bajo estándares profesionales de la industria de software. Implementa:

- **Seguridad y Cifrado:** Protección de contraseñas mediante **Hash con algoritmo Bcrypt** (10 rondas de salt).
- **Autenticación Stateless:** Emisión y validación de tokens **JSON Web Tokens (JWT)** con caducidad configurada.
- **Control de Acceso Basado en Roles (RBAC):** Separación estricta de permisos entre `Administrador` y `usuario básico`.
- **Gestión Comercial de Títulos:** Módulo de alta de películas (exclusivo para Administradores con restricción HTTP 403 para usuarios básicos).
- **Consulta y Filtrado Condicional:** Catálogo accesible para usuarios autenticados y motor de consulta por año de estreno estrictamente mayor a un parámetro y precio menor o igual a otro.
- **Experiencia de Usuario Profesional:** Interfaz web moderna de nivel empresarial con navegación multi-pantalla, notificaciones Toast interactivas y acceso administrativo en portal flotante.

---

## Puesta en Marcha

### Requisitos Previos
- **Node.js** (v18.0 o superior)
- **npm** (v9.0 o superior)

### Comandos de Ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar el servidor en producción
npm start

# 3. Iniciar en modo desarrollo con recarga automática
npm run dev

# 4. Ejecutar la suite completa de pruebas automatizadas
npm test
```

Acceso al portal web: **`http://localhost:3000`**

---

## Usuarios de Demostración Precargados

| Usuario | Contraseña en texto plano | Cifrado en Base de Datos | Rol en la Plataforma |
|---|---|---|---|
| `admin` | `admin123` | `$2a$10$...` (Hash Bcrypt) | `Administrador` |
| `juan` | `juan123` | `$2a$10$...` (Hash Bcrypt) | `usuario básico` |

---

## Rúbrica de Evaluación y Documentación de la API

### 1. (1.5) Registro y Autenticación con Hash y Roles

#### A. Registro de Usuario (`POST /api/auth/register`)
- **URL:** `http://localhost:3000/api/auth/register`
- **Body JSON:**
  ```json
  {
    "username": "nuevo_usuario",
    "password": "PasswordSeguro2026",
    "rol": "usuario básico"
  }
  ```
- **Respuesta (201 Created):**
  ```json
  {
    "success": true,
    "message": "Usuario registrado exitosamente con contraseña cifrada (Hash).",
    "usuario": {
      "id": "1726413000000",
      "username": "nuevo_usuario",
      "rol": "usuario básico",
      "createdAt": "2026-09-15T10:30:00.000Z",
      "passwordAlmacenadoComo": "Hash seguro (Bcrypt)"
    }
  }
  ```

#### B. Inicio de Sesión (`POST /api/auth/login`)
- **URL:** `http://localhost:3000/api/auth/login`
- **Body JSON:**
  ```json
  {
    "username": "admin",
    "password": "admin123"
  }
  ```
- **Respuesta (200 OK):** Retorna `token` JWT y objeto `usuario`.

#### C. Consulta de Perfil de Usuario Logueado (`GET /api/auth/me`)
- **Headers:** `Authorization: Bearer <TOKEN>`

---

### 2. (1.0) Creación de Películas (Restringido a Administrador)

Campos: `Titulo`, `Director`, `Año lanzamiento`, `Productora` y `Precio`.

- **URL:** `http://localhost:3000/api/peliculas`
- **Método:** `POST`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <TOKEN_ADMIN>`
- **Body JSON:**
  ```json
  {
    "titulo": "Gladiador II",
    "director": "Ridley Scott",
    "anioLanzamiento": 2024,
    "productora": "Paramount Pictures",
    "precio": 25.50
  }
  ```
- **Respuesta Administrador (201 Created):** Registro exitoso de la película.
- **Respuesta Usuario Básico (403 Forbidden):**
  ```json
  {
    "success": false,
    "error": "Acceso no autorizado: Solo los usuarios con rol Administrador tienen permiso para realizar esta operación."
  }
  ```

---

### 3. (1.0) Consulta de Catálogo Completo (Usuarios Autenticados)

- **URL:** `http://localhost:3000/api/peliculas`
- **Método:** `GET`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Respuesta sin Token (401 Unauthorized):**
  ```json
  {
    "success": false,
    "error": "Acceso denegado: Debe iniciar sesión y proporcionar un token Bearer válido para acceder a este recurso."
  }
  ```
- **Respuesta con Token (200 OK):** Arreglo JSON con todos los títulos cinematográficos registrados.

---

### 4. (1.5) Consulta con Filtro Especial (Año > X y Precio <= Y)

- **URL:** `http://localhost:3000/api/peliculas/filtro?anio=2015&precio=30`
- **Método:** `GET`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Condición Aplicada:** `pelicula.anioLanzamiento > anio && pelicula.precio <= precio`
- **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "mensaje": "Películas con año de lanzamiento > 2015 y precio <= $30",
    "criterios": {
      "anioMayorA": 2015,
      "precioMenorOIgualA": 30
    },
    "total": 3,
    "peliculas": [ ... ]
  }
  ```

---

## Estructura del Código

```text
Parcial1/
├── package.json               # Dependencias y scripts
├── .env                       # Variables de configuración del entorno
├── .gitignore                 # Exclusiones de control de versiones Git
├── README.md                  # Especificación técnica y académica
├── data/                      # Persistencia en archivos JSON
│   ├── users.json             # Usuarios y contraseñas hasheadas
│   └── movies.json            # Catálogo de películas
├── public/                    # Frontend SPA Profesional
│   ├── index.html             # Estructura modular en pantallas
│   ├── css/styles.css         # Estilos corporativos con Toast notifications
│   └── js/app.js              # Controlador cliente y sistema de notificaciones
├── src/
│   ├── app.js                 # Configuración de Express y middlewares
│   ├── server.js              # Inicialización y arranque del servidor
│   ├── config/config.js       # Configuración global y constantes
│   ├── controllers/
│   │   ├── authController.js  # Lógica de registro, login y usuarios
│   │   └── movieController.js # Lógica de películas y filtros
│   ├── middleware/
│   │   └── auth.js            # Middleware de validación JWT y roles
│   └── storage/jsonStore.js   # Persistencia asíncrona segura en disco
└── tests/
    └── test-api.js            # Suite de pruebas automatizadas (npm test)
```

---

## Información de Entrega

- **Repositorio GitHub:** Público
- **Docente:** Néstor Vélez Vargas (`nvelez@unilasallista.edu.co`)
- **Plazo Máximo:** 15 de septiembre de 2026 - 23:59
