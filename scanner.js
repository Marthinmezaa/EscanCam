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

// 3- Agregar el evento click al boton de captura
snap.addEventListener("click", () => {
  lienzo.width = camara.videoWidth;
  lienzo.height = camara.videoHeight;

  const contexto = lienzo.getContext("2d");

  contexto.drawImage(camara, 0, 0, lienzo.width, lienzo.height);
});

// 4 - Arrancar la aplicacion
iniciarCamara();
