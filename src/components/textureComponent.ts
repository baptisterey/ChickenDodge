import { mat4 } from "gl-matrix";
import * as GraphicsAPI from "../graphicsAPI";
import { Resources } from "../resources";
import { CameraComponent } from "./cameraComponent";
import { Component } from "./component";

let GL: WebGLRenderingContext;

// # Classe *TextureComponent*
// Ce composant comprend les fonctions de base nécessaires
// à l'affichage d'une sprite.
export interface ITextureComponentDesc {
  texture: string;
  vertexShader: string;
  fragmentShader: string;
}

export abstract class TextureComponent<T extends ITextureComponentDesc> extends Component<T> {
  // ## Constante *vertexSize*
  // Cette constante représente le nombre d'éléments d'un vertex,
  // soit 3 valeurs pour la position, et 2 pour la texture
  public static vertexSize = 3 + 2; // position(3d), texture(2d)

  // ## Constante *floatSize*
  // Cette constante représente le nombre d'octets dans une valeur
  // flottante. On s'en sert pour calculer la position des éléments
  // de vertex dans des tableaux de mémoire bruts.
  public static floatSize = 4; // 32 bits

  protected image!: HTMLImageElement;
  private texture!: WebGLTexture;
  private shader!: WebGLProgram;
  private vertexPositionAttrib!: number;
  private textureCoordAttrib!: number;
  private pUniform!: WebGLUniformLocation;
  private mvUniform!: WebGLUniformLocation;
  private uSampler!: WebGLUniformLocation;

  // ## Méthode *create*
  public create(descr: T) {
    GL = GraphicsAPI.context;

    this.image = Resources.load<HTMLImageElement>(descr.texture)!;

    // On crée une texture WebGL à partir de l'image chargée
    this.texture = GL.createTexture()!;
    GL.bindTexture(GL.TEXTURE_2D, this.texture);
    GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, this.image);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
    GL.bindTexture(GL.TEXTURE_2D, null);

    // On charge ensuite les shaders
    const vs = this.compileShader(Resources.load<string>(descr.vertexShader)!, GL.VERTEX_SHADER);
    const fs = this.compileShader(Resources.load<string>(descr.fragmentShader)!, GL.FRAGMENT_SHADER);

    // On attache les deux shaders ensemble
    this.shader = GL.createProgram()!;
    GL.attachShader(this.shader, vs);
    GL.attachShader(this.shader, fs);
    GL.linkProgram(this.shader);

    if (!GL.getProgramParameter(this.shader, GL.LINK_STATUS)) {
      alert(`Initialisation du shader échouée:  ${GL.getProgramInfoLog(this.shader)}`);
    }

    GL.useProgram(this.shader);

    // On récupère des références vers les paramètres configurables des shaders
    this.vertexPositionAttrib = GL.getAttribLocation(this.shader, "aVertexPosition");
    this.textureCoordAttrib = GL.getAttribLocation(this.shader, "aTextureCoord");

    this.pUniform = GL.getUniformLocation(this.shader, "uPMatrix")!;
    this.mvUniform = GL.getUniformLocation(this.shader, "uMVMatrix")!;
    this.uSampler = GL.getUniformLocation(this.shader, "uSampler")!;
  }

  // ## Méthode *bind*
  // La méthode *bind* choisit le shader et y assigne les
  // bonnes valeurs.
  public bind() {
    // On commence par choisir le shader à utiliser
    GL.useProgram(this.shader);

    // On indique au vertex shader la position des paramètres
    // dans le tableau de mémoire (vertex buffer object).
    const stride = TextureComponent.vertexSize * TextureComponent.floatSize;
    GL.enableVertexAttribArray(this.vertexPositionAttrib);
    GL.enableVertexAttribArray(this.textureCoordAttrib);
    GL.vertexAttribPointer(this.vertexPositionAttrib, 3, GL.FLOAT, false, stride, 0);
    GL.vertexAttribPointer(this.textureCoordAttrib, 2, GL.FLOAT, false, stride, 3 * TextureComponent.floatSize);

    // On configure les matrices de transformation
    GL.uniformMatrix4fv(this.pUniform, false, CameraComponent.current!.projection);
    const identity = mat4.create();
    GL.uniformMatrix4fv(this.mvUniform, false, identity);

    // On assigne la texture à utiliser pour le fragment shader
    GL.activeTexture(GL.TEXTURE0);
    GL.bindTexture(GL.TEXTURE_2D, this.texture);
    GL.uniform1i(this.uSampler, 0);

    // On active la semi-transparence
    GL.enable(GL.BLEND);
    GL.blendFunc(GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA);
  }

  // ## Méthode *unbind*
  // Nettoie les paramètres WebGL
  public unbind() {
    GL.disableVertexAttribArray(this.vertexPositionAttrib);
    GL.disableVertexAttribArray(this.textureCoordAttrib);
  }

  // ## Fonction *compileShader*
  // Cette fonction permet de créer un shader du type approprié
  // (vertex ou fragment) à partir de son code GLSL.
  private compileShader(source: string, type: number) {
    const shader = GL.createShader(type)!;
    GL.shaderSource(shader, source);
    GL.compileShader(shader);
    if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
      alert(`Erreur en compilant le shader: ${GL.getShaderInfoLog(shader)}`);
      throw new Error();
    }
    return shader;
  }
}
