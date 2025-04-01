const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg'); // Reemplazamos better-sqlite3 por pg
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const multer = require('multer');
const sharp = require('sharp');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Configura CORS
app.use(cors({
    origin: ['https://iw-recoleccion.onrender.com', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configuración mejorada
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/scripts', express.static(path.join(__dirname, 'public', 'scripts')));

// Conexión a PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Verificar conexión a PostgreSQL
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error al conectar a PostgreSQL:', err);
        process.exit(1);
    }
    console.log('Conectado a PostgreSQL correctamente');
    release();
});

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

// Crear directorio de uploads si no existe
fsPromises.mkdir('./public/uploads/', { recursive: true })
    .catch(err => console.error('Error al crear directorio uploads:', err));

// Helper para manejar el archivo JSON (opcional, puedes mantenerlo como backup adicional)
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

// Crear tablas en PostgreSQL
const createTables = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
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
                fechaRegistro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS eduexphab (
                id SERIAL PRIMARY KEY,
                userId INTEGER NOT NULL,
                educacion TEXT,
                experiencia TEXT,
                habilidades TEXT,
                FOREIGN KEY(userId) REFERENCES usuarios(id) ON DELETE CASCADE
            )
        `);

        console.log('Tablas creadas/verificadas en PostgreSQL');
    } catch (err) {
        console.error('Error al crear tablas:', err);
    }
};

createTables();

// Configuración de rutas principales (sin cambios)
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

// Endpoint para guardar perfil (adaptado a PostgreSQL)
app.post('/api/guardar-perfil', async (req, res) => {
    if (!req.body.pais || !req.body.ciudad) {
        return res.status(400).json({ error: 'País y ciudad son requeridos' });
    }

    const query = `
        INSERT INTO usuarios (
            nombre, apellido, telefono, pais, ciudad, fechaNacimiento, 
            aprendizajeOficio, sector, rama, especialidad, perfilAcademico, 
            nivelAcademico, campoEstudio, categoria, oficio, 
            experienciaTiempo, tiempoDisponible, educacion, experiencia, habilidades
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        RETURNING *
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
        const result = await pool.query(query, params);
        const newUser = result.rows[0];
        
        const backupData = {
            ...req.body,
            id: newUser.id,
            educacion: [],
            experiencia: [],
            habilidades: [],
            fechaRegistro: new Date().toISOString()
        };
        
        updateBackupFile(backupData);
        return res.json({ success: true, id: newUser.id });
    } catch (err) {
        console.error('Error en INSERT:', err);
        return res.status(500).json({ error: 'Error al guardar en base de datos' });
    }
});

// Endpoint para guardar experiencia (adaptado a PostgreSQL)
app.post('/api/guardar-experiencia', async (req, res) => {
    if (!req.body.userId) {
        return res.status(400).json({ error: 'userId es requerido' });
    }

    const educacionStr = JSON.stringify(req.body.educacion || []);
    const experienciaStr = JSON.stringify(req.body.experiencia || []);
    const habilidadesStr = JSON.stringify(req.body.habilidades || []);

    const query = `
        UPDATE usuarios SET
            educacion = $1,
            experiencia = $2,
            habilidades = $3
        WHERE id = $4
        RETURNING *
    `;

    try {
        const result = await pool.query(query, [educacionStr, experienciaStr, habilidadesStr, req.body.userId]);
        const updatedUser = result.rows[0];
        
        const backupData = {
            ...updatedUser,
            educacion: JSON.parse(updatedUser.educacion || '[]'),
            experiencia: JSON.parse(updatedUser.experiencia || '[]'),
            habilidades: JSON.parse(updatedUser.habilidades || '[]'),
            fechaActualizacion: new Date().toISOString()
        };
        
        updateBackupFile(backupData);
        return res.json({ success: true, userId: req.body.userId });
    } catch (err) {
        console.error('Error al actualizar usuario:', err);
        return res.status(500).json({ error: 'Error en base de datos' });
    }
});

// Endpoint para obtener usuario (adaptado a PostgreSQL)
app.get('/api/usuario/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE id = $1', [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        const usuario = {
            ...result.rows[0],
            educacion: result.rows[0].educacion ? JSON.parse(result.rows[0].educacion) : [],
            experiencia: result.rows[0].experiencia ? JSON.parse(result.rows[0].experiencia) : [],
            habilidades: result.rows[0].habilidades ? JSON.parse(result.rows[0].habilidades) : []
        };
        
        res.json(usuario);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Endpoint para subir foto (adaptado a PostgreSQL)
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
        await pool.query('UPDATE usuarios SET fotoPerfil = $1 WHERE id = $2', [imagePath, req.body.userId]);

        // Actualizar backup.json (opcional)
        const userResult = await pool.query('SELECT * FROM usuarios WHERE id = $1', [req.body.userId]);
        if (userResult.rows.length > 0) {
            const userData = userResult.rows[0];
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

// Servir archivos estáticos desde uploads
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor funcionando en puerto ${PORT}`);
    console.log(`- Local: http://localhost:${PORT}`);
    console.log(`- Remoto: https://iw-recoleccion.onrender.com`);
    console.log(`Endpoint para guardar: POST /api/guardar-perfil`);
});