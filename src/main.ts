import { Resources } from "./resources";
import { ISceneDesc, Scene } from "./scene";
import { DisplaySystem } from "./systems/displaySystem";
import { LogicSystem } from "./systems/logicSystem";
import { PhysicSystem } from "./systems/physicSystem";
import { ISystem } from "./systems/system";
import { clamp } from "./utils";

export interface IConfig {
  canvasId: string;
  launchScene: string;
}

export let GlobalConfig: IConfig;

// ## Variable *systems*
// Représente la liste des systèmes utilisés par notre moteur
let systems: ISystem[];

// ## Méthode *run*
// Cette méthode initialise les différents systèmes nécessaires
// et démarre l'exécution complète du jeu.
export function run(config: IConfig) {
  GlobalConfig = config;
  setupSystem(config);
  return launchGame(config);
}

function loadScene(file: string) {
  const content = Resources.load<string>(file)!;
  const sceneDescription = JSON.parse(content) as ISceneDesc;
  return Scene.create(sceneDescription);
}

// ## Méthode *launchGame*
// Cette méthode initialise la scène du jeu et lance la
// boucle de jeu.
function launchGame(config: IConfig) {
  loadScene(config.launchScene);

  let lastTime: number | undefined;

  function iterate(time: number) {
    if (lastTime === undefined) {
      lastTime = time;
    }
    // Le temps est compté en millisecondes, on désire
    // l'avoir en secondes, sans avoir de valeurs trop énorme.
    const delta = clamp((time - lastTime) / 1000, 0, 0.1);

    // Limiter le taux de rafraîchissement à 30 FPS
    if (delta > (1.0 / 30.0)) {
      lastTime = time;

      for (const system of systems) {
        system.iterate(delta);
      }
    }

    window.requestAnimationFrame(iterate);
  }

  window.requestAnimationFrame(iterate);
}

// ## Méthode *setupSystem*
// Cette méthode initialise les différents systèmes nécessaires.
function setupSystem(config: IConfig) {
  const physic = new PhysicSystem();
  const logic = new LogicSystem();
  const display = new DisplaySystem(config.canvasId);

  systems = [physic, logic, display];
}
