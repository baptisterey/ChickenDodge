import { vec3 } from "gl-matrix";
import { EventTrigger } from "../eventTrigger";
import { ILogicComponent } from "../systems/logicSystem";
import { Timing } from "../timing";
import { ChickenComponent } from "./chickenComponent";
import { ColliderComponent, ICollisionComponent } from "./colliderComponent";
import { Component } from "./component";
import { HeartComponent } from "./heartComponent";
import { IInputComponent } from "./inputComponent";
import { LifeComponent } from "./lifeComponent";
import { PositionComponent } from "./positionComponent";
import { RupeeComponent } from "./rupeeComponent";
import { ScoreComponent } from "./scoreComponent";
import { SpriteComponent } from "./spriteComponent";

enum Facing { Back = "B", Front = "F", Left = "L", Right = "R" }

// # Classe *PlayerComponent*
// Ce composant représente le comportement d'un joueur.
interface IArea {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface IPlayerComponentDesc {
  name: string;
  input: string;
  prefix: string;
  score: string;
  life: string;
  gameArea: IArea;
  invulnerableDuration: number;
  hurtDuration: number;
  hurtMotion: number;
  onHurtEnable: string[];
}

export class PlayerComponent extends Component<IPlayerComponentDesc> implements ICollisionComponent, ILogicComponent {
  public deadEvent = new EventTrigger();
  public isDead = false;
  public score!: ScoreComponent;
  public name!: string;

  private prefix!: string;
  private gameArea!: IArea;
  private facing = Facing.Front;
  private isAttacking = false;
  private isMoving = false;
  private isHurt = false;
  private isInvulnerable = false;
  private invulnerableDuration!: number;
  private hurtDuration!: number;
  private hurtMotion!: number;
  private input!: IInputComponent;
  private life!: LifeComponent;
  private sprite!: SpriteComponent;

  // ## Méthode *create*
  // Cette méthode est appelée pour configurer le composant avant
  // que tous les composants d'un objet aient été créés.
  public create(descr: IPlayerComponentDesc) {
    this.name = descr.name;
    this.prefix = descr.prefix;
    this.gameArea = descr.gameArea;
    this.invulnerableDuration = descr.invulnerableDuration;
    this.hurtDuration = descr.hurtDuration;
    this.hurtMotion = descr.hurtMotion;
  }

  // ## Méthode *setup*
  // Cette méthode configure le composant. Elle crée une instance
  // de sprite, et y configure une fonction de rappel lorsque
  // l'animation d'attaque est terminée.
  public setup(descr: IPlayerComponentDesc) {
    this.input = Component.findComponent<IInputComponent>(descr.input)!;
    this.score = Component.findComponent<ScoreComponent>(descr.score)!;
    this.life = Component.findComponent<LifeComponent>(descr.life)!;
    this.life.deadEvent.add(this, this.onDead);
    this.life.hurtEvent.add(this, this.onHurt);

    for (const item of descr.onHurtEnable) {
      const component = Component.findComponent(item)!;
      this.life.hurtEvent.add(this, () => {
        component.enabled = true;
      });
    }

    this.sprite = this.owner.getComponent<SpriteComponent>("Sprite");
    this.sprite.animationEndedEvent.push(() => {
      this.isAttacking = false;
      this.sprite.frameSkip = 2;
      this.updateSprite();
      this.sprite.updateMesh();
    });
    this.updateSprite();
  }

  // ## Méthode *update*
  // Cette méthode récupère les entrées du joueur, effectue les
  // déplacements appropriés, déclenche l'état d'attaque et ajuste
  // la sprite du joueur.
  public update(timing: Timing) {
    let delta;
    if (this.isDead) {
      delta = this.updateDead();
    } else if (this.isHurt) {
      delta = this.updateHurt();
    } else {
      delta = this.updateStandard();
    }

    const visible = (!this.isInvulnerable) || (timing.frame % 2 !== 0);
    this.sprite.enabled = visible;

    const position = this.owner.getComponent<PositionComponent>("Position")!;
    vec3.scale(delta, delta, timing.dT * 60);
    position.translate(delta);
    position.clamp(this.gameArea.x, this.gameArea.x + this.gameArea.w, this.gameArea.y, this.gameArea.y + this.gameArea.h);
  }

  // ## Méthode *onCollision*
  // Cette méthode est appelée par le *CollisionComponent*
  // lorsqu'il y a collision entre le joueur et un objet pertinent.
  // Si cet objet est un rubis, on le récupère et on incrémente
  // le score, si c'est un poulet, on le détruit si on est en
  // état d'attaque, sinon on soustrait le score et on désactive
  // ce poulet.
  public onCollision(otherCollider: ColliderComponent) {
    const obj = otherCollider.owner;
    const rupee = obj.getComponent<RupeeComponent>("Rupee");
    const heart = obj.getComponent<HeartComponent>("Heart");
    const chicken = obj.getComponent<ChickenComponent>("Chicken");

    if (rupee) {
      this.score.value += rupee.value;
      obj.active = false;
      obj.parent!.removeChild(obj);
    }
    if (heart) {
      this.life.value += heart.heal;
      obj.active = false;
      obj.parent!.removeChild(obj);
    }
    if (chicken) {
      if (this.isAttacking) {
        chicken.onAttack();
      } else {
        this.life.value -= chicken.attack;
      }
    }
  }

  // ## Méthode *onDead*
  // Déclenchée lorsque le joueur est mort
  private onDead() {
    this.isDead = true;
    this.deadEvent.trigger();
  }

  // ## Méthode *onHurt*
  // Déclenchée lorsque le joueur est blessé
  private onHurt() {
    const collider = this.owner.getComponent<ColliderComponent>("Collider")!;

    this.isHurt = true;
    setTimeout(() => {
      this.isHurt = false;
    }, this.hurtDuration);

    this.isInvulnerable = true;
    collider.enabled = false;
    setTimeout(() => {
      this.isInvulnerable = false;
      collider.enabled = true;
    }, this.invulnerableDuration);
  }

  // ## Méthode *updateDead*
  // Met à jour le joueur quand il est mort
  private updateDead() {
    this.isMoving = false;
    this.isAttacking = false;
    this.sprite.isAnimated = false;
    this.sprite.spriteName = `${this.prefix}D`;
    this.sprite.updateMesh();

    const collider = this.owner.getComponent<ColliderComponent>("Collider")!;
    collider.enabled = false;
    return vec3.create();
  }

  // ## Méthode *updateHurt*
  // Met à jour le joueur quand il est blessé
  private updateHurt() {
    this.isMoving = false;
    this.isAttacking = false;
    this.sprite.isAnimated = false;
    this.sprite.spriteName = `${this.prefix}H${this.facing}`;
    this.sprite.updateMesh();

    const delta = vec3.create();
    switch (this.facing) {
      case Facing.Back:
        delta[1] = this.hurtMotion;
        break;
      case Facing.Front:
        delta[1] = -this.hurtMotion;
        break;
      case Facing.Left:
        delta[0] = this.hurtMotion;
        break;
      case Facing.Right:
        delta[0] = -this.hurtMotion;
        break;
    }
    return delta;
  }

  // ## Méthode *updateStandard*
  // Met à jour le mouvement normal du joueur
  private updateStandard() {
    if (!this.isAttacking && this.input.getKey("attack")) {
      this.isAttacking = true;
      this.sprite.animationFrame = 1;
      this.sprite.frameSkip = 1;
    }

    const delta = vec3.create();

    if (this.input.getKey("up")) {
      delta[1]--;
      this.facing = Facing.Back;
    }
    if (this.input.getKey("down")) {
      delta[1]++;
      this.facing = Facing.Front;
    }
    if (this.input.getKey("left")) {
      delta[0]--;
      this.facing = Facing.Left;
    }
    if (this.input.getKey("right")) {
      delta[0]++;
      this.facing = Facing.Right;
    }

    this.isMoving = vec3.length(delta) > 0;

    this.updateSprite();
    this.sprite.updateMesh();

    return delta;
  }

  // ## Méthode *updateSprite*
  // Choisi la sprite appropriée selon le contexte.
  private updateSprite() {
    this.sprite.isAnimated = this.isMoving || this.isAttacking;
    const mod = this.isAttacking ? "A" : "M";
    const frame = this.sprite.isAnimated ? "" : "1";

    this.sprite.spriteName = `${this.prefix}${mod}${this.facing}${frame}`;
  }
}
