import { evaluate, parse } from "mathjs";
import promptSync from "prompt-sync";
import { plot } from "nodeplotlib";

const prompt = promptSync();

// MÉTODO DE INTERPOLACIÓN LINEAL
function interpolacionLineal(funcStr, a, b, tol = 1e-6, maxIter = 50) { //1e-6 y 50 son valores predefinidos si estos no tienen valores asignados
  try {
    parse(funcStr); //evalua la funcion ingresada
    const f = (x) => evaluate(funcStr, { x }); //inicializa la funcion

    //Funciones
    let fa = f(a);
    let fb = f(b);

    if (fa * fb > 0) { //verificacion de cambio de signo
      console.log(`⚠ No hay cambio de signo en [${a}, ${b}]`);
      return null;
    }

    console.log(`\nFunción ingresada: ${funcStr}`);
    console.log("\nIteraciones Interpolación Lineal:\n");

    let xi, fxi;
    let xi_anterior = null;

    for (let i = 1; i <= maxIter; i++) {
      const divisor = fb - fa;
      if (Math.abs(divisor) < 1e-12) { //Si la division es aprox por 0 -> finalizan las iteraciones
        console.log(`Iteración ${i}: ⚠ División por cero (fb ≈ fa), terminando.`);
        return null;
      }

      // Fórmula de interpolacion lineal
      xi = (a * fb - b * fa) / divisor;
      fxi = f(xi); //imagen de xi

      //Valores de la iteracion
      console.log(
        `Iteración ${i}: a=${a.toFixed(6)}, b=${b.toFixed(6)}, xi=${xi.toFixed(
          6
        )}, f(xi)=${fxi.toFixed(6)}`
      );

      // Condición de convergencia (a partir de la segunda iteración)
      if (xi_anterior !== null && Math.abs(xi - xi_anterior) < tol) {
        console.log(`\n✔ Convergencia alcanzada en ${i} iteraciones.`);
        return xi;
      }

      // Actualizar extremos
      if (fa * fxi < 0) {
        b = xi;
        fb = fxi;
      } else {
        a = xi;
        fa = fxi;
      }

      xi_anterior = xi; // guardar para la próxima comparación
    }

    console.log("\n❌ No se alcanzó convergencia en el máximo de iteraciones.");
    return xi;
  } catch {
    console.error("⚠ Error: la función ingresada no es válida.");
    return null;
  }
}

// MÉTODO DE TANTEO
function tanteo(funcStr, xMin = -10, xMax = 10, incremento = 0.5) {
  const f = (x) => evaluate(funcStr, { x }); //funcion ingresada
  const intervalos = [];

  //Valor inicial
  let x0 = xMin;
  let f0 = f(x0);

  //Bucle para detectar cambios de signo
  while (x0 <= xMax) {
    const x1 = x0 + incremento;
    const f1 = f(x1);

    // Detecta cruce de signo -> agrega al array
    if (f0 * f1 < 0) {
      intervalos.push([x0, x1]);
    }

    // Avanzar
    x0 = x1;
    f0 = f1;
  }

  //Contador de raices
  const positivas = intervalos.filter(([a, b]) => b > 0).length;
  const negativas = intervalos.filter(([a, b]) => a < 0 && b <= 0).length;

  //Muestra de datos
  console.log(`\n🔍 Intervalos detectados con cambio de signo:`);
  if (intervalos.length === 0) console.log("  (ninguno encontrado)");
  intervalos.forEach(([a, b], i) =>
    console.log(`  Raíz ${i + 1}: entre [${a}, ${b}]`)
  );

  console.log(`\n➡ Raíces positivas: ${positivas}`);
  console.log(`➡ Raíces negativas: ${negativas}`);

  return intervalos;
}

// PROGRAMA PRINCIPAL
console.clear();
console.log(" MÉTODO DE INTERPOLACIÓN LINEAL\n");

const funcionUsuario = prompt("Ingrese la función en x (ej: x^3 - 6x^2 + 11): ");
const tol = Number(prompt("Ingrese la tolerancia (ej: 0.001): ")) || 1e-6;

//Valores iniciales para el rango de tanteo y el valor del incremento
const rangoInferior = -100;
const rangoSuperior = 100;
const incremento = 0.5;

//Array de intervalos
const intervalos = tanteo(funcionUsuario, rangoInferior, rangoSuperior, incremento);

if (intervalos.length === 0) { //No se encuentran intervalos en los rangos establecidos
  console.log("❌ No se detectaron cambios de signo en el rango analizado.");
  process.exit(0);
}

// Aplicar el método en cada intervalo
const raices = [];
for (const [a, b] of intervalos) { //Calculo de a y b -> cada elemento del array
  console.log("\n======================================");
  console.log(`🔹 Aplicando Interpolación Lineal en [${a}, ${b}]`);
  console.log("======================================\n");

  const raiz = interpolacionLineal(funcionUsuario, a, b, tol);

  if (raiz !== null) {
    console.log(`\n✔ Raíz encontrada entre [${a}, ${b}]: x ≈ ${raiz.toFixed(6)}\n`);
    raices.push(raiz); //agrega la raiz a la lista de raices
  } else {
    console.log(`❌ Falló la convergencia en [${a}, ${b}]`);
  }
}

// Graficar resultados
if (raices.length > 0) {
  const f = (x) => evaluate(funcionUsuario, { x });
  const xs = [];
  const ys = [];
  const rangoMin = rangoInferior - 1;
  const rangoMax = rangoSuperior + 1;
  const incrementos = 200;

  for (let i = 0; i <= incrementos; i++) {
    const x = rangoMin + (i * (rangoMax - rangoMin)) / incrementos;
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
      x: raices,
      y: raices.map((r) => f(r)),
      type: "scatter",
      mode: "markers",
      name: "Raíces encontradas",
      marker: { color: "red", size: 10 },
    },
  ]);
} else {
  console.log("❌ No se encontró ninguna raíz válida.");
}