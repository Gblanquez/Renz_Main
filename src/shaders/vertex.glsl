uniform float time;
uniform float uProgress;
uniform float hoverState;

uniform vec2 uResolution;
uniform vec2 uQuadSize;
uniform vec4 uCorners;
uniform vec2 hover;

uniform vec3 uPositionOffset;

uniform float uTransitionProgress;
uniform float uCircleRadius;
uniform vec2 uCircleCenter;
uniform float uCircleAngle;
uniform float uViewTransition;
uniform float uMeshIndex; // For sequencing waves

uniform float uArcProgress;      // Progress of the arc animation (0-1)
uniform float uArcAmplitude;     // How much the mesh should bend
uniform vec3 uArcDirection;      // Direction of the arc movement

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

    // Add arc bending effect
    if (uArcProgress > 0.0) {
        // Calculate normalized position along the mesh width
        float normalizedWidth = position.x / uQuadSize.x;
        
        // Create smooth bend profile with better end behavior
        float bendProfile = sin(normalizedWidth * PI) * uArcAmplitude;
        
        // Apply vertical bend based on horizontal position
        float verticalBend = sin(normalizedWidth * PI) * bendProfile;
        
        // Reduce wave effect at very end of transition
        float waveMultiplier = min(uArcProgress * 2.0, 1.0); // Ramp up quickly and stay at 1.0
        
        // Create wave-like motion during transition with smoother falloff
        float waveOffset = sin(normalizedWidth * PI * 2.0 + time * 2.0 + uMeshIndex * 0.5) * 
                          waveMultiplier * min(uArcAmplitude * 0.3, 20.0);
        
        // Apply bending with controlled transition at end
        newposition.y += verticalBend * uArcProgress;
        newposition.z += waveOffset;
        
        // Add slight twist based on position, reduced at end
        float twist = normalizedWidth * PI * uArcProgress * 0.15;
        mat2 rotationMatrix = mat2(
            cos(twist), -sin(twist),
            sin(twist), cos(twist)
        );
        
        // Apply twist to YZ coordinates
        vec2 twistedYZ = rotationMatrix * newposition.yz;
        newposition.y = twistedYZ.x;
        newposition.z = twistedYZ.y;
    }

    // Apply the position offset after all deformations
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

    // View transition (carousel to circle)
    if (uViewTransition > 0.0) {
        // Create smooth transition curve
        float t = uViewTransition;
        
        // Apply easing for smoother transition
        float smoothT = t * t * (3.0 - 2.0 * t); // Smoothstep easing
        
        // Calculate world position for this vertex
        vec4 worldPos = modelMatrix * vec4(newposition, 1.0);
        
        // Calculate the "center stack" position (everything at center)
        vec4 centerPos = vec4(0.0, 0.0, 0.0, 1.0);
        
        // Calculate the final circle position
        vec4 circlePos = worldPos;
        circlePos.x = cos(uCircleAngle) * uCircleRadius;
        circlePos.z = sin(uCircleAngle) * uCircleRadius;
        circlePos.y = 0.0;
        
        // Create wave effect parameters
        float delay = uMeshIndex * 0.1; // Stagger the animation based on mesh index
        float waveFreq = 3.0;
        float waveSpeed = 2.0;
        
        // Create a wave function that peaks in the middle of the transition
        float waveProgress = smoothT; 
        float waveAmplitude = 0.4 * sin(waveProgress * PI); // Peaks at 0.5
        
        // Calculate wave position
        vec4 wavePos = mix(centerPos, circlePos, smoothT);
        
        // Add waves in all dimensions
        wavePos.x += waveAmplitude * sin(waveFreq * smoothT * PI + delay);
        wavePos.y += waveAmplitude * cos(waveFreq * smoothT * PI + delay * 1.5);
        wavePos.z += waveAmplitude * sin(waveFreq * smoothT * PI + delay * 0.7 + time);
        
        // Create vertex-specific distortion
        float vertexNoise = length(vUv - 0.5);
        wavePos.x += vertexNoise * waveAmplitude * 0.2 * sin(time * 2.0 + smoothT * PI * 3.0);
        wavePos.y += vertexNoise * waveAmplitude * 0.2 * cos(time * 1.5 + smoothT * PI * 2.0);
        
        // Apply transformation to final state, mixing from original state to wave position
        finalState = mix(modelMatrix * vec4(newposition, 1.0), wavePos, smoothT);
    }

    // Set the final position of the vertex
    gl_Position = projectionMatrix * viewMatrix * finalState;
}