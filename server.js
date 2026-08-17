const express = require("express");
const cors = require("cors");
const Tesseract = require("tesseract.js");
const { procesarTextoOCR, preprocesarImagen } = require("./ocr");
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Ruta Principal
app.get("/", (req, res) => {
  res.send("Hola!");
});

// Recepcion y respuesta a HTML
app.post("/api/scan", async (req, res) => {
  const fotoBase64 = req.body.foto;

  if (typeof fotoBase64 !== "string" || !fotoBase64.startsWith("data:image/")) {
    return res.status(400).json({ mensaje: "Falta la foto o no es un data URL de imagen válido." });
  }

  try {
    console.log("1-Imagen recibida. Preprocesando y aplicando OCR.");

    const imagenLista = await preprocesarImagen(fotoBase64);
    const resultado = await Tesseract.recognize(imagenLista, "spa");
    const textoCrudo = resultado.data.text;

    console.log("2-OCR finalizado. Limpiando datos.");

    const datosLimpios = procesarTextoOCR(textoCrudo);

    res.json({
      mensaje: "Procesamiento completado.",
      datos: datosLimpios,
    });
  } catch (error) {
    console.error("Procesamiento fallido.", error);
    res.status(500).json({ mensaje: "Error en el procesamiento del servidor" });
  }
});

// Inicio de Servidor
app.listen(PORT, () => {
  console.log(`Servidor encendido en http://localhost:${PORT}`);
});
