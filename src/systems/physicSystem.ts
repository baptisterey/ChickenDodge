import { ColliderComponent } from "../components/colliderComponent";
import { Scene } from "../scene";
import { ISystem } from "./system";

// # Classe *PhysicSystem*
// Représente le système permettant de détecter les collisions
export class PhysicSystem implements ISystem {
  // Méthode *iterate*
  // Appelée à chaque tour de la boucle de jeu
  public iterate(dT: number) {
    const colliders: ColliderComponent[] = [];

    for (const e of Scene.current.entities()) {
      for (const comp of e.components) {
        if (comp instanceof ColliderComponent && comp.enabled) {
          colliders.push(comp);
        }
      }
    }

    const collisions: Array<[ColliderComponent, ColliderComponent]> = [];

    for (let i = 0; i < colliders.length; i++) {
      const c1 = colliders[i];
      if (!c1.enabled || !c1.owner.active) {
        continue;
      }

      for (let j = i + 1; j < colliders.length; j++) {
        const c2 = colliders[j];
        if (!c2.enabled || !c2.owner.active) {
          continue;
        }

        if (c1.area.intersectsWith(c2.area)) {
          collisions.push([c1, c2]);
        }
      }
    }

    for (const [c1, c2] of collisions) {
      if (c1.handler) {
        c1.handler.onCollision(c2);
      }
      if (c2.handler) {
        c2.handler.onCollision(c1);
      }
    }
  }
}
