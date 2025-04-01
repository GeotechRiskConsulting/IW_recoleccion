document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("perfilForm");

    // Elementos del formulario
    const nombreInput = document.getElementById("nombre");
    const apellidoInput = document.getElementById("apellido");
    const telefonoInput = document.getElementById("telefono");

    const paisSelect = document.getElementById("pais");
    const ciudadSelect = document.getElementById("ciudad");
    const fechaNacimiento = document.getElementById("fechaNacimiento");
    const aprendizajeOficio = document.getElementById("aprendizajeOficio");
    const seccionProfesional = document.getElementById("seccionProfesional");
    const seccionProfesionalAcademica = document.getElementById("seccionProfesionalAcademica");
    const seccionEmpirico = document.getElementById("seccionEmpirico");
    const sectorSelect = document.getElementById("sector");
    const ramaSelect = document.getElementById("rama");
    const especialidadSelect = document.getElementById("especialidad");
    const perfilAcademico = document.getElementById("perfilAcademico");
    const nivelAcademico = document.getElementById("nivelAcademico");
    const campoEstudioContainer = document.getElementById("campoEstudioContainer");
    const campoEstudio = document.getElementById("campoEstudio");
    const categoriaSelect = document.getElementById("categoria");
    const oficioSelect = document.getElementById("oficio");
    const experienciaTiempo = document.getElementById("experiencia_tiempo");
    const tiempoDisponible = document.getElementById("tiempoDisponible");

    // Variable para almacenar los datos originales del usuario
    let datosOriginales = {};

    // Función para procesar el archivo .txt y convertirlo en un objeto JSON
    const procesarDatos = (texto) => {
        const lineas = texto.split("\n"); // Dividir el texto por líneas
        const paisesYCiudades = {};

        lineas.forEach(linea => {
            // Corregir caracteres especiales en la línea
            linea = corregirCaracteres(linea);

            // Eliminar comillas y dividir por el separador ";"
            const [pais, ciudad, codigo] = linea.replace(/"/g, "").split(";");

            // Si el país no existe en el objeto, lo agregamos
            if (!paisesYCiudades[pais]) {
                paisesYCiudades[pais] = [];
            }

            // Agregar la ciudad al país correspondiente
            paisesYCiudades[pais].push(ciudad);
        });

        return paisesYCiudades;
    };

    // Cargar el archivo .txt y procesar los datos
    fetch("/data/ciudades_paises.txt")
        .then(response => response.text())
        .then(texto => {
            const datos = procesarDatos(texto);

            // Llenar el selector de países
            Object.keys(datos).forEach(pais => {
                let option = document.createElement("option");
                option.value = pais;
                option.textContent = pais;
                paisSelect.appendChild(option);
            });

            // Manejar el cambio de país
            paisSelect.addEventListener("change", function () {
                const paisSeleccionado = paisSelect.value;
                ciudadSelect.innerHTML = '<option value="">Selecciona una ciudad</option>';

                if (paisSeleccionado && datos[paisSeleccionado]) {
                    // Llenar el selector de ciudades con las ciudades del país seleccionado
                    datos[paisSeleccionado].forEach(ciudad => {
                        let option = document.createElement("option");
                        option.value = ciudad;
                        option.textContent = ciudad;
                        ciudadSelect.appendChild(option);
                    });
                }
            });
        })
        .catch(error => console.error("Error al cargar el archivo .txt:", error));

    // Cargar el JSON con sectores, ramas y especialidades
    fetch("/data/sec_ram_esp.json")
        .then(response => response.json())
        .then(data => {
            // Verificar que el JSON tiene la estructura esperada
            if (!data.sectores) {
                console.error("El JSON no tiene la estructura esperada.");
                return;
            }

            // Llenar el selector de sectores
            Object.keys(data.sectores).forEach(sector => {
                let option = document.createElement("option");
                option.value = sector;
                option.textContent = sector;
                sectorSelect.appendChild(option);
            });

            // Función para actualizar opciones de ramas
            sectorSelect.addEventListener("change", function () {
                const sector = sectorSelect.value;
                ramaSelect.innerHTML = '<option value="">Selecciona una rama</option>';
                especialidadSelect.innerHTML = '<option value="">Selecciona una especialidad</option>';

                if (sector && data.sectores[sector] && data.sectores[sector].ramas) {
                    Object.keys(data.sectores[sector].ramas).forEach(rama => {
                        let option = document.createElement("option");
                        option.value = rama;
                        option.textContent = rama;
                        ramaSelect.appendChild(option);
                    });
                }
            });

            // Función para actualizar especialidades
            ramaSelect.addEventListener("change", function () {
                const sector = sectorSelect.value;
                const rama = ramaSelect.value;
                especialidadSelect.innerHTML = '<option value="">Selecciona una especialidad</option>';

                if (sector && rama && data.sectores[sector] && data.sectores[sector].ramas && data.sectores[sector].ramas[rama]) {
                    data.sectores[sector].ramas[rama].forEach(especialidad => {
                        let option = document.createElement("option");
                        option.value = especialidad;
                        option.textContent = especialidad;
                        especialidadSelect.appendChild(option);
                    });
                }
            });
        })
        .catch(error => console.error("Error al cargar el JSON:", error));

    // Cargar el archivo JSON con las categorías y oficios
    fetch("/data/oficios_empiricos.json")
        .then(response => response.json())
        .then(data => {
            const categoriasOficios = data.categorias;

            // Manejar la selección de "¿Cómo aprendiste tu oficio?"
            aprendizajeOficio.addEventListener("change", function () {
                const valor = aprendizajeOficio.value;

                if (valor === "profesional") {
                    // Mostrar Secciones 2 y 3, ocultar Sección de empirico
                    seccionProfesional.style.display = "block";
                    seccionProfesionalAcademica.style.display = "block";
                    seccionEmpirico.style.display = "none";
                } else if (valor === "empirico") {
                    // Ocultar Secciones 2 y 3, mostrar Sección de empirico
                    seccionProfesional.style.display = "none";
                    seccionProfesionalAcademica.style.display = "none";
                    seccionEmpirico.style.display = "block";

                    // Llenar el selector de categorías
                    categoriaSelect.innerHTML = '<option value="">Selecciona una categoría</option>';
                    Object.keys(categoriasOficios).forEach(categoria => {
                        let option = document.createElement("option");
                        option.value = categoria;
                        option.textContent = categoria;
                        categoriaSelect.appendChild(option);
                    });

                    // Llenar el selector de oficios según la categoría seleccionada
                    categoriaSelect.addEventListener("change", function () {
                        const categoria = categoriaSelect.value;
                        oficioSelect.innerHTML = '<option value="">Selecciona un oficio</option>';

                        if (categoria && categoriasOficios[categoria]) {
                            categoriasOficios[categoria].forEach(oficio => {
                                let option = document.createElement("option");
                                option.value = oficio[0]; // Nombre del oficio
                                option.textContent = oficio[0]; // Nombre del oficio
                                oficioSelect.appendChild(option);
                            });
                        }
                    });
                } else {
                    // Ocultar todas las secciones condicionales
                    seccionProfesional.style.display = "none";
                    seccionProfesionalAcademica.style.display = "none";
                    seccionEmpirico.style.display = "none";
                }
            });
        })
        .catch(error => console.error("Error al cargar el archivo JSON:", error));

    // Mostrar campo de estudio si el nivel académico es Especialista, Magíster o Doctor
    nivelAcademico.addEventListener("change", function () {
        if (nivelAcademico.value === "Especialista" || nivelAcademico.value === "Magíster" || nivelAcademico.value === "Doctor") {
            campoEstudioContainer.style.display = "block";
        } else {
            campoEstudioContainer.style.display = "none";
        }
    });

    // Cargar datos existentes al cargar la página (opcional para versión local)
    // En esta versión no cargamos datos existentes ya que se guardan en el servidor

    // Enviar formulario al servidor local
    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        
        // Mostrar loader
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';
        
        try {
            const datosActuales = {
                nombre: nombreInput.value,
                apellido: apellidoInput.value,
                telefono: telefonoInput.value,

                pais: paisSelect.value,
                ciudad: ciudadSelect.value,
                fechaNacimiento: fechaNacimiento.value,
                aprendizajeOficio: aprendizajeOficio.value,
                sector: sectorSelect.value,
                rama: ramaSelect.value,
                especialidad: especialidadSelect.value,
                perfilAcademico: perfilAcademico.value,
                nivelAcademico: nivelAcademico.value,
                campoEstudio: campoEstudio.value,
                categoria: categoriaSelect.value,
                oficio: oficioSelect.value,
                experienciaTiempo: experienciaTiempo.value,
                tiempoDisponible: tiempoDisponible.value
            };
    
            console.log('Enviando datos:', datosActuales);
    
            const response = await fetch('/api/guardar-perfil', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(datosActuales)
            });
    
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error al guardar los datos');
            }
            
            alert("Datos guardados correctamente ✔️");
            sessionStorage.setItem('currentUserId', data.id);
            sessionStorage.setItem('userName', `${nombreInput.value} ${apellidoInput.value}`);
            window.location.href = "editar-edu-exp-hab.html";            
            
        } catch (error) {
            console.error('Error detallado:', error);
            alert(`Error al guardar: ${error.message}\n\nConsulta la consola (F12) para más detalles`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });

    // Función para corregir caracteres especiales
    const corregirCaracteres = (texto) => {
        const caracteresMalInterpretados = {
            "Ã¡": "á",
            "Ã©": "é",        
            "Ã¿": "ÿ"
        };
        Object.keys(caracteresMalInterpretados).forEach(caracter => {
            texto = texto.replace(new RegExp(caracter, "g"), caracteresMalInterpretados[caracter]);
        });
        return texto;
    };
});