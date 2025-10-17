import { evaluate, parse, log10 } from "mathjs";
import promptSync from "prompt-sync";
import { plot } from "nodeplotlib";

const prompt = promptSync();

// FUNCIONES AUXILIARES

// Función para validar que la función ingresada sea correcta
// Intento parsearla con mathjs y si no da error, es válida
function validarFuncion(funcionStr) {
  try {
    parse(funcionStr); // intento parsear
    return true;
  } catch {
    return false;
  }
}

/**
 * Función auxiliar que envuelve la evaluación con un manejo de errores
 * para evitar que el programa falle si la función se evalúa fuera de su dominio.
 * @param {string} funcStr - La función como string.
 * @param {number} x - El valor de x.
 * @returns {number|NaN} El resultado de f(x) o NaN si hay un error.
 */
const fEvaluador = (funcStr, x) => {
  try {
    // Si da un número complejo, mathjs puede devolver un objeto
    const resultado = evaluate(funcStr, { x });
    if (typeof resultado === 'number') {
      return resultado;
    }
    // Si es un número complejo o un resultado no numérico, lo tratamos como no válido
    return NaN;
  } catch {
    return NaN; // Devuelve NaN si hay un error de dominio (ej: log(-1))
  }
}

// Búsqueda de intervalos con cambio de signo
// Este método hace un barrido de [rangoMin, rangoMax] con incremento fijo
// Para detectar intervalos donde f(x) cambia de signo
function buscarIntervalos(funcStr, rangoMin, rangoMax, incremento = 0.5) {
  const f = (x) => fEvaluador(funcStr, x); // función evaluable mejorada

  const intervalos = [];
  const posiblesRaices = [];

  let x1 = rangoMin;
  let f1 = f(x1);

  // Repetición hasta el máximo
  while (x1 + incremento <= rangoMax) {
    let x2 = x1 + incremento;
    let f2 = f(x2);

    // Evitar NaNs (errores de dominio)
    if (isNaN(f1) || isNaN(f2)) {
      x1 = x2;
      f1 = f2;
      continue;
    }

    // Si f(x1) o f(x2) es exactamente cero, se considera raíz directa
    if (Math.abs(f1) === 0) posiblesRaices.push(x1);
    if (Math.abs(f2) === 0) posiblesRaices.push(x2);

    // Si hay cambio de signo entre f1 y f2, guardo el intervalo
    if (f1 * f2 < 0) {
      intervalos.push([x1, x2]);
    }

    x1 = x2;
    f1 = f2;
  }

  // Combinar intervalos y raíces puntuales sin duplicados
  return {
    intervalos,
    // Uso toFixed(6) para evitar problemas de coma flotante
    raicesDirectas: [...new Set(posiblesRaices.map((x) => Number(x.toFixed(6))))],
  };
}

// MÉTODO DEL INTERVALO MEDIO (Bisección)
// Función que implementa el método del intervalo medio
// Devuelve un objeto con la raíz aproximada, iteraciones y el intervalo final
function metodoIntervaloMedio(funcStr, a, b, tol = 1e-6) {
  if (a === b) return null; // No tiene sentido si el intervalo no tiene amplitud

  const f = (x) => fEvaluador(funcStr, x);

  let fa = f(a);
  let fb = f(b);

  // Comprobación inicial de NaN -> no numerico
  if (isNaN(fa) || isNaN(fb)) {
    console.log(`⚠ La función no está definida en [${a.toFixed(6)}, ${b.toFixed(6)}] (NaN detectado).`);
    return null;
  }

  if (fa * fb > 0) {
    console.log(`⚠ No hay cambio de signo en [${a.toFixed(6)}, ${b.toFixed(6)}]`);
    return null;
  }

  // Cálculo de iteraciones teóricas máximas
  const nTeorico = (Math.log(b - a) - Math.log(tol)) / Math.log(2);
  const nMax = Math.ceil(nTeorico);

  // Mostrar encabezado inicial
  console.log("\nFunción ingresada:", funcStr);
  console.log(`Intervalo inicial: [${a}, ${b}]`);
  console.log(`Tolerancia: ${tol}`);
  console.log(`Iteraciones teóricas máximas: ${nMax}`);
  console.log("\nIteraciones Método del Intervalo Medio:\n");

  let xi = a;         // Inicializo xi en el límite izquierdo
  let xiAnt = null;   // Para indicar que aún no hay iteración anterior

  for (let i = 1; i <= nMax; i++) {
    xi = (a + b) / 2;
    const fxi = f(xi);

    console.log(
      `Iteración ${i}: a = ${a.toFixed(6)}, b = ${b.toFixed(6)}, ` +
      `xi = ${xi.toFixed(6)}, f(a) = ${fa.toFixed(6)}, f(b) = ${fb.toFixed(
        6
      )}, f(xi) = ${fxi.toFixed(6)}, dif-error = ${Math.abs(xi - xiAnt).toFixed(6)}`
    );

    // Condición de parada: no se evalúa si xiAnt es null (primera iteración)
    if (xiAnt !== null && (Math.abs(xi - xiAnt) < tol || Math.abs(fxi) < tol)) {
      console.log("\n✔ Convergencia alcanzada");
      return { raiz: xi, iteraciones: i, intervalo: [a, b] };
    }

    // Actualización del intervalo según el cambio de signo
    if (fa * fxi < 0) {
      b = xi;
      fb = fxi; // Actualizar fb
    } else {
      a = xi;
      fa = fxi; // Actualizar fa
    }

    xiAnt = xi; // Actualizo xi anterior para la siguiente iteración
  }

  console.log("\n❌ No se alcanzó convergencia en el máximo de iteraciones");
  return { raiz: xi, iteraciones: nMax, intervalo: [a, b] };
}

// PROGRAMA PRINCIPAL
console.clear();
console.log(" MÉTODO DEL INTERVALO MEDIO \n");

// Pido al usuario la función
const funcionUsuario = prompt("Ingrese la función en x (ej: x^3 -2x -2): ");

// Valido la función
if (!validarFuncion(funcionUsuario)) {
  console.log("❌ Error: la función ingresada no es válida.");
  process.exit(1);
}

// Parámetros
const tol = Number(prompt("Ingrese la tolerancia (ej: 0.001): ")) || 0.001;
const rangoMin = -10;
const rangoMax = 10;

console.time("Tiempo de ejecución");

// Busco intervalos automáticamente
console.log(`\n🔍 Buscando intervalos con cambio de signo en [${rangoMin}, ${rangoMax}]...`);
const { intervalos, raicesDirectas } = buscarIntervalos(funcionUsuario, rangoMin, rangoMax, 0.5);

// Si no hay nada, salir
if (intervalos.length === 0 && raicesDirectas.length === 0) {
  console.log("⚠ No se encontraron intervalos con cambio de signo.");
  process.exit(0);
}

// Mostrar resultados encontrados
console.log("\n✅ Intervalos detectados:");
intervalos.forEach(([a, b], i) => console.log(`  ${i + 1}) [${a.toFixed(6)}, ${b.toFixed(6)}]`));

if (raicesDirectas.length > 0) {
  console.log("\n✅ Raíces directas detectadas (f(x) = 0):");
  raicesDirectas.forEach((r, i) => console.log(`  → Raíz ${i + 1}: x = ${r}`));
}

// Aplico el método del intervalo medio en cada intervalo detectado
const raices = [];
for (const [a, b] of intervalos) {
  const resultado = metodoIntervaloMedio(funcionUsuario, a, b, tol);
  if (resultado !== null) raices.push(resultado);
}

// Agrego las raíces directas también al resumen
raicesDirectas.forEach((r) => {
  raices.push({ raiz: r, iteraciones: 0, intervalo: [r, r] });
});

// RESULTADOS Y GRAFICO
if (raices.length > 0) {
  console.log("\n📊 Resumen de raíces encontradas:");
  console.table(
    raices.map((r, i) => ({
      "#": i + 1,
      "Intervalo [a,b]": `[${r.intervalo[0].toFixed(6)}, ${r.intervalo[1].toFixed(6)}]`,
      "Raíz aprox.": r.raiz.toFixed(6),
      "Iteraciones": r.iteraciones,
    }))
  );

  // ===============================
  // GRAFICADO
  // ===============================
  const f = (x) => fEvaluador(funcionUsuario, x);
  const Y_LIMIT = 1e6;
  const pasos = 400;

  // Guardará segmentos de la función continua
  const segmentos = [];
  let xs = [];
  let ys = [];

  for (let i = 0; i <= pasos; i++) {
    const x = rangoMin + (i * (rangoMax - rangoMin)) / pasos;
    const y = f(x);

    // Si la función no es finita (NaN o ±Infinity), corto el trazo
    if (isNaN(y) || !Number.isFinite(y)) {
      if (xs.length > 0) {
        segmentos.push({ x: [...xs], y: [...ys] });
        xs = [];
        ys = [];
      }
      continue;
    }

    xs.push(x);
    ys.push(Math.max(-Y_LIMIT, Math.min(Y_LIMIT, y)));
  }

  // Agrego último segmento si hay datos pendientes
  if (xs.length > 0) segmentos.push({ x: xs, y: ys });

  // ===============================
  // MARCADORES DE RAÍCES
  // ===============================
  const rootXs = [];
  const rootYs = [];
  for (const r of raices) {
    const xR = r.raiz;
    const yR = fEvaluador(funcionUsuario, xR);
    if (!isNaN(yR) && Number.isFinite(yR)) {
      rootXs.push(xR);
      rootYs.push(Math.max(-Y_LIMIT, Math.min(Y_LIMIT, yR)));
    }
  }

  // ===============================
  // PLOTEO FINAL
  // ===============================
  try {
    plot([
      // Dibuja cada segmento continuo por separado
      ...segmentos.map((seg) => ({
        x: seg.x,
        y: seg.y,
        type: "scatter",
        mode: "lines",
        name: funcionUsuario,
      })),
      // Dibuja las raíces en rojo
      {
        x: rootXs,
        y: rootYs,
        type: "scatter",
        mode: "markers",
        name: "Raíces encontradas",
        marker: { color: "red", size: 10 },
      },
    ]);
  } catch (err) {
    console.error("Error al graficar:", err.message || err);
  }
}

console.timeEnd("Tiempo de ejecución");