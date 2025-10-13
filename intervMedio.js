import { evaluate, log10 } from "mathjs";
import promptSync from "prompt-sync";
import { plot } from "nodeplotlib";

const prompt = promptSync();

// ===========================
// Funciones auxiliares
// ===========================

// Contar cambios de signo en un arreglo de coeficientes
function contarCambiosSigno(coefs) {
  let cambios = 0;
  for (let i = 0; i < coefs.length - 1; i++) {
    if (coefs[i] * coefs[i + 1] < 0) cambios++;
  }
  return cambios;
}

// Convertir string de polinomio a arreglo de coeficientes
function extraerCoeficientes(polinomioStr) {
  const coefs = polinomioStr
    .replace(/\s+/g, "")
    .replace(/-/g, "+-")
    .split("+")
    .filter(s => s !== "")
    .map(term => {
      let coef = term.replace(/x(\^\d+)?/, "");
      if (coef === "" || coef === "+") return 1;
      if (coef === "-") return -1;
      return parseFloat(coef);
    });
  return coefs;
}

// ===========================
// Método del Intervalo Medio
// ===========================
function intervaloMedio(funcStr, a, b, tol = 1e-4) {
  const f = (x) => evaluate(funcStr, { x });
  let fa = f(a);
  let fb = f(b);

  if (fa * fb > 0) {
    console.log(`⚠ No hay cambio de signo en [${a}, ${b}]`);
    return null;
  }

  const nTeorico = (log10(b - a) - log10(tol)) / log10(2);
  const nMax = Math.ceil(nTeorico);

  let xi;
  for (let i = 1; i <= nMax; i++) {
    xi = (a + b) / 2;
    const fxi = f(xi);

    if (Math.abs(fxi) < tol) break;

    if (fa * fxi < 0) {
      b = xi;
      fb = fxi;
    } else {
      a = xi;
      fa = fxi;
    }
  }

  return { raiz: xi, iteraciones: nMax, intervalo: [a, b] };
}

// ===========================
// Método de Tanteos Automático
// ===========================
function buscarIntervalos(funcStr, rangoMin, rangoMax, incremento = 0.1) {
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

// ===========================
// Programa principal
// ===========================
const funcionUsuario = prompt("Ingrese la función en x (ej: x^3 - x - 2): ");

// ---------------------------
// Máximo de raíces según Descartes
// ---------------------------
const coefs = extraerCoeficientes(funcionUsuario);
console.log("\n📌 Coeficientes del polinomio:", coefs);
console.log("🔹 Máximo de raíces positivas:", contarCambiosSigno(coefs));

const coefsNeg = coefs.map((c, i) => ((coefs.length - 1 - i) % 2 === 1 ? -c : c));
console.log("🔹 Máximo de raíces negativas:", contarCambiosSigno(coefsNeg));

// ---------------------------
// Búsqueda de raíces
// ---------------------------
const tol = Number(prompt("Ingrese la tolerancia (ej: 0.01): ")) || 0.01;
const rangoMin = -10;
const rangoMax = 10;

console.log(`\n🔎 Buscando raíces en el rango [${rangoMin}, ${rangoMax}]...`);
const intervalos = buscarIntervalos(funcionUsuario, rangoMin, rangoMax);

if (intervalos.length === 0) {
  console.log("⚠ No se encontraron intervalos con cambio de signo.");
  process.exit(0);
}

console.log("\n✅ Intervalos con cambio de signo detectados:");
intervalos.forEach(([a, b], i) => console.log(`  ${i + 1}) [${a}, ${b}]`));

const raices = [];
for (const [a, b] of intervalos) {
  const resultado = intervaloMedio(funcionUsuario, a, b, tol);
  if (resultado !== null) raices.push(resultado);
}

// ---------------------------
// Resumen y gráfico
// ---------------------------
if (raices.length > 0) {
  console.log("\n📋 Resumen de raíces encontradas:");
  console.table(
    raices.map((r, i) => ({
      "#": i + 1,
      "Intervalo [a,b]": `[${r.intervalo[0].toFixed(6)}, ${r.intervalo[1].toFixed(6)}]`,
      "Raíz aprox.": r.raiz.toFixed(6),
      "Iteraciones": r.iteraciones,
    }))
  );

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