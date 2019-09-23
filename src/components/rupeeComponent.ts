import { ILogicComponent } from "../systems/logicSystem";
import { Timing } from "../timing";
import { Component } from "./component";
import { SpriteComponent } from "./spriteComponent";

// # Classe *RupeeComponent*
// Cette classe comprend les informations d'un rubis.
interface IRupeeValueMap {
  [type: string]: number;
}

interface IRupeeComponentDesc {
  values: IRupeeValueMap;
  lifetime: number;
}

export class RupeeComponent extends Component<IRupeeComponentDesc> implements ILogicComponent {
  private values!: IRupeeValueMap;
  private start!: number;
  private lifetime!: number;
  private type!: string;

  // ## Propriété *value*
  // Cette propriété retourne la valeur numérique correspondant
  // au rubis.
  get value() {
    return this.values[this.type];
  }

  // ## Méthode *create*
  // Cette méthode est appelée pour configurer le composant avant
  // que tous les composants d'un objet aient été créés.
  public create(descr: IRupeeComponentDesc) {
    this.values = descr.values;
    this.lifetime = descr.lifetime;
  }

  // ## Méthode *setup*
  // Cette méthode choisit une valeur aléatoire pour le rubis, et
  // détermine la sprite correspondante.
  public setup() {
    const types = Object.keys(this.values);
    const count = types.length;
    this.type = types[Math.floor(Math.random() * count)];

    const sprite = this.owner.getComponent<SpriteComponent>("Sprite")!;
    sprite.spriteName = this.type;
    this.start = (new Date()).getTime();
  }

  // ## Méthode *update*
  // La méthode *update* de chaque composant est appelée une fois
  // par itération de la boucle de jeu.
  public update(timing: Timing) {
    const elapsed = timing.now.getTime() - this.start;
    if (elapsed > this.lifetime) {
      this.owner.active = false;
      this.owner.parent!.removeChild(this.owner);
    }
  }
}
