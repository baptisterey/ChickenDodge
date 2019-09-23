import * as GraphicsAPI from "../graphicsAPI";
import { CompositorComponent, ICompositorComponentDesc } from "./compositorComponent";

let GL: WebGLRenderingContext;

// # Classe *RenderCompositorComponent*
// Ce compositeur affiche la texture à l'écran. Il devrait être le dernier
// de la liste.
export class RenderCompositorComponent extends CompositorComponent<ICompositorComponentDesc> {
  private positionAttrib!: number;
  private uSampler!: WebGLUniformLocation;
  private screenQuad!: WebGLBuffer;
  private itemSize!: number;
  private numItems!: number;

  // ## Méthode *setup*
  // Charge les shaders et configure le composant
  public setup(descr: ICompositorComponentDesc) {
    GL = GraphicsAPI.context;

    super.setup(descr);
    this.positionAttrib = GL.getAttribLocation(this.shader, "aPosition");
    this.uSampler = GL.getUniformLocation(this.shader, "uSampler")!;

    const verts = [1, 1, -1, 1, -1, -1, -1, -1, 1, -1, 1, 1];
    this.screenQuad = GL.createBuffer()!;
    GL.bindBuffer(GL.ARRAY_BUFFER, this.screenQuad);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(verts), GL.STATIC_DRAW);
    this.itemSize = 2;
    this.numItems = 6;
  }

  // ## Méthode *compose*
  // Cette méthode est appelée afin d'effectuer le rendu final.
  public compose(texture: WebGLTexture) {
    GL.bindFramebuffer(GL.FRAMEBUFFER, null);

    // tslint:disable-next-line:no-bitwise
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    GL.useProgram(this.shader);

    GL.bindBuffer(GL.ARRAY_BUFFER, this.screenQuad);
    GL.enableVertexAttribArray(this.positionAttrib);
    GL.vertexAttribPointer(this.positionAttrib, this.itemSize, GL.FLOAT, false, 0, 0);

    GL.activeTexture(GL.TEXTURE0);
    GL.bindTexture(GL.TEXTURE_2D, texture);
    GL.uniform1i(this.uSampler, 0);

    GL.drawArrays(GL.TRIANGLES, 0, this.numItems);
    GL.disableVertexAttribArray(this.positionAttrib);

    // On ne s'en sert plus après ça
    return texture;
  }
}
