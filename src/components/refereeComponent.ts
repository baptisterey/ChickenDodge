import { EventTrigger } from "../eventTrigger";
import { Component } from "./component";
import { PlayerComponent } from "./playerComponent";

// # Classe *RefereeComponent*
// Ce composant permet de déclarer un vainqueur!
interface IRefereeComponentDesc {
  players: string[];
}

export class RefereeComponent extends Component<IRefereeComponentDesc> {
  private winEvent = new EventTrigger();
  private players: PlayerComponent[] = [];

  // ## Méthode *create*
  // Cette méthode est appelée pour configurer le composant avant
  // que tous les composants d'un objet aient été créés.
  public create() {
    this.winEvent.add(this, this.showWinMessage);
  }

  // ## Méthode *setup*
  // Cette méthode configure le composant.
  public setup(descr: IRefereeComponentDesc) {
    for (const p of descr.players) {
      const player = Component.findComponent<PlayerComponent>(p)!;
      this.players.push(player);
      player.deadEvent.add(this, this.onDead, undefined, player);
    }
  }

  // ## Méthode *onDead*
  // Cette méthode est déclenchée quand un joueur meurt
  private onDead( /*player*/) {
    let bestScore = -1;
    let bestPlayer: PlayerComponent | null = null;
    let worstScore = Number.MAX_VALUE;
    let worstPlayer: PlayerComponent | null = null;

    let gameOver = true;

    for (const p of this.players) {
      if (!gameOver) {
        continue;
      }
      if (!p.isDead) {
        gameOver = false;
        continue;
      }

      if (p.score.value > bestScore) {
        bestScore = p.score.value;
        bestPlayer = p;
      }
      if (p.score.value < worstScore) {
        worstScore = p.score.value;
        worstPlayer = p;
      }
    }

    if (gameOver) {
      this.winEvent.trigger(bestPlayer!, worstPlayer!);
    }
  }

  // ## Méthode *showWinMessage*
  // Affiche un popup mentionnant le gagnant
  private showWinMessage(winner: PlayerComponent, loser: PlayerComponent) {
    alert(`${winner.name} a gagné contre ${loser.name}`);
  }
}
