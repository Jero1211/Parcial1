// Estado global de la aplicación (CinemaStore Enterprise)
const state = {
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  currentScreen: 'auth', // 'auth' | 'app'
  currentView: 'view-catalog', // 'view-catalog' | 'view-filter' | 'view-create'
  allMovies: [],
  filteredMovies: []
};

// ==========================================
// ELEMENTOS DEL DOM
// ==========================================

const toastContainer = document.getElementById('toast-container');

// Pantallas Principales
const screenAuth = document.getElementById('screen-auth');
const screenApp = document.getElementById('screen-app');

// Cajas de Autenticación
const authBoxLogin = document.getElementById('auth-box-login');
const authBoxRegister = document.getElementById('auth-box-register');
const btnGotoRegister = document.getElementById('btn-goto-register');
const btnGotoLogin = document.getElementById('btn-goto-login');

// Formularios de Autenticación
const formLogin = document.getElementById('form-login');
const formRegister = document.getElementById('form-register');
const btnQuickUser = document.getElementById('btn-quick-user');

// Portal de Administrador (esquina inferior derecha)
const btnOpenAdminPortal = document.getElementById('btn-open-admin-portal');
const modalAdmin = document.getElementById('modal-admin');
const btnCloseAdminModal = document.getElementById('btn-close-admin-modal');
const formAdminLogin = document.getElementById('form-admin-login');

// Barra de Navegación y Perfil
const appUsername = document.getElementById('app-username');
const appUserRole = document.getElementById('app-user-role');
const btnLogout = document.getElementById('btn-logout');
const navTabBtns = document.querySelectorAll('.nav-tab-btn');
const appScreenPanels = document.querySelectorAll('.app-screen-panel');

// Módulo 1: Catálogo Comercial
const catalogGrid = document.getElementById('catalog-grid');
const catalogCountBadge = document.getElementById('catalog-count-badge');
const btnRefreshCatalog = document.getElementById('btn-refresh-catalog');

// Módulo 2: Búsqueda y Filtros
const formFilterStandalone = document.getElementById('form-filter-standalone');
const filterParamYear = document.getElementById('filter-param-year');
const filterParamPrice = document.getElementById('filter-param-price');
const filterStatusBadge = document.getElementById('filter-status-badge');
const filterResultsGrid = document.getElementById('filter-results-grid');
const btnClearFilter = document.getElementById('btn-clear-filter');

// Módulo 3: Gestión y Alta de Películas
const formCreateMovie = document.getElementById('form-create-movie');
const roleAuthBanner = document.getElementById('role-authorization-banner');

// Modal de Diagnósticos Técnicos (Inspector)
const btnToggleInspector = document.getElementById('btn-toggle-inspector');
const modalInspector = document.getElementById('modal-inspector');
const btnCloseInspector = document.getElementById('btn-close-inspector');
const inspMethod = document.getElementById('insp-method');
const inspUrl = document.getElementById('insp-url');
const inspStatus = document.getElementById('insp-status');
const inspJson = document.getElementById('insp-json');

// ==========================================
// SISTEMA DE NOTIFICACIONES TOAST (ENTERPRISE)
// ==========================================

function showToast(title, message, type = 'info', duration = 4000) {
  if (!toastContainer) return;

  const icons = {
    success: '✅',
    error: '⛔',
    warning: '⚠️',
    info: 'ℹ️'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'alert');

  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || 'ℹ️'}</div>
    <div class="toast-content">
      <div class="toast-title">${escapeHtml(title)}</div>
      <div class="toast-message">${escapeHtml(message)}</div>
    </div>
    <button type="button" class="toast-close" aria-label="Cerrar">&times;</button>
  `;

  toast.querySelector('.toast-close').addEventListener('click', () => {
    dismissToast(toast);
  });

  toastContainer.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => {
      dismissToast(toast);
    }, duration);
  }
}

function dismissToast(toast) {
  if (!toast || toast.classList.contains('toast-hiding')) return;
  toast.classList.add('toast-hiding');
  setTimeout(() => {
    toast.remove();
  }, 300);
}

// ==========================================
// NAVEGACIÓN Y CONTROL DE VISTAS
// ==========================================

function switchMainScreen(screenName) {
  state.currentScreen = screenName;
  if (screenName === 'app' && state.token && state.user) {
    screenAuth.classList.remove('active');
    screenApp.classList.add('active');
    updateNavbarUser();
    switchAppView('view-catalog');
    loadCatalogMovies();
  } else {
    screenApp.classList.remove('active');
    screenAuth.classList.add('active');
    authBoxLogin.classList.add('active');
    authBoxRegister.classList.remove('active');
  }
}

function switchAppView(viewId) {
  state.currentView = viewId;
  navTabBtns.forEach(btn => {
    if (btn.getAttribute('data-target-view') === viewId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  appScreenPanels.forEach(panel => {
    if (panel.id === viewId) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  if (viewId === 'view-create') {
    updateCreateRoleBanner();
  }
}

function updateNavbarUser() {
  if (!state.user) return;
  appUsername.textContent = state.user.username;
  appUserRole.textContent = state.user.rol;

  const esAdmin = (state.user.rol || '').toLowerCase().includes('admin');
  if (esAdmin) {
    appUserRole.className = 'user-role-tag admin';
  } else {
    appUserRole.className = 'user-role-tag user';
  }
}

function updateCreateRoleBanner() {
  if (!state.user) return;
  const esAdmin = (state.user.rol || '').toLowerCase().includes('admin');

  if (esAdmin) {
    roleAuthBanner.className = 'role-auth-banner admin-allowed';
    roleAuthBanner.innerHTML = `
      <span style="font-size: 1.4rem;">🛡️</span>
      <div>
        <strong>Permiso Concedido: Administrador (${state.user.username})</strong>
        <p style="margin: 0; font-size: 0.85rem; opacity: 0.9;">Cuenta con autorización completa para registrar nuevos títulos en el catálogo comercial.</p>
      </div>
    `;
  } else {
    roleAuthBanner.className = 'role-auth-banner basic-denied';
    roleAuthBanner.innerHTML = `
      <span style="font-size: 1.4rem;">⚠️</span>
      <div>
        <strong>Permiso Restringido: ${state.user.rol}</strong>
        <p style="margin: 0; font-size: 0.85rem; opacity: 0.9;">El sistema exige privilegios de Administrador para registrar títulos. Si intenta guardar, la API responderá con estado <strong>403 No Autorizado</strong>.</p>
      </div>
    `;
  }
}

// ==========================================
// REGISTRO TÉCNICO HTTP (DIAGNÓSTICOS)
// ==========================================

function logHttp(method, url, status, data) {
  if (!inspMethod) return;
  inspMethod.textContent = method;
  inspMethod.className = `insp-method-tag ${method}`;
  inspUrl.textContent = url;
  inspStatus.textContent = `${status}`;
  inspStatus.className = 'insp-status-tag';

  if (status >= 200 && status < 300) {
    inspStatus.classList.add('s2xx');
  } else {
    inspStatus.classList.add('s4xx');
  }

  inspJson.textContent = JSON.stringify(data, null, 2);
}

async function apiCall(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }

  try {
    const res = await fetch(url, { ...options, headers });
    let data;
    try {
      data = await res.json();
    } catch {
      data = { raw: await res.text() };
    }

    logHttp(options.method || 'GET', url, res.status, data);
    return { ok: res.ok, status: res.status, data };
  } catch (error) {
    logHttp(options.method || 'GET', url, 'ERROR', { error: error.message });
    return { ok: false, status: 0, data: { error: error.message } };
  }
}

// ==========================================
// AUTENTICACIÓN
// ==========================================

async function performLogin(username, password) {
  const res = await apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });

  if (res.ok && res.data.token) {
    state.token = res.data.token;
    state.user = res.data.usuario;
    localStorage.setItem('token', state.token);
    localStorage.setItem('user', JSON.stringify(state.user));
    switchMainScreen('app');
    showToast('Sesión Iniciada', `Bienvenido(a), ${state.user.username}. Rol: ${state.user.rol}.`, 'success');
    return true;
  } else {
    showToast('Error de Autenticación', res.data.error || 'Credenciales incorrectas. Verifique usuario y contraseña.', 'error');
    return false;
  }
}

function performLogout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  switchMainScreen('auth');
  showToast('Sesión Finalizada', 'Ha cerrado sesión en la plataforma.', 'info');
}

// ==========================================
// RENDERIZADO DE TÍTULOS
// ==========================================

function createMovieCardHtml(m) {
  return `
    <div class="movie-presentation-card">
      <div class="movie-card-banner">
        <span class="movie-pill-year">Estreno: ${m.anioLanzamiento}</span>
        <span class="movie-price-highlight">$${Number(m.precio).toFixed(2)}</span>
      </div>
      <div class="movie-card-content">
        <h3 class="movie-presentation-title">${escapeHtml(m.titulo)}</h3>
        <div class="movie-attributes-list">
          <span><strong>Director(a):</strong> ${escapeHtml(m.director)}</span>
          <span><strong>Productora:</strong> ${escapeHtml(m.productora)}</span>
          <span><strong>Gestor:</strong> ${escapeHtml(m.creadoPor || 'Sistema')}</span>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function loadCatalogMovies(silent = false) {
  catalogCountBadge.textContent = 'Sincronizando inventario comercial...';
  const res = await apiCall('/api/peliculas');
  if (res.ok && res.data.peliculas) {
    state.allMovies = res.data.peliculas;
    catalogCountBadge.textContent = `${state.allMovies.length} títulos disponibles en el catálogo comercial`;

    if (state.allMovies.length === 0) {
      catalogGrid.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-icon-lg">🎞️</div>
          <p>No se registran títulos cinematográficos en el inventario.</p>
        </div>
      `;
    } else {
      catalogGrid.innerHTML = state.allMovies.map(createMovieCardHtml).join('');
    }

    if (!silent) {
      showToast('Inventario Sincronizado', `${state.allMovies.length} títulos cargados exitosamente.`, 'info', 2500);
    }
  } else {
    catalogCountBadge.textContent = 'Error al consultar inventario';
    catalogGrid.innerHTML = `
      <div class="empty-state-card">
        <div class="empty-icon-lg">⚠️</div>
        <p>${escapeHtml(res.data.error || 'No fue posible acceder al catálogo.')}</p>
      </div>
    `;
    showToast('Error de Conexión', res.data.error || 'No se pudo sincronizar el catálogo.', 'error');
  }
}

// ==========================================
// EVENT LISTENERS
// ==========================================

btnGotoRegister?.addEventListener('click', () => {
  authBoxLogin.classList.remove('active');
  authBoxRegister.classList.add('active');
});

btnGotoLogin?.addEventListener('click', () => {
  authBoxRegister.classList.remove('active');
  authBoxLogin.classList.add('active');
});

formLogin?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  await performLogin(username, password);
});

btnQuickUser?.addEventListener('click', async () => {
  await performLogin('juan', 'juan123');
});

formRegister?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value;
  const rol = document.getElementById('reg-role').value;

  const res = await apiCall('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, rol })
  });

  if (res.ok) {
    showToast('Cuenta Creada', `El usuario "${username}" fue registrado con contraseña cifrada (Hash).`, 'success');
    await performLogin(username, password);
    formRegister.reset();
  } else {
    showToast('Registro Rechazado', res.data.error || 'No se pudo completar el registro.', 'error');
  }
});

btnOpenAdminPortal?.addEventListener('click', () => {
  modalAdmin.classList.add('active');
});

btnCloseAdminModal?.addEventListener('click', () => {
  modalAdmin.classList.remove('active');
});

modalAdmin?.addEventListener('click', (e) => {
  if (e.target === modalAdmin) {
    modalAdmin.classList.remove('active');
  }
});

formAdminLogin?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('admin-login-username').value.trim();
  const password = document.getElementById('admin-login-password').value;
  const success = await performLogin(username, password);
  if (success) {
    modalAdmin.classList.remove('active');
  }
});

navTabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetView = btn.getAttribute('data-target-view');
    switchAppView(targetView);
  });
});

btnRefreshCatalog?.addEventListener('click', () => {
  loadCatalogMovies(false);
});

formFilterStandalone?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const anio = filterParamYear.value;
  const precio = filterParamPrice.value;

  filterStatusBadge.textContent = `Filtrando títulos con Año > ${anio} y Precio <= $${precio}...`;
  filterResultsGrid.innerHTML = `
    <div class="empty-state-card">
      <div class="empty-icon-lg">⏳</div>
      <p>Consultando base de datos cinematográfica...</p>
    </div>
  `;

  const res = await apiCall(`/api/peliculas/filtro?anio=${encodeURIComponent(anio)}&precio=${encodeURIComponent(precio)}`);

  if (res.ok && res.data.peliculas) {
    state.filteredMovies = res.data.peliculas;
    btnClearFilter.style.display = 'inline-block';
    filterStatusBadge.textContent = `${state.filteredMovies.length} título(s) coincidente(s) con Año > ${anio} y Precio <= $${precio}`;

    if (state.filteredMovies.length === 0) {
      filterResultsGrid.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-icon-lg">🔍</div>
          <p>No se encontraron títulos con año posterior a <strong>${anio}</strong> y precio hasta <strong>$${precio}</strong>.</p>
        </div>
      `;
    } else {
      filterResultsGrid.innerHTML = state.filteredMovies.map(createMovieCardHtml).join('');
    }

    showToast('Filtro Aplicado', `Se obtuvieron ${state.filteredMovies.length} películas que cumplen con los criterios.`, 'success');
  } else {
    filterStatusBadge.textContent = 'Error al ejecutar los filtros comerciales';
    showToast('Error en Filtros', res.data.error || 'No fue posible aplicar el filtro.', 'error');
  }
});

btnClearFilter?.addEventListener('click', () => {
  filterResultsGrid.innerHTML = '';
  btnClearFilter.style.display = 'none';
  filterStatusBadge.textContent = 'Configure los parámetros y pulse "Aplicar Filtros Comerciales".';
  showToast('Filtros Restablecidos', 'Puede definir nuevos parámetros de búsqueda.', 'info', 2500);
});

formCreateMovie?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const titulo = document.getElementById('movie-title').value.trim();
  const director = document.getElementById('movie-director').value.trim();
  const anioLanzamiento = document.getElementById('movie-year').value;
  const productora = document.getElementById('movie-studio').value.trim();
  const precio = document.getElementById('movie-price').value;

  const res = await apiCall('/api/peliculas', {
    method: 'POST',
    body: JSON.stringify({
      titulo,
      director,
      anioLanzamiento,
      productora,
      precio
    })
  });

  if (res.ok) {
    showToast('Título Registrado con Éxito', `La película "${titulo}" ha sido dada de alta en el catálogo comercial.`, 'success', 5000);
    formCreateMovie.reset();
    switchAppView('view-catalog');
    loadCatalogMovies(true);
  } else {
    showToast(
      `Acceso Denegado (Código ${res.status})`,
      res.data.error || 'No está autorizado para realizar esta acción. Solo administradores pueden crear películas.',
      'error',
      6000
    );
  }
});

btnLogout?.addEventListener('click', () => {
  performLogout();
});

btnToggleInspector?.addEventListener('click', () => {
  modalInspector.classList.add('active');
});

btnCloseInspector?.addEventListener('click', () => {
  modalInspector.classList.remove('active');
});

modalInspector?.addEventListener('click', (e) => {
  if (e.target === modalInspector) {
    modalInspector.classList.remove('active');
  }
});

// Inicialización de la aplicación
if (state.token && state.user) {
  switchMainScreen('app');
} else {
  switchMainScreen('auth');
}
