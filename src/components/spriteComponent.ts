import * as GraphicsAPI from "../graphicsAPI";
import {IDisplayComponent} from "../systems/displaySystem";
import {ILogicComponent} from "../systems/logicSystem";
import {Timing} from "../timing";
import {Component} from "./component";
import {PositionComponent} from "./positionComponent";
import {IFrameEntry, ISize, SpriteSheetComponent} from "./spriteSheetComponent";
import {TextureComponent} from "./textureComponent";

// # Classe *SpriteComponent*
// Ce composant permet l'affichage d'une sprite pouvant
// potentiellement être animée.
interface ISpriteComponentDesc {
    spriteSheet: string | SpriteSheetComponent;
    spriteName?: string;
    isAnimated?: boolean;
    frameSkip?: number;
    animWait?: number;
}

export class SpriteComponent extends Component<ISpriteComponentDesc> implements ILogicComponent {
    public spriteSheet!: SpriteSheetComponent;
    public spriteName!: string;
    public animationEndedEvent: Array<() => void> = [];
    public isAnimated!: boolean;
    public frameSkip!: number;
    public animationFrame!: number;
    private animWait!: number;
    private animWaitCounter!: number;
    private descr!: IFrameEntry;
    private spriteSize!: ISize;
    private vertices!: Float32Array;

    // ## Méthode *create*
    // Cette méthode est appelée pour configurer le composant avant
    // que tous les composants d'un objet aient été créés.
    public create(descr: ISpriteComponentDesc) {
        let ref;

        this.spriteName = descr.spriteName || "(unknown)";
        // tslint:disable:no-conditional-assignment
        this.isAnimated = (ref = descr.isAnimated) !== undefined ? ref : false;
        this.frameSkip = (ref = descr.frameSkip) !== undefined ? ref : 1;
        this.animWait = (ref = descr.animWait) !== undefined ? ref : 0;
        // tslint:enable:no-conditional-assignment
        this.animationFrame = 1;
        this.animWaitCounter = this.animWait;
    }

    // ## Méthode *setup*
    public setup(descr: ISpriteComponentDesc) {

        // On récupère ici la feuille de sprite correspondant à ce composant.
        this.spriteSheet = Component.findComponent<SpriteSheetComponent>(descr.spriteSheet)!;

        // On crée ici un tableau de 4 vertices permettant de représenter
        // le rectangle à afficher.
        this.vertices = new Float32Array(4 * TextureComponent.vertexSize);

        // Et on initialise le contenu des vertices
        this.updateMesh();
    }

    // ## Méthode *update*
    // Cette méthode met à jour l'animation de la sprite, si il
    // y a lieu, et met à jour le contenu des vertices afin de tenir
    // compte des changements de position et autres.
    public update(timing: Timing) {
        if (this.isAnimated) {
            if (this.animWaitCounter > 0) {
                this.animWaitCounter--;
            } else if ((timing.frame % this.frameSkip) === 0) {
                this.updateMesh();
            }
        }

        this.updateComponents(this.descr);
    }

    // ## Fonction "getVertices"
    // Cette fonction renvoie la liste des 4 vertices courantes.
    public getVertices(): Float32Array {
        return this.vertices;
    }

    // ## Méthode *updateMesh*
    // Cette méthode met à jour les informations relatives à la sprite
    // à afficher.
    public updateMesh() {
        const spriteName = this.isAnimated ? this.findNextFrameName() : this.spriteName;
        if (!this.spriteSheet.sprites[spriteName]) {
            console.error(spriteName, this.spriteName, this.owner);
            return;
        }
        this.descr = this.spriteSheet.sprites[spriteName];
        this.spriteSize = this.descr.sourceSize;
    }

    // ## Fonction *findNextFrameName*
    // La fonction *findNextFrameName* détermine le nom de la sprite
    // à afficher dans une animation, et déclenche des événements
    // enregistrés si on atteint la fin de l'animation.
    private findNextFrameName(): string {
        const animationSprite = `${this.spriteName}${this.animationFrame}`;
        if (this.spriteSheet.sprites[animationSprite]) {
            this.animationFrame++;
            return animationSprite;
        }
        if (this.animationFrame === 1) {
            return this.spriteName;
        } else {
            this.animationFrame = 1;
            this.animWaitCounter = this.animWait;
            for (const e of this.animationEndedEvent) {
                e();
            }
            return this.findNextFrameName();
        }
    }

    // ## Méthode *updateComponents*
    // Cette méthode met à jour le contenu de chaque vertex, soient
    // leurs position et les coordonnées de texture, en tenant compte
    // des transformations et de la sprite courante.
    private updateComponents(descr: IFrameEntry) {
        const position = this.owner.getComponent<PositionComponent>("Position").worldPosition;

        const z = position[2];
        const xMin = position[0];
        const xMax = xMin + descr.frame.w;
        const yMax = position[1];
        const yMin = yMax - descr.frame.h;
        const uMin = descr.uv!.x;
        const uMax = uMin + descr.uv!.w;
        const vMin = descr.uv!.y;
        const vMax = vMin + descr.uv!.h;

        const v = [
            xMin, yMin, z, uMin, vMin,
            xMax, yMin, z, uMax, vMin,
            xMax, yMax, z, uMax, vMax,
            xMin, yMax, z, uMin, vMax,
        ];

        const offset = 0;
        this.vertices.set(v, offset);
    }
}
