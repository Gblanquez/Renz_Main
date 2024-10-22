uniform float time;
uniform float uProgress;
uniform float hoverState;

uniform vec2 uResolution;
uniform vec2 uQuadSize;
uniform vec4 uCorners;
uniform vec2 hover;

uniform vec3 uPositionOffset;





varying vec2 vUv;
varying vec2 vSize;



void main(){
  float PI = 3.1415926;
    vec3 newposition = position;

    vUv = uv;

    // Hover animation
    float dist = distance(uv, hover);
    float hoverEffect = hoverState * 10.0 * sin(dist * 10.0 + time) * 0.2;

    // Click animation
    float cornersProgress = mix(
        mix(uCorners.w, uCorners.z, uv.x),
        mix(uCorners.y, uCorners.x, uv.x),
        uv.y
    );
    float sine = sin(PI * cornersProgress);
    float waves = sine * 0.1 * sin(2.0 * length(uv) + 8.0 * cornersProgress);

    // Combine hover and click effects
    newposition.z += hoverEffect + waves;

    // Apply the position offset here, after all other position adjustments
    newposition += uPositionOffset;

    // Calculate the default state
    vec4 defaultState = modelMatrix * vec4(newposition, 1.0);

    // Calculate the full screen state, adjust z to bring mesh closer
    vec4 fullScreenState = vec4(newposition, 1.0);
    fullScreenState.x *= uResolution.x;
    fullScreenState.y *= uResolution.y;
    // Adjusting z based on uCorners.x to bring the mesh closer or further
    fullScreenState.z += uCorners.x;

    // Blend between the default state and the full screen state based on cornersProgress
    vec4 finalState = mix(defaultState, fullScreenState, cornersProgress);

    // Set the size based on the cornersProgress
    vSize = mix(uQuadSize, uResolution, cornersProgress);

    // Set the final position of the vertex
    gl_Position = projectionMatrix * viewMatrix * finalState;


}