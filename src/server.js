const app = require('./app');
const config = require('./config/config');
const jsonStore = require('./storage/jsonStore');

async function startServer() {
  try {
    // Inicializar almacenamiento y datos semilla
    await jsonStore.initStore();

    app.listen(config.port, () => {
      console.log('====================================================');
      console.log(`🚀 Servidor ejecutándose en: http://localhost:${config.port}`);
      console.log(`🌐 Interfaz Web disponible en: http://localhost:${config.port}`);
      console.log(`📡 Endpoints API: http://localhost:${config.port}/api/status`);
      console.log('====================================================');
      console.log('Usuarios de prueba precargados:');
      console.log(' - Admin:  username="admin"   | password="admin123" | rol="Administrador"');
      console.log(' - Básico: username="juan"    | password="juan123"  | rol="usuario básico"');
      console.log('====================================================');
    });
  } catch (error) {
    console.error('Error fatal al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();
