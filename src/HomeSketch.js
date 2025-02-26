import * as THREE from 'three';
import gsap from 'gsap';
import ScrollTrigger from "gsap/ScrollTrigger";
import ASScroll from '@ashthornton/asscroll'
import barba from '@barba/core';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import fragment from './shaders/fragment.glsl'
import vertex from './shaders/vertex.glsl'
import bgfragment from './shaders/bgFragment.glsl'
import bgvertex from './shaders/bgVertex.glsl'
import * as dat from 'dat.gui'
import testTexture from '../img/texture.jpg'
import imagesLoaded from 'imagesloaded';
import { getASScrollInstance } from './smoothScroll';

import { initializeAnimations, OutAnimation, initializeInsideAnimations} from './animation';


import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { each } from 'jquery';


export default class HomeSketch{

    constructor(options){
        this.isActive = true;
        // First, verify DOM elements
        this.images = [...document.querySelectorAll('.js-image')]


        this.container = options.domElement

        this.isGrown = false;


        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        // Setup scene
        this.scene = new THREE.Scene()
        
        // Adjust camera
        this.camera = new THREE.PerspectiveCamera(70, this.width/this.height, 100, 2000)
        this.camera.position.z = 600
        this.camera.fov = 2 * Math.atan((this.height / 2) / 600) * 180 / Math.PI

        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true
        })
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.container.appendChild(this.renderer.domElement)
        this.renderer.setSize(this.width, this.height)



        this.smoothScroll = getASScrollInstance();
        this.smoothScroll.on('update', () => {
            this.updateScrollNumber();
        });


        //Custom Effect Controllers
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.prevScrollPos = 0;
        this.scrollSpeed = 0;



        // Initialize
        this.materials = []
        this.imageStore = null
        this.time = 0

        // Setup
        this.addObjects()
        this.setupResize()
        this.resize()
        this.composerPass()
        this.addClickEvents()
        this.render()




    }


    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.renderer.setSize(this.width, this.height);
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
    
        this.camera.fov = 2 * Math.atan((this.height / 2) / 600) * 180 / Math.PI;
    
        this.materials.forEach(m => {
            m.uniforms.uResolution.value.x = this.width;
            m.uniforms.uResolution.value.y = this.height;
        });

        if (this.imageStore) {
            this.imageStore.forEach(i => {
                let bounds = i.img.getBoundingClientRect();
                i.mesh.scale.set(bounds.width, bounds.height, 1);
                i.top = bounds.top;
                i.left = bounds.left + this.smoothScroll.currentPos;
                i.width = bounds.width;
                i.height = bounds.height;

                i.mesh.material.uniforms.uQuadSize.value.x = bounds.width;
                i.mesh.material.uniforms.uQuadSize.value.y = bounds.height;

                i.mesh.material.uniforms.uTextureSize.value.x = bounds.width;
                i.mesh.material.uniforms.uTextureSize.value.y = bounds.height;
            });
        }

        this.setPosition()

    }

    setupResize(){
        window.addEventListener('resize',this.resize.bind(this));
    }

    addClickEvents() {
        const secondElements = document.querySelectorAll('.second');
        const firstElements = document.querySelectorAll('.first');
        const imgItems = document.querySelectorAll('.item img');
    
        // Initial state: disable .first, enable .second
        firstElements.forEach(el => el.style.pointerEvents = 'none');
        secondElements.forEach(el => el.style.pointerEvents = 'auto');
    
        secondElements.forEach(element => {
            element.addEventListener('click', () => {
                if (!this.isGrown) { // Only proceed if not already grown
                    console.log('Clicked on .second');
                    imgItems.forEach(img => img.classList.add('two'));
                    requestAnimationFrame(() => {
                        this.updateMeshesForSecond();
                    });
    
                    // Update state and UX
                    this.isGrown = true;
                    element.style.pointerEvents = 'none'; // Disable .second
                    firstElements.forEach(el => el.style.pointerEvents = 'auto'); // Enable .first
                }
            });
        });
    
        firstElements.forEach(element => {
            element.addEventListener('click', () => {
                if (this.isGrown) { // Only proceed if grown
                    console.log('Clicked on .first');
                    imgItems.forEach(img => img.classList.remove('two'));
                    requestAnimationFrame(() => {
                        this.restoreMeshesToOriginal();
                    });
    
                    // Update state and UX
                    this.isGrown = false;
                    element.style.pointerEvents = 'none'; // Disable .first
                    secondElements.forEach(el => el.style.pointerEvents = 'auto'); // Enable .second
                }
            });
        });
    }

    updateMeshesForSecond() {
        if (!this.imageStore) return;
    
        // Save current scroll percentage
        const currentPercentage = this.maxScroll > 0 ? (this.smoothScroll.currentPos / this.maxScroll) : 0;
    
        // Calculate new states with margin adjustments
        const newStates = this.imageStore.map((o, i) => {
            const bounds = o.img.getBoundingClientRect();
            const marginInPixels = window.innerWidth * 0.1; // 20vw to pixels
            const adjustedTop = (i % 2 === 0) 
                ? bounds.top - marginInPixels // Even: shift up
                : bounds.top + marginInPixels; // Odd: shift down
            return {
                width: bounds.width, // CSS-driven (32vw)
                height: bounds.height, // CSS-driven (18vw)
                left: bounds.left + this.smoothScroll.currentPos,
                top: adjustedTop
            };
        });
    
        // Calculate target maxScroll
        const lastImageNewState = newStates[newStates.length - 1];
        const targetMaxScroll = lastImageNewState.left + lastImageNewState.width - this.width;
    
        // Animate all properties with stagger, including scroll position
        const tl = gsap.timeline({
            onUpdate: () => {
                this.setPosition(); // Update positions during animation
            },
            onComplete: () => {
                this.smoothScroll.resize(); // Final sync after animation
                this.setPosition();
            }
        });
    
        this.imageStore.forEach((o, i) => {
            const marginShift = (i % 2 === 0) ? -window.innerWidth * 0.2 : window.innerWidth * 0.2;
    
            // Animate the parent <a> (link with class 'item')
            tl.to(o.img.parentElement, {
                y: marginShift, // Move <a>, <img> follows
                duration: 0.8,
                ease: 'power2.out'
            }, i * 0.1);
    
            // Animate mesh properties
            tl.to(o, {
                width: newStates[i].width,
                height: newStates[i].height,
                left: newStates[i].left,
                top: newStates[i].top,
                duration: 0.8,
                ease: 'power2.out',
                onUpdate: () => {
                    o.mesh.scale.set(o.width, o.height, 1);
                }
            }, i * 0.1);
        });
    
        // Animate maxScroll and currentPos together
        const totalDuration = 0.8 + (this.imageStore.length - 1) * 0.1;
        tl.to(this, {
            maxScroll: targetMaxScroll,
            duration: totalDuration,
            ease: 'power2.out'
        }, 0);
    
        tl.to(this.smoothScroll, {
            currentPos: currentPercentage * targetMaxScroll,
            duration: totalDuration,
            ease: 'power2.out',
            onUpdate: () => {
                this.smoothScroll.currentPos = Math.max(0, Math.min(this.smoothScroll.currentPos, this.maxScroll));
            }
        }, 0);
    }

    restoreMeshesToOriginal() {
        if (!this.imageStore) return;
    
        // Save current scroll percentage
        const currentPercentage = this.maxScroll > 0 ? (this.smoothScroll.currentPos / this.maxScroll) : 0;
    
        // Remove 'two' class from all images
        const imgItems = document.querySelectorAll('.item img');
        imgItems.forEach(img => img.classList.remove('two'));
    
        // Calculate target maxScroll based on original state
        const lastImageOriginal = this.imageStore[this.imageStore.length - 1];
        const targetMaxScroll = lastImageOriginal.originalLeft + lastImageOriginal.originalWidth - this.width;
    
        // Animate all properties back to original state with stagger, including scroll position
        const tl = gsap.timeline({
            onUpdate: () => {
                this.setPosition(); // Update positions during animation
            },
            onComplete: () => {
                this.smoothScroll.resize(); // Final sync after animation
                this.setPosition();
            }
        });
    
        this.imageStore.forEach((o, i) => {
            // Animate the parent <a> (link with class 'item')
            tl.to(o.img.parentElement, {
                y: 0, // Reset <a> position, <img> follows
                duration: 1.2,
                ease: 'expo.out'
            }, i * 0.02);
    
            // Animate mesh properties
            tl.to(o, {
                width: o.originalWidth,
                height: o.originalHeight,
                left: o.originalLeft,
                top: o.originalTop,
                duration: 1.2,
                ease: 'expo.out',
                onUpdate: () => {
                    o.mesh.scale.set(o.width, o.height, 1);
                }
            }, i * 0.02);
        });
    
        // Animate maxScroll and currentPos together
        const totalDuration = 1.2 + (this.imageStore.length - 1) * 0.02;
        tl.to(this, {
            maxScroll: targetMaxScroll,
            duration: totalDuration,
            ease: 'expo.out'
        }, 0);
    
        tl.to(this.smoothScroll, {
            currentPos: currentPercentage * targetMaxScroll,
            duration: totalDuration,
            ease: 'expo.out',
            onUpdate: () => {
                this.smoothScroll.currentPos = Math.max(0, Math.min(this.smoothScroll.currentPos, this.maxScroll));
            }
        }, 0);
    }

    addObjects() {
        this.geometry = new THREE.PlaneGeometry(1, 1, 30, 30);
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 1.0 },
                uProgress: { value: 0 },
                uImage: { value: 0 },
                hover: { value: new THREE.Vector2(0.5, 0.5) },
                hoverState: { value: 0 },
                uTexture: { value: new THREE.TextureLoader().load('https://uploads-ssl.webflow.com/64f92766515fe8ac324ab919/65b137e8f28c663ea682d28e_texture.jpg') },
                uResolution: { value: new THREE.Vector2(this.width, this.height) },
                uCorners: { value: new THREE.Vector4(0, 0, 0, 0) },
                uQuadSize: { value: new THREE.Vector2(300, 300) },
                uTextureSize: { value: new THREE.Vector2(100, 100) },
                uPositionOffset: { value: new THREE.Vector3(0, 0, 0) }
            },
            vertexShader: vertex,
            fragmentShader: fragment,
        });
    
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.scale.set(300, 300, 1);
        // this.scene.add(this.mesh);
    
        // Background Mesh
        this.backgroundGeometry = new THREE.PlaneGeometry(2, 2, 100, 100);
        this.backgroundMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 1.0 },
                hover: { value: new THREE.Vector2(0.5, 0.5) },
                hoverState: { value: 0 },
                u_resolution: { value: new THREE.Vector2(this.width, this.height) },
                smoothSpped: { value: 1.0 }
            },
            vertexShader: bgvertex,
            fragmentShader: bgfragment
        });
    
        this.bgMesh = new THREE.Mesh(this.backgroundGeometry, this.backgroundMaterial);
        this.bgMesh.scale.set(300, 300, 1);
        this.bgMesh.position.set(1, 1, -30);
        // this.scene.add(this.bgMesh);
    
        // Images Texture Meshes
        this.images = [...document.querySelectorAll('.js-image')];
    
        Promise.all(this.images.map(img => {
            return new Promise((resolve, reject) => {
                const bounds = img.getBoundingClientRect();
                let m = this.material.clone();
                this.materials.push(m);
    
                let imageObj = new Image();
                imageObj.src = img.src;
    
                imageObj.onload = () => {
                    let texture = new THREE.Texture(imageObj);
                    texture.needsUpdate = true;
                    m.uniforms.uTexture.value = texture;
    
                    // Add hover animation
                    img.addEventListener('mouseenter', () => {
                        gsap.to(m.uniforms.hoverState, {
                            duration: 0.4,
                            value: 1,
                        });
                    });
    
                    img.addEventListener('mouseout', () => {
                        gsap.to(m.uniforms.hoverState, {
                            duration: 0.4,
                            value: 0,
                        });
                    });
    
                    // Add click animation
                    img.addEventListener('click', () => {
                        const tl = gsap.timeline({
                            onComplete: () => {
                                this.clickAnimationCompleted = true;
                            }
                        });
                        tl.to(m.uniforms.uCorners.value, { x: 1, duration: 1.1, ease: 'expo.out' }, 0.1)
                          .to(m.uniforms.uCorners.value, { y: 1, duration: 1.1, ease: 'expo.out' }, 0.3)
                          .to(m.uniforms.uCorners.value, { z: 1, duration: 1.1, ease: 'expo.out' }, 0.2)
                          .to(m.uniforms.uCorners.value, { w: 1, duration: 1.1, ease: 'expo.out' }, 0.4);
                    });
    
                    let mesh = new THREE.Mesh(this.geometry, m);
                    this.scene.add(mesh);
                    mesh.scale.set(bounds.width, bounds.height, 1);
    
                    resolve({
                        img: img,
                        mesh: mesh,
                        material: m,
                        width: bounds.width,
                        height: bounds.height,
                        top: bounds.top,
                        left: bounds.left,
                        originalWidth: bounds.width,   // Save original dimensions and positions
                        originalHeight: bounds.height,
                        originalLeft: bounds.left,
                        originalTop: bounds.top
                    });
                };
    
                imageObj.onerror = reject;
            });
        })).then(imageStore => {
            this.imageStore = imageStore;
            this.setPosition(); // Set initial positions with original state
    
            // Add initial animation for each mesh
            imageStore.forEach(({ material }, index) => {
                const delay = 0.02 + index * 0.16;
                gsap.fromTo(material.uniforms.uPositionOffset.value,
                    { y: 0, x: 10, z: 0 },
                    {
                        y: 0,
                        x: 0,
                        z: 0,
                        duration: 1.8,
                        delay: delay,
                        ease: "expo.out",
                        onUpdate: () => {
                            material.uniforms.uPositionOffset.needsUpdate = true;
                        }
                    }
                );
            });
        }).catch(error => {
            console.error('Error loading images:', error);
        });
    }


updateScrollNumber() {
    const nmElement = document.querySelector('.nm');
    if (!nmElement || !this.imageStore || this.imageStore.length === 0) return;

    // Get last mesh
    const lastMesh = this.imageStore[this.imageStore.length - 1];

    // Calculate its rightmost position (assuming mesh position is in pixels)
    const lastMeshRight = lastMesh.left + lastMesh.width;

    // Total scrollable distance: either smoothScroll max or the last mesh's right position
    const totalScrollableDistance = Math.max(this.maxScroll, lastMeshRight - window.innerWidth);

    // Get the current scroll position, making sure it doesn't exceed max
    let scrollX = Math.min(this.smoothScroll.currentPos, totalScrollableDistance);

    // Calculate percentage
    let percentage = Math.round((scrollX / totalScrollableDistance) * 100);

    // Update the text
    nmElement.textContent = percentage;
}


    setPosition() {
        let lastMeshRight = 0;
    
        if (this.imageStore) {
            this.imageStore.forEach(o => {
                o.mesh.position.x = -this.smoothScroll.currentPos + o.left - this.width / 2 + o.width / 2;
                o.mesh.position.y = -o.top + this.height / 2 - o.height / 2;
    
                lastMeshRight = Math.max(lastMeshRight, o.mesh.position.x + o.width / 2);
            });
    
            this.maxScroll = lastMeshRight - this.width / 2; // Adjust for horizontal scroll
        }
    
        this.updateScrollNumber();
    }



    composerPass() {
        this.composer = new EffectComposer(this.renderer);
        this.renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(this.renderPass);
    
        this.myEffect = {
            uniforms: {
                "tDiffuse": { value: null },
                "scrollSpeed": { value: this.scrollSpeed },
                "time": { value: 0.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
uniform sampler2D tDiffuse;
varying vec2 vUv;
uniform float scrollSpeed;
uniform float time;

void main() {
    vec2 newUV = vUv;

    // Define wave effect area
    float center = 0.5;
    float width = 0.2;  // Defines how much of the screen is affected
    float smoothRange = 0.1; // Smooth transition for a softer fade

    // Softened smoothstep transition
    float area = smoothstep(center - width, center - width + smoothRange, vUv.x) * 
                 (1.0 - smoothstep(center + width - smoothRange, center + width, vUv.x));

    // Shift wave effect so the strongest distortion is in the middle
    float waveEffect = cos(time * 1.0 + (vUv.x - center) * 10.0) * 0.5 + 0.5;

    // Gradual effect reduction toward edges
    float edgeFade = smoothstep(width, 0.0, abs(vUv.x - center));  

    // Clamp effect intensity
    float absScrollSpeed = clamp(abs(scrollSpeed), 0.0, 10.0);
    float scaleEffect = 1.0 - absScrollSpeed * 0.014 * waveEffect * area * edgeFade;

    // Apply distortion
    newUV = (newUV - vec2(0.5, 0.5)) * scaleEffect + vec2(0.5, 0.5);

    gl_FragColor = texture2D(tDiffuse, newUV);
}
            `
        };
    
        this.customPass = new ShaderPass(this.myEffect);
        this.customPass.renderToScreen = true;
        this.composer.addPass(this.customPass);
    }

    render() {
        if (!this.isActive) return;
        
        this.time += 0.05;

        this.material.uniforms.time.value = this.time;
        this.backgroundMaterial.uniforms.time.value = this.time;

        this.materials.forEach(m => {
            m.uniforms.time.value = this.time;
        });

        this.scrollSpeed = this.smoothScroll.currentPos - this.prevScrollPos;
        this.prevScrollPos = this.smoothScroll.currentPos;

        if (this.customPass) {
            this.customPass.uniforms.scrollSpeed.value = this.scrollSpeed;
        }

        this.smoothScroll.update();
        this.setPosition();

        if (this.mesh) {
            this.mesh.rotation.x = this.time / 2000;
            this.mesh.rotation.y = this.time / 1000;
        }

        this.composer.render();
        
        this.rafID = requestAnimationFrame(this.render.bind(this));
    }

    destroy() {
        this.isActive = false;

        // Clear all meshes
        this.imageStore.forEach(item => {
            this.scene.remove(item.mesh);
            item.material.dispose();
            item.mesh.geometry.dispose();
        });

        // Clear arrays
        this.imageStore = [];
        this.materials = [];

        // Dispose of renderer and remove from DOM
        this.renderer.dispose();
        this.renderer.domElement.remove();

        // Clear composer and its passes
        if (this.composer) {
            this.composer.passes.forEach(pass => pass.dispose());
            this.composer = null;
        }

        // Cancel animation frame if it exists
        if (this.rafID) {
            cancelAnimationFrame(this.rafID);
        }

        // Clear scroll
        if (this.smoothScroll) {
            this.smoothScroll.disable();
        }
    }

}

// window.addEventListener('DOMContentLoaded', () => {
//     const container = document.getElementById('container');
//     if (container) {
//         new HomeSketch({
//             domElement: container
//         });
//     }
// });