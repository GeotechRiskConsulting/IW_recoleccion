const express = require('express');
const bodyParser = require('body-parser');
const Database = require('better-sqlite3'); // Cambio principal
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const multer = require('multer');
const sharp = require('sharp');

const app = express();
const PORT = 3000;

// Configuración mejorada
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/scripts', express.static(path.join(__dirname, 'public', 'scripts')));

// Configuración de rutas principales
app.get('/', (req, res) => {
    res.redirect('/editar-info-basica');
});

app.get('/editar-info-basica', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'editar-info-basica.html'));
});

app.get('/editar-edu-exp-hab', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'editar-edu-exp-hab.html'));
});

app.get('/editar-foto', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'editar-foto.html'));
});

// Conexión a SQLite con better-sqlite3
let db;
try {
    db = new Database('./database/database.db');
    db.pragma('journal_mode = WAL'); // Mejor rendimiento
    console.log('Conectado a SQLite correctamente con better-sqlite3');
} catch (err) {
    console.error('Error al inicializar SQLite:', err);
    process.exit(1);
}

// Configuración de multer (sin cambios)
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './public/uploads/');
    },
    filename: function(req, file, cb) {
        const userName = req.body.userName || 'usuario';
        const safeUserName = userName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const extension = path.extname(file.originalname);
        cb(null, `usuario-${req.body.userId}-${safeUserName}-${Date.now()}${extension}`);
    }
});

const upload = multer({ 
    storage: multer.diskStorage({
        destination: './public/uploads/',
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            cb(null, `temp-${Date.now()}${ext}`); 
        }
    }),
    limits: {
        fileSize: 2 * 1024 * 1024,
        files: 1
    }
});

// Crear directorio de uploads si no existe (sin cambios)
fsPromises.mkdir('./public/uploads/', { recursive: true })
    .catch(err => console.error('Error al crear directorio uploads:', err));

// Helper para manejar el archivo JSON (sin cambios)
const updateBackupFile = (newData) => {
    try {
        let existingData = [];
        const backupFile = './database/backup.json';
        
        if (fs.existsSync(backupFile)) {
            const fileContent = fs.readFileSync(backupFile, 'utf8').trim();
            
            if (fileContent) {
                existingData = fileContent.split('\n')
                    .filter(line => line.trim() !== '')
                    .map(line => {
                        try {
                            return JSON.parse(line);
                        } catch (e) {
                            console.error('Error parsing JSON line:', line);
                            return null;
                        }
                    })
                    .filter(item => item !== null);
            }
        }
        
        const userIndex = existingData.findIndex(user => user && user.id === newData.id);
        
        if (userIndex >= 0) {
            existingData[userIndex] = {
                ...existingData[userIndex],
                ...newData,
                fechaActualizacion: new Date().toISOString()
            };
        } else {
            existingData.push({
                ...newData,
                fechaRegistro: newData.fechaRegistro || new Date().toISOString()
            });
        }
        
        const stream = fs.createWriteStream(backupFile);
        existingData.forEach((user, index) => {
            stream.write(JSON.stringify(user) + (index < existingData.length - 1 ? '\n' : ''));
        });
        stream.end();
        
    } catch (err) {
        console.error('Error al actualizar backup:', err);
    }
};

// Crear tabla con validación (versión better-sqlite3)
const createTable = () => {
    try {
        db.prepare(`CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT,
            apellido TEXT,
            telefono TEXT,
            pais TEXT,
            ciudad TEXT,
            fechaNacimiento TEXT,
            aprendizajeOficio TEXT,
            sector TEXT,
            rama TEXT,
            especialidad TEXT,
            perfilAcademico TEXT,
            nivelAcademico TEXT,
            campoEstudio TEXT,
            categoria TEXT,
            oficio TEXT,
            experienciaTiempo TEXT,
            tiempoDisponible TEXT, 
            educacion TEXT,           
            experiencia TEXT,         
            habilidades TEXT,  
            fotoPerfil TEXT,                   
            fechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP
        )`).run();

        db.prepare(`CREATE TABLE IF NOT EXISTS EduExpHab (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL,
            educacion TEXT,
            experiencia TEXT,
            habilidades TEXT,
            FOREIGN KEY(userId) REFERENCES usuarios(id)
        )`).run();

        console.log('Tablas "usuarios" y "EduExpHab" verificadas/creadas');
    } catch (err) {
        console.error('Error al crear tablas:', err);
    }
};

createTable();

// Endpoint mejorado para guardar (versión better-sqlite3)
app.post('/api/guardar-perfil', (req, res) => {
    if (!req.body.pais || !req.body.ciudad) {
        return res.status(400).json({ error: 'País y ciudad son requeridos' });
    }

    const query = `
        INSERT INTO usuarios (
            nombre, apellido, telefono,
            pais, ciudad, fechaNacimiento, aprendizajeOficio, 
            sector, rama, especialidad, perfilAcademico, 
            nivelAcademico, campoEstudio, categoria, oficio, 
            experienciaTiempo, tiempoDisponible,
            educacion, experiencia, habilidades
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
        req.body.nombre || null,
        req.body.apellido || null,
        req.body.telefono || null,
        req.body.pais,
        req.body.ciudad,
        req.body.fechaNacimiento || null,
        req.body.aprendizajeOficio || null,
        req.body.sector || null,
        req.body.rama || null,
        req.body.especialidad || null,
        req.body.perfilAcademico || null,
        req.body.nivelAcademico || null,
        req.body.campoEstudio || null,
        req.body.categoria || null,
        req.body.oficio || null,
        req.body.experienciaTiempo || null,
        req.body.tiempoDisponible || null,
        '[]',
        '[]',
        '[]'
    ];

    try {
        const result = db.prepare(query).run(params);
        
        const backupData = {
            ...req.body,
            id: result.lastInsertRowid,
            educacion: [],
            experiencia: [],
            habilidades: [],
            fechaRegistro: new Date().toISOString()
        };
        
        updateBackupFile(backupData);
        return res.json({ success: true, id: result.lastInsertRowid });
    } catch (err) {
        console.error('Error en INSERT:', err);
        return res.status(500).json({ error: 'Error al guardar en base de datos' });
    }
});

app.post('/api/guardar-experiencia', (req, res) => {
    if (!req.body.userId) {
        return res.status(400).json({ error: 'userId es requerido' });
    }

    const educacionStr = JSON.stringify(req.body.educacion || []);
    const experienciaStr = JSON.stringify(req.body.experiencia || []);
    const habilidadesStr = JSON.stringify(req.body.habilidades || []);

    const query = `
        UPDATE usuarios SET
            educacion = ?,
            experiencia = ?,
            habilidades = ?
        WHERE id = ?
    `;

    try {
        db.prepare(query).run(educacionStr, experienciaStr, habilidadesStr, req.body.userId);
        
        // Obtener TODOS los datos actualizados del usuario
        const row = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.body.userId);
        
        const backupData = {
            ...row,
            educacion: JSON.parse(row.educacion || '[]'),
            experiencia: JSON.parse(row.experiencia || '[]'),
            habilidades: JSON.parse(row.habilidades || '[]'),
            fechaActualizacion: new Date().toISOString()
        };
        
        updateBackupFile(backupData);
        return res.json({ success: true, userId: req.body.userId });
    } catch (err) {
        console.error('Error al actualizar usuario:', err);
        return res.status(500).json({ error: 'Error en base de datos' });
    }
});

app.get('/api/usuario/:id', (req, res) => {
    try {
        const row = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.params.id);
        
        if (!row) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        const usuario = {
            ...row,
            educacion: row.educacion ? JSON.parse(row.educacion) : [],
            experiencia: row.experiencia ? JSON.parse(row.experiencia) : [],
            habilidades: row.habilidades ? JSON.parse(row.habilidades) : []
        };
        
        res.json(usuario);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Endpoint para subir foto (adaptado)
app.post('/api/upload-photo', upload.single('profileImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó una imagen válida' });
        }

        if (req.file.size > 2 * 1024 * 1024) {
            await fsPromises.unlink(req.file.path);
            return res.status(400).json({ 
                error: 'La imagen excede el tamaño máximo de 2MB',
                details: `Tamaño recibido: ${(req.file.size/(1024*1024)).toFixed(2)}MB`
            });
        }

        if (!req.body.userId) {
            await fsPromises.unlink(req.file.path);
            return res.status(400).json({ error: 'userId es requerido' });
        }

        const newFilename = `user-${req.body.userId}-${Date.now()}${path.extname(req.file.originalname)}`;
        const newPath = path.join('./public/uploads/', newFilename);
        await fsPromises.rename(req.file.path, newPath);
        
        const imagePath = `/uploads/${newFilename}`;
        db.prepare('UPDATE usuarios SET fotoPerfil = ? WHERE id = ?').run(imagePath, req.body.userId);

        // Actualizar backup.json
        const userData = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.body.userId);
        if (userData) {
            const backupData = {
                ...userData,
                educacion: userData.educacion ? JSON.parse(userData.educacion) : [],
                experiencia: userData.experiencia ? JSON.parse(userData.experiencia) : [],
                habilidades: userData.habilidades ? JSON.parse(userData.habilidades) : [],
                fechaActualizacion: new Date().toISOString()
            };
            
            await updateBackupFile(backupData);
        }

        res.json({ 
            success: true, 
            imagePath: imagePath,
            sizeMB: (req.file.size/(1024*1024)).toFixed(2)
        });

    } catch (error) {
        console.error('Error al procesar imagen:', error);
        if (req.file?.path) {
            await fsPromises.unlink(req.file.path).catch(console.error);
        }
        res.status(500).json({ 
            error: 'Error al procesar la imagen',
            details: error.message 
        });
    }
});

// Servir archivos estáticos desde uploads (sin cambios)
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Iniciar servidor (sin cambios)
app.listen(PORT, () => {
    console.log(`Servidor funcionando en http://localhost:${PORT}`);
    console.log(`Endpoint para guardar: POST http://localhost:${PORT}/api/guardar-perfil`);
    console.log(`Endpoint para verificar: GET http://localhost:${PORT}/api/verificar-datos`);
});