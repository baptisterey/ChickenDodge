attribute vec2 aPosition;

varying vec2 vTextureCoord;

const vec2 scale = vec2(0.5, 0.5);

void main(void) {
    vTextureCoord = aPosition * scale + scale;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
