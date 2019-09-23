import * as GraphicsAPI from "../graphicsAPI";
import { IDisplayComponent } from "../systems/displaySystem";
import { PositionComponent } from "./positionComponent";
import { ITextureComponentDesc, TextureComponent } from "./textureComponent";

let GL: WebGLRenderingContext;

// # Classe *RawSpriteComponent*
// Ce composant comprend les fonctions nécessaires à l'affichage
// d'une sprite brute.
interface IRawSpriteDesc extends ITextureComponentDesc {
  width?: number;
  height?: number;
  scale?: number;
}

export class RawSpriteComponent extends TextureComponent<IRawSpriteDesc> implements IDisplayComponent {
  private vertexBuffer!: WebGLBuffer;
  private vertices!: Float32Array;
  private indexBuffer!: WebGLBuffer;

  // ## Méthode *create*
  public create(descr: IRawSpriteDesc) {
    GL = GraphicsAPI.context;

    // On charge l'image et les shaders
    super.create(descr);

    // On crée ici un tableau de 4 vertices permettant de représenter
    // le rectangle à afficher.
    this.vertexBuffer = GL.createBuffer()!;
    GL.bindBuffer(GL.ARRAY_BUFFER, this.vertexBuffer);
    this.vertices = new Float32Array(4 * TextureComponent.vertexSize);
    GL.bufferData(GL.ARRAY_BUFFER, this.vertices, GL.DYNAMIC_DRAW);

    // On crée ici un tableau de 6 indices, soit 2 triangles, pour
    // représenter quels vertices participent à chaque triangle:
    // ```
    // 0    1
    // +----+
    // |\   |
    // | \  |
    // |  \ |
    // |   \|
    // +----+
    // 3    2
    // ```
    this.indexBuffer = GL.createBuffer()!;
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    const indices = new Uint16Array([0, 1, 2, 2, 3, 0]);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, indices, GL.DYNAMIC_DRAW);

    // Et on initialise le contenu des vertices
    this.updateComponents(descr);
  }

  // ## Méthode *display*
  // La méthode *display* choisit le shader et la texture appropriée
  // via la méthode *bind* sélectionne le tableau de vertices et
  // d'indices et fait l'appel de rendu.
  public display() {
    GL.bindBuffer(GL.ARRAY_BUFFER, this.vertexBuffer);
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.bind();
    GL.drawElements(GL.TRIANGLES, 6, GL.UNSIGNED_SHORT, 0);
    this.unbind();
  }

  // ## Méthode *updateComponents*
  // Cette méthode met à jour le contenu de chaque vertex.
  private updateComponents(descr: IRawSpriteDesc) {
    let ref;

    const position = this.owner.getComponent<PositionComponent>("Position").worldPosition;
    // tslint:disable:no-conditional-assignment
    let width = (ref = descr.width) !== undefined ? ref : this.image.width;
    let height = (ref = descr.height) !== undefined ? ref : this.image.height;
    // tslint:enable:no-conditional-assignment
    if (descr.scale) {
      width *= descr.scale;
      height *= descr.scale;
    }

    const z = position[2];
    const xMin = position[0] - width / 2;
    const xMax = xMin + width;
    const yMax = position[1] - height / 2;
    const yMin = yMax - height;

    const v = [
      xMin, yMin, z, 0, 0,
      xMax, yMin, z, 1, 0,
      xMax, yMax, z, 1, 1,
      xMin, yMax, z, 0, 1,
    ];

    this.vertices.set(v);
    GL.bindBuffer(GL.ARRAY_BUFFER, this.vertexBuffer);
    GL.bufferSubData(GL.ARRAY_BUFFER, 0, this.vertices);
  }
}
