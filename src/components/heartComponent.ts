import { ILogicComponent } from "../systems/logicSystem";
import { Timing } from "../timing";
import { Component } from "./component";

// # Classe *HeartComponent*
// Cette classe comprend les informations d'un coeur à ramasser.
interface IHeartComponentDesc {
  heal: number;
  lifetime: number;
}

export class HeartComponent extends Component<IHeartComponentDesc> implements ILogicComponent {
  public heal!: number;
  private start!: number;
  private lifetime!: number;

  // ## Méthode *create*
  // Cette méthode est appelée pour configurer le composant avant
  // que tous les composants d'un objet aient été créés.
  public create(descr: IHeartComponentDesc) {
    this.heal = descr.heal;
    this.lifetime = descr.lifetime;
  }

  // ## Méthode *setup*
  // Cette méthode est appelée pour configurer le composant après
  // que tous les composants d'un objet aient été créés.
  public setup() {
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
