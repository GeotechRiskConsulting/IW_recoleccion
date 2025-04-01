document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("perfilForm");
    const userId = sessionStorage.getItem('currentUserId');
    console.log('UserID obtenido:', userId); // Verifica en consola

    const agregarEducacionBtn = document.getElementById("agregarEducacion");
    const educacionForm = document.getElementById("educacionForm");
    const confirmarEducacionBtn = document.getElementById("confirmarEducacion");
    const educacionLista = document.getElementById("educacionLista");

    const agregarExperienciaBtn = document.getElementById("agregarExperiencia");
    const experienciaForm = document.getElementById("experienciaForm");
    const confirmarExperienciaBtn = document.getElementById("confirmarExperiencia");
    const experienciaLista = document.getElementById("experienciaLista");

    const agregarHabilidadBtn = document.getElementById("agregarHabilidad");
    const habilidadForm = document.getElementById("habilidadForm");
    const confirmarHabilidadBtn = document.getElementById("confirmarHabilidad");
    const habilidadesLista = document.getElementById("habilidadesLista");

    let educacionTexto; // Declarada en un ámbito más amplio
    let experienciaTexto;
    let habilidadTexto;

    // Variable para almacenar los datos originales del usuario
    let datosOriginales = {};

    // Función para validar si todos los campos requeridos están completos
    function validarCamposCompletos(campos) {
        for (const campo of campos) {
            if (!campo.value.trim()) {
                campo.style.border = "2px solid red"; // Resaltar campo vacío
                return false;
            } else {
                campo.style.border = "1px solid #ddd"; // Restaurar borde normal
            }
        }
        return true;
    }

    // Función para validar la fecha de graduación
    function validaranoGraduacion(anoGraduacion) {
        const fechaActual = new Date();
        const anoActual = fechaActual.getFullYear();

        // Validar que el año graduacion no sea mayor a 60 años antes del año actual
        if (anoGraduacion < (anoActual - 60) || anoGraduacion > anoActual) {
            return false;
        };

        return true;
    }

    // Función para validar los años de experiencia
    function validarAniosExperiencia(anoInicio, anoFin) {
        const fechaActual = new Date();
        const anoActual = fechaActual.getFullYear();

        // Validar que el año de inicio no sea mayor a 60 años antes del año actual
        if (anoInicio < (anoActual - 60) || anoInicio > anoActual) {
            return false;
        }

        // Validar que el año de finalización no sea menor que el año de inicio
        if (anoFin && anoFin < anoInicio) {
            return false;
        }

        return true;
    }

    // Mostrar formulario de educación
    agregarEducacionBtn.addEventListener("click", function () {
        educacionForm.style.display = "block";
    });

    // Confirmar educación
    confirmarEducacionBtn.addEventListener("click", function () {
        const nivel = document.getElementById("nivelAcademico");
        const titulo = document.getElementById("titulo");
        const universidad = document.getElementById("universidad");
        const anoGraduacion = document.getElementById("anoGraduacion");

        // Validar que todos los campos estén completos
        if (!validarCamposCompletos([nivel, titulo, universidad, anoGraduacion])) {
            alert("Por favor, completa todos los campos");
            return;
        }

        // Validar fecha de graduación
        if (!validaranoGraduacion(anoGraduacion.value)) {
            alert("La fecha de graduación no es valida");
            return;
        }

        educacionTexto = `${nivel.value} | ${titulo.value} | ${universidad.value} | ${anoGraduacion.value}`;
        agregarItemALista(educacionTexto, educacionLista, "educacion");

        // Ocultar formulario y limpiar campos
        educacionForm.style.display = "none";
        nivel.value = "Técnico";
        titulo.value = "";
        universidad.value = "";
        anoGraduacion.value = "";
    });

    // Mostrar formulario de experiencia
    agregarExperienciaBtn.addEventListener("click", function () {
        experienciaForm.style.display = "block";
    });

    // Confirmar experiencia
    confirmarExperienciaBtn.addEventListener("click", function () {
        const cargo = document.getElementById("cargo");
        const tipoCargo = document.getElementById("tipoCargo");
        const empresa = document.getElementById("empresa");
        const anoInicio = document.getElementById("anoInicio");
        const anoFin = document.getElementById("anoFin");

        // Validar que todos los campos estén completos
        if (!validarCamposCompletos([cargo, tipoCargo, empresa, anoInicio])) {
            alert("Por favor, completa todos los campos");
            return;
        }

        // Validar años de experiencia
        if (!validarAniosExperiencia(parseInt(anoInicio.value), parseInt(anoFin.value))) {
            alert("Los años de inicio y finalización no son validos");
            return;
        }

        experienciaTexto = `${cargo.value} | ${tipoCargo.value} | ${empresa.value} | ${anoInicio.value} | ${anoFin.value || "Actual"}`;
        agregarItemALista(experienciaTexto, experienciaLista, "experiencia");

        // Ocultar formulario y limpiar campos
        experienciaForm.style.display = "none";
        cargo.value = "";
        tipoCargo.value = "Operativos-asistentes";
        empresa.value = "";
        anoInicio.value = "";
        anoFin.value = "";
    });

    // Mostrar formulario de habilidad
    agregarHabilidadBtn.addEventListener("click", function () {
        habilidadForm.style.display = "block";
    });

    // Confirmar habilidad
    confirmarHabilidadBtn.addEventListener("click", function () {
        const habilidad = document.getElementById("habilidad");
        const nivel = document.getElementById("nivel");

        // Validar que todos los campos estén completos
        if (!validarCamposCompletos([habilidad, nivel])) {
            alert("Por favor, completa todos los campos requeridos.");
            return;
        }

        habilidadTexto = `${habilidad.value} | ${nivel.value}`;
        agregarItemALista(habilidadTexto, habilidadesLista, "habilidades");

        // Ocultar formulario y limpiar campos
        habilidadForm.style.display = "none";
        habilidad.value = "";
        nivel.value = "básico";
    });

    // Función para agregar un ítem a la lista
    function agregarItemALista(texto, lista, tipo) {
        const item = document.createElement("div");
        item.classList.add("lista-item");

        // Crear texto del ítem
        const textoItem = document.createElement("span");
        textoItem.textContent = texto;

        // Crear botón de eliminar
        const eliminarBtn = document.createElement("button");
        eliminarBtn.textContent = "Eliminar";
        eliminarBtn.classList.add("btn-eliminar");
        eliminarBtn.addEventListener("click", function () {
            item.remove(); // Eliminar el ítem de la lista            
        });

        // Agregar texto y botón al ítem
        item.appendChild(textoItem);
        item.appendChild(eliminarBtn);

        // Agregar ítem a la lista
        lista.appendChild(item);
    }

    // Enviar formulario al servidor local     
    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        // Mostrar loader
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';

        // Recopilar datos de educación
        const educacion = [];
        document.querySelectorAll("#educacionLista .lista-item span").forEach(item => {
            const [nivelAcademico, titulo, universidad, fecha] = item.textContent.split(" | ");
            educacion.push({
                nivelAcademico: nivelAcademico,
                titulo: titulo,
                universidad: universidad,
                anoGraduacion: fecha
            });
        });

        // Recopilar datos de experiencia
        const experiencia = [];
        document.querySelectorAll("#experienciaLista .lista-item span").forEach(item => {
            const [cargo, tipoCargo, empresa, anoInicio, anoFin] = item.textContent.split(" | ");
            experiencia.push({
                cargo: cargo,
                tipoCargo: tipoCargo,
                empresa: empresa,
                anoInicio: anoInicio,
                anoFin: anoFin || "Actual"
            });
        });

        // Recopilar datos de habilidades
        const habilidades = [];
        document.querySelectorAll("#habilidadesLista .lista-item span").forEach(item => {
            const [habilidad, nivel] = item.textContent.split(" | ");
            habilidades.push({
                habilidad: habilidad,
                nivel: nivel
            });
        });

        try {

            const userId = sessionStorage.getItem('currentUserId');
            if (!userId) {
                throw new Error('No se encontró el ID de usuario');
            }
            // Crear objeto con los datos actuales
            const datosActuales = {
                userId: userId,
                educacion: educacion,
                experiencia: experiencia,
                habilidades: habilidades
            };

            console.log('Enviando datos:', datosActuales);
            
            const response = await fetch('http://localhost:3000/api/guardar-experiencia', {
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
            window.location.href = "editar-foto.html"; //           
            
        } catch (error) {
            console.error('Error detallado:', error);
            console.error('Respuesta del servidor:', await response.text()); // Esto muestra el mensaje completo del servidor
            alert(`Error al guardar: ${error.message}\n\nConsulta la consola (F12) para más detalles`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }       


    });
});