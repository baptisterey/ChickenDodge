import * as GraphicsAPI from "../graphicsAPI";
import { ILogicComponent } from "../systems/logicSystem";
import { Component } from "./component";

type IDrawElements = (mode: number, count: number, type: number, offset: number) => void;

let GL: WebGLRenderingContext;
let origDrawElements: IDrawElements;
let value = 0;

// ## Méthode *countDrawCalls*
// Cette méthode est appelée à la place de *drawElements*
// de l'API WebGL. Puisqu'on utilise une manière détournée
// d'atteindre cette méthode, le pointeur *this*
// correspond au contexte WebGL. On incrémente donc le
// compteur d'appels de rendu, et on appelle ensuite
// la méthode d'origine.
function countDrawCalls(mode: number, count: number, type: number, offset: number) {
  value++;
  origDrawElements.apply(GL, [mode, count, type, offset]);
}

// # Classe *DebugDrawCallsComponent*
// Ce composant permet d'intercepter les appels de rendu,
// de compter leur nombre et d'afficher le résultat dans
// un élément de la page Web.
interface IDCComponentDesc {
  field: string;
}

export class DebugDrawCallsComponent extends Component<IDCComponentDesc> implements ILogicComponent {
  private target!: HTMLElement;

  // ## Méthode *create*
  // On substitue ici la méthode *drawElements* de l'API
  // WebGL par une fonction locale.
  public create() {
    GL = GraphicsAPI.context;
    origDrawElements = GL.drawElements;
    GL.drawElements = countDrawCalls;
  }

  // ## Méthode *setup*
  // On conserve la référence vers l'élément HTML dans
  // lequel on écrira le nombre d'appels de rendu.
  public setup(descr: IDCComponentDesc) {
    this.target = document.getElementById(descr.field)!;
  }

  // ## Méthode *update*
  // On affiche le nombre d'appels de rendu exécuté à
  // la dernière itération et on remet le compteur à zéro.
  public update() {
    this.target.innerHTML = value.toString();
    value = 0;
  }
}
