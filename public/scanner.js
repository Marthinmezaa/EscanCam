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

// Funcion para enviar la imagen al Backend y recibir los datos limpios
async function enviarFotoAlServidor(imagenBase64) {
  try {
    console.log("Enviando foto al servidor...");

    const respuesta = await fetch("http://localhost:3000/api/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ foto: imagenBase64 }),
    });

    const datosDelServidor = await respuesta.json();
    console.log("El servidor respondio:", datosDelServidor);

    // Muestra los datos limpios devueltos por el servidor en la pantalla
    resultadoOcr.value = datosDelServidor.datos;
  } catch (error) {
    console.error("Error al conectar con el servidor", error);
    resultadoOcr.value = "Error al conectar con el servidor.";
  }
}

// Agregar el evento click al boton de captura
snap.addEventListener("click", async () => {
  // ANTI-SPAM (Para lo hacer miles de pedidos con el click)
  snap.disabled = true;
  snap.textContent = "Procesando.";

  // Preparado de lienzo para capturar la imagen
  lienzo.width = camara.videoWidth;
  lienzo.height = camara.videoHeight;
  const contexto = lienzo.getContext("2d");
  contexto.drawImage(camara, 0, 0, lienzo.width, lienzo.height);

  // Obtener la imagen en formato base64
  const imagenDatos = lienzo.toDataURL("image/jpeg");

  // Mostrar mensaje de carga temporal en el área de texto
  resultadoOcr.value = "Procesando imagen en el servidor. Por favor espere...";
  console.log("Imagen capturada, enviando al backend...");

  // Enviar copia al backend
  await enviarFotoAlServidor(imagenDatos);

  snap.disabled = false;
  snap.textContent = "Escanear";
});

// Arrancar la aplicacion
iniciarCamara();
