import { ILogicComponent } from "../systems/logicSystem";
import { Timing } from "../timing";
import { Component } from "./component";
import { TextSpriteComponent } from "./textSpriteComponent";

// ## Méthode *format*
// Cette méthode prend un interval et le converti en une chaîne
// lisible.
function format(total_ms: number) {
  const total_s = Math.floor(total_ms / 1000);
  const minutes = Math.floor(total_s / 60);
  const seconds = total_s - (minutes * 60);
  let secText = seconds.toString();
  if (seconds < 10) {
    secText = "0" + secText;
  }
  return `${minutes}:${secText}`;
}

// # Classe *TimerComponent*
// Ce composant affiche le temps écoulé depuis son lancement.
export class TimerComponent extends Component<object> implements ILogicComponent {
  private textSprite!: TextSpriteComponent;
  private start!: number;
  private beginPause!: number;

  // ## Méthode *setup*
  // Cette méthode conserve le composant de texte qui affiche
  // le pointage, et initialise sa valeur.
  public setup() {
    this.textSprite = this.owner.getComponent<TextSpriteComponent>("TextSprite");
    this.start = (new Date()).getTime();
  }

  // ## Méthode *onEnabled*
  // La méthode *onEnabled* est appelée quand l'objet passe de l'état
  // activé à désactivé.
  public onEnabled() {
    const now = (new Date()).getTime();
    const paused = now - this.beginPause;
    this.start += paused;
  }

  // ## Méthode *onDisabled*
  // La méthode *onDisabled* est appelée quand l'objet passe de l'état
  // désactivé à activé.
  public onDisabled() {
    this.beginPause = (new Date()).getTime();
  }

  // ## Méthode *update*
  // La méthode *update* de chaque composant est appelée une fois
  // par itération de la boucle de jeu.
  public update(timing: Timing) {
    const elapsed = timing.now.getTime() - this.start;
    const array = format(elapsed).split("");
    for (let i = 0; i < array.length; ++i) {
      if (array[i] === ":") {
        array[i] = "colon";
      }
    }
    this.textSprite.array = array;
  }
}
