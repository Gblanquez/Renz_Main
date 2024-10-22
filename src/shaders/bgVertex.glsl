varying vec2 vUv;
uniform vec2 hover;
uniform float time;

void main() {
    vUv = uv;

    vec3 newposition = position;

   float dist = distance(uv, hover);

    newposition.z += 10.0 * sin(dist * 10.0 + time);


    gl_Position = projectionMatrix * modelViewMatrix * vec4(newposition, 1.0);
}