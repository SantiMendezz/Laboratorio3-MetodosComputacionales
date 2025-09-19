import { derivative, evaluate, parse } from "mathjs";
import promptSync from "prompt-sync";
import { plot } from "nodeplotlib";

const prompt = promptSync();

// Método Newton-Raphson
function newtonRaphson(funcStr, x0, tol = 1e-6, maxIter = 20) {
  try {
    // Validar que la función sea válida y contenga la variable "x"
    if (!funcStr.includes("x")) {
      throw new Error("La función debe contener la variable x.");
    }
    parse(funcStr);

    const f = (x) => evaluate(funcStr, { x });
    const df = (x) => evaluate(derivative(funcStr, "x").toString(), { x });

    console.log("\nFunción ingresada:", funcStr);
    console.log("Derivada:", derivative(funcStr, "x").toString());
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
        )}, f'(x) = ${dfxi.toFixed(6)}, x_next = ${xnext.toFixed(6)}`
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

// 🔹 Pedir función
const funcionUsuario = prompt("Ingrese la función en x (ej: x^3 - x - 2): ");

// 🔹 Validar entrada numérica para x0
let x0;
while (true) {
  const entrada = prompt("Ingrese el valor inicial x0 (puede ser positivo, negativo o decimal): ");
  x0 = Number(entrada);

  if (!isNaN(x0)) {
    break;
  }
  console.log("⚠ Entrada inválida. Debe ingresar un número.");
}

// 🔹 Validar entrada numérica para tolerancia
let tol;
while (true) {
  const entradaTol = prompt("Ingrese la tolerancia (ej: 0.0001): ");
  tol = Number(entradaTol);

  if (!isNaN(tol) && tol > 0) {
    break;
  }
  console.log("⚠ Entrada inválida. Debe ingresar un número mayor que 0.");
}

// Ejecutar Newton-Raphson
const resultado = newtonRaphson(funcionUsuario, x0, tol);

if (resultado !== null) {
  console.log(`\nResultado final: x ≈ ${resultado.toFixed(6)}`);

  // 🔹 Generar datos para el gráfico
  const f = (x) => evaluate(funcionUsuario, { x });
  const xs = [];
  const ys = [];
  const rangoMin = x0 - 5;
  const rangoMax = x0 + 5;
  const pasos = 100;

  for (let i = 0; i <= pasos; i++) {
    const x = rangoMin + (i * (rangoMax - rangoMin)) / pasos;
    xs.push(x);
    ys.push(f(x));
  }

  // 🔹 Mostrar gráfico
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
  console.log("❌ No se generará gráfico porque la función no es válida.");
}