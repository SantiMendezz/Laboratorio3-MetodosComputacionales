import { evaluate, parse, log10 } from "mathjs";
import promptSync from "prompt-sync";
import { plot } from "nodeplotlib";

const prompt = promptSync();

// FUNCIONES AUXILIARES

// Función para validar que la función ingresada sea correcta
// Básicamente intento parsearla con mathjs y si no da error, es válida
function validarFuncion(funcionStr) {
  try {
    parse(funcionStr); // intento parsear
    return true;
  } catch {
    return false;
  }
}

// Búsqueda de intervalos con cambio de signo
// Este método hace un barrido de [rangoMin, rangoMax] con paso fijo
// Para detectar intervalos donde f(x) cambia de signo
function buscarIntervalos(funcStr, rangoMin, rangoMax, incremento = 0.5) {
  const f = (x) => evaluate(funcStr, { x }); // función evaluable
  const intervalos = [];
  const EPS = 1e-8; // tolerancia para considerar que es cero

  let x1 = rangoMin;
  let f1 = f(x1);

  // barrido hasta el máximo
  while (x1 + incremento <= rangoMax) {
    let x2 = x1 + incremento;
    let f2 = f(x2);

    // Si f(x) es prácticamente cero en algún extremo, lo guardo como intervalo "puntual"
    if (Math.abs(f1) < EPS) {
      intervalos.push([x1, x1]);
    } else if (Math.abs(f2) < EPS) {
      intervalos.push([x2, x2]);
    } else if (f1 * f2 < 0) {
      // Si hay cambio de signo, guardo el intervalo
      intervalos.push([x1, x2]);
    }

    x1 = x2;
    f1 = f2;
  }

  return intervalos;
}

// MÉTODO DEL INTERVALO MEDIO (Bisección)
// Función que implementa el método del intervalo medio
// Devuelve un objeto con la raíz aproximada, iteraciones y el intervalo final
function metodoIntervaloMedio(funcStr, a, b, tol) {
  const f = (x) => evaluate(funcStr, { x });

  let fa = f(a);
  let fb = f(b);

  if (fa * fb > 0) {
    // Si los extremos no tienen cambio de signo, no se puede aplicar
    console.log(`⚠ No hay cambio de signo en [${a.toFixed(6)}, ${b.toFixed(6)}]`);
    return null;
  }

  // Cálculo de iteraciones teóricas máximas
  const nTeorico = (log10(b - a) - log10(tol)) / log10(2);
  const nMax = Math.ceil(nTeorico);

  // Mostrar info inicial del intervalo
  console.log(`\n🔹 Intervalo inicial: [${a.toFixed(6)}, ${b.toFixed(6)}]`);
  console.log(`🔹 f(a) = ${fa.toFixed(6)}, f(b) = ${fb.toFixed(6)}`);
  console.log(`🔹 Tolerancia: ${tol}`);
  console.log(`🔹 Iteraciones teóricas máximas: ${nMax}`);
  console.log("\n📘 Iteraciones:\n");
  console.log("Iter\t     a\t       b\t       xi\t      f(xi)");

  let xi = (a + b) / 2; // inicializo xi antes del bucle
  let xiAnt;

  for (let i = 1; i <= nMax; i++) {
    xiAnt = xi;
    xi = (a + b) / 2;
    const fxi = f(xi);

    console.log(
      `${i.toString().padEnd(5)}  ${a.toFixed(6).padEnd(12)}  ${b.toFixed(6).padEnd(12)}  ${xi
        .toFixed(6)
        .padEnd(12)}  ${fxi.toFixed(6)}`
    );

    // Condición de parada: si f(xi) es suficientemente pequeño o cambio de xi pequeño
    if (Math.abs(fxi) < tol || (i > 1 && Math.abs(xi - xiAnt) < tol)) break;

    if (fa * fxi < 0) {
      b = xi;
      fb = fxi;
    } else {
      a = xi;
      fa = fxi;
    }
  }

  // Devuelvo la raíz encontrada, número de iteraciones y el intervalo final
  return { raiz: xi, iteraciones: nMax, intervalo: [a, b] };
}

// PROGRAMA PRINCIPAL
console.clear();
console.log(" MÉTODO DEL INTERVALO MEDIO \n");

// Pido al usuario la función
const funcionUsuario = prompt("Ingrese la función en x (ej: x^3 - 6x^2 + 11x - 6): ");

// Valido la función
if (!validarFuncion(funcionUsuario)) {
  console.log("❌ Error: la función ingresada no es válida.");
  process.exit(1);
}

// Parámetros
const tol = Number(prompt("Ingrese la tolerancia (ej: 0.001): ")) || 0.001;
const rangoMin = -100;
const rangoMax = 100;

// Busco intervalos automáticamente
console.log(`\n🔍 Buscando intervalos con cambio de signo en [${rangoMin}, ${rangoMax}]...`);
const intervalos = buscarIntervalos(funcionUsuario, rangoMin, rangoMax, 0.5);

if (intervalos.length === 0) {
  console.log("⚠ No se encontraron intervalos con cambio de signo.");
  process.exit(0);
}

// Muestro los intervalos detectados
console.log("\n✅ Intervalos detectados:");
intervalos.forEach(([a, b], i) => console.log(`  ${i + 1}) [${a.toFixed(6)}, ${b.toFixed(6)}]`));

// Aplico el método del intervalo medio en cada intervalo detectado
const raices = [];
for (const [a, b] of intervalos) {
  const resultado = metodoIntervaloMedio(funcionUsuario, a, b, tol);
  if (resultado !== null) raices.push(resultado);
}

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

  // Genero datos para graficar
  const f = (x) => evaluate(funcionUsuario, { x });
  const xs = [];
  const ys = [];
  const pasos = 200;

  for (let i = 0; i <= pasos; i++) {
    const x = rangoMin + (i * (rangoMax - rangoMin)) / pasos;
    xs.push(x);
    ys.push(f(x));
  }

  // Grafico función y raíces encontradas
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