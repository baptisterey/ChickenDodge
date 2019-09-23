import { IComponent } from "../components/component";
import * as GraphicsAPI from "../graphicsAPI";
import { Scene } from "../scene";
import { ISystem } from "./system";

// # Interface *IDisplayComponent*
// Déclare le type d'un composant géré par ce système.
export interface IDisplayComponent extends IComponent {
  // ### Méthode *display*
  // La méthode *display* de chaque composant est appelée une fois
  // par itération de la boucle de jeu.
  display(dT: number): void;
}

// # Interface *ICameraComponent*
// Déclare le type d'un composant géré par ce système.
export interface ICameraComponent extends IComponent {
  // ### Méthode *render*
  // La méthode *render* de chaque composant est appelée une fois
  // par itération de la boucle de jeu.
  render(dT: number): void;
}

// # Fonction *isDisplayComponent*
// Vérifie si le composant est du type `IDisplayComponent``
// Voir [la documentation de TypeScript](https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards)
function isDisplayComponent(arg: IComponent): arg is IDisplayComponent {
  return (arg as IDisplayComponent).display !== undefined;
}

// # Fonction *isCameraComponent*
// Vérifie si le composant est du type `ICameraComponent``
// Voir [la documentation de TypeScript](https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards)
function isCameraComponent(arg: IComponent): arg is ICameraComponent {
  return (arg as ICameraComponent).render !== undefined;
}

// # Classe *DisplaySystem*
// Représente le système permettant de gérer l'affichage
export class DisplaySystem implements ISystem {
  // ## Constructeur
  // Initialise l'API graphique.
  constructor(canvasId: string) {
    GraphicsAPI.init(canvasId);
  }

  // Méthode *iterate*
  // Appelée à chaque tour de la boucle de jeu
  public iterate(dT: number) {
    const displayComp: IDisplayComponent[] = [];
    const cameraComp: ICameraComponent[] = [];

    for (const e of Scene.current.entities()) {
      for (const comp of e.components) {
        if (isDisplayComponent(comp) && comp.enabled) {
          displayComp.push(comp);
        }
        if (isCameraComponent(comp) && comp.enabled) {
          cameraComp.push(comp);
        }
      }
    }

    for (const c of displayComp) {
      c.display(dT);
    }
    for (const c of cameraComp) {
      c.render(dT);
    }
  }
}
