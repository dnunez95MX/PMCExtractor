import readlineSync from "readline-sync";

export const getApiKey = async () => {
  const key = await readlineSync.question("Enter your NCBI API key: ");

  // Lectura con opciones
  // const opciones = ["Piedra", "Papel", "Tijeras"];
  // const indice = await readlineSync.keyInSelect(opciones, "Elige una opción");
  // console.log(`Elegiste: ${opciones[indice]}`);

  // // Lectura de contraseña (oculta entrada)
  // const password = readlineSync.question("Contraseña: ", {
  //   hideEchoBack: true,
  // });

  return key;
};
