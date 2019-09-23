import {IEntity} from "../entity";
import {IDisplayComponent} from "../systems/displaySystem";
import {Component} from "./component";
import {SpriteComponent} from "./spriteComponent";
import * as GraphicsAPI from "../graphicsAPI";

let GL: WebGLRenderingContext;

// # Classe *LayerComponent*
// Ce composant représente un ensemble de sprites qui
// doivent normalement être considérées comme étant sur un
// même plan.
export class LayerComponent extends Component<object> implements IDisplayComponent {

    indexBuffer!: WebGLBuffer;
    vertexBuffer!: WebGLBuffer;

    // ## Méthode *create*
    // Cette méthode est appelée pour configurer le composant avant
    // que tous les composants d'un objet aient été créés.
    public create() {

    }

    // ## Méthode *setup*
    public setup() {
        GL = GraphicsAPI.context;
        this.displaySprites();
    }


    // ## Méthode *display*
    // La méthode *display* est appelée une fois par itération
    // de la boucle de jeu.
    public display(dT: number) {
        this.displaySprites();
    }

    // ## Fonction *listSprites*
    // Cette fonction retourne une liste comportant l'ensemble
    // des sprites de l'objet courant et de ses enfants.
    private listSprites() {
        const sprites: SpriteComponent[] = [];

        const queue: IEntity[] = [this.owner];
        while (queue.length > 0) {
            const node = queue.shift() as IEntity;
            for (const child of node.children) {
                if (child.active) {
                    queue.push(child);
                }
            }

            for (const comp of node.components) {
                if (comp instanceof SpriteComponent && comp.enabled) {
                    sprites.push(comp);
                }
            }
        }

        return sprites;
    }

    // ## Méthode *displaySprites*
    // La méthode *displaySprites* parcourt l'ensemble des sprites
    // du layer et affiche toutes leurs vertices.
    private displaySprites() {

        const layerSprites = this.listSprites();
        if (layerSprites.length === 0) {
            return; // Si on a aucun sprite à afficher, ne rien faire
        }

        const spriteSheet = layerSprites[0].spriteSheet;
        if (spriteSheet == null) {
            return; // Si on a aucune spritesheet pour afficher les sprites, ne rien faire
        }

        let vertices: any[] = [];
        let indexes: any[] = [];

        let i = 0;
        for (const sprite of layerSprites) { // On parcour l'ensemble des sprites du layer pour recolter leurs vertices & indices
            const newStartIndex = i * 4;
            vertices = vertices.concat(Array.prototype.slice.call(sprite.getVertices()));
            indexes = indexes.concat([newStartIndex, newStartIndex + 1, newStartIndex + 2, newStartIndex + 2, newStartIndex + 3, newStartIndex]);
            i++;
        }

        this.indexBuffer = GL.createBuffer()!;
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        const indices = new Uint16Array(indexes);
        GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, indices, GL.DYNAMIC_DRAW);

        this.vertexBuffer = GL.createBuffer()!;
        GL.bindBuffer(GL.ARRAY_BUFFER, this.vertexBuffer);

        const verts = new Float32Array(vertices);
        GL.bufferData(GL.ARRAY_BUFFER, verts, GL.DYNAMIC_DRAW);

        spriteSheet.bind();
        GL.drawElements(GL.TRIANGLES, 6 * layerSprites.length, GL.UNSIGNED_SHORT, 0);
        spriteSheet.unbind();
    }
}
