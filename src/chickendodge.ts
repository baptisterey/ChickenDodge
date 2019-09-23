import { IConfig, run } from "./main";
import { Resources } from "./resources";

export function preload() {
  return Resources.init("data/resources.json");
}

export function init() {
  const equipe = Resources.load<string>("equipe.txt")!;
  console.log(equipe);
  if (equipe === "Coéquipiers") {
    alert("N'oubliez pas d'inscrire les membres de votre équipe dans le fichier client/data/equipe.txt!");
  }

  const config: IConfig = {
    canvasId: "canvas",
    launchScene: "scenes/play.json",
  };

  return run(config);
}
