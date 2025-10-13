import { derivative, evaluate, parse } from "mathjs";
import promptSync from "prompt-sync";
import { plot } from "nodeplotlib";

const prompt = promptSync();

// Metodo Newton-Raphson
function newtonRaphson(funcStr, a, b, tol = 1e-6, maxIter = 20) {
  try {
    // Validar función
    if (!funcStr.includes("x")) {
      throw new Error("La función debe contener la variable x.");
    }
    parse(funcStr);

    const f = (x) => evaluate(funcStr, { x });
    const dfStr = derivative(funcStr, "x").toString();
    const ddfStr = derivative(dfStr, "x").toString(); // segunda derivada
    const df = (x) => evaluate(dfStr, { x });
    const ddf = (x) => evaluate(ddfStr, { x });

    // Evaluar extremos
    const fa = f(a), fb = f(b);
    const f2a = ddf(a), f2b = ddf(b);

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

    console.log("\nFunción ingresada:", funcStr);
    console.log("f'(x):", dfStr);
    console.log("f''(x):", ddfStr);
    console.log("Iteraciones Newton-Raphson:\n");

    let xi = x0;
    for (let i = 1; i <= maxIter; i++) {
      const fxi = f(xi);
      const dfxi = df(xi);

      if (dfxi === 0) {
        console.log(`Iteración ${i}: Derivada nula, no se puede continuar.`);
        return null;
      }

      const xnext = xi - fxi / dfxi;
      console.log(
        `Iteración ${i}: x = ${xi.toFixed(6)}, f(x) = ${fxi.toFixed(
          6
        )}, f'(x) = ${dfxi.toFixed(6)}, x-resultante = ${xnext.toFixed(6)}`
      );

      if (Math.abs(xnext - xi) < tol) {
        console.log("\n✔ Convergencia alcanzada");
        return xnext;
      }

      xi = xnext;
    }

    console.log("\n❌ No se alcanzó convergencia en el máximo de iteraciones");
    return xi;
  } catch (err) {
    console.error("⚠ Error: La función ingresada no es válida.");
    return null;
  }
}

const funcionUsuario = prompt("Ingrese la función en x (ej: x^3 - x - 2): ");

// Intervalo [a, b]
let a, b;
while (true) {
  const entradaA = Number(prompt("Ingrese el límite inferior a: "));
  const entradaB = Number(prompt("Ingrese el límite superior b: "));

  if (!isNaN(entradaA) && !isNaN(entradaB) && entradaA < entradaB) {
    a = entradaA;
    b = entradaB;
    break;
  }
  console.log("⚠ Intervalo inválido. a debe ser menor que b.");
}

// Tolerancia
let tol;
while (true) {
  const entradaTol = Number(prompt("Ingrese la tolerancia (ej: 0.0001): "));
  tol = Number(entradaTol);

  if (!isNaN(tol) && tol > 0) {
    break;
  }
  console.log("⚠ Entrada inválida. Debe ingresar un número mayor que 0.");
}

// Ejecutar Newton-Raphson con condición de Fourier
const resultado = newtonRaphson(funcionUsuario, a, b, tol);

if (resultado !== null) {
  console.log(`\nResultado final: x ≈ ${resultado.toFixed(6)}`);

  // Graficar
  const f = (x) => evaluate(funcionUsuario, { x });
  const xs = [];
  const ys = [];
  const rangoMin = a - 1;
  const rangoMax = b + 1;
  const pasos = 100;

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
      x: [resultado],
      y: [f(resultado)],
      type: "scatter",
      mode: "markers",
      name: "Raíz encontrada",
      marker: { color: "red", size: 12 },
    },
  ]);
} else {
  console.log("❌ No se generará gráfico porque no se encontró raíz.");
}