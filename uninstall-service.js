// 📂 uninstall-service.js
const { Service } = require('node-windows');
const svc = new Service({ name: 'ServidorRecoleccionDatos' });

svc.on('uninstall', () => console.log('❌ Servicio desinstalado.'));
svc.uninstall();