import {ColliderComponent} from "./colliderComponent";
import {Rectangle} from "./rectangle";


const MAX_OBJECTS = 3;
const MAX_LEVELS = 5;

export class QuadTree {

    private level: number;
    private objects: Array<ColliderComponent>;
    private bounds: Rectangle;
    private nodes: Array<QuadTree>;


    public constructor(_level: number, _bounds: Rectangle) {

        this.level = _level;
        this.bounds = _bounds;

        this.nodes = new Array<QuadTree>();
        this.objects = new Array<ColliderComponent>();

    }


    public clear() {
        this.objects = [];

        for (let quadTree of this.nodes) {
            quadTree.clear();
        }

        this.nodes = [];
    }

    /**
     * Divise le node en 4 sous-nodes
     */
    public split() {

        let subWidth: number = (this.bounds.xMax - this.bounds.xMin) / 2;
        let subHeight: number = (this.bounds.yMax - this.bounds.yMin) / 2;
        let x: number = this.bounds.xMin;
        let y: number = this.bounds.yMin;

        // En bas à gauche
        this.nodes.push(new QuadTree(this.level + 1, new Rectangle({
            x: x,
            y: y,
            width: subWidth,
            height: subHeight,
        })));

        // En haut à gauche
        this.nodes.push(new QuadTree(this.level + 1, new Rectangle({
            x: x,
            y: y + subHeight,
            width: subWidth,
            height: subHeight,
        })));

        // En bas à droite
        this.nodes.push(new QuadTree(this.level + 1, new Rectangle({
            x: x + subWidth,
            y: y,
            width: subWidth,
            height: subHeight,
        })));

        // En haut à droite
        this.nodes.push(new QuadTree(this.level + 1, new Rectangle({
            x: x + subWidth,
            y: y + subHeight,
            width: subWidth,
            height: subHeight,
        })));

    }


    private getIndex(area: Rectangle): number {
        let width: number = this.bounds.xMax - this.bounds.xMin;
        let height: number = this.bounds.yMax - this.bounds.yMin;
        let verticalMiddle: number = this.bounds.xMin + width / 2;
        let horizontalMiddle: number = this.bounds.yMin + height / 2;

        let top: boolean = (area.yMin > horizontalMiddle);
        let bottom: boolean = (area.yMax < horizontalMiddle);

        let left: boolean = (area.xMax < verticalMiddle);
        let right: boolean = (area.xMin > verticalMiddle);

        if (bottom && left) {
            return 0;
        } else if (top && left) {
            return 1;
        } else if (bottom && right) {
            return 2;
        } else if (top && right) {
            return 3;
        }

        return -1;
    }


    public insert(collider: ColliderComponent) {
        if (this.nodes.length > 0) {
            let index: number = this.getIndex(collider.area);

            if (index != -1) {
                this.nodes[index].insert(collider);
                return;
            }
        }

        this.objects.push(collider);

        if (this.objects.length > MAX_OBJECTS && this.level < MAX_LEVELS) {
            if (this.nodes.length == 0) {
                this.split();
            }

            let i = 0;
            while (i < this.objects.length) {
                let c: ColliderComponent = this.objects[i];
                let index: number = this.getIndex(c.area);
                if (index != -1) {
                    this.objects.splice(i, 1);
                    this.nodes[index].insert(c);
                } else {
                    i++;
                }
            }
        }
    }


    public retrieve(area: Rectangle): Array<ColliderComponent> {
        let index: number = this.getIndex(area);

        let colliders: Array<ColliderComponent> = new Array<ColliderComponent>();

        if (index != -1 && this.nodes.length != 0) {
            colliders = this.nodes[index].retrieve(area);
        }
        colliders = colliders.concat(this.objects);

        return colliders;
    }

}
