import { mat4 } from "gl-matrix";
import * as GraphicsAPI from "../graphicsAPI";
import { ICameraComponent } from "../systems/displaySystem";
import { Component, IComponent } from "./component";
import { CompositorComponent } from "./compositorComponent";
import { PositionComponent } from "./positionComponent";

let GL: WebGLRenderingContext;

// # Classe *CameraComponent*
// Cette classe permet de configurer certains paramètres de
// rendu, la couleur de l'arrière-plan, les dimensions de
// l'aire d'affichage, etc.
interface IColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface ICameraComponentDesc {
  color: IColor;
  height: number;
  near: number;
  far: number;
  compositors: string[];
}

export class CameraComponent extends Component<ICameraComponentDesc> implements ICameraComponent {
  // ## Propriété statique *current*
  // Pour simplifier l'exercice, la caméra courante est stockée
  // dans ce champ. Elle est utilisée par le composant SpriteSheetComponent
  public static current: CameraComponent | null = null;

  private clearColor!: IColor;
  private viewHeight!: number;
  private near!: number;
  private far!: number;
  private canvas!: HTMLCanvasElement;
  private rttFrameBuffer!: WebGLFramebuffer;
  private renderTexture!: WebGLTexture;
  private renderBuffer!: WebGLRenderbuffer;
  private compositors: Array<CompositorComponent<any>> = [];

  // ## Méthode *create*
  // Cette méthode est appelée pour configurer le composant avant
  // que tous les composants d'un objet aient été créés. On y
  // configure globalement le tests de profondeur, la couleur de
  // l'arrière-plan et la zone de rendu.
  public create(descr: ICameraComponentDesc) {
    GL = GraphicsAPI.context;
    CameraComponent.current = this;

    this.clearColor = descr.color;
    this.viewHeight = descr.height;
    this.near = descr.near;
    this.far = descr.far;
    const canvas = this.canvas = GraphicsAPI.canvas;

    GL.disable(GL.DEPTH_TEST);
    GL.depthFunc(GL.LEQUAL);
    GL.clearColor(this.clearColor.r, this.clearColor.g, this.clearColor.b, this.clearColor.a);

    GL.viewport(0, 0, canvas.width, canvas.height);

    this.rttFrameBuffer = GL.createFramebuffer()!;
    GL.bindFramebuffer(GL.FRAMEBUFFER, this.rttFrameBuffer);

    this.renderTexture = GL.createTexture()!;
    GL.bindTexture(GL.TEXTURE_2D, this.renderTexture);
    GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, canvas.width, canvas.height, 0, GL.RGBA, GL.UNSIGNED_BYTE, null);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);

    this.renderBuffer = GL.createRenderbuffer()!;
    GL.bindRenderbuffer(GL.RENDERBUFFER, this.renderBuffer);
    GL.renderbufferStorage(GL.RENDERBUFFER, GL.DEPTH_COMPONENT16, canvas.width, canvas.height);

    GL.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, this.renderTexture, 0);
    GL.framebufferRenderbuffer(GL.FRAMEBUFFER, GL.DEPTH_ATTACHMENT, GL.RENDERBUFFER, this.renderBuffer);

    // tslint:disable-next-line:no-bitwise
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    GL.bindTexture(GL.TEXTURE_2D, null);
    GL.bindRenderbuffer(GL.RENDERBUFFER, null);
    GL.bindFramebuffer(GL.FRAMEBUFFER, null);
  }

  // ## Méthode *setup*
  // La méthode *setup* récupère les compositeurs spécifiés pour
  // la caméra.
  public setup(descr: ICameraComponentDesc) {
    for (const comp of descr.compositors) {
      const compositor = Component.findComponent<CompositorComponent<any>>(comp);
      if (compositor) {
        this.compositors.push(compositor);
      }
    }
  }

  // ## Méthode *render*
  // La méthode *render* est appelée une fois par itération de
  // la boucle de jeu. La caméra courante est conservée, et on
  // efface la zone de rendu. La zone de rendu sera à nouveau
  // remplie par les appels aux méthodes *display* des autres
  // composants.
  public render() {
    CameraComponent.current = this;
    let rt = this.renderTexture;
    for (const comp of this.compositors) {
      if (comp.enabled) {
        rt = comp.compose(rt);
      }
    }

    GL.bindFramebuffer(GL.FRAMEBUFFER, this.rttFrameBuffer);
    // tslint:disable-next-line:no-bitwise
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
  }

  // ## Accesseur *projection*
  // Cet accesseur retourne la matrice de projection de la caméra.
  // Elle est utilisée pour configurer le shader par le composant
  // SpriteSheetComponent.
  get projection() {
    const ratio = this.canvas.width / this.canvas.height;
    const viewWidth = ratio * this.viewHeight;
    const position = this.owner.getComponent<PositionComponent>("Position").worldPosition;
    const ortho = mat4.create();
    return mat4.ortho(ortho, position[0] - viewWidth, position[0] + viewWidth, -position[1] + this.viewHeight, -position[1] - this.viewHeight, position[2] + this.near, position[2] + this.far);
  }
}
