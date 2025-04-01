// 📂 install-service.js
const { Service } = require('node-windows');

// 1. Configuración del servicio
const svc = new Service({
  name: 'ServidorRecoleccionDatos', // Nombre del servicio (aparecerá en services.msc)
  description: 'Servicio para la recolección de datos desde dispositivos móviles', // Descripción
  script: 'C:\\Users\\Acer\\Desktop\\GRC_Project\\iWork\\base_datos_local\\server.js', // 🔴 ¡Reemplaza esta ruta!
   env: [{
    name: "NODE_ENV",
    value: "production"
  }]
});

// 2. Evento cuando se instale
svc.on('install', () => {
  console.log('✅ Servicio instalado correctamente.');
  svc.start(); // Inicia el servicio automáticamente después de instalarlo
});

// 3. Instalar el servicio
svc.install();