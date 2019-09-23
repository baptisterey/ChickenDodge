import { IEntity } from "../entity";
import { EventTrigger } from "../eventTrigger";
import { IEntityDesc, Scene } from "../scene";
import { ILogicComponent } from "../systems/logicSystem";
import { Timing } from "../timing";
import { Component } from "./component";

// # Classe *CountdownComponent*
// Ce composant affiche un décompte et envoie un événement
// lorsqu'il a terminé.
interface ICountdownComponentDesc {
  sprites: string[];
  waitSprite: string;
  playerSpritePrefix: string;
  spriteTemplate: IEntityDesc;
  delay: number;
  handler?: string;
  playerWait?: string;
}

export class CountdownComponent extends Component<ICountdownComponentDesc> implements ILogicComponent {
  private handler = new EventTrigger();
  private sprites: string[] = [];
  private delay!: number;
  private spriteTemplate!: IEntityDesc;
  private index = -1;
  private shownTime!: number;
  private current?: IEntity;

  // ## Méthode *create*
  // Cette méthode est appelée pour configurer le composant avant
  // que tous les composants d'un objet aient été créés.
  public create(descr: ICountdownComponentDesc) {
    this.sprites = descr.sprites;
    this.delay = descr.delay;
    this.spriteTemplate = descr.spriteTemplate;
  }

  // ## Méthode *setup*
  // Cette méthode est appelée pour configurer le composant après
  // que tous les composants d'un objet aient été créés.
  public setup(descr: ICountdownComponentDesc) {
    if (descr.handler) {
      const tokens = descr.handler.split(".");
      this.handler.add(this.owner.getComponent(tokens[0]), tokens[1]);
    }
  }

  // ## Méthode *update*
  // À chaque itération, on vérifie si on a attendu le délai
  // désiré, et on change d'image si c'est le cas.
  public update(timing: Timing) {
    if ((timing.now.getTime() - this.shownTime) < this.delay) {
      return;
    }
    this.index++;
    if (this.current) {
      this.owner.removeChild(this.current);
      delete this.current;
    }

    if (this.index >= this.sprites.length) {
      this.handler.trigger();
      this.enabled = false;
    } else {
      return this.showImage();
    }
  }

  // ## Méthode *showImage*
  // Affiche une image parmi les sprites désirées, si il y en
  // a encore à afficher.
  private showImage() {
    this.shownTime = (new Date()).getTime();
    this.showNamedImage(this.sprites[this.index]);
  }

  // ## Méthode *showNamedImage*
  // Affiche une image, directement à partir de son nom
  private showNamedImage(textureName: string) {
    this.spriteTemplate.components!.RawSprite.texture = textureName;
    this.current = Scene.current.createChild(this.spriteTemplate, "sprite", this.owner);
  }
}
