import * as GraphicsAPI from "../graphicsAPI";
import { Resources } from "../resources";
import { CompositorComponent, ICompositorComponentDesc } from "./compositorComponent";

let GL: WebGLRenderingContext;

// # Classe *DeformationCompositorComponent*
// Ce compositeur applique une déformation dynamique sur l'écran.
interface IDeformationCompositorDesc extends ICompositorComponentDesc {
  speed: number;
  scale: number;
  source: string;
  intensity: string;
}

export class DeformationCompositorComponent extends CompositorComponent<IDeformationCompositorDesc> {
  private speed!: number;
  private scale!: number;
  private start!: number;
  private deformation!: WebGLTexture;
  private intensity!: WebGLTexture;
  private positionAttrib!: number;
  private uSampler!: WebGLUniformLocation;
  private uDeformation!: WebGLUniformLocation;
  private uIntensity!: WebGLUniformLocation;
  private uTime!: WebGLUniformLocation;
  private uScale!: WebGLUniformLocation;
  private screenQuad!: WebGLBuffer;
  private itemSize!: number;
  private numItems!: number;
  private rttFrameBuffer!: WebGLFramebuffer;
  private renderTexture!: WebGLTexture;
  private renderBuffer!: WebGLRenderbuffer;

  // ## Méthode *onEnabled*
  // La méthode *onEnabled* est appelée quand l'objet passe de l'état
  // activé à désactivé.
  public onEnabled() {
    this.start = +new Date();
  }

  // ## Méthode *setup*
  // Charge les shaders et les textures nécessaires au composant
  public setup(descr: IDeformationCompositorDesc) {
    GL = GraphicsAPI.context;

    const width = GraphicsAPI.canvas.width;
    const height = GraphicsAPI.canvas.height;

    this.speed = descr.speed;
    this.scale = descr.scale;
    this.start = +new Date();

    super.setup(descr);

    const deformationImage = Resources.load<HTMLImageElement>(descr.source)!;
    this.deformation = GL.createTexture()!;
    GL.bindTexture(GL.TEXTURE_2D, this.deformation);
    GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, deformationImage);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.REPEAT);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.REPEAT);
    GL.bindTexture(GL.TEXTURE_2D, null);

    const intensityImage = Resources.load<HTMLImageElement>(descr.intensity)!;
    this.intensity = GL.createTexture()!;
    GL.bindTexture(GL.TEXTURE_2D, this.intensity);
    GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, intensityImage);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
    GL.bindTexture(GL.TEXTURE_2D, null);

    this.positionAttrib = GL.getAttribLocation(this.shader, "aPosition");
    this.uSampler = GL.getUniformLocation(this.shader, "uSampler")!;
    this.uDeformation = GL.getUniformLocation(this.shader, "uDeformation")!;
    this.uIntensity = GL.getUniformLocation(this.shader, "uIntensity")!;
    this.uTime = GL.getUniformLocation(this.shader, "uTime")!;
    this.uScale = GL.getUniformLocation(this.shader, "uScale")!;

    const verts = [1, 1, -1, 1, -1, -1, -1, -1, 1, -1, 1, 1];
    this.screenQuad = GL.createBuffer()!;
    GL.bindBuffer(GL.ARRAY_BUFFER, this.screenQuad);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(verts), GL.STATIC_DRAW);
    this.itemSize = 2;
    this.numItems = 6;

    this.rttFrameBuffer = GL.createFramebuffer()!;
    GL.bindFramebuffer(GL.FRAMEBUFFER, this.rttFrameBuffer);

    this.renderTexture = GL.createTexture()!;
    GL.bindTexture(GL.TEXTURE_2D, this.renderTexture);
    GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, width, height, 0, GL.RGBA, GL.UNSIGNED_BYTE, null);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);

    this.renderBuffer = GL.createRenderbuffer()!;
    GL.bindRenderbuffer(GL.RENDERBUFFER, this.renderBuffer);
    GL.renderbufferStorage(GL.RENDERBUFFER, GL.DEPTH_COMPONENT16, width, height);

    GL.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, this.renderTexture, 0);
    GL.framebufferRenderbuffer(GL.FRAMEBUFFER, GL.DEPTH_ATTACHMENT, GL.RENDERBUFFER, this.renderBuffer);

    // tslint:disable-next-line:no-bitwise
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    GL.bindTexture(GL.TEXTURE_2D, null);
    GL.bindRenderbuffer(GL.RENDERBUFFER, null);
    GL.bindFramebuffer(GL.FRAMEBUFFER, null);
  }

  // ## Méthode *compose*
  // Cette méthode est appelée afin d'appliquer un effet sur la caméra
  public compose(texture: WebGLTexture) {
    GL.bindFramebuffer(GL.FRAMEBUFFER, this.rttFrameBuffer);
    // tslint:disable-next-line:no-bitwise
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    GL.useProgram(this.shader);

    GL.bindBuffer(GL.ARRAY_BUFFER, this.screenQuad);
    GL.enableVertexAttribArray(this.positionAttrib);
    GL.vertexAttribPointer(this.positionAttrib, this.itemSize, GL.FLOAT, false, 0, 0);

    GL.activeTexture(GL.TEXTURE0);
    GL.bindTexture(GL.TEXTURE_2D, texture);
    GL.uniform1i(this.uSampler, 0);

    GL.activeTexture(GL.TEXTURE1);
    GL.bindTexture(GL.TEXTURE_2D, this.deformation);
    GL.uniform1i(this.uDeformation, 1);

    GL.activeTexture(GL.TEXTURE2);
    GL.bindTexture(GL.TEXTURE_2D, this.intensity);
    GL.uniform1i(this.uIntensity, 2);

    const elapsed = ((+new Date()) - this.start) / 1000 * this.speed;
    GL.uniform1f(this.uTime, elapsed);

    GL.uniform1f(this.uScale, this.scale);

    GL.drawArrays(GL.TRIANGLES, 0, this.numItems);
    GL.disableVertexAttribArray(this.positionAttrib);

    if (elapsed >= 1) {
      this.enabled = false;
    }

    return this.renderTexture;
  }
}
