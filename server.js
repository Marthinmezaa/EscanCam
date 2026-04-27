const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Ruta Principal
app.get("/", (req, res) => {
  res.send("Hola!");
});

// Recepcion y respuesta a HTML
app.post("/api/scan", cors(), (req, res) => {
  console.log(req.body);
  res.json({ mensaje: "Imagen recibida con exito en el servidor!" });
});

// Inicio de Servidor
app.listen(PORT, () => {
  console.log(`Servidor encendido en http://localhost:${PORT}`);
});
