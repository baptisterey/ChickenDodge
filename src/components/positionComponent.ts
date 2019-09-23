import { vec3 } from "gl-matrix";
import { Component } from "./component";

// # Classe *PositionComponent*
// Ce composant représente une position dans l'espace, via un
// tableau de nombres flottants issu d'une bibliothèque externe.
interface IPositionComponentDesc {
  x?: number;
  y?: number;
  z?: number;
}

function isVec3(arg: IPositionComponentDesc | vec3): arg is vec3 {
  return (arg as vec3).buffer !== undefined;
}

export class PositionComponent extends Component<IPositionComponentDesc> {
  public local!: vec3;

  // ## Méthode *create*
  // Cette méthode est appelée pour configurer le composant avant
  // que tous les composants d'un objet aient été créés. Les valeurs
  // omises prennent la valeur 0 par défaut.
  public create(descr: IPositionComponentDesc | vec3) {
    if (isVec3(descr)) {
      this.local = vec3.clone(descr);
    } else {
      this.local = vec3.fromValues(descr.x || 0, descr.y || 0, descr.z || 0);
    }
  }

  // ## Propriété *worldPosition*
  // Cette propriété combine les transformations des parents afin
  // de trouver la position absolue de l'objet dans le monde.
  get worldPosition() {
    const pos = vec3.clone(this.local);
    const parentPosition = this.owner.parent ? this.owner.parent.getComponent<PositionComponent>("Position") : undefined;
    if (parentPosition) {
      const parentWorld = parentPosition.worldPosition;
      vec3.add(pos, pos, parentWorld);
    }
    return pos;
  }

  // ## Méthode *translate*
  // Applique une translation sur l'objet.
  public translate(delta: vec3) {
    vec3.add(this.local, this.local, delta);
  }

  // ## Méthode *clamp*
  // Cette méthode limite la position de l'objet dans une zone
  // donnée.
  public clamp(xMin = Number.MIN_VALUE, xMax = Number.MAX_VALUE, yMin = Number.MIN_VALUE, yMax = Number.MAX_VALUE, zMin = Number.MIN_VALUE, zMax = Number.MAX_VALUE) {
    if (this.local[0] < xMin) {
      this.local[0] = xMin;
    }
    if (this.local[0] > xMax) {
      this.local[0] = xMax;
    }
    if (this.local[1] < yMin) {
      this.local[1] = yMin;
    }
    if (this.local[1] > yMax) {
      this.local[1] = yMax;
    }
    if (this.local[2] < zMin) {
      this.local[2] = zMin;
    }
    if (this.local[2] > zMax) {
      this.local[2] = zMax;
    }
  }
}
