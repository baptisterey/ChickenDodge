import { IEntityDesc, Scene } from "../scene";
import { ILogicComponent } from "../systems/logicSystem";
import { Timing } from "../timing";
import { Component } from "./component";
import { SpriteSheetComponent } from "./spriteSheetComponent";

// # Classe *ChickenSpawnerComponent*
// Cette classe contrôle l'apparition de poulets.
interface IArea {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ISpawnerComponentDesc {
  spriteSheet: string;
  sourceArea: IArea;
  targetArea: IArea;
  spawnDelay: number;
  spawnWaitFactor: number;
  chickenTemplate: IEntityDesc;
}

export class ChickenSpawnerComponent extends Component<ISpawnerComponentDesc> implements ILogicComponent {
  private spriteSheet!: SpriteSheetComponent;
  private sourceArea!: IArea;
  private targetArea!: IArea;
  private spawnDelay!: number;
  private spawnWaitFactor!: number;
  private chickenTemplate!: IEntityDesc;

  // ## Méthode *create*
  // Cette méthode est appelée pour configurer le composant avant
  // que tous les composants d'un objet aient été créés.
  public create(descr: ISpawnerComponentDesc) {
    this.sourceArea = descr.sourceArea;
    this.targetArea = descr.targetArea;
    this.spawnDelay = descr.spawnDelay;
    this.spawnWaitFactor = descr.spawnWaitFactor;
    this.chickenTemplate = descr.chickenTemplate;
  }

  // ## Méthode *setup*
  // Cette méthode est appelée pour configurer le composant après
  // que tous les composants d'un objet aient été créés.
  public setup(descr: ISpawnerComponentDesc) {
    this.spriteSheet = Component.findComponent<SpriteSheetComponent>(descr.spriteSheet)!;
  }

  // ## Méthode *update*
  // À chaque itération, on vérifie si on a attendu un délai
  // quelconque. Si c'est le cas, on génère un poulet, et on
  // réduit le temps d'attente.
  public update(timing: Timing) {
    const spawnDelay = Math.floor(this.spawnDelay);
    if ((timing.frame % spawnDelay) === 0) {
      this.spawnDelay = Math.max(8, this.spawnDelay * this.spawnWaitFactor);
      this.spawn(timing.frame);
    }
  }

  // ## Méthode *spawn*
  // Cette méthode crée un nouveau poulet. On configure son
  // apparition sur un rectangle autour de l'écran, et sa
  // cible sur l'aire de jeu.
  private spawn(frame: number) {
    let x = 0;
    let y = 0;
    if (Math.floor(Math.random() * 2) === 0) {
      x = this.sourceArea.x;
      if (Math.floor(Math.random() * 2) === 0) {
        x += this.sourceArea.w;
      }
      y = Math.random() * this.sourceArea.h + this.sourceArea.y;
    } else {
      y = this.sourceArea.y;
      if (Math.floor(Math.random() * 2) === 0) {
        y += this.sourceArea.h;
      }
      x = Math.random() * this.sourceArea.w + this.sourceArea.x;
    }

    this.chickenTemplate.components!.Chicken.target = {
      x: Math.random() * this.targetArea.w + this.targetArea.x,
      y: Math.random() * this.targetArea.h + this.targetArea.y,
    };
    this.chickenTemplate.components!.Position = {
      x,
      y,
      z: 0,
    };
    this.chickenTemplate.components!.Sprite.spriteSheet = this.spriteSheet;

    Scene.current.createChild(this.chickenTemplate, frame.toString(), this.owner);
  }
}
