// 1 - Variables del DOM
const camara = document.getElementById("camara");
const snap = document.getElementById("snap");
const resultadoOcr = document.getElementById("resultado-ocr");
const lienzo = document.getElementById("lienzo");

// Funcion para iniciar la camara
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

// Funcion para enviar la imagen al Backend
async function enviarFotoAlServidor(imagenBase64) {
  try {
    console.log("Enviando foto al servidor");

    const respuesta = await fetch("http://localhost:3000/api/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ foto: imagenBase64 }),
    });

    const datosDelServidor = await respuesta.json();

    console.log("El servidor respondio:", datosDelServidor);
  } catch (error) {
    console.error("Error al conectar con el servidor", error);
  }
}

// Agregar el evento click al boton de captura
snap.addEventListener("click", () => {
  // Preparado de lienzo para capturar la imagen
  lienzo.width = camara.videoWidth;
  lienzo.height = camara.videoHeight;
  const contexto = lienzo.getContext("2d");
  contexto.drawImage(camara, 0, 0, lienzo.width, lienzo.height);

  // Obtener la imagen en formato base64
  const imagenDatos = lienzo.toDataURL("image/jpeg");

  // Enviar copia al backend
  enviarFotoAlServidor(imagenDatos);

  // Mostrar mensaje de procesamiento
  console.log("Imagen capturada, procesando OCR...");

  // Porcesar la imagen con Tesseract.js
  Tesseract.recognize(imagenDatos, "spa")
    .then((resultado) => {
      const textoSucio = resultado.data.text;

      const textoFinalLimpio = procesarTextoOCR(textoSucio);

      // Aplicar resultado en text area de HTML
      resultadoOcr.value = textoFinalLimpio;
    })
    .catch((error) => {
      console.error("Error durante el procesamiento de OCR:", error);
    });
});

// Arrancar la aplicacion
iniciarCamara();

// Funcion para limpiar los datos del OCR
function procesarTextoOCR(textosucio) {
  // Almacenar datos limpios
  const datosLimpios = {
    ci: "No encontrado",
    fechaNacimiento: "No encontrado",
    textoCrudo: textosucio,
  };

  // Busqueda de CI con regex
  const regexCI = /\b\d{6,8}\b/;
  const matchCI = textosucio.match(regexCI);

  if (matchCI) {
    datosLimpios.ci = matchCI[0]; // Guardar CI encontrado
  }

  // Busqueda de fecha de nacimiento con regex
  const regexFecha = /\b\d{2}-\d{2}-\d{4}\b/;
  const matchFecha = textosucio.match(regexFecha);

  if (matchFecha) {
    datosLimpios.fechaNacimiento = matchFecha[0]; // Guardar fecha encontrada
  }

  return `CI: ${datosLimpios.ci}\nFecha de Nacimiento: ${datosLimpios.fechaNacimiento}\n\n--- Texto Original ---\n${textosucio}`;
}
