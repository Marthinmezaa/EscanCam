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
- `npm start` (= `node src/server.js`) — levanta el backend (puerto 3000, hardcodeado)
- Servir `public/index.html` (cualquier servidor estático, o abrirlo directo) — el
  frontend llama al backend en `http://localhost:3000` sin importar su propio origen
- `npm test` — corre el self-check con el test runner nativo de Node (`node --test`
  sobre `src/ocr.test.js`), sin dependencias de testing agregadas; no hay config de lint

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

```
src/
  server.js     — backend Express (entry point, npm start)
  ocr.js        — preprocesamiento de imagen + parseo de texto (sin Express)
  ocr.test.js   — self-check de ocr.js (node --test)
public/
  index.html    — frontend
  scanner.js    — captura de cámara + fetch al backend
spa.traineddata — modelo de Tesseract en español
```

- **`src/server.js`** — backend Express. `POST /api/scan` valida que llegue
  `req.body.foto` como data URL de imagen, corre `tesseract.js` (idioma `spa`) sobre
  la foto tal cual llega y arma la respuesta con `procesarTextoOCR()`. Solo si a esa
  primera pasada le faltó algún campo (`faltanCampos()`), reintenta una vez más con
  la imagen preprocesada (`preprocesarImagen()`) — ver por qué en "Bitácora".
  Responde `{ mensaje, datos }`.
- **`src/ocr.js`** — todo el preprocesamiento de imagen y el parseo de texto,
  separado de `server.js` para poder testearlo sin levantar Express:
  - `preprocesarImagen(fotoBase64)` — decodifica el data URL, pasa la imagen a
    escala de grises, le sube el contraste y la escala 1.5x con `jimp`.
  - `procesarTextoOCR(textoCrudo)` — extrae CI, nombre y fecha de nacimiento del
    texto reconocido, anclado a las etiquetas reales de la cédula (`NOMBRES`,
    `FECHA`, `NACIMIENTO`, `VENCIMIENTO`) en vez de "primer match del regex en todo
    el texto" — ver `ocr.test.js` para los casos cubiertos.
  - `faltanCampos(datosFormateados)` — dice si al string ya formateado le falta
    algún campo, para decidir si vale la pena el reintento con preprocesamiento.
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

- **Todavía no probado con una foto sacada en vivo desde webcam** (baja resolución,
  posible blur de movimiento, mala luz). Lo único probado contra datos reales hasta
  ahora es una foto fija de buena calidad (ver Bitácora) — el escenario de cámara en
  vivo (el que originalmente motivó el backend) sigue sin validar.
- **Script de `tesseract.js` en `index.html` sin uso** (dead code, ver arriba) —
  todavía no se sacó.
- **Extracción de nombre/fecha ancladas por texto, no por coordenadas.** Si Tesseract
  lee mal la propia etiqueta (`NOMBRES`, `FECHA`), la extracción de ese campo falla
  silenciosamente y devuelve "No encontrado". El upgrade, si esto pasa seguido con
  cédulas reales, es recortar la imagen por región fija en vez de anclar por texto
  (ver comentarios `ponytail:` en `ocr.js`).
- **CI todavía puede matchear cualquier número de 6-8 dígitos** que no sea una fecha
  — mejoró (antes también podía matchear un pedazo de fecha), pero no hay una
  etiqueta clara para anclarlo como con nombre/fecha.
- **`README.md`** ya no está vacío (ver raíz del repo), pero no tiene capturas ni demo.

**Resuelto** (ver Bitácora):

- ~~Falta extraer el nombre~~ → `extraerNombre()` en `ocr.js`.
- ~~Sin preprocesamiento de imagen~~ → `preprocesarImagen()` en `ocr.js`, con
  fallback condicional (ver Bitácora, no siempre conviene preprocesar).
- ~~Regex de fecha ambiguo~~ → `extraerFechaNacimiento()` ancla por la etiqueta
  `NACIMIENTO` en vez de tomar la primera fecha del texto.
- ~~Sin validación de entrada~~ → `/api/scan` devuelve 400 si falta `foto` o no es
  un data URL de imagen.
- ~~Sin probar contra una cédula real~~ → probado contra una foto real (ver
  Bitácora); sigue pendiente el caso específico de webcam en vivo.
- ~~Todo en la raíz del repo~~ → backend movido a `src/`.

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

### 2026-08-17 (misma rama, segunda tanda) — probado contra una foto real + reorganización en carpetas

El usuario no tiene cámara en esta computadora (solo en la de trabajo), así que se
probó el pipeline contra una foto real de cédula que ya había compartido antes en la
conversación (no un fixture sintético).

- **Resultado real, primera pasada (sin preprocesar)**: CI y fecha de nacimiento
  salieron bien; el nombre salió con basura pegada al final:
  `"* MEZA GIMENEZ JUAN MARTHIN FECHA DE"`. Bug real, no hipotético — el corte de
  `extraerNombre()` estaba anclado en `NACIMIENTO`, pero el label completo es
  "FECHA DE NACIMIENTO", así que "FECHA DE" quedaba pegado al nombre. **Corregido**:
  el corte ahora es en `FECHA`, y se agregó un `.replace()` para sacar basura de OCR
  (asteriscos, etc.) al principio del nombre.
  - Esto también reveló que el test de `ocr.test.js` no lo hubiese detectado: usaba
    `assert.match` (substring) en vez de comparar la línea completa, así que un
    "FECHA DE" colgando pasaba el test igual. Se endureció el assert a línea exacta
    (`/^Nombre: .../m`).
- **Resultado real, con preprocesamiento (`jimp`)**: en esta foto (buena luz, buena
  resolución) el preprocesamiento **empeoró** el resultado — el CI pasó de
  reconocerse bien a "No encontrado", y tardó ~4x más (3.7s vs 0.9s) sin mejorar
  nombre ni fecha. La hipótesis original ("preprocesar siempre ayuda") era
  incorrecta para este caso; validado con datos reales, no solo argumentado.
  - **Decisión, con evidencia**: `server.js` ahora prueba primero con la foto tal
    cual (rápido, y funcionó perfecto en esta foto real), y solo si a
    `procesarTextoOCR()` le faltó algún campo reintenta con `preprocesarImagen()`.
    Nueva función `faltanCampos()` en `ocr.js` para esa decisión.
  - Con el fix de `extraerNombre()` + esta estrategia, la foto real de prueba dio
    los tres campos correctos en la primera pasada (~0.8s), sin necesitar el
    fallback preprocesado.
  - **Sigue sin probarse el caso que originalmente rompía todo**: una captura en
    vivo de webcam (baja resolución, posible blur) es distinta a una foto fija bien
    sacada. Ahí sí puede que el fallback preprocesado entre en juego y haga falta
    calibrar sus parámetros — eso queda pendiente hasta poder probar con cámara real
    (próxima sesión en la compu de trabajo).
- **Reorganización en carpetas** (pedida explícitamente): `server.js`, `ocr.js` y
  `ocr.test.js` se movieron a `src/` (con `git mv`, historia preservada). Se
  actualizó `package.json` (`main`, y se agregó script `start`) y se corrió todo de
  nuevo (`npm test`, `npm start` + `curl`) para confirmar que las rutas relativas
  (`require("./ocr")`) y todo lo demás siguieron funcionando después del move.
