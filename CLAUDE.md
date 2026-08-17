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
- `npm test` — corre el self-check con el test runner nativo de Node (`node --test`
  sobre `ocr.test.js`), sin dependencias de testing agregadas; no hay config de lint

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

- **`server.js`** — backend Express. `POST /api/scan` valida que llegue
  `req.body.foto` como data URL de imagen, la pasa por `preprocesarImagen()` (de
  `ocr.js`), corre `tesseract.js` (idioma `spa`) sobre el buffer ya preprocesado y
  formatea el resultado con `procesarTextoOCR()`, devolviendo `{ mensaje, datos }`.
- **`ocr.js`** — todo el preprocesamiento de imagen y el parseo de texto, separado de
  `server.js` para poder testearlo sin levantar Express:
  - `preprocesarImagen(fotoBase64)` — decodifica el data URL, pasa la imagen a
    escala de grises, le sube el contraste y la escala 1.5x con `jimp` antes de
    dársela a Tesseract (mejora la lectura de texto chico/bajo contraste).
  - `procesarTextoOCR(textoCrudo)` — extrae CI, nombre y fecha de nacimiento del
    texto reconocido, todo anclado a las etiquetas reales de la cédula (`NOMBRES`,
    `NACIMIENTO`, `VENCIMIENTO`) en vez de "primer match del regex en todo el
    texto" — ver `ocr.test.js` para los casos cubiertos.
- **`public/scanner.js`** — frontend. Captura un frame de video a `<canvas>`, lo
  convierte a JPEG base64 y lo postea a `/api/scan`. No hace OCR en el cliente.
- **`public/index.html`** todavía carga `tesseract.js` desde un `<script>` de CDN,
  pero es peso muerto sin uso — el OCR se migró al backend. No asumir que ese script
  significa que el OCR corre en el cliente.
- **`spa.traineddata`** en la raíz — modelo de Tesseract en español, lo usa el OCR
  del backend.

## Estado real / pendiente

Análisis del código actual, no lista de deseos. Ver "Bitácora de avances" abajo para
el detalle de qué se resolvió y cuándo.

**Pendiente:**

- **Script de `tesseract.js` en `index.html` sin uso** (dead code, ver arriba) —
  todavía no se sacó.
- **Extracción de nombre/fecha ancladas por texto, no por coordenadas.** Si Tesseract
  lee mal la propia etiqueta (`NOMBRES`, `NACIMIENTO`), la extracción de ese campo
  falla silenciosamente y devuelve "No encontrado". El upgrade, si esto pasa seguido
  con cédulas reales, es recortar la imagen por región fija en vez de anclar por
  texto (ver comentarios `ponytail:` en `ocr.js`).
- **CI todavía puede matchear cualquier número de 6-8 dígitos** que no sea una fecha
  — mejoró (antes también podía matchear un pedazo de fecha), pero no hay una
  etiqueta clara para anclarlo como con nombre/fecha.
- **Parámetros de preprocesamiento de imagen sin calibrar contra una cédula real** —
  se probaron con imágenes sintéticas en blanco, no contra una foto real de cédula
  con la cámara. Puede necesitar ajuste de contraste/escala.
- **`README.md`** ya no está vacío (ver raíz del repo), pero no tiene capturas ni demo.

**Resuelto** (ver Bitácora):

- ~~Falta extraer el nombre~~ → `extraerNombre()` en `ocr.js`.
- ~~Sin preprocesamiento de imagen~~ → `preprocesarImagen()` en `ocr.js`.
- ~~Regex de fecha ambiguo~~ → `extraerFechaNacimiento()` ancla por la etiqueta
  `NACIMIENTO` en vez de tomar la primera fecha del texto.
- ~~Sin validación de entrada~~ → `/api/scan` devuelve 400 si falta `foto` o no es
  un data URL de imagen.

## Convenciones

- Código, comentarios y logs en castellano (rioplatense) — mantiene consistencia con
  el código existente.
- Commits en Conventional Commits; `release-please`
  (`.github/workflows/release-please.yml`) genera versión y CHANGELOG en cada push a
  `main`.
- `.github/workflows/seguridad.yml` corre `npm audit --audit-level=critical` en cada
  PR contra `main`.

## Bitácora de avances

Registro por rama/PR de qué se hizo, qué funcionó, qué falló y qué queda — para
retomar el proyecto desde otra computadora sin perder contexto. Entradas nuevas
abajo de todo (orden cronológico).

### 2026-08-17 — rama `docs/readme` (PR #14, sin mergear)

- Se creó `README.md` (estaba vacío) y se tradujo/expandió este `CLAUDE.md`.
- Se corrigió que la cédula es **paraguaya**, no uruguaya (error de la sesión
  anterior, nunca verificado) — corregido contra una cédula real.
- Falló release-please al mergear PR #13 → rama `docs/readme`: la API de GitHub
  devolvía 503 intermitente (server error del lado de GitHub, no del repo). Se
  reintentó `gh run rerun` varias veces sin éxito inmediato — no es un problema de
  configuración del workflow, solo esperar a que GitHub se recupere y volver a
  correrlo (o dejar que corra solo en el próximo push a `main`).

### 2026-08-17 — rama `feat/ocr-nombre-y-preprocesamiento` (sin PR todavía)

Objetivo: cerrar los dos pendientes más importantes — falta de preprocesamiento de
imagen y falta de extracción de nombre.

- Se separó el parseo/preprocesamiento de `server.js` a `ocr.js` (para poder
  testearlo sin levantar Express).
- Se agregó `jimp` (única dependencia nueva; no hay nada en stdlib de Node ni ya
  instalado que procese imágenes) para `preprocesarImagen()`: escala de grises +
  contraste + escala 1.5x antes de pasarle el buffer a Tesseract.
  - **Verificado en código, no en README**: la API de `jimp` v1.6.1 cambió respecto
    a la v0.x que aparece en ejemplos viejos — `resize()` ahora pide `{w, h}` como
    objeto, no `(w, h)` posicional. Se confirmó inspeccionando el paquete instalado
    directamente, no por memoria.
- Se agregó `extraerNombre()` y se reescribió `extraerFechaNacimiento()` en `ocr.js`
  para anclar la extracción a las etiquetas reales de la cédula (`NOMBRES`,
  `NACIMIENTO`, `VENCIMIENTO`) en vez de "primer match del regex en todo el texto" —
  esto de paso resuelve la ambigüedad de fecha nacimiento/vencimiento que estaba
  anotada como pendiente.
- **Bug encontrado de paso, no buscado**: `express.json()` no tenía `limit`
  configurado — el default de Express es 100kb, y una foto JPEG de cámara en base64
  fácilmente lo supera. El endpoint probablemente rechazaba fotos reales desde
  siempre. Se subió el límite a `10mb`.
- Se agregó validación de entrada a `POST /api/scan` (400 si falta `foto` o no es un
  data URL de imagen) y se corrigió el status code de error de 505 (inexistente para
  este caso) a 500.
- Se agregó `ocr.test.js` con el test runner nativo de Node (`node --test`, sin
  dependencias nuevas) cubriendo `procesarTextoOCR()`; `npm test` ahora corre esto en
  vez del stub que fallaba siempre.
- **Verificado corriendo, no solo leyendo**: se levantó `server.js` de verdad y se le
  mandó una imagen real por `POST /api/scan` — responde 400 sin `foto`, y con una
  imagen válida corre preprocesamiento + OCR + parseo sin romperse de punta a punta.
  No se probó todavía con una foto real de cédula (los pendientes de calibración
  quedan anotados arriba).
