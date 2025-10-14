import { evaluate } from "mathjs";
import promptSync from "prompt-sync";
import { plot } from "nodeplotlib";

const prompt = promptSync();

// Método de Interpolación Lineal (Regula Falsi)
function interpolacionLineal(funcStr, a, b, tol, maxIter = 50) {
  const f = (x) => evaluate(funcStr, { x });

  let fa = f(a);
  let fb = f(b);

  // Verificar cambio de signo
  if (fa * fb > 0) {
    console.log("⚠ No hay cambio de signo en [a, b]. El método no es aplicable.");
    return null;
  }

  let xi, fxi;
  for (let i = 1; i <= maxIter; i++) {
    // Fórmula de interpolación lineal
    xi = (a * fb - b * fa) / (fb - fa);
    fxi = f(xi);

    console.log(`Iteración ${i}: a = ${a.toFixed(6)}, b = ${b.toFixed(6)}, xi = ${xi.toFixed(6)}, f(xi) = ${fxi.toFixed(6)}`);

    if (Math.abs(fxi) < tol) {
      console.log("✔ Convergencia alcanzada");
      return { raiz: xi, iter: i };
    }

    // Actualizar intervalo
    if (fa * fxi < 0) {
      b = xi;
      fb = fxi;
    } else {
      a = xi;
      fa = fxi;
    }
  }

  console.log("❌ No se alcanzó convergencia en el máximo de iteraciones");
  return { raiz: xi, iter: maxIter };
}


const funcionUsuario = prompt("Ingrese la función en x (ej: x^3 - x - 2): ");

// Validar intervalo [a, b]
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

// Validar tolerancia
let tol;
while (true) {
  const entradaTol = Number(prompt("Ingrese la tolerancia (ej: 0.0001): "));
  if (!isNaN(entradaTol) && entradaTol > 0) {
    tol = entradaTol;
    break;
  }
  console.log("⚠ Entrada inválida. Debe ingresar un número mayor que 0.");
}

// Ejecutar método
const resultado = interpolacionLineal(funcionUsuario, a, b, tol);

if (resultado !== null) {
  const { raiz } = resultado;
  console.log(`\nResultado final: x ≈ ${raiz.toFixed(6)}`);

  // Graficar
  const f = (x) => evaluate(funcionUsuario, { x });
  const xs = [];
  const ys = [];
  const pasos = 100;
  const rangoMin = a - 1;
  const rangoMax = b + 1;

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
      x: [raiz],
      y: [f(raiz)],
      type: "scatter",
      mode: "markers",
      name: "Raíz encontrada",
      marker: { color: "red", size: 12 },
    },
    {
      x: [a, b],
      y: [f(a), f(b)],
      type: "scatter",
      mode: "markers",
      name: "Extremos iniciales",
      marker: { color: "blue", size: 8 },
    },
  ]);
} else {
  console.log("❌ No se generará gráfico porque no se encontró raíz.");
}