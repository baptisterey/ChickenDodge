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
        width: 850,
        height: 850,
    }));

    // Méthode *iterate*
    // Appelée à chaque tour de la boucle de jeu
    public iterate(dT: number) {

        const colliders: ColliderComponent[] = [];

        // On récupère tous les colliders actifs avec un owner actif
        for (const e of Scene.current.entities()) {
            for (const comp of e.components) {
                if (comp instanceof ColliderComponent && comp.enabled && comp.owner.active) {
                    colliders.push(comp);
                    this.quadTree.insert(comp);
                }
            }
        }

        let nbIsIntersect = 0;
        const collisions: Array<[ColliderComponent, ColliderComponent]> = [];
        const collisionsTested: Array<[ColliderComponent, ColliderComponent]> = [];

        for (let i = 0; i < colliders.length; i++) {

            const c1 = colliders[i];

            // On parcourt tous les éléments qui peuvent potentiellement collide avec c1
            let possibleColliders: Array<ColliderComponent> = this.quadTree.retrieve(c1.area);
            for (let c2 of possibleColliders) {

                // Si le flag & le mask ne correspondent pas, on passe
                if (!(c2.flag & c1.mask)) {
                    continue;
                }

                // On teste seulement si on a pas déjà testé la collision
                if (collisionsTested.find(value => {
                    return value[0] === c2 && value[1] === c1;
                }) == null) {

                    nbIsIntersect++;

                    collisionsTested.push([c1, c2]);

                    if (c1.area.intersectsWith(c2.area)) {
                        collisions.push([c1, c2]);
                    }
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

        this.quadTree.clear();

        console.log("isIntersect Calls : " + nbIsIntersect);
    }
}
