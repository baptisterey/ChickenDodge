import * as GraphicsAPI from "../graphicsAPI";
import { Resources } from "../resources";
import { Component } from "./component";

let GL: WebGLRenderingContext;

// ## Fonction *compileShader*
// Cette fonction permet de créer un shader du type approprié
// (vertex ou fragment) à partir de son code GLSL.
function compileShader(source: string, type: number) {
  const shader = GL.createShader(type)!;
  GL.shaderSource(shader, source);
  GL.compileShader(shader);
  if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
    alert(`Erreur en compilant le shader: ${GL.getShaderInfoLog(shader)}`);
    throw new Error();
  }
  return shader;
}

// # Classe *CompositorComponent*
// Ce composant définit l'interface utilisée pour les compositeurs,
// afin d'effectuer des opérations de post-process sur les caméras.
export interface ICompositorComponentDesc {
  vertexShader: string;
  fragmentShader: string;
}

export abstract class CompositorComponent<T extends ICompositorComponentDesc> extends Component<T> {
  protected shader!: WebGLProgram;

  // ## Méthode *compose*
  // Cette méthode est appelée afin d'appliquer un effet sur la caméra
  public compose(texture: WebGLTexture): WebGLTexture {
    return texture;
  }

  // ## Méthode *setup*
  // Charge les shaders et configure le composant
  public setup(descr: T) {
    GL = GraphicsAPI.context;

    const vs = compileShader(Resources.load<string>(descr.vertexShader)!, GL.VERTEX_SHADER);
    const fs = compileShader(Resources.load<string>(descr.fragmentShader)!, GL.FRAGMENT_SHADER);

    this.shader = GL.createProgram()!;
    GL.attachShader(this.shader, vs);
    GL.attachShader(this.shader, fs);
    GL.linkProgram(this.shader);

    if (!GL.getProgramParameter(this.shader, GL.LINK_STATUS)) {
      alert(`Initialisation du shader échouée: ${GL.getProgramInfoLog(this.shader)}`);
    }

    GL.useProgram(this.shader);
  }
}
