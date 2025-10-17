import promptSync from "prompt-sync";
import { evaluate, parse } from "mathjs";
import { plot } from "nodeplotlib";

const prompt = promptSync();

// ------------------------------------------------------
// FUNCIONES AUXILIARES
// ------------------------------------------------------
function validarFuncion(funcStr) {
  try {
    parse(funcStr);
    return true;
  } catch {
    return false;
  }
}

function fEvaluador(funcStr, x) {
  try {
    const res = evaluate(funcStr, { x });
    return typeof res === "number" ? res : NaN;
  } catch {
    return NaN;
  }
}

// ------------------------------------------------------
// MÉTODO DE ITERACIÓN SIMPLE O ACELERADA (AITKEN)
// ------------------------------------------------------
function metodoIteracion(funcStrF, x0, tol = 1e-6, maxIter = 100, aplicarAitken = false) {
  // Definimos g(x) = x - f(x)
  const gStr = `(x - (${funcStrF}))`;
  const iteraciones = [];
  let x = x0;

  console.log(`\nFunción f(x) = ${funcStrF}`);
  console.log(`Función de iteración g(x) = ${gStr}`);
  console.log(`x₀ = ${x0}, tolerancia = ${tol}, máximo de iteraciones = ${maxIter}`);
  console.log(`Método: Iteración${aplicarAitken ? " + Aitken" : ""}\n`);
  console.log("Iteraciones:\n");

  let xAitken = null;

  for (let i = 1; i <= maxIter; i++) {
    const gx = fEvaluador(gStr, x);
    iteraciones.push({ x, gx });

    // Aplicar Aitken si hay al menos 3 puntos
    if (aplicarAitken && iteraciones.length >= 3) {
      const x0_prev = iteraciones[iteraciones.length - 3].x;
      const x1_prev = iteraciones[iteraciones.length - 2].x;
      const x2_prev = gx;
      const denom = x2_prev - 2 * x1_prev + x0_prev;

      if (Math.abs(denom) > 1e-12) {
        xAitken = x2_prev - ((x2_prev - x1_prev) ** 2) / denom;
      } else {
        xAitken = null;
      }
    } else {
      xAitken = null;
    }

    const mostrar = (num) => (Number.isFinite(num) ? num.toFixed(12) : num);

    if (xAitken !== null) {
      console.log(
        `Iteración ${i}: x = ${mostrar(x)}, g(x) = ${mostrar(gx)}, x(Aitken) = ${mostrar(xAitken)}`
      );
    } else {
      console.log(`Iteración ${i}: x = ${mostrar(x)}, g(x) = ${mostrar(gx)}`);
    }

    // Condición de parada
    if (Math.abs(gx - x) < tol || (xAitken !== null && Math.abs(xAitken - x) < tol)) {
      x = xAitken !== null ? xAitken : gx;
      console.log("\n✔ Convergencia alcanzada");
      return { raiz: x, iteraciones: i, historial: iteraciones, gStr };
    }

    // Actualizar x
    x = xAitken !== null ? xAitken : gx;
  }

  console.log("\n❌ No se alcanzó convergencia.");
  return { raiz: x, iteraciones: maxIter, historial: iteraciones, gStr };
}

// ------------------------------------------------------
// PROGRAMA PRINCIPAL
// ------------------------------------------------------
console.clear();
console.log("=== MÉTODO DE ITERACIÓN SIMPLE / AITKEN ===");

const funcionUsuario = prompt("Ingrese la función f(x): ");
if (!validarFuncion(funcionUsuario)) {
  console.log("❌ Función inválida.");
  process.exit(1);
}

const x0 = Number(prompt("Ingrese x₀: "));
const tol = Number(prompt("Ingrese la tolerancia (ej: 0.001): ")) || 0.001;
const aplicarAitken = prompt("¿Aplicar aceleración de Aitken? (s/n): ").toLowerCase() === "s";

const resultado = metodoIteracion(funcionUsuario, x0, tol, 100, aplicarAitken);

console.log(`\nAproximación final: x ≈ ${resultado.raiz.toFixed(12)}`);

// ------------------------------------------------------
// GRAFICAR RESULTADOS
// ------------------------------------------------------
const xs = [];
const ys_f = [];
const ys_g = [];
const ys_identidad = [];
const pasos = 200;

const f = (x) => fEvaluador(funcionUsuario, x);
const g = (x) => fEvaluador(resultado.gStr, x);

const minX = Math.min(...resultado.historial.map((h) => h.x)) - 1;
const maxX = Math.max(...resultado.historial.map((h) => h.x)) + 1;

for (let i = 0; i <= pasos; i++) {
  const x = minX + ((maxX - minX) * i) / pasos;
  xs.push(x);
  ys_f.push(f(x));
  ys_g.push(g(x));
  ys_identidad.push(x);
}

const layout = {
  title: { text: `Iteración de Aitken (Δ²)`, x: 0.5 },
  xaxis: { title: { text: "x" } },
  yaxis: { title: { text: "y" } },
  margin: { t: 70 },
  legend: { orientation: "h", y: -0.2 },
};

plot([
  { x: xs, y: ys_f, type: "scatter", mode: "lines", name: "f(x)" },
  { x: xs, y: ys_g, type: "scatter", mode: "lines", name: "g(x)" },
  { x: xs, y: ys_identidad, type: "scatter", mode: "lines", name: "y = x", line: { dash: "dot" } },
  {
    x: resultado.historial.map((h) => h.x),
    y: resultado.historial.map((h) => h.gx),
    type: "scatter",
    mode: "markers",
    name: "Iteraciones",
    marker: { color: "red", size: 10 },
  },
], layout);