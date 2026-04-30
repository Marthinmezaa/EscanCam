const express = require("express");
const cors = require("cors");
const Tesseract = require("tesseract.js");
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

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

// Ruta Principal
app.get("/", (req, res) => {
  res.send("Hola!");
});

// Recepcion y respuesta a HTML
app.post("/api/scan", async (req, res) => {
  try {
    console.log("1-Imagen recibida. Iniciando OCR.");

    const fotoBase64 = req.body.foto;
    const resultado = await Tesseract.recognize(fotoBase64, "spa");
    const textoCrudo = resultado.data.text;

    console.log("2-Ocr finalizado. Limpiando datos.");

    const datosLimpios = procesarTextoOCR(textoCrudo);

    res.json({
      mensaje: "Procesamiento completado.",
      datos: datosLimpios,
    });
  } catch (error) {
    console.error("Procesamiento fallido.", error);
    res.status(505).json({ mensaje: "Error en el procesamiento del servidor" });
  }
});

// Inicio de Servidor
app.listen(PORT, () => {
  console.log(`Servidor encendido en http://localhost:${PORT}`);
});
