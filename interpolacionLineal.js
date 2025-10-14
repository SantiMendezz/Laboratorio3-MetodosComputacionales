import { evaluate, parse, log10 } from "mathjs";
import promptSync from "prompt-sync";
import { plot } from "nodeplotlib";

const prompt = promptSync();

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

// Validar función
function validarFuncion(funcionStr) {
  try {
    parse(funcionStr);
    return true;
  } catch {
    return false;
  }
}

// Contar cambios de signo en los coeficientes (Regla de Descartes)
function contarCambiosSigno(coefs) {
  let cambios = 0;
  for (let i = 0; i < coefs.length - 1; i++) {
    if (coefs[i] * coefs[i + 1] < 0) cambios++;
  }
  return cambios;
}

// Extraer coeficientes de una función polinómica simple en x
function extraerCoeficientes(polinomioStr) {
  const expr = polinomioStr.replace(/\s+/g, "");
  const terminos = expr.match(/[+-]?\d*\.?\d*x?(\^\d+)?/g)?.filter((t) => t) || [];
  const coefs = {};

  for (const term of terminos) {
    const match = term.match(/([+-]?\d*\.?\d*)x?(\^(\d+))?/);
    if (!match) continue;

    let [, num, , exp] = match;
    const coef = num === "" || num === "+" ? 1 : num === "-" ? -1 : parseFloat(num);
    const exponente = exp ? parseInt(exp) : term.includes("x") ? 1 : 0;
    coefs[exponente] = (coefs[exponente] || 0) + coef;
  }

  const gradoMax = Math.max(...Object.keys(coefs).map(Number));
  const arreglo = [];
  for (let i = gradoMax; i >= 0; i--) arreglo.push(coefs[i] || 0);
  return arreglo;
}

// Buscar intervalos con cambio de signo
function buscarIntervalos(funcStr, rangoMin, rangoMax, incremento = 0.5) {
  const f = (x) => evaluate(funcStr, { x });
  const intervalos = [];
  const EPS = 1e-8;

  let x1 = rangoMin;
  let f1 = f(x1);

  while (x1 + incremento <= rangoMax) {
    let x2 = x1 + incremento;
    let f2 = f(x2);

    if (Math.abs(f1) < EPS) {
      intervalos.push([x1, x1]);
    } else if (Math.abs(f2) < EPS) {
      intervalos.push([x2, x2]);
    } else if (f1 * f2 < 0) {
      intervalos.push([x1, x2]);
    }

    x1 = x2;
    f1 = f2;
  }

  return intervalos;
}

// ============================================================
// MÉTODO DE INTERPOLACIÓN LINEAL (REGULA FALSI)
// ============================================================
function interpolacionLineal(funcStr, a, b, tol, maxIter = 50) {
  const f = (x) => evaluate(funcStr, { x });

  let fa = f(a);
  let fb = f(b);

  // 🚫 Intervalo degenerado (posible raíz exacta)
  if (a === b) {
    if (Math.abs(fa) < tol) {
      console.log(`✅ Raíz exacta detectada en x = ${a}`);
      return { raiz: a, iter: 0, intervalo: [a, b] };
    } else {
      console.log(`⚠ Intervalo degenerado [${a}, ${b}] sin raíz válida`);
      return null;
    }
  }

  // 🚫 Sin cambio de signo
  if (fa * fb > 0) {
    console.log(`⚠ No hay cambio de signo en [${a}, ${b}]`);
    return null;
  }

  let xi, fxi;
  for (let i = 1; i <= maxIter; i++) {
    const divisor = fb - fa;
    if (Math.abs(divisor) < 1e-12) {
      console.log("⚠ División por cero evitada (fb ≈ fa). Terminando iteraciones.");
      return null;
    }

    xi = (a * fb - b * fa) / divisor;
    fxi = f(xi);

    console.log(
      `Iteración ${i}: a=${a.toFixed(6)}, b=${b.toFixed(6)}, xi=${xi.toFixed(6)}, f(xi)=${fxi.toFixed(6)}`
    );

    if (Math.abs(fxi) < tol) {
      console.log(`✔ Convergencia alcanzada en ${i} iteraciones`);
      return { raiz: xi, iter: i, intervalo: [a, b] };
    }

    if (fa * fxi < 0) {
      b = xi;
      fb = fxi;
    } else {
      a = xi;
      fa = fxi;
    }
  }

  console.log("❌ No se alcanzó convergencia en el máximo de iteraciones");
  return { raiz: xi, iter: maxIter, intervalo: [a, b] };
}

// ============================================================
// PROGRAMA PRINCIPAL
// ============================================================

console.clear();
console.log(" MÉTODO DE INTERPOLACIÓN LINEAL (REGULA FALSI)\n");

// Ingreso de función
const funcionUsuario = prompt("Ingrese la función en x (ej: x^3 - 6x^2 + 11x - 6): ");

if (!validarFuncion(funcionUsuario)) {
  console.log("❌ Error: la función ingresada no es válida.");
  process.exit(1);
}

// Mostrar regla de Descartes si es polinómica
try {
  const coefs = extraerCoeficientes(funcionUsuario);
  const cambios = contarCambiosSigno(coefs);
  console.log(`\n📈 Regla de Descartes: ${cambios} posibles raíces reales positivas.`);
} catch {
  console.log("⚠ No se pudo aplicar la regla de Descartes (no parece ser polinómica).");
}

// Parámetros
const tol = Number(prompt("Ingrese la tolerancia (ej: 0.001): ")) || 0.001;
const rangoMin = -100;
const rangoMax = 100;

// Buscar intervalos con cambio de signo
console.log(`\n🔍 Buscando intervalos con cambio de signo en [${rangoMin}, ${rangoMax}]...`);
const intervalos = buscarIntervalos(funcionUsuario, rangoMin, rangoMax, 0.5);

if (intervalos.length === 0) {
  console.log("⚠ No se encontraron intervalos con cambio de signo.");
  process.exit(0);
}

console.log("\n✅ Intervalos detectados:");
intervalos.forEach(([a, b], i) =>
  console.log(`  ${i + 1}) [${a.toFixed(6)}, ${b.toFixed(6)}]`)
);

// Aplicar el método en cada intervalo
const raices = [];
for (const [a, b] of intervalos) {
  const resultado = interpolacionLineal(funcionUsuario, a, b, tol);
  if (resultado !== null) raices.push(resultado);
}

// Mostrar resultados
if (raices.length > 0) {
  console.log("\n📊 Resumen de raíces encontradas:");
  console.table(
    raices.map((r, i) => ({
      "#": i + 1,
      "Intervalo [a,b]": `[${r.intervalo[0].toFixed(6)}, ${r.intervalo[1].toFixed(6)}]`,
      "Raíz aprox.": r.raiz.toFixed(6),
      "Iteraciones": r.iter,
    }))
  );

  // Graficar
  const f = (x) => evaluate(funcionUsuario, { x });
  const xs = [];
  const ys = [];
  const pasos = 200;

  for (let i = 0; i <= pasos; i++) {
    const x = rangoMin + (i * (rangoMax - rangoMin)) / pasos;
    xs.push(x);
    ys.push(f(x));
  }

  plot([
    {
      x: xs,
      y: ys,
      type: "scatter",
      mode: "lines",
      name: funcionUsuario,
    },
    {
      x: raices.map((r) => r.raiz),
      y: raices.map((r) => evaluate(funcionUsuario, { x: r.raiz })),
      type: "scatter",
      mode: "markers",
      name: "Raíces encontradas",
      marker: { color: "red", size: 10 },
    },
  ]);
} else {
  console.log("❌ No se encontraron raíces para graficar.");
}