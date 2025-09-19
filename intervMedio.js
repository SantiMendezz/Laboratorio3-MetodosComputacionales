import { evaluate, parse } from "mathjs";
import promptSync from "prompt-sync";
import { plot } from "nodeplotlib";

const prompt = promptSync();

// Método del Intervalo Medio
function intervMedio(funcStr, a, b, tol = 1e-6, maxIter = 50) { //Si no se ingresa error -> se iguala a 1e-6 = 0.000001
    try {
        // Validar función incluye x
        if (!funcStr.includes("x")) {
            throw new Error("La función debe contener la variable x.");
        }
        parse(funcStr); //Evalua que funcion sea sintacticamente valida

        //Evaluate calcula la funcion con el/los valores pasados
        const f = (x) => evaluate(funcStr, { x });

        //Calculo de las funciones
        const fa = f(a);
        const fb = f(b);

        //Condición f(a) * f(b) < 0 -> significa que f(a) y f(b) tienen signos opuestos.
        if (fa * fb > 0) {
            console.error("⚠ Error: f(a) y f(b) deben tener signos opuestos.");
            return null;
        }

        console.log("\nFunción ingresada:", funcStr);
        console.log("Iteraciones Método del Intervalo Medio:\n");

        let iteraciones = [];
        let xi;

        for (let i = 1; i <= maxIter; i++) {
            //Calculo de iteracion de xi
            xi = (a + b) / 2;
            const fxi = f(xi);

            //numero.toFixed(cantidadDeDecimales) -> redondea a la cantidad de decimales ingresada y devuelve ese numero en string
            console.log(
                `Iteración ${i}: a = ${a.toFixed(6)}, b = ${b.toFixed(6)}, xi = ${xi.toFixed(6)}, f(xi) = ${fxi.toFixed(6)}`
            );

            iteraciones.push({ i, a, b, xi, fxi });

            //Condicion de convergencia -> funcion sea practicamente 0 o es menor al maximo error posible
            if (Math.abs(fxi) < tol || (b - a) / 2 < tol) {
                console.log("\n✔ Convergencia alcanzada");
                return { raiz: xi, iteraciones };
            }

            if (fa * fxi < 0) { //cambio de signo, cambia b
                b = xi;
            } else {
                a = xi; //cambio de signo, cambia a
            }
        }

        console.log("\n❌ No se alcanzó convergencia en el máximo de iteraciones");
        return { raiz: xi, iteraciones };
    } catch (err) {
        console.error("⚠ Error: La función ingresada no es válida.");
        return null;
    }
}

const funcionUsuario = prompt("Ingrese la función en x (ej: x^3 - x - 2): ");

//Validar intervalo [a, b]
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

//Validar tolerancia
let tol;
while (true) {
    const entradaTol = Number(prompt("Ingrese la tolerancia (ej: 0.0001): "));
    if (!isNaN(entradaTol) && entradaTol > 0) {
        tol = entradaTol;
        break;
    }
    console.log("⚠ Entrada inválida. Debe ingresar un número mayor que 0.");
}

//Ejecutar metodo de intervalo medio
const resultado = intervMedio(funcionUsuario, a, b, tol);

if (resultado !== null) {
    const { raiz } = resultado;
    console.log(`\nResultado final: x ≈ ${raiz.toFixed(6)}`);

    //Graficar
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
    ]);
} else {
    console.log("❌ No se generará gráfico porque no se encontró raíz.");
}