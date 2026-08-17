# EscanCam

Escanea una Cédula de Identidad Civil paraguaya con la webcam y extrae sus datos
(número de cédula, fecha de nacimiento) mediante OCR.

## Cómo funciona

1. El frontend (`public/`) captura un frame de la cámara a un `<canvas>` y lo
   convierte a JPEG en base64.
2. Lo envía por `POST /api/scan` al backend.
3. El backend (`server.js`) corre el OCR con [`tesseract.js`](https://github.com/naptha/tesseract.js)
   (idioma español) y parsea el texto reconocido con expresiones regulares para
   extraer el número de cédula y la fecha de nacimiento.
4. Devuelve el resultado al frontend, que lo muestra en pantalla.

## Requisitos

- Node.js

## Uso

```bash
npm install
node server.js
```

El backend queda escuchando en `http://localhost:3000`. Abrí `public/index.html` en
el navegador (necesita permiso de cámara) — el frontend llama al backend en ese
puerto sin importar desde dónde se sirva.

## Estado del proyecto

En desarrollo activo. El detalle de qué falta y las decisiones de arquitectura están
documentados en [`CLAUDE.md`](./CLAUDE.md).

## Licencia

ISC
