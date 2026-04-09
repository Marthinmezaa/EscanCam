// 1 - Variables del DOM
const camara = document.getElementById("camara");
const snap = document.getElementById("snap");
const resultadoOcr = document.getElementById("resultado-ocr");
const lienzo = document.getElementById("canvas");

// 2 - Definir la funcion para iniciar la camara
async function iniciarCamara() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });

    camara.srcObject = stream;
  } catch (error) {
    console.error(
      "El usuario denego el permiso o no hay camara conectada:",
      error,
    );
  }
}

// 3 - Agregar el evento click al boton de captura
snap.addEventListener("click", () => {
  // Preparado de lienzo para capturar la imagen
  lienzo.width = camara.videoWidth;
  lienzo.height = camara.videoHeight;
  const contexto = lienzo.getContext("2d");
  contexto.drawImage(camara, 0, 0, lienzo.width, lienzo.height);

  // Obtener la imagen en formato base64
  const imagenDatos = lienzo.toDataURL("image/jpeg");

  // Mostrar mensaje de procesamiento
  console.log("Imagen capturada, procesando OCR...");

  // Porcesar la imagen con Tesseract.js
  Tesseract.recognize(imagenDatos, "spa")
    .then((resultado) => {
      // Guardar texto
      const textoExtraido = resultado.data.text;

      // Aplicar resultado en text area de HTML
      resultadoOcr.value = textoExtraido;
    })
    .catch((error) => {
      console.error("Error durante el procesamiento de OCR:", error);
    });
});

// 4 - Arrancar la aplicacion
iniciarCamara();
