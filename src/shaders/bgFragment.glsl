uniform vec2 hover;
uniform float time;
varying vec2 vUv;


vec2 random2(vec2 st){
    st = vec2( dot(st,vec2(127.1,311.7)),
              dot(st,vec2(269.5,183.3)) );
    return -1.0 + 2.0*fract(sin(st)*43758.5453123);
}

// Gradient Noise by Inigo Quilez - iq/2013
// https://www.shadertoy.com/view/XdXGW8
float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    vec2 u = f*f*(3.0-2.0*f);

    return mix( mix( dot( random2(i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ),
                     dot( random2(i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                mix( dot( random2(i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ),
                     dot( random2(i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
}

void main() {

    vec2 newUv = vUv;
    float dist = distance(newUv, hover);

    // Parameters for the mouse trail effect
    float maxDistance = 0.; // Maximum distance from hover to apply the effect
    float strength = 1.0; // Strength of the effect

    // Calculate the effect's intensity based on the distance
    float effectIntensity = smoothstep(maxDistance, 0.0, dist);

    // Modulate the effect intensity by the strength parameter
    effectIntensity *= strength;

    // Use noise to modulate the effect intensity further
    float noiseValue = noise(newUv * time); // Use time to animate the noise
    effectIntensity *= noiseValue;

    // Example effect: Modulate the red channel based on the effect intensity
    vec3 color = vec3(0.0, effectIntensity, 0.0);

    gl_FragColor = vec4(color, 1.0);


}

