import { derivative, evaluate, parse } from "mathjs";
import promptSync from "prompt-sync";
import { plot } from "nodeplotlib";

const prompt = promptSync();

// Método Newton-Raphson con impresión de iteraciones
function newtonRaphson(funcStr, a, b, tol = 1e-6, maxIter = 20) {
  try {
    // Validar la función
    parse(funcStr);

    const f = (x) => evaluate(funcStr, { x });
    const dfStr = derivative(funcStr, "x").toString();
    const ddfStr = derivative(dfStr, "x").toString();
    const df = (x) => evaluate(dfStr, { x });
    const ddf = (x) => evaluate(ddfStr, { x });

    // Calculo de imagen de la funcion en los extremos y sus 2das derivadas
    const fa = f(a),
      fb = f(b);
    const f2a = ddf(a),
      f2b = ddf(b);
    // Evaluar extremos por condicion de fourier
    let x0;
    if (fa * f2a > 0) {
      x0 = a;
      console.log(`✔ Condición de Fourier: Usamos a = ${a}`);
    } else if (fb * f2b > 0) {
      x0 = b;
      console.log(`✔ Condición de Fourier: Usamos b = ${b}`);
    } else {
      console.error("⚠ Ningún extremo cumple la condición de Fourier.");
      return null;
    }

    //Mostrar la funcion y sus derivadas
    console.log("\nFunción ingresada:", funcStr);
    console.log("f'(x):", dfStr);
    console.log("f''(x):", ddfStr);
    console.log("\nIteraciones Newton-Raphson:\n");

    let xi = x0;
    for (let i = 1; i <= maxIter; i++) { //Iteraciones
      const fxi = f(xi);
      const dfxi = df(xi);

      if (dfxi === 0) {
        console.log(`Iteración ${i}: Derivada nula, no se puede continuar.`);
        return null;
      }

      //let diferenciaError = Math.abs(xnext - xi);

      const xnext = xi - fxi / dfxi; //Calculo de la iteracion
      console.log(
        `Iteración ${i}: x = ${xi.toFixed(6)}, f(x) = ${fxi.toFixed(
          6
        )}, f'(x) = ${dfxi.toFixed(6)}, x-resultante = ${xnext.toFixed(6)}, dif-error = ${Math.abs(xnext - xi).toFixed(6)}`
      );

      if (Math.abs(xnext - xi) < tol) { //Verifica la convergencia
        console.log("\n✔ Convergencia alcanzada");
        return xnext;
      }

      xi = xnext; //Actualiza el valor de xi al nuevo valor calculado
    }

    console.log("\n❌ No se alcanzó convergencia en el máximo de iteraciones");
    return xi;
  } catch (err) {
    console.error("⚠ Error: La función ingresada no es válida.");
    return null;
  }
}

// Método de tanteos para encontrar intervalos con cambio de signo
function tanteo(funcStr, xMin = -10, xMax = 10, paso = 0.5) { // El incremental es 0.5
  const f = (x) => evaluate(funcStr, { x });
  const intervalos = [];

  let x0 = xMin;
  let f0 = f(x0);

  for (let x = xMin + paso; x <= xMax; x += paso) {
    const f1 = f(x);
    if (f0 * f1 < 0) {
      intervalos.push([x0, x]); //Agrega nuevo intervalo
    }
    //Actualiza con los nuevos valores
    x0 = x;
    f0 = f1;
  }

  //Cantidad de elementos del array que cumplen las siguientes condiciones
  const positivas = intervalos.filter(([a, b]) => a >= 0).length;
  const negativas = intervalos.filter(([a, b]) => b <= 0).length;

  console.log(`\n🔍 Intervalos detectados con cambio de signo:`);
  intervalos.forEach(([a, b], i) =>
    console.log(`  Raíz ${i + 1}: entre [${a}, ${b}]`)
  );

  console.log(`\n➡ Raíces positivas: ${positivas}`);
  console.log(`➡ Raíces negativas: ${negativas}`);

  return intervalos;
}

// Programa principal
const funcionUsuario = prompt("Ingrese la función en x (ej: x^3 - x - 2): ");
const tol = Number(prompt("Ingrese la tolerancia (ej: 0.0001): ")) || 1e-6;

// Configuración del tanteo
const rangoInferior = -10;
const rangoSuperior = 10;
const paso = 0.5;

console.time("Tiempo de ejecución");

// Buscar intervalos
const intervalos = tanteo(funcionUsuario, rangoInferior, rangoSuperior, paso);

if (intervalos.length === 0) {
  console.log("❌ No se detectaron cambios de signo en el rango analizado.");
  process.exit(0);
}

// Ejecutar Newton-Raphson para cada raíz detectada
const raices = [];
for (const [a, b] of intervalos) {
  console.log("\n======================================");
  console.log(`🔹 Aplicando Newton-Raphson en [${a}, ${b}]`);
  console.log("======================================\n");

  const raiz = newtonRaphson(funcionUsuario, a, b, tol);

  if (raiz !== null) {
    console.log(`\n✔ Raíz encontrada entre [${a}, ${b}]: x ≈ ${raiz.toFixed(6)}\n`);
    raices.push(raiz);
  } else {
    console.log(`❌ Falló la convergencia en [${a}, ${b}]`);
  }
}

// Graficar función y raíces encontradas
if (raices.length > 0) {
  const f = (x) => evaluate(funcionUsuario, { x });
  const xs = [];
  const ys = [];
  const rangoMin = rangoInferior - 1;
  const rangoMax = rangoSuperior + 1;
  const pasos = 200;

  for (let i = 0; i <= pasos; i++) {
    const x = rangoMin + (i * (rangoMax - rangoMin)) / pasos;
    xs.push(x);
    ys.push(f(x));
  }

  const data = [
    {
      x: xs,
      y: ys,
      type: "scatter",
      mode: "lines",
      name: funcionUsuario,
    },
    {
      x: raices,
      y: raices.map((r) => f(r)),
      type: "scatter",
      mode: "markers",
      name: "Raíces encontradas",
      marker: { color: "red", size: 10 },
    },
  ];

  const layout = {
    title: { text: `Newton–Raphson`, x: 0.5 },
    xaxis: { title: { text: "x" }, zeroline: true },
    yaxis: { title: { text: "f(x)" }, zeroline: true },
    margin: { t: 60 },
    legend: { orientation: "h", y: -0.2 },
  };

  plot(data, layout);
} else {
  console.log("❌ No se encontró ninguna raíz válida.");
}

console.timeEnd("Tiempo de ejecución");