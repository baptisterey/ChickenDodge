define("resources", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // ## Fonction *loadAsync*
    // Fonction qui charge un fichier de façon asynchrone,
    // via une [promesse](http://bluebirdjs.com/docs/why-promises.html)
    async function loadAsync(url, mime, responseType) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.addEventListener("error", reject);
            xhr.addEventListener("load", () => {
                resolve(xhr);
            });
            if (mime) {
                xhr.overrideMimeType(mime);
            }
            xhr.open("GET", url);
            if (responseType) {
                xhr.responseType = responseType;
            }
            xhr.send();
        });
    }
    // ## Fonction *loadJSON*
    // Fonction qui charge un fichier JSON de façon asynchrone,
    // via une [promesse](http://bluebirdjs.com/docs/why-promises.html)
    async function loadJSON(url) {
        return loadAsync(url)
            .then((xhr) => {
            return JSON.parse(xhr.responseText);
        });
    }
    async function loadImageFile(url) {
        return new Promise((resolve) => {
            const imgDownload = new Image();
            imgDownload.onload = () => {
                resolve(imgDownload);
            };
            imgDownload.src = url;
        });
    }
    class Resources {
        static async init(url) {
            const relPath = url.substr(0, url.lastIndexOf("/"));
            const desc = await loadJSON(url);
            await Resources.loadText(relPath, desc.text || {});
            await Resources.loadImages(relPath, desc.images || []);
        }
        static load(file) {
            return Resources.resources.get(file);
        }
        static async loadText(relPath, files) {
            for (const mime in files) {
                if (!files.hasOwnProperty(mime)) {
                    continue;
                }
                for (const file of files[mime]) {
                    const xhr = await loadAsync(`${relPath}/${file}`, mime);
                    Resources.resources.set(file, xhr.responseText);
                }
            }
        }
        static async loadImages(relPath, files) {
            for (const file of files) {
                const image = await loadImageFile(`${relPath}/${file}`);
                Resources.resources.set(file, image);
            }
        }
    }
    exports.Resources = Resources;
    Resources.resources = new Map();
});
// # Fonctions d'affichage
define("graphicsAPI", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // ## Méthode *init*
    // La méthode d'initialisation prend en paramètre le nom d'un objet de
    // type *canvas* de la page web où dessiner. On y extrait
    // et conserve alors une référence vers le contexte de rendu 3D.
    function init(canvasId) {
        exports.canvas = document.getElementById(canvasId);
        const gl = exports.canvas.getContext("webgl");
        if (!gl) {
            throw new Error("Impossible de récupérer le contexte WebGL!");
        }
        exports.context = gl;
        return exports.context;
    }
    exports.init = init;
    // ## Méthode *requestFullScreen*
    // Méthode utilitaire pour mettre le canvas en plein écran.
    // Il existe plusieurs méthodes selon le navigateur, donc on
    // se doit de vérifier l'existence de celles-ci avant de les
    // appeler.
    //
    // À noter qu'un script ne peut appeler le basculement en plein
    // écran que sur une action explicite du joueur.
    function requestFullScreen() {
        exports.canvas.requestFullscreen();
    }
    exports.requestFullScreen = requestFullScreen;
});
define("systems/system", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("systems/displaySystem", ["require", "exports", "graphicsAPI", "scene"], function (require, exports, GraphicsAPI, scene_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // # Fonction *isDisplayComponent*
    // Vérifie si le composant est du type `IDisplayComponent``
    // Voir [la documentation de TypeScript](https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards)
    function isDisplayComponent(arg) {
        return arg.display !== undefined;
    }
    // # Fonction *isCameraComponent*
    // Vérifie si le composant est du type `ICameraComponent``
    // Voir [la documentation de TypeScript](https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards)
    function isCameraComponent(arg) {
        return arg.render !== undefined;
    }
    // # Classe *DisplaySystem*
    // Représente le système permettant de gérer l'affichage
    class DisplaySystem {
        // ## Constructeur
        // Initialise l'API graphique.
        constructor(canvasId) {
            GraphicsAPI.init(canvasId);
        }
        // Méthode *iterate*
        // Appelée à chaque tour de la boucle de jeu
        iterate(dT) {
            const displayComp = [];
            const cameraComp = [];
            for (const e of scene_1.Scene.current.entities()) {
                for (const comp of e.components) {
                    if (isDisplayComponent(comp) && comp.enabled) {
                        displayComp.push(comp);
                    }
                    if (isCameraComponent(comp) && comp.enabled) {
                        cameraComp.push(comp);
                    }
                }
            }
            for (const c of displayComp) {
                c.display(dT);
            }
            for (const c of cameraComp) {
                c.render(dT);
            }
        }
    }
    exports.DisplaySystem = DisplaySystem;
});
define("components/compositorComponent", ["require", "exports", "graphicsAPI", "resources", "components/component"], function (require, exports, GraphicsAPI, resources_1, component_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let GL;
    // ## Fonction *compileShader*
    // Cette fonction permet de créer un shader du type approprié
    // (vertex ou fragment) à partir de son code GLSL.
    function compileShader(source, type) {
        const shader = GL.createShader(type);
        GL.shaderSource(shader, source);
        GL.compileShader(shader);
        if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
            alert(`Erreur en compilant le shader: ${GL.getShaderInfoLog(shader)}`);
            throw new Error();
        }
        return shader;
    }
    class CompositorComponent extends component_1.Component {
        // ## Méthode *compose*
        // Cette méthode est appelée afin d'appliquer un effet sur la caméra
        compose(texture) {
            return texture;
        }
        // ## Méthode *setup*
        // Charge les shaders et configure le composant
        setup(descr) {
            GL = GraphicsAPI.context;
            const vs = compileShader(resources_1.Resources.load(descr.vertexShader), GL.VERTEX_SHADER);
            const fs = compileShader(resources_1.Resources.load(descr.fragmentShader), GL.FRAGMENT_SHADER);
            this.shader = GL.createProgram();
            GL.attachShader(this.shader, vs);
            GL.attachShader(this.shader, fs);
            GL.linkProgram(this.shader);
            if (!GL.getProgramParameter(this.shader, GL.LINK_STATUS)) {
                alert(`Initialisation du shader échouée: ${GL.getProgramInfoLog(this.shader)}`);
            }
            GL.useProgram(this.shader);
        }
    }
    exports.CompositorComponent = CompositorComponent;
});
define("components/positionComponent", ["require", "exports", "gl-matrix", "components/component"], function (require, exports, gl_matrix_1, component_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function isVec3(arg) {
        return arg.buffer !== undefined;
    }
    class PositionComponent extends component_2.Component {
        // ## Méthode *create*
        // Cette méthode est appelée pour configurer le composant avant
        // que tous les composants d'un objet aient été créés. Les valeurs
        // omises prennent la valeur 0 par défaut.
        create(descr) {
            if (isVec3(descr)) {
                this.local = gl_matrix_1.vec3.clone(descr);
            }
            else {
                this.local = gl_matrix_1.vec3.fromValues(descr.x || 0, descr.y || 0, descr.z || 0);
            }
        }
        // ## Propriété *worldPosition*
        // Cette propriété combine les transformations des parents afin
        // de trouver la position absolue de l'objet dans le monde.
        get worldPosition() {
            const pos = gl_matrix_1.vec3.clone(this.local);
            const parentPosition = this.owner.parent ? this.owner.parent.getComponent("Position") : undefined;
            if (parentPosition) {
                const parentWorld = parentPosition.worldPosition;
                gl_matrix_1.vec3.add(pos, pos, parentWorld);
            }
            return pos;
        }
        // ## Méthode *translate*
        // Applique une translation sur l'objet.
        translate(delta) {
            gl_matrix_1.vec3.add(this.local, this.local, delta);
        }
        // ## Méthode *clamp*
        // Cette méthode limite la position de l'objet dans une zone
        // donnée.
        clamp(xMin = Number.MIN_VALUE, xMax = Number.MAX_VALUE, yMin = Number.MIN_VALUE, yMax = Number.MAX_VALUE, zMin = Number.MIN_VALUE, zMax = Number.MAX_VALUE) {
            if (this.local[0] < xMin) {
                this.local[0] = xMin;
            }
            if (this.local[0] > xMax) {
                this.local[0] = xMax;
            }
            if (this.local[1] < yMin) {
                this.local[1] = yMin;
            }
            if (this.local[1] > yMax) {
                this.local[1] = yMax;
            }
            if (this.local[2] < zMin) {
                this.local[2] = zMin;
            }
            if (this.local[2] > zMax) {
                this.local[2] = zMax;
            }
        }
    }
    exports.PositionComponent = PositionComponent;
});
define("components/cameraComponent", ["require", "exports", "gl-matrix", "graphicsAPI", "components/component"], function (require, exports, gl_matrix_2, GraphicsAPI, component_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let GL;
    class CameraComponent extends component_3.Component {
        constructor() {
            super(...arguments);
            this.compositors = [];
        }
        // ## Méthode *create*
        // Cette méthode est appelée pour configurer le composant avant
        // que tous les composants d'un objet aient été créés. On y
        // configure globalement le tests de profondeur, la couleur de
        // l'arrière-plan et la zone de rendu.
        create(descr) {
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
            this.rttFrameBuffer = GL.createFramebuffer();
            GL.bindFramebuffer(GL.FRAMEBUFFER, this.rttFrameBuffer);
            this.renderTexture = GL.createTexture();
            GL.bindTexture(GL.TEXTURE_2D, this.renderTexture);
            GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, canvas.width, canvas.height, 0, GL.RGBA, GL.UNSIGNED_BYTE, null);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
            this.renderBuffer = GL.createRenderbuffer();
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
        setup(descr) {
            for (const comp of descr.compositors) {
                const compositor = component_3.Component.findComponent(comp);
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
        render() {
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
            const position = this.owner.getComponent("Position").worldPosition;
            const ortho = gl_matrix_2.mat4.create();
            return gl_matrix_2.mat4.ortho(ortho, position[0] - viewWidth, position[0] + viewWidth, -position[1] + this.viewHeight, -position[1] - this.viewHeight, position[2] + this.near, position[2] + this.far);
        }
    }
    exports.CameraComponent = CameraComponent;
    // ## Propriété statique *current*
    // Pour simplifier l'exercice, la caméra courante est stockée
    // dans ce champ. Elle est utilisée par le composant SpriteSheetComponent
    CameraComponent.current = null;
});
define("components/textureComponent", ["require", "exports", "gl-matrix", "graphicsAPI", "resources", "components/cameraComponent", "components/component"], function (require, exports, gl_matrix_3, GraphicsAPI, resources_2, cameraComponent_1, component_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let GL;
    class TextureComponent extends component_4.Component {
        // ## Méthode *create*
        create(descr) {
            GL = GraphicsAPI.context;
            this.image = resources_2.Resources.load(descr.texture);
            // On crée une texture WebGL à partir de l'image chargée
            this.texture = GL.createTexture();
            GL.bindTexture(GL.TEXTURE_2D, this.texture);
            GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, this.image);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
            GL.bindTexture(GL.TEXTURE_2D, null);
            // On charge ensuite les shaders
            const vs = this.compileShader(resources_2.Resources.load(descr.vertexShader), GL.VERTEX_SHADER);
            const fs = this.compileShader(resources_2.Resources.load(descr.fragmentShader), GL.FRAGMENT_SHADER);
            // On attache les deux shaders ensemble
            this.shader = GL.createProgram();
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
            this.pUniform = GL.getUniformLocation(this.shader, "uPMatrix");
            this.mvUniform = GL.getUniformLocation(this.shader, "uMVMatrix");
            this.uSampler = GL.getUniformLocation(this.shader, "uSampler");
        }
        // ## Méthode *bind*
        // La méthode *bind* choisit le shader et y assigne les
        // bonnes valeurs.
        bind() {
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
            GL.uniformMatrix4fv(this.pUniform, false, cameraComponent_1.CameraComponent.current.projection);
            const identity = gl_matrix_3.mat4.create();
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
        unbind() {
            GL.disableVertexAttribArray(this.vertexPositionAttrib);
            GL.disableVertexAttribArray(this.textureCoordAttrib);
        }
        // ## Fonction *compileShader*
        // Cette fonction permet de créer un shader du type approprié
        // (vertex ou fragment) à partir de son code GLSL.
        compileShader(source, type) {
            const shader = GL.createShader(type);
            GL.shaderSource(shader, source);
            GL.compileShader(shader);
            if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
                alert(`Erreur en compilant le shader: ${GL.getShaderInfoLog(shader)}`);
                throw new Error();
            }
            return shader;
        }
    }
    exports.TextureComponent = TextureComponent;
    // ## Constante *vertexSize*
    // Cette constante représente le nombre d'éléments d'un vertex,
    // soit 3 valeurs pour la position, et 2 pour la texture
    TextureComponent.vertexSize = 3 + 2; // position(3d), texture(2d)
    // ## Constante *floatSize*
    // Cette constante représente le nombre d'octets dans une valeur
    // flottante. On s'en sert pour calculer la position des éléments
    // de vertex dans des tableaux de mémoire bruts.
    TextureComponent.floatSize = 4; // 32 bits
});
define("components/spriteSheetComponent", ["require", "exports", "resources", "components/textureComponent"], function (require, exports, resources_3, textureComponent_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class SpriteSheetComponent extends textureComponent_1.TextureComponent {
        // ## Méthode *create*
        create(descr) {
            // On charge l'image et les shaders
            super.create(descr);
            // On charge ensuite le fichier de description de l'image,
            // qui contient l'emplacement et les dimensions des sprites
            // contenues sur la feuille.
            const content = resources_3.Resources.load(descr.description);
            const rawDescription = JSON.parse(content);
            this.parseDescription(rawDescription);
        }
        // ## Méthode *parseDescription*
        // Cette méthode extrait la description de la feuille de sprite.
        parseDescription(rawDescription) {
            this.sprites = rawDescription.frames;
            for (const k in rawDescription.frames) {
                if (!rawDescription.frames.hasOwnProperty(k)) {
                    continue;
                }
                const v = rawDescription.frames[k];
                v.uv = this.normalizeUV(v.frame, rawDescription.meta.size);
            }
        }
        // ## Fonction *normalizeUV*
        // La fonction *normalizeUV* retourne la position relative, entre
        // 0 et 1, des rectangles comportant les sprites de la feuille.
        normalizeUV(frame, size) {
            return {
                x: frame.x / size.w,
                y: frame.y / size.h,
                // tslint:disable-next-line:object-literal-sort-keys
                w: frame.w / size.w,
                h: frame.h / size.h,
            };
        }
    }
    exports.SpriteSheetComponent = SpriteSheetComponent;
});
define("components/backgroundLoaderComponent", ["require", "exports", "resources", "scene", "components/component"], function (require, exports, resources_4, scene_2, component_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class BackgroundLoaderComponent extends component_5.Component {
        // ## Méthode *create*
        // Cette méthode est appelée pour configurer le composant avant
        // que tous les composants d'un objet aient été créés.
        create(descr) {
            this.entryMap = descr.entryMap;
            this.scale = descr.scale;
        }
        // ## Méthode *setup*
        // Cette méthode est responsable d'instancier les différents
        // objets contenant des sprites.
        setup(descr) {
            const spriteSheet = component_5.Component.findComponent(descr.spriteSheet);
            const content = resources_4.Resources.load(descr.description);
            const lines = content.split(/\r?\n/);
            for (let row = 0; row < lines.length; ++row) {
                const chars = lines[row].split("");
                for (let col = 0; col < chars.length; ++col) {
                    const char = chars[col];
                    const entry = this.entryMap[char];
                    if (!entry) {
                        continue;
                    }
                    scene_2.Scene.current.createChild({
                        components: {
                            Position: {
                                x: col * this.scale,
                                y: row * this.scale,
                                z: row * 0.01,
                            },
                            Sprite: {
                                frameSkip: entry.frameSkip,
                                isAnimated: entry.isAnimated,
                                spriteName: entry.spriteName,
                                spriteSheet,
                            },
                        },
                    }, `${col}-${row}`, this.owner);
                }
            }
        }
    }
    exports.BackgroundLoaderComponent = BackgroundLoaderComponent;
});
define("timing", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Timing {
        constructor(dT, frame) {
            this.dT = dT;
            this.frame = frame;
            this.now = new Date();
        }
    }
    exports.Timing = Timing;
});
define("systems/logicSystem", ["require", "exports", "scene", "timing"], function (require, exports, scene_3, timing_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // # Fonction *isLogicComponent*
    // Vérifie si le composant est du type `ILogicComponent``
    // Voir [la documentation de TypeScript](https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards)
    function isLogicComponent(arg) {
        return arg.update !== undefined;
    }
    // # Classe *LogicSystem*
    // Représente le système permettant de mettre à jour la logique
    class LogicSystem {
        constructor() {
            this.frameCount = 0;
        }
        // Méthode *iterate*
        // Appelée à chaque tour de la boucle de jeu
        iterate(dT) {
            const timing = new timing_1.Timing(dT, this.frameCount++);
            for (const e of scene_3.Scene.current.entities()) {
                for (const comp of e.components) {
                    if (isLogicComponent(comp) && comp.enabled) {
                        comp.update(timing);
                    }
                }
            }
        }
    }
    exports.LogicSystem = LogicSystem;
});
define("components/rectangle", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function isRectangleDesc(arg) {
        return arg.xMin !== undefined;
    }
    class Rectangle {
        // ### Constructeur de la classe *Rectangle*
        // Le constructeur de cette classe prend en paramètre un
        // objet pouvant définir soit le centre et la taille du
        // rectangle (`x`, `y`, `width` et `height`) ou les côtés
        // de celui-ci (`xMin`, `xMax`, `yMin` et `yMax`).
        constructor(descr) {
            if (isRectangleDesc(descr)) {
                this.xMin = descr.xMin;
                this.xMax = descr.xMax;
                this.yMin = descr.yMin;
                this.yMax = descr.yMax;
            }
            else {
                this.xMin = descr.x - descr.width / 2;
                this.xMax = descr.x + descr.width / 2;
                this.yMin = descr.y - descr.height / 2;
                this.yMax = descr.y + descr.height / 2;
            }
        }
        // ### Fonction *intersectsWith*
        // Cette fonction retourne *vrai* si ce rectangle et celui
        // passé en paramètre se superposent.
        intersectsWith(other) {
            return !((this.xMin >= other.xMax) ||
                (this.xMax <= other.xMin) ||
                (this.yMin >= other.yMax) ||
                (this.yMax <= other.yMin));
        }
    }
    exports.Rectangle = Rectangle;
});
define("components/colliderComponent", ["require", "exports", "components/component", "components/rectangle"], function (require, exports, component_6, rectangle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ColliderComponent extends component_6.Component {
        // ## Méthode *create*
        // Cette méthode est appelée pour configurer le composant avant
        // que tous les composants d'un objet aient été créés.
        create(descr) {
            this.flag = descr.flag;
            this.mask = descr.mask;
            this.size = descr.size;
        }
        // ## Méthode *setup*
        // Si un type *handler* est défini, on y appellera une méthode
        // *onCollision* si une collision est détectée sur cet objet.
        setup(descr) {
            if (descr.handler) {
                this.handler = this.owner.getComponent(descr.handler);
            }
        }
        // ## Propriété *area*
        // Cette fonction calcule l'aire courante de la zone de
        // collision, après avoir tenu compte des transformations
        // effectuées sur les objets parent.
        get area() {
            const position = this.owner.getComponent("Position").worldPosition;
            return new rectangle_1.Rectangle({
                x: position[0],
                y: position[1],
                // tslint:disable-next-line:object-literal-sort-keys
                width: this.size.w,
                height: this.size.h,
            });
        }
    }
    exports.ColliderComponent = ColliderComponent;
});
define("components/spriteComponent", ["require", "exports", "components/component", "components/textureComponent"], function (require, exports, component_7, textureComponent_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class SpriteComponent extends component_7.Component {
        constructor() {
            super(...arguments);
            this.animationEndedEvent = [];
        }
        // ## Méthode *create*
        // Cette méthode est appelée pour configurer le composant avant
        // que tous les composants d'un objet aient été créés.
        create(descr) {
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
        setup(descr) {
            // On récupère ici la feuille de sprite correspondant à ce composant.
            this.spriteSheet = component_7.Component.findComponent(descr.spriteSheet);
            // On crée ici un tableau de 4 vertices permettant de représenter
            // le rectangle à afficher.
            this.vertices = new Float32Array(4 * textureComponent_2.TextureComponent.vertexSize);
            // Et on initialise le contenu des vertices
            this.updateMesh();
        }
        // ## Méthode *update*
        // Cette méthode met à jour l'animation de la sprite, si il
        // y a lieu, et met à jour le contenu des vertices afin de tenir
        // compte des changements de position et autres.
        update(timing) {
            if (this.isAnimated) {
                if (this.animWaitCounter > 0) {
                    this.animWaitCounter--;
                }
                else if ((timing.frame % this.frameSkip) === 0) {
                    this.updateMesh();
                }
            }
            this.updateComponents(this.descr);
        }
        // ## Fonction "getVertices"
        // Cette fonction renvoie la liste des 4 vertices courantes.
        getVertices() {
            return this.vertices;
        }
        // ## Méthode *updateMesh*
        // Cette méthode met à jour les informations relatives à la sprite
        // à afficher.
        updateMesh() {
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
        findNextFrameName() {
            const animationSprite = `${this.spriteName}${this.animationFrame}`;
            if (this.spriteSheet.sprites[animationSprite]) {
                this.animationFrame++;
                return animationSprite;
            }
            if (this.animationFrame === 1) {
                return this.spriteName;
            }
            else {
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
        updateComponents(descr) {
            const position = this.owner.getComponent("Position").worldPosition;
            const z = position[2];
            const xMin = position[0];
            const xMax = xMin + descr.frame.w;
            const yMax = position[1];
            const yMin = yMax - descr.frame.h;
            const uMin = descr.uv.x;
            const uMax = uMin + descr.uv.w;
            const vMin = descr.uv.y;
            const vMax = vMin + descr.uv.h;
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
    exports.SpriteComponent = SpriteComponent;
});
define("components/chickenComponent", ["require", "exports", "gl-matrix", "scene", "components/component"], function (require, exports, gl_matrix_4, scene_4, component_8) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let dropId = 0;
    class ChickenComponent extends component_8.Component {
        constructor() {
            super(...arguments);
            this.dropped = false;
            this.distance = 0;
        }
        // ## Méthode *create*
        // Cette méthode est appelée pour configurer le composant avant
        // que tous les composants d'un objet aient été créés.
        create(descr) {
            this.target = gl_matrix_4.vec3.fromValues(descr.target.x, descr.target.y, 0);
            this.rupeeTemplate = descr.rupeeTemplate;
            this.heartAttackChance = descr.heartAttackChance;
            this.heartTemplate = descr.heartTemplate;
            this.attack = descr.attack;
        }
        // ## Méthode *setup*
        // Cette méthode détermine la trajectoire du poulet et configure
        // la sprite à utiliser pour son affichage.
        setup() {
            const position = this.owner.getComponent("Position");
            this.velocity = gl_matrix_4.vec3.create();
            gl_matrix_4.vec3.subtract(this.velocity, this.target, position.local);
            gl_matrix_4.vec3.normalize(this.velocity, this.velocity);
            gl_matrix_4.vec3.scale(this.velocity, this.velocity, Math.random() * 45 + 30);
            const sprite = this.owner.getComponent("Sprite");
            const dir = (this.velocity[0] > 0) ? "R" : "L";
            sprite.spriteName = `C${dir}`;
        }
        // ## Méthode *update*
        // La méthode *update* met à jour la position du poulet. Si il
        // a atteint sa cible, il laisse tomber un rubis. Le poulet est
        // automatiquement détruit si il a parcouru une distance trop
        // grande (il sera déjà en dehors de l'écran).
        update(timing) {
            const position = this.owner.getComponent("Position");
            const targetDistanceSq = gl_matrix_4.vec3.squaredDistance(this.target, position.local);
            const delta = gl_matrix_4.vec3.create();
            gl_matrix_4.vec3.scale(delta, this.velocity, timing.dT);
            position.translate(delta);
            const newTargetDistanceSq = gl_matrix_4.vec3.squaredDistance(this.target, position.local);
            if ((!this.dropped) && (newTargetDistanceSq > targetDistanceSq)) {
                this.drop(this.rupeeTemplate, dropId++);
            }
            this.distance += gl_matrix_4.vec3.length(delta);
            if (this.distance > 500) {
                this.owner.parent.removeChild(this.owner);
            }
        }
        // ## Méthode *onAttack*
        // Cette méthode est appelée quand le poulet se fait attaquer
        onAttack() {
            const toDrop = (Math.random() < this.heartAttackChance) ? this.heartTemplate : this.rupeeTemplate;
            this.drop(toDrop, dropId++);
            const collider = this.owner.getComponent("Collider");
            collider.enabled = false;
            this.velocity[0] *= -1;
            const sprite = this.owner.getComponent("Sprite");
            const dir = (this.velocity[0] > 0) ? "R" : "L";
            sprite.spriteName = `C${dir}`;
        }
        // ## Méthode *drop*
        // Cette méthode instancie un objet au même endroit que le
        // poulet.
        drop(template, id) {
            const position = this.owner.getComponent("Position");
            template.components.Position = position.local;
            template.components.Sprite.spriteSheet = this.owner.getComponent("Sprite").spriteSheet;
            scene_4.Scene.current.createChild(template, id.toString(), this.owner.parent);
            this.dropped = true;
        }
    }
    exports.ChickenComponent = ChickenComponent;
});
define("components/chickenSpawnerComponent", ["require", "exports", "scene", "components/component"], function (require, exports, scene_5, component_9) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ChickenSpawnerComponent extends component_9.Component {
        // ## Méthode *create*
        // Cette méthode est appelée pour configurer le composant avant
        // que tous les composants d'un objet aient été créés.
        create(descr) {
            this.sourceArea = descr.sourceArea;
            this.targetArea = descr.targetArea;
            this.spawnDelay = descr.spawnDelay;
            this.spawnWaitFactor = descr.spawnWaitFactor;
            this.chickenTemplate = descr.chickenTemplate;
        }
        // ## Méthode *setup*
        // Cette méthode est appelée pour configurer le composant après
        // que tous les composants d'un objet aient été créés.
        setup(descr) {
            this.spriteSheet = component_9.Component.findComponent(descr.spriteSheet);
        }
        // ## Méthode *update*
        // À chaque itération, on vérifie si on a attendu un délai
        // quelconque. Si c'est le cas, on génère un poulet, et on
        // réduit le temps d'attente.
        update(timing) {
            const spawnDelay = Math.floor(this.spawnDelay);
            if ((timing.frame % spawnDelay) === 0) {
                this.spawnDelay = Math.max(8, this.spawnDelay * this.spawnWaitFactor);
                this.spawn(timing.frame);
            }
        }
        // ## Méthode *spawn*
        // Cette méthode crée un nouveau poulet. On configure son
        // apparition sur un rectangle autour de l'écran, et sa
        // cible sur l'aire de jeu.
        spawn(frame) {
            let x = 0;
            let y = 0;
            if (Math.floor(Math.random() * 2) === 0) {
                x = this.sourceArea.x;
                if (Math.floor(Math.random() * 2) === 0) {
                    x += this.sourceArea.w;
                }
                y = Math.random() * this.sourceArea.h + this.sourceArea.y;
            }
            else {
                y = this.sourceArea.y;
                if (Math.floor(Math.random() * 2) === 0) {
                    y += this.sourceArea.h;
                }
                x = Math.random() * this.sourceArea.w + this.sourceArea.x;
            }
            this.chickenTemplate.components.Chicken.target = {
                x: Math.random() * this.targetArea.w + this.targetArea.x,
                y: Math.random() * this.targetArea.h + this.targetArea.y,
            };
            this.chickenTemplate.components.Position = {
                x,
                y,
                z: 0,
            };
            this.chickenTemplate.components.Sprite.spriteSheet = this.spriteSheet;
            scene_5.Scene.current.createChild(this.chickenTemplate, frame.toString(), this.owner);
        }
    }
    exports.ChickenSpawnerComponent = ChickenSpawnerComponent;
});
define("eventTrigger", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // # Classe *EventTrigger*
    // Classe utilitaire pour appeler des méthodes en réaction
    // à des événements.
    class EventTrigger {
        constructor() {
            this.handlers = new Map();
            this.autoIndex = 0;
        }
        // ## Méthode *add*
        // Ajoute une méthode à appeler lors du déclenchement de
        // l'événement.
        add(instance, method, name, context) {
            if (!name) {
                name = (this.autoIndex++).toString();
            }
            this.handlers.set(name, {
                context,
                instance,
                method,
            });
            return name;
        }
        // ## Méthode *remove*
        // Supprime une méthode du tableau de méthodes à appeler.
        remove(name) {
            this.handlers.delete(name);
        }
        // ## Méthode *trigger*
        // Déclenche les méthodes enregistrées.
        trigger(...params) {
            for (const handler of this.handlers.values()) {
                if (handler.context) {
                    params.push(handler.context);
                }
                let method = handler.method;
                if (typeof (method) === "string") {
                    method = handler.instance[method];
                }
                method.apply(handler.instance, params);
            }
        }
    }
    exports.EventTrigger = EventTrigger;
});
define("components/countdownComponent", ["require", "exports", "eventTrigger", "scene", "components/component"], function (require, exports, eventTrigger_1, scene_6, component_10) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class CountdownComponent extends component_10.Component {
        constructor() {
            super(...arguments);
            this.handler = new eventTrigger_1.EventTrigger();
            this.sprites = [];
            this.index = -1;
        }
        // ## Méthode *create*
        // Cette méthode est appelée pour configurer le composant avant
        // que tous les composants d'un objet aient été créés.
        create(descr) {
            this.sprites = descr.sprites;
            this.delay = descr.delay;
            this.spriteTemplate = descr.spriteTemplate;
        }
        // ## Méthode *setup*
        // Cette méthode est appelée pour configurer le composant après
        // que tous les composants d'un objet aient été créés.
        setup(descr) {
            if (descr.handler) {
                const tokens = descr.handler.split(".");
                this.handler.add(this.owner.getComponent(tokens[0]), tokens[1]);
            }
        }
        // ## Méthode *update*
        // À chaque itération, on vérifie si on a attendu le délai
        // désiré, et on change d'image si c'est le cas.
        update(timing) {
            if ((timing.now.getTime() - this.shownTime) < this.delay) {
                return;
            }
            this.index++;
            if (this.current) {
                this.owner.removeChild(this.current);
                delete this.current;
            }
            if (this.index >= this.sprites.length) {
                this.handler.trigger();
                this.enabled = false;
            }
            else {
                return this.showImage();
            }
        }
        // ## Méthode *showImage*
        // Affiche une image parmi les sprites désirées, si il y en
        // a encore à afficher.
        showImage() {
            this.shownTime = (new Date()).getTime();
            this.showNamedImage(this.sprites[this.index]);
        }
        // ## Méthode *showNamedImage*
        // Affiche une image, directement à partir de son nom
        showNamedImage(textureName) {
            this.spriteTemplate.components.RawSprite.texture = textureName;
            this.current = scene_6.Scene.current.createChild(this.spriteTemplate, "sprite", this.owner);
        }
    }
    exports.CountdownComponent = CountdownComponent;
});
define("components/debugDrawCallsComponent", ["require", "exports", "graphicsAPI", "components/component"], function (require, exports, GraphicsAPI, component_11) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let GL;
    let origDrawElements;
    let value = 0;
    // ## Méthode *countDrawCalls*
    // Cette méthode est appelée à la place de *drawElements*
    // de l'API WebGL. Puisqu'on utilise une manière détournée
    // d'atteindre cette méthode, le pointeur *this*
    // correspond au contexte WebGL. On incrémente donc le
    // compteur d'appels de rendu, et on appelle ensuite
    // la méthode d'origine.
    function countDrawCalls(mode, count, type, offset) {
        value++;
        origDrawElements.apply(GL, [mode, count, type, offset]);
    }
    class DebugDrawCallsComponent extends component_11.Component {
        // ## Méthode *create*
        // On substitue ici la méthode *drawElements* de l'API
        // WebGL par une fonction locale.
        create() {
            GL = GraphicsAPI.context;
            origDrawElements = GL.drawElements;
            GL.drawElements = countDrawCalls;
        }
        // ## Méthode *setup*
        // On conserve la référence vers l'élément HTML dans
        // lequel on écrira le nombre d'appels de rendu.
        setup(descr) {
            this.target = document.getElementById(descr.field);
        }
        // ## Méthode *update*
        // On affiche le nombre d'appels de rendu exécuté à
        // la dernière itération et on remet le compteur à zéro.
        update() {
            this.target.innerHTML = value.toString();
            value = 0;
        }
    }
    exports.DebugDrawCallsComponent = DebugDrawCallsComponent;
});
define("components/deformationCompositorComponent", ["require", "exports", "graphicsAPI", "resources", "components/compositorComponent"], function (require, exports, GraphicsAPI, resources_5, compositorComponent_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let GL;
    class DeformationCompositorComponent extends compositorComponent_1.CompositorComponent {
        // ## Méthode *onEnabled*
        // La méthode *onEnabled* est appelée quand l'objet passe de l'état
        // activé à désactivé.
        onEnabled() {
            this.start = +new Date();
        }
        // ## Méthode *setup*
        // Charge les shaders et les textures nécessaires au composant
        setup(descr) {
            GL = GraphicsAPI.context;
            const width = GraphicsAPI.canvas.width;
            const height = GraphicsAPI.canvas.height;
            this.speed = descr.speed;
            this.scale = descr.scale;
            this.start = +new Date();
            super.setup(descr);
            const deformationImage = resources_5.Resources.load(descr.source);
            this.deformation = GL.createTexture();
            GL.bindTexture(GL.TEXTURE_2D, this.deformation);
            GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, deformationImage);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.REPEAT);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.REPEAT);
            GL.bindTexture(GL.TEXTURE_2D, null);
            const intensityImage = resources_5.Resources.load(descr.intensity);
            this.intensity = GL.createTexture();
            GL.bindTexture(GL.TEXTURE_2D, this.intensity);
            GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, intensityImage);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
            GL.bindTexture(GL.TEXTURE_2D, null);
            this.positionAttrib = GL.getAttribLocation(this.shader, "aPosition");
            this.uSampler = GL.getUniformLocation(this.shader, "uSampler");
            this.uDeformation = GL.getUniformLocation(this.shader, "uDeformation");
            this.uIntensity = GL.getUniformLocation(this.shader, "uIntensity");
            this.uTime = GL.getUniformLocation(this.shader, "uTime");
            this.uScale = GL.getUniformLocation(this.shader, "uScale");
            const verts = [1, 1, -1, 1, -1, -1, -1, -1, 1, -1, 1, 1];
            this.screenQuad = GL.createBuffer();
            GL.bindBuffer(GL.ARRAY_BUFFER, this.screenQuad);
            GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(verts), GL.STATIC_DRAW);
            this.itemSize = 2;
            this.numItems = 6;
            this.rttFrameBuffer = GL.createFramebuffer();
            GL.bindFramebuffer(GL.FRAMEBUFFER, this.rttFrameBuffer);
            this.renderTexture = GL.createTexture();
            GL.bindTexture(GL.TEXTURE_2D, this.renderTexture);
            GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, width, height, 0, GL.RGBA, GL.UNSIGNED_BYTE, null);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
            this.renderBuffer = GL.createRenderbuffer();
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
        compose(texture) {
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
    exports.DeformationCompositorComponent = DeformationCompositorComponent;
});
define("components/enablerComponent", ["require", "exports", "eventTrigger", "components/component"], function (require, exports, eventTrigger_2, component_12) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class EnablerComponent extends component_12.Component {
        constructor() {
            super(...arguments);
            this.eventTargets = new eventTrigger_2.EventTrigger();
        }
        // ## Méthode *setup*
        // Cette méthode est appelée pour configurer le composant après
        // que tous les composants d'un objet aient été créés.
        setup(descr) {
            for (const name in descr.onStart) {
                if (!descr.onStart.hasOwnProperty(name)) {
                    continue;
                }
                const enabled = descr.onStart[name];
                const target = component_12.Component.findComponent(name);
                target.enabled = enabled;
            }
            for (const name in descr.onEvent) {
                if (!descr.onEvent.hasOwnProperty(name)) {
                    continue;
                }
                const enabled = descr.onEvent[name];
                const target = component_12.Component.findComponent(name);
                this.eventTargets.add(target, "enable", undefined, enabled);
            }
        }
        // ## Méthode *onEvent*
        // Active ou désactive les composants en réaction à un événement.
        onEvent() {
            this.eventTargets.trigger();
        }
    }
    exports.EnablerComponent = EnablerComponent;
});
define("components/heartComponent", ["require", "exports", "components/component"], function (require, exports, component_13) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class HeartComponent extends component_13.Component {
        // ## Méthode *create*
        // Cette méthode est appelée pour configurer le composant avant
        // que tous les composants d'un objet aient été créés.
        create(descr) {
            this.heal = descr.heal;
            this.lifetime = descr.lifetime;
        }
        // ## Méthode *setup*
        // Cette méthode est appelée pour configurer le composant après
        // que tous les composants d'un objet aient été créés.
        setup() {
            this.start = (new Date()).getTime();
        }
        // ## Méthode *update*
        // La méthode *update* de chaque composant est appelée une fois
        // par itération de la boucle de jeu.
        update(timing) {
            const elapsed = timing.now.getTime() - this.start;
            if (elapsed > this.lifetime) {
                this.owner.active = false;
                this.owner.parent.removeChild(this.owner);
            }
        }
    }
    exports.HeartComponent = HeartComponent;
});
define("components/inputComponent", ["require", "exports", "components/component"], function (require, exports, component_14) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // ## Variable *keyPressed*
    // Tableau associatif vide qui contiendra l'état courant
    // des touches du clavier.
    const keyPressed = {};
    // ## Méthode *setupKeyboardHandler*
    // Cette méthode enregistre des fonctions qui seront
    // appelées par le navigateur lorsque l'utilisateur appuie
    // sur des touches du clavier. On enregistre alors si la touche
    // est appuyée ou relâchée dans le tableau `keyPressed`.
    //
    // On utilise la propriété `code` de l'événement, qui est
    // indépendant de la langue du clavier (ie.: WASD vs ZQSD)
    //
    // Cette méthode est appelée lors du chargement de ce module.
    function setupKeyboardHandler() {
        document.addEventListener("keydown", (evt) => {
            keyPressed[evt.code] = true;
        }, false);
        document.addEventListener("keyup", (evt) => {
            keyPressed[evt.code] = false;
        }, false);
    }
    class InputComponent extends component_14.Component {
        constructor() {
            super(...arguments);
            this.isLocal = true;
        }
        // ## Méthode *create*
        // Cette méthode est appelée pour configurer le composant avant
        // que tous les composants d'un objet aient été créés.
        create(descr) {
            this.symbols = descr.symbols;
        }
        listSymbols() {
            return Object.keys(this.symbols);
        }
        // ## Fonction *getKey*
        // Cette méthode retourne une valeur correspondant à un symbole défini.
        //
        // Si on le voulait, on pourrait substituer cette implémentation
        // par clavier par une implémentation de l'[API Gamepad.](https://developer.mozilla.org/fr/docs/Web/Guide/API/Gamepad)
        getKey(symbol) {
            if (keyPressed[this.symbols[symbol]]) {
                return true;
            }
            return false;
        }
    }
    exports.InputComponent = InputComponent;
    // Configuration de la capture du clavier au chargement du module.
    // On met dans un bloc `try/catch` afin de pouvoir exécuter les
    // tests unitaires en dehors du navigateur.
    try {
        setupKeyboardHandler();
    }
    catch (e) {
        // Rien
    }
});
define("components/layerComponent", ["require", "exports", "components/component", "components/spriteComponent", "graphicsAPI", "components/textureComponent"], function (require, exports, component_15, spriteComponent_1, GraphicsAPI, textureComponent_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let GL;
    // # Classe *LayerComponent*
    // Ce composant représente un ensemble de sprites qui
    // doivent normalement être considérées comme étant sur un
    // même plan.
    class LayerComponent extends component_15.Component {
        // ## Méthode *create*
        // Cette méthode est appelée pour configurer le composant avant
        // que tous les composants d'un objet aient été créés.
        create() {
        }
        // ## Méthode *setup*
        setup() {
            GL = GraphicsAPI.context;
            this.displaySprites();
        }
        // ## Méthode *display*
        // La méthode *display* est appelée une fois par itération
        // de la boucle de jeu.
        display(dT) {
            this.displaySprites();
        }
        // ## Fonction *listSprites*
        // Cette fonction retourne une liste comportant l'ensemble
        // des sprites de l'objet courant et de ses enfants.
        listSprites() {
            const sprites = [];
            const queue = [this.owner];
            while (queue.length > 0) {
                const node = queue.shift();
                for (const child of node.children) {
                    if (child.active) {
                        queue.push(child);
                    }
                }
                for (const comp of node.components) {
                    if (comp instanceof spriteComponent_1.SpriteComponent && comp.enabled) {
                        sprites.push(comp);
                    }
                }
            }
            return sprites;
        }
        // ## Méthode *displaySprites*
        // La méthode *displaySprites* parcourt l'ensemble des sprites
        // du layer et affiche toutes leurs vertices.
        displaySprites() {
            const layerSprites = this.listSprites();
            if (layerSprites.length === 0) {
                return; // Si on a aucun sprite à afficher, ne rien faire
            }
            const spriteSheet = layerSprites[0].spriteSheet;
            if (spriteSheet == null) {
                return; // Si on a aucune spritesheet pour afficher les sprites, ne rien faire
            }
            const indices = new Uint16Array(6 * layerSprites.length);
            const vertices = new Float32Array(4 * layerSprites.length * textureComponent_3.TextureComponent.vertexSize);
            let i = 0;
            for (const sprite of layerSprites) { // On parcourt l'ensemble des sprites du layer pour recolter leurs vertices & indices
                const newStartIndex = i * 4;
                vertices.set(sprite.getVertices(), i * 4 * textureComponent_3.TextureComponent.vertexSize);
                indices.set([newStartIndex, newStartIndex + 1, newStartIndex + 2, newStartIndex + 2, newStartIndex + 3, newStartIndex], i * 6);
                i++;
            }
            this.indexBuffer = GL.createBuffer();
            GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
            GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, indices, GL.DYNAMIC_DRAW);
            this.vertexBuffer = GL.createBuffer();
            GL.bindBuffer(GL.ARRAY_BUFFER, this.vertexBuffer);
            GL.bufferData(GL.ARRAY_BUFFER, vertices, GL.DYNAMIC_DRAW);
            spriteSheet.bind();
            GL.drawElements(GL.TRIANGLES, 6 * layerSprites.length, GL.UNSIGNED_SHORT, 0);
            spriteSheet.unbind();
        }
    }
    exports.LayerComponent = LayerComponent;
});
define("components/textSpriteComponent", ["require", "exports", "scene", "components/component"], function (require, exports, scene_7, component_16) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // # Classe *TextSpriteComponent*
    var TextAlign;
    (function (TextAlign) {
        TextAlign["Left"] = "left";
        TextAlign["Right"] = "right";
    })(TextAlign || (TextAlign = {}));
    class TextSpriteComponent extends component_16.Component {
        constructor() {
            super(...arguments);
            this.sprites = [];
            this._text = [];
        }
        // ## Méthode *create*
        // Cette méthode est appelée pour configurer le composant avant
        // que tous les composants d'un objet aient été créés.
        create(descr) {
            this.align = descr.align;
        }
        // ## Méthode *setup*
        // Cette méthode conserve la feuille de sprite comportant
        // les glyphes du texte, et met le texte à jour.
        setup(descr) {
            this.spriteSheet = component_16.Component.findComponent(descr.spriteSheet);
            return this.updateTextSprites();
        }
        // ## Propriété *text*
        // Cette propriété met à jour le texte affiché. On force tout
        // d'abord le paramètre à un type de chaîne de caractères,
        // et on ne met à jour que si le texte a changé.
        set text(text) {
            this.array = String(text).split("");
        }
        // ## Propriété *array*
        // Cette propriété met à jour le texte affiché, à partir d'un
        // tableau d'identifiants de sprites.
        set array(array) {
            let changed = array.length !== this._text.length;
            if (!changed) {
                for (let i = 0; i < array.length; ++i) {
                    if (array[i] !== this._text[i]) {
                        changed = true;
                    }
                }
            }
            if (!changed) {
                return;
            }
            this._text = array;
            this.updateTextSprites();
        }
        // ## Méthode *updateTextSprites*
        // On crée de nouvelles sprites pour chaque caractère de la
        // chaîne, on les positionne correctement, et on détruit les
        // anciens sprites.
        updateTextSprites() {
            const oldSprites = this.sprites;
            this.sprites = [];
            let offset = 0;
            const dir = (this.align === TextAlign.Left) ? 1 : -1;
            let text = this._text.slice();
            if (this.align === TextAlign.Right) {
                text = text.reverse();
            }
            text.forEach((c, index) => {
                if (!this.spriteSheet.sprites[c]) {
                    return;
                }
                const x = offset;
                offset += this.spriteSheet.sprites[c].sourceSize.w * dir;
                const template = {
                    components: {
                        Position: {
                            x,
                        },
                        Sprite: {
                            isAnimated: false,
                            spriteName: c,
                            spriteSheet: this.spriteSheet,
                        },
                    },
                };
                const newSpriteObj = scene_7.Scene.current.createChild(template, `${this._text}_${index}`, this.owner);
                this.sprites.push(newSpriteObj);
            });
            for (const s of oldSprites) {
                s.parent.removeChild(s);
            }
        }
    }
    exports.TextSpriteComponent = TextSpriteComponent;
});
define("components/lifeComponent", ["require", "exports", "eventTrigger", "components/component"], function (require, exports, eventTrigger_3, component_17) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class LifeComponent extends component_17.Component {
        constructor() {
            super(...arguments);
            this.deadEvent = new eventTrigger_3.EventTrigger();
            this.hurtEvent = new eventTrigger_3.EventTrigger();
        }
        // ## Méthode *create*
        // Cette méthode est appelée pour configurer le composant avant
        // que tous les composants d'un objet aient été créés.
        create(descr) {
            this.max = descr.max;
            this.sprites = descr.sprites;
        }
        // ## Méthode *setup*
        // Cette méthode conserve le composant de texte qui affiche
        // la vie, et initialise sa valeur.
        setup(descr) {
            this.lifeSprite = component_17.Component.findComponent(descr.lifeSprite);
            this.value = descr.default;
        }
        // ## Propriété *value*
        // Cette méthode met à jour la vie et l'affichage de
        // cette dernière.
        get value() {
            return this._value;
        }
        set value(newVal) {
            if (newVal < 0) {
                newVal = 0;
            }
            if (newVal > this.max) {
                newVal = this.max;
            }
            if (newVal === 0) {
                this.deadEvent.trigger();
            }
            else if (newVal < this.value) {
                this.hurtEvent.trigger();
            }
            this._value = newVal;
            const hearts = [];
            for (let i = 0; i < this.max; ++i) {
                let sIndex = 0;
                if (i < this.value) {
                    sIndex = 1;
                }
                if (i + 1 <= this.value) {
                    sIndex = 2;
                }
                hearts.push(this.sprites[sIndex]);
            }
            this.lifeSprite.array = hearts;
        }
    }
    exports.LifeComponent = LifeComponent;
});
define("components/rupeeComponent", ["require", "exports", "components/component"], function (require, exports, component_18) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class RupeeComponent extends component_18.Component {
        // ## Propriété *value*
        // Cette propriété retourne la valeur numérique correspondant
        // au rubis.
        get value() {
            return this.values[this.type];
        }
        // ## Méthode *create*
        // Cette méthode est appelée pour configurer le composant avant
        // que tous les composants d'un objet aient été créés.
        create(descr) {
            this.values = descr.values;
            this.lifetime = descr.lifetime;
        }
        // ## Méthode *setup*
        // Cette méthode choisit une valeur aléatoire pour le rubis, et
        // détermine la sprite correspondante.
        setup() {
            const types = Object.keys(this.values);
            const count = types.length;
            this.type = types[Math.floor(Math.random() * count)];
            const sprite = this.owner.getComponent("Sprite");
            sprite.spriteName = this.type;
            this.start = (new Date()).getTime();
        }
        // ## Méthode *update*
        // La méthode *update* de chaque composant est appelée une fois
        // par itération de la boucle de jeu.
        update(timing) {
            const elapsed = timing.now.getTime() - this.start;
            if (elapsed > this.lifetime) {
                this.owner.active = false;
                this.owner.parent.removeChild(this.owner);
            }
        }
    }
    exports.RupeeComponent = RupeeComponent;
});
define("components/scoreComponent", ["require", "exports", "eventTrigger", "components/component"], function (require, exports, eventTrigger_4, component_19) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ScoreComponent extends component_19.Component {
        constructor() {
            super(...arguments);
            this.scoreChangedEvent = new eventTrigger_4.EventTrigger();
        }
        // ## Méthode *setup*
        // Cette méthode conserve le composant de texte qui affiche
        // le pointage, et initialise sa valeur.
        setup(descr) {
            this.scoreSprite = component_19.Component.findComponent(descr.scoreSprite);
            this.value = 0;
        }
        // ## Propriété *value*
        // Cette méthode met à jour le pointage et l'affichage de
        // ce dernier.
        get value() {
            return this._value;
        }
        set value(newVal) {
            this._value = newVal;
            this.scoreChangedEvent.trigger(this.value);
            this.scoreSprite.text = this.value.toString();
        }
    }
    exports.ScoreComponent = ScoreComponent;
});
define("components/playerComponent", ["require", "exports", "gl-matrix", "eventTrigger", "components/component"], function (require, exports, gl_matrix_5, eventTrigger_5, component_20) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Facing;
    (function (Facing) {
        Facing["Back"] = "B";
        Facing["Front"] = "F";
        Facing["Left"] = "L";
        Facing["Right"] = "R";
    })(Facing || (Facing = {}));
    class PlayerComponent extends component_20.Component {
        constructor() {
            super(...arguments);
            this.deadEvent = new eventTrigger_5.EventTrigger();
            this.isDead = false;
            this.facing = Facing.Front;
            this.isAttacking = false;
            this.isMoving = false;
            this.isHurt = false;
            this.isInvulnerable = false;
        }
        // ## Méthode *create*
        // Cette méthode est appelée pour configurer le composant avant
        // que tous les composants d'un objet aient été créés.
        create(descr) {
            this.name = descr.name;
            this.prefix = descr.prefix;
            this.gameArea = descr.gameArea;
            this.invulnerableDuration = descr.invulnerableDuration;
            this.hurtDuration = descr.hurtDuration;
            this.hurtMotion = descr.hurtMotion;
        }
        // ## Méthode *setup*
        // Cette méthode configure le composant. Elle crée une instance
        // de sprite, et y configure une fonction de rappel lorsque
        // l'animation d'attaque est terminée.
        setup(descr) {
            this.input = component_20.Component.findComponent(descr.input);
            this.score = component_20.Component.findComponent(descr.score);
            this.life = component_20.Component.findComponent(descr.life);
            this.life.deadEvent.add(this, this.onDead);
            this.life.hurtEvent.add(this, this.onHurt);
            for (const item of descr.onHurtEnable) {
                const component = component_20.Component.findComponent(item);
                this.life.hurtEvent.add(this, () => {
                    component.enabled = true;
                });
            }
            this.sprite = this.owner.getComponent("Sprite");
            this.sprite.animationEndedEvent.push(() => {
                this.isAttacking = false;
                this.sprite.frameSkip = 2;
                this.updateSprite();
                this.sprite.updateMesh();
            });
            this.updateSprite();
        }
        // ## Méthode *update*
        // Cette méthode récupère les entrées du joueur, effectue les
        // déplacements appropriés, déclenche l'état d'attaque et ajuste
        // la sprite du joueur.
        update(timing) {
            let delta;
            if (this.isDead) {
                delta = this.updateDead();
            }
            else if (this.isHurt) {
                delta = this.updateHurt();
            }
            else {
                delta = this.updateStandard();
            }
            const visible = (!this.isInvulnerable) || (timing.frame % 2 !== 0);
            this.sprite.enabled = visible;
            const position = this.owner.getComponent("Position");
            gl_matrix_5.vec3.scale(delta, delta, timing.dT * 60);
            position.translate(delta);
            position.clamp(this.gameArea.x, this.gameArea.x + this.gameArea.w, this.gameArea.y, this.gameArea.y + this.gameArea.h);
        }
        // ## Méthode *onCollision*
        // Cette méthode est appelée par le *CollisionComponent*
        // lorsqu'il y a collision entre le joueur et un objet pertinent.
        // Si cet objet est un rubis, on le récupère et on incrémente
        // le score, si c'est un poulet, on le détruit si on est en
        // état d'attaque, sinon on soustrait le score et on désactive
        // ce poulet.
        onCollision(otherCollider) {
            const obj = otherCollider.owner;
            const rupee = obj.getComponent("Rupee");
            const heart = obj.getComponent("Heart");
            const chicken = obj.getComponent("Chicken");
            if (rupee) {
                this.score.value += rupee.value;
                obj.active = false;
                obj.parent.removeChild(obj);
            }
            if (heart) {
                this.life.value += heart.heal;
                obj.active = false;
                obj.parent.removeChild(obj);
            }
            if (chicken) {
                if (this.isAttacking) {
                    chicken.onAttack();
                }
                else {
                    this.life.value -= chicken.attack;
                }
            }
        }
        // ## Méthode *onDead*
        // Déclenchée lorsque le joueur est mort
        onDead() {
            this.isDead = true;
            this.deadEvent.trigger();
        }
        // ## Méthode *onHurt*
        // Déclenchée lorsque le joueur est blessé
        onHurt() {
            const collider = this.owner.getComponent("Collider");
            this.isHurt = true;
            setTimeout(() => {
                this.isHurt = false;
            }, this.hurtDuration);
            this.isInvulnerable = true;
            collider.enabled = false;
            setTimeout(() => {
                this.isInvulnerable = false;
                collider.enabled = true;
            }, this.invulnerableDuration);
        }
        // ## Méthode *updateDead*
        // Met à jour le joueur quand il est mort
        updateDead() {
            this.isMoving = false;
            this.isAttacking = false;
            this.sprite.isAnimated = false;
            this.sprite.spriteName = `${this.prefix}D`;
            this.sprite.updateMesh();
            const collider = this.owner.getComponent("Collider");
            collider.enabled = false;
            return gl_matrix_5.vec3.create();
        }
        // ## Méthode *updateHurt*
        // Met à jour le joueur quand il est blessé
        updateHurt() {
            this.isMoving = false;
            this.isAttacking = false;
            this.sprite.isAnimated = false;
            this.sprite.spriteName = `${this.prefix}H${this.facing}`;
            this.sprite.updateMesh();
            const delta = gl_matrix_5.vec3.create();
            switch (this.facing) {
                case Facing.Back:
                    delta[1] = this.hurtMotion;
                    break;
                case Facing.Front:
                    delta[1] = -this.hurtMotion;
                    break;
                case Facing.Left:
                    delta[0] = this.hurtMotion;
                    break;
                case Facing.Right:
                    delta[0] = -this.hurtMotion;
                    break;
            }
            return delta;
        }
        // ## Méthode *updateStandard*
        // Met à jour le mouvement normal du joueur
        updateStandard() {
            if (!this.isAttacking && this.input.getKey("attack")) {
                this.isAttacking = true;
                this.sprite.animationFrame = 1;
                this.sprite.frameSkip = 1;
            }
            const delta = gl_matrix_5.vec3.create();
            if (this.input.getKey("up")) {
                delta[1]--;
                this.facing = Facing.Back;
            }
            if (this.input.getKey("down")) {
                delta[1]++;
                this.facing = Facing.Front;
            }
            if (this.input.getKey("left")) {
                delta[0]--;
                this.facing = Facing.Left;
            }
            if (this.input.getKey("right")) {
                delta[0]++;
                this.facing = Facing.Right;
            }
            this.isMoving = gl_matrix_5.vec3.length(delta) > 0;
            this.updateSprite();
            this.sprite.updateMesh();
            return delta;
        }
        // ## Méthode *updateSprite*
        // Choisi la sprite appropriée selon le contexte.
        updateSprite() {
            this.sprite.isAnimated = this.isMoving || this.isAttacking;
            const mod = this.isAttacking ? "A" : "M";
            const frame = this.sprite.isAnimated ? "" : "1";
            this.sprite.spriteName = `${this.prefix}${mod}${this.facing}${frame}`;
        }
    }
    exports.PlayerComponent = PlayerComponent;
});
define("components/rawSpriteComponent", ["require", "exports", "graphicsAPI", "components/textureComponent"], function (require, exports, GraphicsAPI, textureComponent_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let GL;
    class RawSpriteComponent extends textureComponent_4.TextureComponent {
        // ## Méthode *create*
        create(descr) {
            GL = GraphicsAPI.context;
            // On charge l'image et les shaders
            super.create(descr);
            // On crée ici un tableau de 4 vertices permettant de représenter
            // le rectangle à afficher.
            this.vertexBuffer = GL.createBuffer();
            GL.bindBuffer(GL.ARRAY_BUFFER, this.vertexBuffer);
            this.vertices = new Float32Array(4 * textureComponent_4.TextureComponent.vertexSize);
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
            this.indexBuffer = GL.createBuffer();
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
        display() {
            GL.bindBuffer(GL.ARRAY_BUFFER, this.vertexBuffer);
            GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
            this.bind();
            GL.drawElements(GL.TRIANGLES, 6, GL.UNSIGNED_SHORT, 0);
            this.unbind();
        }
        // ## Méthode *updateComponents*
        // Cette méthode met à jour le contenu de chaque vertex.
        updateComponents(descr) {
            let ref;
            const position = this.owner.getComponent("Position").worldPosition;
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
    exports.RawSpriteComponent = RawSpriteComponent;
});
define("components/refereeComponent", ["require", "exports", "eventTrigger", "components/component"], function (require, exports, eventTrigger_6, component_21) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class RefereeComponent extends component_21.Component {
        constructor() {
            super(...arguments);
            this.winEvent = new eventTrigger_6.EventTrigger();
            this.players = [];
        }
        // ## Méthode *create*
        // Cette méthode est appelée pour configurer le composant avant
        // que tous les composants d'un objet aient été créés.
        create() {
            this.winEvent.add(this, this.showWinMessage);
        }
        // ## Méthode *setup*
        // Cette méthode configure le composant.
        setup(descr) {
            for (const p of descr.players) {
                const player = component_21.Component.findComponent(p);
                this.players.push(player);
                player.deadEvent.add(this, this.onDead, undefined, player);
            }
        }
        // ## Méthode *onDead*
        // Cette méthode est déclenchée quand un joueur meurt
        onDead( /*player*/) {
            let bestScore = -1;
            let bestPlayer = null;
            let worstScore = Number.MAX_VALUE;
            let worstPlayer = null;
            let gameOver = true;
            for (const p of this.players) {
                if (!gameOver) {
                    continue;
                }
                if (!p.isDead) {
                    gameOver = false;
                    continue;
                }
                if (p.score.value > bestScore) {
                    bestScore = p.score.value;
                    bestPlayer = p;
                }
                if (p.score.value < worstScore) {
                    worstScore = p.score.value;
                    worstPlayer = p;
                }
            }
            if (gameOver) {
                this.winEvent.trigger(bestPlayer, worstPlayer);
            }
        }
        // ## Méthode *showWinMessage*
        // Affiche un popup mentionnant le gagnant
        showWinMessage(winner, loser) {
            alert(`${winner.name} a gagné contre ${loser.name}`);
        }
    }
    exports.RefereeComponent = RefereeComponent;
});
define("components/renderCompositorComponent", ["require", "exports", "graphicsAPI", "components/compositorComponent"], function (require, exports, GraphicsAPI, compositorComponent_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let GL;
    // # Classe *RenderCompositorComponent*
    // Ce compositeur affiche la texture à l'écran. Il devrait être le dernier
    // de la liste.
    class RenderCompositorComponent extends compositorComponent_2.CompositorComponent {
        // ## Méthode *setup*
        // Charge les shaders et configure le composant
        setup(descr) {
            GL = GraphicsAPI.context;
            super.setup(descr);
            this.positionAttrib = GL.getAttribLocation(this.shader, "aPosition");
            this.uSampler = GL.getUniformLocation(this.shader, "uSampler");
            const verts = [1, 1, -1, 1, -1, -1, -1, -1, 1, -1, 1, 1];
            this.screenQuad = GL.createBuffer();
            GL.bindBuffer(GL.ARRAY_BUFFER, this.screenQuad);
            GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(verts), GL.STATIC_DRAW);
            this.itemSize = 2;
            this.numItems = 6;
        }
        // ## Méthode *compose*
        // Cette méthode est appelée afin d'effectuer le rendu final.
        compose(texture) {
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
    exports.RenderCompositorComponent = RenderCompositorComponent;
});
define("components/timerComponent", ["require", "exports", "components/component"], function (require, exports, component_22) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // ## Méthode *format*
    // Cette méthode prend un interval et le converti en une chaîne
    // lisible.
    function format(total_ms) {
        const total_s = Math.floor(total_ms / 1000);
        const minutes = Math.floor(total_s / 60);
        const seconds = total_s - (minutes * 60);
        let secText = seconds.toString();
        if (seconds < 10) {
            secText = "0" + secText;
        }
        return `${minutes}:${secText}`;
    }
    // # Classe *TimerComponent*
    // Ce composant affiche le temps écoulé depuis son lancement.
    class TimerComponent extends component_22.Component {
        // ## Méthode *setup*
        // Cette méthode conserve le composant de texte qui affiche
        // le pointage, et initialise sa valeur.
        setup() {
            this.textSprite = this.owner.getComponent("TextSprite");
            this.start = (new Date()).getTime();
        }
        // ## Méthode *onEnabled*
        // La méthode *onEnabled* est appelée quand l'objet passe de l'état
        // activé à désactivé.
        onEnabled() {
            const now = (new Date()).getTime();
            const paused = now - this.beginPause;
            this.start += paused;
        }
        // ## Méthode *onDisabled*
        // La méthode *onDisabled* est appelée quand l'objet passe de l'état
        // désactivé à activé.
        onDisabled() {
            this.beginPause = (new Date()).getTime();
        }
        // ## Méthode *update*
        // La méthode *update* de chaque composant est appelée une fois
        // par itération de la boucle de jeu.
        update(timing) {
            const elapsed = timing.now.getTime() - this.start;
            const array = format(elapsed).split("");
            for (let i = 0; i < array.length; ++i) {
                if (array[i] === ":") {
                    array[i] = "colon";
                }
            }
            this.textSprite.array = array;
        }
    }
    exports.TimerComponent = TimerComponent;
});
define("components", ["require", "exports", "components/backgroundLoaderComponent", "components/cameraComponent", "components/chickenComponent", "components/chickenSpawnerComponent", "components/colliderComponent", "components/countdownComponent", "components/debugDrawCallsComponent", "components/deformationCompositorComponent", "components/enablerComponent", "components/heartComponent", "components/inputComponent", "components/layerComponent", "components/lifeComponent", "components/playerComponent", "components/positionComponent", "components/rawSpriteComponent", "components/refereeComponent", "components/renderCompositorComponent", "components/rupeeComponent", "components/scoreComponent", "components/spriteComponent", "components/spriteSheetComponent", "components/textSpriteComponent", "components/timerComponent"], function (require, exports, backgroundLoaderComponent_1, cameraComponent_2, chickenComponent_1, chickenSpawnerComponent_1, colliderComponent_1, countdownComponent_1, debugDrawCallsComponent_1, deformationCompositorComponent_1, enablerComponent_1, heartComponent_1, inputComponent_1, layerComponent_1, lifeComponent_1, playerComponent_1, positionComponent_1, rawSpriteComponent_1, refereeComponent_1, renderCompositorComponent_1, rupeeComponent_1, scoreComponent_1, spriteComponent_2, spriteSheetComponent_1, textSpriteComponent_1, timerComponent_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ComponentFactory {
        // ## Fonction statique *create*
        // Cette fonction instancie un nouveau composant choisi dans
        // le tableau `componentCreators` depuis son nom.
        static create(type, owner) {
            if (!ComponentFactory.componentCreators[type]) {
                console.error(type);
            }
            const comp = new ComponentFactory.componentCreators[type](owner);
            comp.__type = type;
            return comp;
        }
    }
    exports.ComponentFactory = ComponentFactory;
    // ## Attribut statique *componentCreators*
    // Ce tableau associatif fait le lien entre les noms des composants
    // tels qu'utilisés dans le fichier JSON et les classes de
    // composants correspondants.
    ComponentFactory.componentCreators = {
        BackgroundLoader: backgroundLoaderComponent_1.BackgroundLoaderComponent,
        Camera: cameraComponent_2.CameraComponent,
        Chicken: chickenComponent_1.ChickenComponent,
        ChickenSpawner: chickenSpawnerComponent_1.ChickenSpawnerComponent,
        Collider: colliderComponent_1.ColliderComponent,
        Countdown: countdownComponent_1.CountdownComponent,
        DebugDrawCalls: debugDrawCallsComponent_1.DebugDrawCallsComponent,
        DeformationCompositor: deformationCompositorComponent_1.DeformationCompositorComponent,
        Enabler: enablerComponent_1.EnablerComponent,
        Heart: heartComponent_1.HeartComponent,
        Input: inputComponent_1.InputComponent,
        Layer: layerComponent_1.LayerComponent,
        Life: lifeComponent_1.LifeComponent,
        Player: playerComponent_1.PlayerComponent,
        Position: positionComponent_1.PositionComponent,
        RawSprite: rawSpriteComponent_1.RawSpriteComponent,
        Referee: refereeComponent_1.RefereeComponent,
        RenderCompositor: renderCompositorComponent_1.RenderCompositorComponent,
        Rupee: rupeeComponent_1.RupeeComponent,
        Score: scoreComponent_1.ScoreComponent,
        Sprite: spriteComponent_2.SpriteComponent,
        SpriteSheet: spriteSheetComponent_1.SpriteSheetComponent,
        TextSprite: textSpriteComponent_1.TextSpriteComponent,
        Timer: timerComponent_1.TimerComponent,
    };
});
define("entity", ["require", "exports", "components"], function (require, exports, components_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // # Classe *Entity*
    // La classe *Entity* représente un objet de la scène qui
    // peut contenir des enfants et des composants.
    class Entity {
        constructor() {
            // ## Membre *active*
            // Si ce membre a une valeur fausse, les systèmes devraient
            // ignorer les composants de cet objet et ses enfants.
            this.active = true;
            this.parent = null;
            this._components = new Map();
            this.nextChildOrder = 0;
            this._children = new Set();
            this.childrenByName = new Map();
            this.childrenByChild = new Map();
        }
        get components() {
            return this._components.values();
        }
        // ## Méthode *addComponent*
        // Cette méthode prend en paramètre le type d'un composant et
        // instancie un nouveau composant.
        addComponent(type, descr, deferred = false) {
            const newComponent = Entity.componentCreator(type, this);
            this._components.set(type, newComponent);
            newComponent.create(descr);
            if (!deferred) {
                newComponent.setup(descr);
            }
            return newComponent;
        }
        // ## Fonction *getComponent*
        // Cette fonction retourne un composant existant du type spécifié
        // associé à l'objet.
        getComponent(type) {
            return this._components.get(type);
        }
        // ## Méthode *addChild*
        // La méthode *addChild* ajoute à l'objet courant un objet
        // enfant.
        addChild(objectName, child) {
            if (child.parent) {
                throw new Error("Cet objet est déjà attaché à un parent");
            }
            const childEntry = {
                child,
                name: objectName,
                order: this.nextChildOrder++,
            };
            this._children.add(childEntry);
            this.childrenByName.set(objectName, childEntry);
            this.childrenByChild.set(child, childEntry);
            child.parent = this;
        }
        // ## Méthode *removeChild*
        // La méthode *removeChild* enlève un enfant de l'objet courant
        removeChild(child) {
            if (child.parent !== this) {
                throw new Error("Cet object n'est pas attaché à ce parent");
            }
            const childEntry = this.childrenByChild.get(child);
            this.childrenByChild.delete(child);
            if (this.childrenByName.get(childEntry.name) === childEntry) {
                this.childrenByName.delete(childEntry.name);
            }
            this._children.delete(childEntry);
            child.parent = null;
        }
        // ## Fonction *getChild*
        // La fonction *getChild* retourne un objet existant portant le
        // nom spécifié, dont l'objet courant est le parent.
        getChild(objectName) {
            const childEntry = this.childrenByName.get(objectName);
            if (childEntry) {
                return childEntry.child;
            }
        }
        get children() {
            return this.sortedChildren();
        }
        *sortedChildren() {
            const sortedChildren = Array.from(this._children).sort((a, b) => a.order - b.order);
            for (const v of sortedChildren) {
                yield v.child;
            }
        }
    }
    exports.Entity = Entity;
    // ## Fonction *componentCreator*
    // Référence vers la fonction permettant de créer de
    // nouveaux composants. Permet ainsi de substituer
    // cette fonction afin de réaliser des tests unitaires.
    Entity.componentCreator = components_1.ComponentFactory.create;
});
define("components/component", ["require", "exports", "scene"], function (require, exports, scene_8) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // ## Classe *Component*
    // Cette classe est une classe de base pour l'ensemble des
    // composants et implémente les méthodes par défaut.
    class Component {
        // ### Constructeur de la classe *Composant*
        // Le constructeur de cette classe prend en paramètre l'objet
        // propriétaire du composant, et l'assigne au membre `owner`.
        constructor(owner) {
            this.owner = owner;
            this._enabled = true;
        }
        // ## Accesseur *enabled*
        // L'accesseur *enabled* active ou désactive le composant, et appelle
        // une méthode en réponse si l'état a changé.
        get enabled() {
            return this._enabled;
        }
        set enabled(val) {
            if (this.enabled === val) {
                return;
            }
            this._enabled = val;
            if (this.enabled) {
                this.onEnabled();
            }
            else {
                this.onDisabled();
            }
        }
        static findComponent(name) {
            if (typeof (name) !== "string") {
                return name;
            }
            const tokens = name.split(".");
            const targetName = tokens[0];
            const compName = tokens[1];
            const target = scene_8.Scene.current.findObject(targetName);
            return target && target.getComponent(compName);
        }
        // ### Méthode *create*
        // Cette méthode est appelée pour configurer le composant avant
        // que tous les composants d'un objet aient été créés.
        create(desc) {
            // Rien
        }
        // ### Méthode *setup*
        // Cette méthode est appelée pour configurer le composant après
        // que tous les composants d'un objet aient été créés.
        setup(descr) {
            // Rien
        }
        enable(val) {
            this.enabled = val;
        }
        // ## Méthode *onEnabled*
        // La méthode *onEnabled* est appelée quand l'objet passe de l'état
        // activé à désactivé.
        onEnabled() {
            // Rien
        }
        // ## Méthode *onDisabled*
        // La méthode *onDisabled* est appelée quand l'objet passe de l'état
        // désactivé à activé.
        onDisabled() {
            // Rien
        }
    }
    exports.Component = Component;
});
define("scene", ["require", "exports", "entity"], function (require, exports, entity_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // # Classe *Scene*
    // La classe *Scene* représente la hiérarchie d'objets contenus
    // simultanément dans la logique du jeu.
    class Scene {
        constructor() {
            this.root = new entity_1.Entity();
        }
        // ## Fonction statique *create*
        // La fonction *create* permet de créer une nouvelle instance
        // de la classe *Scene*, contenant tous les objets instanciés
        // et configurés. Le paramètre `description` comprend la
        // description de la hiérarchie et ses paramètres.
        static create(description) {
            const scene = new Scene();
            Scene.current = scene;
            const toSetup = new Map();
            scene.createChildren(description, scene.root, toSetup);
            scene.setupChildren(toSetup);
            return scene;
        }
        createChild(descr, name, parent) {
            const toSetup = new Map();
            const newChild = this.createChildInternal(descr, name, parent, toSetup);
            this.setupChildren(toSetup);
            return newChild;
        }
        // ## Fonction *findObject*
        // La fonction *findObject* retourne l'objet de la scène
        // portant le nom spécifié.
        findObject(objectName) {
            return this.findObjectRecursive(this.root, objectName);
        }
        // ## Méthode *entities*
        // Cette méthode parcourt l'ensemble des entités de la scène
        entities(onlyActive = true) {
            return this.entitiesRecursive(this.root, onlyActive);
        }
        createChildInternal(descr, name, parent, toSetup) {
            const newObj = new entity_1.Entity();
            parent.addChild(name, newObj);
            this.createChildren(descr.children || {}, newObj, toSetup);
            for (const type in descr.components) {
                if (!descr.components.hasOwnProperty(type)) {
                    continue;
                }
                const compDescr = descr.components[type];
                const newComp = newObj.addComponent(type, compDescr, true);
                toSetup.set(newComp, compDescr);
            }
            return newObj;
        }
        createChildren(description, parent, toSetup) {
            for (const name in description) {
                if (!description.hasOwnProperty(name)) {
                    continue;
                }
                const descr = description[name];
                this.createChildInternal(descr, name, parent, toSetup);
            }
        }
        setupChildren(pending) {
            for (const [comp, desc] of pending) {
                comp.setup(desc);
            }
        }
        findObjectRecursive(parent, objectName) {
            let found = parent.getChild(objectName);
            if (found) {
                return found;
            }
            for (const obj of parent.children) {
                if (!found) {
                    found = this.findObjectRecursive(obj, objectName);
                }
            }
            return found;
        }
        *entitiesRecursive(entity, onlyActive) {
            if (onlyActive && !entity.active) {
                return;
            }
            for (const child of entity.children) {
                yield child;
                yield* this.entitiesRecursive(child, onlyActive);
            }
        }
    }
    exports.Scene = Scene;
});
define("systems/physicSystem", ["require", "exports", "components/colliderComponent", "scene"], function (require, exports, colliderComponent_2, scene_9) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // # Classe *PhysicSystem*
    // Représente le système permettant de détecter les collisions
    class PhysicSystem {
        // Méthode *iterate*
        // Appelée à chaque tour de la boucle de jeu
        iterate(dT) {
            const colliders = [];
            for (const e of scene_9.Scene.current.entities()) {
                for (const comp of e.components) {
                    if (comp instanceof colliderComponent_2.ColliderComponent && comp.enabled) {
                        colliders.push(comp);
                    }
                }
            }
            const collisions = [];
            for (let i = 0; i < colliders.length; i++) {
                const c1 = colliders[i];
                if (!c1.enabled || !c1.owner.active) {
                    continue;
                }
                for (let j = i + 1; j < colliders.length; j++) {
                    const c2 = colliders[j];
                    if (!c2.enabled || !c2.owner.active) {
                        continue;
                    }
                    if (c1.area.intersectsWith(c2.area)) {
                        collisions.push([c1, c2]);
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
        }
    }
    exports.PhysicSystem = PhysicSystem;
});
// # Fonctions utilitaires
// Fonctions utilitaires pour des méthodes génériques qui n'ont
// pas de lien direct avec le jeu.
define("utils", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // ## Fonction *inRange*
    // Méthode utilitaire retournant le booléen *vrai* si une
    // valeur se situe dans un interval.
    function inRange(x, min, max) {
        return (min <= x) && (x <= max);
    }
    exports.inRange = inRange;
    // ## Fonction *clamp*
    // Méthode retournant la valeur passée en paramètre si elle
    // se situe dans l'interval spécifié, ou l'extrémum correspondant
    // si elle est hors de l'interval.
    function clamp(x, min, max) {
        return Math.min(Math.max(x, min), max);
    }
    exports.clamp = clamp;
});
define("main", ["require", "exports", "resources", "scene", "systems/displaySystem", "systems/logicSystem", "systems/physicSystem", "utils"], function (require, exports, resources_6, scene_10, displaySystem_1, logicSystem_1, physicSystem_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // ## Variable *systems*
    // Représente la liste des systèmes utilisés par notre moteur
    let systems;
    // ## Méthode *run*
    // Cette méthode initialise les différents systèmes nécessaires
    // et démarre l'exécution complète du jeu.
    function run(config) {
        exports.GlobalConfig = config;
        setupSystem(config);
        return launchGame(config);
    }
    exports.run = run;
    function loadScene(file) {
        const content = resources_6.Resources.load(file);
        const sceneDescription = JSON.parse(content);
        return scene_10.Scene.create(sceneDescription);
    }
    // ## Méthode *launchGame*
    // Cette méthode initialise la scène du jeu et lance la
    // boucle de jeu.
    function launchGame(config) {
        loadScene(config.launchScene);
        let lastTime;
        function iterate(time) {
            if (lastTime === undefined) {
                lastTime = time;
            }
            // Le temps est compté en millisecondes, on désire
            // l'avoir en secondes, sans avoir de valeurs trop énorme.
            const delta = utils_1.clamp((time - lastTime) / 1000, 0, 0.1);
            // Limiter le taux de rafraîchissement à 30 FPS
            if (delta > (1.0 / 30.0)) {
                lastTime = time;
                for (const system of systems) {
                    system.iterate(delta);
                }
            }
            window.requestAnimationFrame(iterate);
        }
        window.requestAnimationFrame(iterate);
    }
    // ## Méthode *setupSystem*
    // Cette méthode initialise les différents systèmes nécessaires.
    function setupSystem(config) {
        const physic = new physicSystem_1.PhysicSystem();
        const logic = new logicSystem_1.LogicSystem();
        const display = new displaySystem_1.DisplaySystem(config.canvasId);
        systems = [physic, logic, display];
    }
});
define("chickendodge", ["require", "exports", "main", "resources"], function (require, exports, main_1, resources_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function preload() {
        return resources_7.Resources.init("data/resources.json");
    }
    exports.preload = preload;
    function init() {
        const equipe = resources_7.Resources.load("equipe.txt");
        console.log(equipe);
        if (equipe === "Coéquipiers") {
            alert("N'oubliez pas d'inscrire les membres de votre équipe dans le fichier client/data/equipe.txt!");
        }
        const config = {
            canvasId: "canvas",
            launchScene: "scenes/play.json",
        };
        return main_1.run(config);
    }
    exports.init = init;
});
//# sourceMappingURL=merged.js.map