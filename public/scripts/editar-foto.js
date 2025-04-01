document.addEventListener("DOMContentLoaded", function() {
    const imageUpload = document.getElementById('imageUpload');
    const imagePreview = document.getElementById('imagePreview');
    const savePhotoBtn = document.getElementById('savePhoto');
    const skipPhotoBtn = document.getElementById('skipPhoto');
    const statusText = document.getElementById('statusText');
    
    let currentFile = null;

    // Mostrar vista previa
    imageUpload.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file && file.type.match('image.*')) {
            currentFile = file;
            const reader = new FileReader();
            
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
                savePhotoBtn.disabled = false;
                
                if (file.size > 2 * 1024 * 1024) {
                    statusText.textContent = "Comprimiendo imagen automáticamente...";
                } else {
                    statusText.textContent = "Imagen lista para subir";
                }
            };
            
            reader.readAsDataURL(file);
        }
    });

    // Función para comprimir automáticamente
    async function compressImage(file) {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Reducir progresivamente hasta cumplir con 2MB
                let quality = 0.9; // Empezar con 90% de calidad
                let result;
                
                const attemptCompression = () => {
                    // Calcular nuevo tamaño manteniendo relación de aspecto
                    let width = img.width;
                    let height = img.height;
                    const maxDimension = 1500; // Máximo permitido para empezar
                    
                    if (width > height && width > maxDimension) {
                        height *= maxDimension / width;
                        width = maxDimension;
                    } else if (height > maxDimension) {
                        width *= maxDimension / height;
                        height = maxDimension;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob((blob) => {
                        if (!blob || quality <= 0.1) {
                            // Si no se puede comprimir más o calidad mínima alcanzada
                            resolve(result || file);
                            return;
                        }
                        
                        if (blob.size <= 2 * 1024 * 1024) {
                            // Cumple con el tamaño requerido
                            resolve(new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            }));
                        } else {
                            // Reducir calidad y volver a intentar
                            quality -= 0.1;
                            attemptCompression();
                        }
                    }, 'image/jpeg', quality);
                };
                
                attemptCompression();
            };
        });
    }

    // Guardar foto
    savePhotoBtn.addEventListener('click', async function() {
        if (!currentFile) return;
        
        savePhotoBtn.disabled = true;
        statusText.textContent = "Procesando imagen...";
        
        try {
            // Comprimir solo si es necesario
            const finalFile = currentFile.size > 2 * 1024 * 1024 
                ? await compressImage(currentFile)
                : currentFile;
            
            if (finalFile.size > 2 * 1024 * 1024) {
                throw new Error("No se pudo comprimir la imagen a menos de 2MB");
            }
            
            statusText.textContent = "Subiendo imagen...";
            
            const formData = new FormData();
            formData.append('userId', sessionStorage.getItem('currentUserId'));
            formData.append('profileImage', finalFile);
            
            const response = await fetch('http://localhost:3000/api/upload-photo', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(await response.text());
            }
            
            alert("Foto subida exitosamente!");
            window.location.href = "editar-info-basica.html";
            
        } catch (error) {
            console.error("Error:", error);
            statusText.textContent = `Error: ${error.message}`;
            savePhotoBtn.disabled = false;
        }
    });
    
    // Omitir
    skipPhotoBtn.addEventListener('click', function() {
        if (confirm("¿Continuar sin subir foto de perfil?")) {
            window.location.href = "editar-info-basica.html";
        }
    });
});