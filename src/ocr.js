// Preprocesamiento de imagen y parseo del texto reconocido por Tesseract.
// Separado de server.js para poder testear el parseo de texto sin levantar Express.
const { Jimp } = require("jimp");

// Convierte el data URL base64 que manda el frontend en un Buffer JPEG
function base64AJpegBuffer(fotoBase64) {
  const base64Limpio = fotoBase64.replace(/^data:image\/\w+;base64,/, "");
  return Buffer.from(base64Limpio, "base64");
}

// Prepara la imagen para el OCR: escala de grises + contraste + upscale.
// Tesseract lee mucho mejor texto chico y con poco contraste (como el de una
// cédula fotografiada a mano) si se lo entregamos así en vez del frame crudo.
// ponytail: parámetros fijos (contraste 0.3, escala 1.5x) elegidos a ojo:
// si con cédulas reales la precisión sigue baja, el próximo paso es afinarlos
// con casos reales, no reescribir el pipeline.
async function preprocesarImagen(fotoBase64) {
  const imagen = await Jimp.read(base64AJpegBuffer(fotoBase64));
  imagen.greyscale().contrast(0.3).scale(1.5);
  return imagen.getBuffer("image/jpeg");
}

// Fecha de nacimiento anclada a la etiqueta "NACIMIENTO": la cédula tiene dos
// fechas con el mismo formato DD-MM-AAAA (nacimiento y vencimiento), buscar la
// primera fecha del texto completo podía devolver la equivocada.
function extraerFechaNacimiento(texto) {
  const idxNacimiento = texto.search(/NACIMIENTO/i);
  if (idxNacimiento === -1) return null;
  const idxVencimiento = texto.search(/VENCIMIENTO/i);
  const finSegmento = idxVencimiento === -1 ? texto.length : idxVencimiento;
  const match = texto.slice(idxNacimiento, finSegmento).match(/\b\d{2}-\d{2}-\d{4}\b/);
  return match ? match[0] : null;
}

// Nombre: todo lo que aparece entre la etiqueta "APELLIDOS, NOMBRES" y la
// etiqueta "FECHA..." siguiente (apellido y nombre van en líneas separadas en
// la cédula real, por eso se juntan los saltos de línea en un espacio). El
// corte es en "FECHA", no en "NACIMIENTO", porque el label completo es
// "FECHA DE NACIMIENTO" — cortar en "NACIMIENTO" dejaba "FECHA DE" pegado al
// nombre (bug real, visto probando con una cédula de verdad, no hipotético).
// ponytail: heurística de layout fijo. Si Tesseract lee mal la propia etiqueta
// "NOMBRES" (ej. "N0MBRES"), no encuentra nada — el upgrade sería recortar la
// región de la imagen por coordenadas fijas en vez de anclar por texto.
function extraerNombre(texto) {
  const etiqueta = texto.match(/APELLIDOS,?\s*NOMBRES/i);
  if (!etiqueta) return null;
  const inicio = etiqueta.index + etiqueta[0].length;
  const idxFecha = texto.slice(inicio).search(/FECHA/i);
  const fin = idxFecha === -1 ? texto.length : inicio + idxFecha;
  const nombre = texto
    .slice(inicio, fin)
    .replace(/\s+/g, " ")
    // ruido de OCR ocasional (asteriscos, guiones sueltos) antes del nombre real
    .replace(/^[^a-zA-ZÀ-ÿ]+/, "")
    .trim();
  return nombre || null;
}

// CI: mismo regex que antes (6 a 8 dígitos) pero ignorando primero las fechas,
// que también son secuencias numéricas y podían matchear en su lugar.
function extraerCI(texto) {
  const textoSinFechas = texto.replace(/\b\d{2}-\d{2}-\d{4}\b/g, "");
  const match = textoSinFechas.match(/\b\d{6,8}\b/);
  return match ? match[0] : null;
}

// Funcion para limpiar los datos del OCR
function procesarTextoOCR(textosucio) {
  const datosLimpios = {
    ci: extraerCI(textosucio) || "No encontrado",
    nombre: extraerNombre(textosucio) || "No encontrado",
    fechaNacimiento: extraerFechaNacimiento(textosucio) || "No encontrado",
    textoCrudo: textosucio,
  };

  return `CI: ${datosLimpios.ci}\nNombre: ${datosLimpios.nombre}\nFecha de Nacimiento: ${datosLimpios.fechaNacimiento}\n\n--- Texto Original ---\n${textosucio}`;
}

// Si el OCR no encontró alguno de los tres campos en el string ya formateado.
// Se usa para decidir si vale la pena reintentar con la imagen preprocesada.
function faltanCampos(datosFormateados) {
  return datosFormateados.split("--- Texto Original ---")[0].includes("No encontrado");
}

module.exports = { procesarTextoOCR, preprocesarImagen, faltanCampos };
