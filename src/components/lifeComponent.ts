import { EventTrigger } from "../eventTrigger";
import { Component } from "./component";
import { TextSpriteComponent } from "./textSpriteComponent";

// # Classe *LifeComponent*
interface ILifeComponentDesc {
  max: number;
  default: number;
  lifeSprite: string;
  sprites: string[];
}

export class LifeComponent extends Component<ILifeComponentDesc> {
  public deadEvent = new EventTrigger();
  public hurtEvent = new EventTrigger();
  private max!: number;
  private _value!: number;
  private sprites!: string[];
  private lifeSprite!: TextSpriteComponent;

  // ## Méthode *create*
  // Cette méthode est appelée pour configurer le composant avant
  // que tous les composants d'un objet aient été créés.
  public create(descr: ILifeComponentDesc) {
    this.max = descr.max;
    this.sprites = descr.sprites;
  }

  // ## Méthode *setup*
  // Cette méthode conserve le composant de texte qui affiche
  // la vie, et initialise sa valeur.
  public setup(descr: ILifeComponentDesc) {
    this.lifeSprite = Component.findComponent<TextSpriteComponent>(descr.lifeSprite)!;
    this.value = descr.default;
  }

  // ## Propriété *value*
  // Cette méthode met à jour la vie et l'affichage de
  // cette dernière.
  get value() {
    return this._value;
  }

  set value(newVal: number) {
    if (newVal < 0) {
      newVal = 0;
    }
    if (newVal > this.max) {
      newVal = this.max;
    }

    if (newVal === 0) {
      this.deadEvent.trigger();
    } else if (newVal < this.value) {
      this.hurtEvent.trigger();
    }

    this._value = newVal;

    const hearts: string[] = [];
    for (let i = 0; i < this.max; ++i) {
      let sIndex = 0;
      if (i < this.value) {
        sIndex = 1;
      }
      if (i + 1 <= this.value) {
        sIndex = 2;
      }
      hearts.push(this.sprites[sIndex]);
    }

    this.lifeSprite.array = hearts;
  }
}
