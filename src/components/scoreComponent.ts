import { EventTrigger } from "../eventTrigger";
import { Component } from "./component";
import { TextSpriteComponent } from "./textSpriteComponent";

// # Classe *ScoreComponent*
interface IScoreComponentDesc {
  scoreSprite: string;
}

export class ScoreComponent extends Component<IScoreComponentDesc> {
  private scoreChangedEvent = new EventTrigger();
  private scoreSprite!: TextSpriteComponent;
  private _value!: number;

  // ## Méthode *setup*
  // Cette méthode conserve le composant de texte qui affiche
  // le pointage, et initialise sa valeur.
  public setup(descr: IScoreComponentDesc) {
    this.scoreSprite = Component.findComponent<TextSpriteComponent>(descr.scoreSprite)!;
    this.value = 0;
  }

  // ## Propriété *value*
  // Cette méthode met à jour le pointage et l'affichage de
  // ce dernier.
  get value() {
    return this._value;
  }

  set value(newVal) {
    this._value = newVal;
    this.scoreChangedEvent.trigger(this.value);
    this.scoreSprite.text = this.value.toString();
  }
}
