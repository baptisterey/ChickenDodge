precision mediump float;

/* Rendu du jeu */
uniform sampler2D uSampler;

/* Texture de déformation en rouge et vert */
uniform sampler2D uDeformation;

/* Texture pour contrôler l'intensité de la déformation */
uniform sampler2D uIntensity;

/* Interval de temps multiplié par la vitesse depuis l'activation du composant */
uniform float uTime;

/* Échelle de la déformation */
uniform float uScale;

/* Coordonnées UV du fragment */
varying vec2 vTextureCoord;

void main(void) {

    vec4 intensity = texture2D(uIntensity, vec2(uTime, 0.5)) * uScale;

    vec4 deformation = texture2D(uDeformation, vTextureCoord + sin(uTime));
    deformation = ((deformation * float(2)) - float(1) ); // Permet de passer de 0:1 à -1:1
    deformation = deformation * intensity;

    gl_FragColor = texture2D(uSampler, vTextureCoord + vec2(deformation));
    gl_FragColor.gb *= 0.5;
}
