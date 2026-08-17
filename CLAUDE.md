# CLAUDE.md

Este archivo guía a Claude Code (claude.ai/code) al trabajar en este repositorio.
**Regla del usuario: este archivo se mantiene siempre en castellano.**

## Qué es esto

EscanCam escanea una Cédula de Identidad Civil **paraguaya** por webcam y extrae los
datos con OCR. Backend Node/Express, frontend vanilla JS/HTML, sin build step, sin
framework.

Es un proyecto que el usuario empezó, dejó a medio terminar y retoma ahora. Nació
100% frontend con `tesseract.js` en el navegador, pero el OCR en vivo daba muchos
errores de lectura y costaba escanear bien la cédula. Por eso se migró el OCR al
backend (ver CHANGELOG "refactor: migrar motor OCR al backend"), pero esa migración
quedó incompleta — ver "Estado real / pendiente" abajo.

## Filosofía de trabajo en este repo

- **Clean code siempre**: nombres claros, funciones chicas, sin duplicación.
- **Ponytail activo** (plugin instalado, nivel `full`): la solución más simple que
  funciona gana. Antes de escribir código nuevo, reusar lo que ya existe en el repo.
  Sin abstracciones que no se pidieron, sin scaffolding "para después".
- **Espíritu Gentle-AI, sin su infraestructura**: no se instala Engram/OpenSpec/MCP de
  ese proyecto (es tooling aparte, no se pidió instalar). Lo que sí se adopta de su
  filosofía: confiar en lo que el código/los logs prueban, no en lo que se narra;
  verificar antes de afirmar; dejar registro de decisiones importantes en memoria.

## Comandos

- `npm install` — instala dependencias
- `node server.js` — levanta el backend (puerto 3000, hardcodeado)
- Servir `public/index.html` (cualquier servidor estático, o abrirlo directo) — el
  frontend llama al backend en `http://localhost:3000` sin importar su propio origen
- No hay suite de tests (`npm test` es un stub que sale con error); no hay config de lint

## Layout de la cédula paraguaya (para calibrar el OCR)

Confirmado contra una cédula real, no supuesto:

- Encabezado: `REPÚBLICA DEL PARAGUAY` / `Cédula de Identidad Civil`.
- Bloque de texto principal (lado izquierdo), en este orden: `APELLIDOS, NOMBRES`
  (dos líneas), `FECHA DE NACIMIENTO` (`DD-MM-AAAA`), `LUGAR DE NACIMIENTO`,
  `FECHA DE VENCIMIENTO` (**también** `DD-MM-AAAA`, mismo formato que la fecha de
  nacimiento — confirma que el regex actual de fecha puede matchear la fecha
  equivocada según cuál aparezca primero en el texto reconocido).
- `SEXO` (Masculino/Femenino) en el centro, al lado de la foto.
- Número de cédula: dígitos sueltos debajo/al lado de la foto (lado derecho), no
  pegado al bloque de texto principal — separado visualmente del resto de los datos.
- Formato de cédula visto: 7 dígitos, dentro del rango `\d{6,8}` que ya cubre el
  regex actual.

## Arquitectura

Dos runtimes independientes, sin build compartido:

- **`server.js`** — backend Express en un solo archivo. `POST /api/scan` recibe un
  JPEG en base64 (`req.body.foto`), lo pasa por `tesseract.js` (idioma `spa`) del
  lado del servidor, y `procesarTextoOCR()` parsea el texto crudo con regex buscando
  número de CI (`\b\d{6,8}\b`) y fecha de nacimiento (`\b\d{2}-\d{2}-\d{4}\b`),
  devolviendo un string formateado en `{ mensaje, datos }`. Todo el OCR y el parseo
  viven en este único archivo.
- **`public/scanner.js`** — frontend. Captura un frame de video a `<canvas>`, lo
  convierte a JPEG base64 y lo postea a `/api/scan`. No hace OCR en el cliente.
- **`public/index.html`** todavía carga `tesseract.js` desde un `<script>` de CDN,
  pero es peso muerto sin uso — el OCR se migró al backend. No asumir que ese script
  significa que el OCR corre en el cliente.
- **`spa.traineddata`** en la raíz — modelo de Tesseract en español, lo usa el OCR
  del backend.

## Estado real / pendiente

Análisis del código actual, no lista de deseos:

- **Falta extraer el nombre.** `procesarTextoOCR()` solo busca CI y fecha de
  nacimiento; el usuario quiere también el nombre y hoy no se captura en absoluto.
- **Sin preprocesamiento de imagen.** Se le pasa el frame completo de la cámara a
  Tesseract tal cual (sin recorte, sin escala de grises/threshold, sin corrección de
  perspectiva). Es la causa más probable de la mala precisión que motivó el backend.
- **Regex de fecha ambiguo, confirmado.** La cédula tiene dos fechas con el mismo
  formato `DD-MM-AAAA` (nacimiento y vencimiento) — `\b\d{2}-\d{2}-\d{4}\b` toma la
  primera que aparezca en el texto reconocido, puede devolver la fecha de
  vencimiento en vez de la de nacimiento.
- **Regex de CI también ambiguo.** `\b\d{6,8}\b` toma el primer número de 6 a 8
  dígitos en todo el texto — puede matchear cualquier otra secuencia numérica de la
  cédula, no necesariamente el número de documento.
- **Sin validación de entrada** en `/api/scan` (no valida que `foto` exista o sea un
  data URL válido antes de mandarlo a Tesseract).
- **Script de `tesseract.js` en `index.html` sin uso** (dead code, ver arriba).
- **`README.md` vacío.**

## Convenciones

- Código, comentarios y logs en castellano (rioplatense) — mantiene consistencia con
  el código existente.
- Commits en Conventional Commits; `release-please`
  (`.github/workflows/release-please.yml`) genera versión y CHANGELOG en cada push a
  `main`.
- `.github/workflows/seguridad.yml` corre `npm audit --audit-level=critical` en cada
  PR contra `main`.
