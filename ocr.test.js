// Self-check de procesarTextoOCR: la lógica de parseo es la parte con ramas
// reales de este módulo (preprocesarImagen es puro IO de imagen, sin fixture
// no vale la pena testearla acá). Usa el test runner nativo de Node, sin deps.
const test = require("node:test");
const assert = require("node:assert/strict");
const { procesarTextoOCR } = require("./ocr");

// Texto de ejemplo con la MISMA estructura que una cédula paraguaya real
// (ver CLAUDE.md), pero con datos inventados — no son datos de nadie real.
const textoOcrDeEjemplo = `
REPUBLICA DEL PARAGUAY
Cedula de Identidad Civil
APELLIDOS, NOMBRES
PEREZ ROJAS
ANA MARIA
FECHA DE NACIMIENTO
15-03-1990
LUGAR DE NACIMIENTO
ASUNCION
FECHA DE VENCIMIENTO
15-03-2030
SEXO
Femenino
1234567
`;

test("extrae CI, nombre y fecha de nacimiento (no la de vencimiento)", () => {
  const resultado = procesarTextoOCR(textoOcrDeEjemplo);
  assert.match(resultado, /CI: 1234567/);
  assert.match(resultado, /Nombre: PEREZ ROJAS ANA MARIA/);
  assert.match(resultado, /Fecha de Nacimiento: 15-03-1990/);
  assert.doesNotMatch(resultado, /Fecha de Nacimiento: 15-03-2030/);
});

test("sin etiquetas reconocibles, devuelve 'No encontrado' sin romper", () => {
  const resultado = procesarTextoOCR("texto sin ningun dato util");
  assert.match(resultado, /CI: No encontrado/);
  assert.match(resultado, /Nombre: No encontrado/);
  assert.match(resultado, /Fecha de Nacimiento: No encontrado/);
});
