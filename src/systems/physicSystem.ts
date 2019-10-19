import {ColliderComponent} from "../components/colliderComponent";
import {Scene} from "../scene";
import {ISystem} from "./system";
import {QuadTree} from "../components/quadTree";
import {Rectangle} from "../components/rectangle";

// # Classe *PhysicSystem*
// Représente le système permettant de détecter les collisions
export class PhysicSystem implements ISystem {

    private quadTree: QuadTree = new QuadTree(0, new Rectangle({
        x: 0,
        y: 0,
        width: 1500,
        height: 1500,
    }));

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

            // On clear le quadtree pour ce composant
            this.quadTree.clear();

            const c1 = colliders[i];
            if (!c1.enabled || !c1.owner.active) {
                continue;
            }

            for (let j = i + 1; j < colliders.length; j++) {
                const c2 = colliders[j];
                if (!c2.enabled || !c2.owner.active) {
                    continue;
                }

                if (!(c2.flag & c1.mask)) {
                    continue;
                }


                this.quadTree.insert(c2);
            }

            // On parcourt tous les éléments qui peuvent potentiellement collide avec c1
            let possibleColliders: Array<ColliderComponent> = this.quadTree.retrieve(c1.area);
            for (let c2 of possibleColliders) {
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
