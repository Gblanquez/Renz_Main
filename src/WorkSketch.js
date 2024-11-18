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

import { initializeAnimations, OutAnimation, initializeInsideAnimations} from './animation';


import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { each } from 'jquery';


export default class WorkSketch{


    constructor(options){
        this.isActive = true;
        // First, verify DOM elements
        this.images = [...document.querySelectorAll('.projectImg')]

        this.container = options.domElement

        this.width = this.container.offsetWidth
        this.height = this.container.offsetHeight
        
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

        // Initialize ASScroll properly
        this.asscroll = new ASScroll({
            disableRaf: true,
            containerElement: document.querySelector("[asscroll-container]"),
            reset: true
        });
    
        this.asscroll.enable({
            horizontalScroll: !document.body.classList.contains('b-inside'),
            newScrollElements: document.querySelector('.scroll-wrap')
        });

        // Initialize
        this.materials = []
        this.imageStore = null
        this.time = 0

        // Setup
        this.addObjects()
        this.setupResize()
        this.resize()
        this.composerPass()
        this.render()
    }


    resize(){
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        this.renderer.setSize( this.width, this.height );
        this.camera.aspect = this.width/this.height;
        this.camera.updateProjectionMatrix();
    
        this.camera.fov = 2 * Math.atan( (this.height / 2) / 600) * 180 / Math.PI
    
        this.materials.forEach(m=>{
            m.uniforms.uResolution.value.x = this.width;
            m.uniforms.uResolution.value.y = this.height;
        })
    
        if (this.imageStore) {
            this.imageStore.forEach(i=>{
                let bounds = i.img.getBoundingClientRect();
                i.mesh.scale.set(bounds.width, bounds.height, 1);
                i.top = bounds.top;
                i.left = bounds.left + this.asscroll.currentPos;
                i.width = bounds.width;
                i.height = bounds.height;
    
                i.mesh.material.uniforms.uQuadSize.value.x = bounds.width;
                i.mesh.material.uniforms.uQuadSize.value.y = bounds.height;
    
                i.mesh.material.uniforms.uTextureSize.value.x = bounds.width;
                i.mesh.material.uniforms.uTextureSize.value.y = bounds.height;
            })
        }
    }

    setupResize(){
        window.addEventListener('resize',this.resize.bind(this));
    }

    addClickEvents(){
        this.images.forEach(img => {
            img.addEventListener('click', () => {
                console.log('clicked')
            })
        })
    }

    addObjects(){

        this.geometry = new THREE.PlaneGeometry( 1, 1, 30, 30);
        this.material = new THREE.ShaderMaterial({
            // wireframe: true,
            uniforms: {
                time: { value: 1.0 },
                uProgress: {value: 0},
                uImage: {value: 0},
                hover: {value: new THREE.Vector2( 0.5, 0.5)},
                hoverState: {value: 0},
                uTexture: {value: new THREE.TextureLoader().load('https://uploads-ssl.webflow.com/64f92766515fe8ac324ab919/65b137e8f28c663ea682d28e_texture.jpg')},
                uResolution: { value: new THREE.Vector2(this.width, this.height) },
                uCorners: {value: new THREE.Vector4(0, 0, 0, 0)},
                uQuadSize: {value: new THREE.Vector2(300, 300)},
                uTextureSize: {value: new THREE.Vector2(100, 100)},
                uPositionOffset: {value: new THREE.Vector3(0, 0, 0)}

            },

            vertexShader: vertex,
            fragmentShader: fragment,
        })




        this.mesh = new THREE.Mesh( this.geometry, this.material );
        this.mesh.scale.set(300, 300, 1)
        // this.scene.add( this.mesh );



        //Background Mesh

        this.backgroundGeometry = new THREE.PlaneGeometry(2, 2, 100, 100)
        this.backgroundMaterial = new THREE.ShaderMaterial({
            uniforms:{
                time: { value: 1.0 },
                hover: {value: new THREE.Vector2( 0.5, 0.5)},
                hoverState: {value: 0},
                u_resolution: {value: new THREE.Vector2(this.width, this.height)},
                smoothSpped: {value: 1.0}
            },
            // wireframe: true,
            vertexShader: bgvertex,
            fragmentShader: bgfragment
        })

        this.bgMesh = new THREE.Mesh(this.backgroundGeometry, this.backgroundMaterial);
        this.bgMesh.scale.set(300, 300, 1);
        this.bgMesh.position.set(1, 1, -30)
        // this.scene.add(this.bgMesh);



        //Images Texture Meshes


        this.images = [...document.querySelectorAll('.projectImg')];

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
                        
                        tl.to(m.uniforms.uCorners.value, {
                            x: 1,
                            duration: 1.1,
                            ease: 'expo.out'
                        }, 0.1)
                        .to(m.uniforms.uCorners.value, {
                            y: 1,
                            duration: 1.1,
                            ease: 'expo.out'
                        }, 0.3)
                        .to(m.uniforms.uCorners.value, {
                            z: 1,
                            duration: 1.1,
                            ease: 'expo.out'
                        }, 0.2)
                        .to(m.uniforms.uCorners.value, {
                            w: 1,
                            duration: 1.1,
                            ease: 'expo.out'
                        }, 0.4);
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
                    });
                };
    
                imageObj.onerror = reject;
            });
        })).then(imageStore => {
            this.imageStore = imageStore;

            // Add initial animation for each mesh
            imageStore.forEach(({material}, index) => {
                const delay = 0.02 + index * 0.16;
                gsap.fromTo(material.uniforms.uPositionOffset.value,
                    { y: -5, x: 0, z: 0 },
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

    setPosition() {
        if (this.imageStore) {
            this.imageStore.forEach(o => {
                o.mesh.position.x = o.left - this.width / 2 + o.width / 2;
                o.mesh.position.y = -o.top + this.height / 2 - o.height / 2 + (this.asscroll ? this.asscroll.currentPos : 0);
            })
        }
    }




    composerPass(){
        this.composer = new EffectComposer(this.renderer);
        this.renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(this.renderPass);
  
        //custom shader pass
        var counter = 0.0;
        this.myEffect = {
          uniforms: {
            "tDiffuse": { value: null },
            "scrollSpeed": { value: 0.0 }
          },
          vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix 
              * modelViewMatrix 
              * vec4( position, 1.0 );
          }
          `,
          fragmentShader: `
          uniform sampler2D tDiffuse;
          varying vec2 vUv;
          uniform float scrollSpeed;
          
          void main(){
            vec2 newUV = vUv;
            
            // Create wave effect based only on position
            float wave = sin(vUv.y * 3.14159 + vUv.x * 2.0);
            float depth = 0.3 * wave;
            
            // Clamp the scroll speed to limit the maximum effect
            float clampedSpeed = clamp(scrollSpeed, -18.0, 18.0);
            
            // Apply clamped distortion
            float distortion = (clampedSpeed * 0.05) * depth * smoothstep(0.5, 0.0, abs(vUv.y - 0.5));
            
            // Apply distortion to both x and y
            newUV.x += distortion * 0.1;
            newUV.y += distortion * 0.05;
            
            gl_FragColor = texture2D(tDiffuse, newUV);
          }
          `
        }
  
        this.customPass = new ShaderPass(this.myEffect);
        this.customPass.renderToScreen = true;
  
        this.composer.addPass(this.customPass);
      }


    render(){
        if (!this.isActive) return;
        
        this.time += 0.01;
        
        // Update material uniforms
        this.material.uniforms.time.value = this.time;
        this.backgroundMaterial.uniforms.time.value = this.time;
        
        this.materials.forEach(m=>{
            m.uniforms.time.value = this.time;
        })

        // Update scroll speed for shader effect
        this.scrollSpeed = this.asscroll.currentPos - this.prevScrollPos;
        this.prevScrollPos = this.asscroll.currentPos;

        // Update shader passes
        if (this.customPass) {
            // this.customPass.uniforms.time.value = this.time;
            this.customPass.uniforms.scrollSpeed.value = this.scrollSpeed;
        }

        if (this.asscroll) {
            this.asscroll.update();
            this.setPosition();
        }

        // Render both
        this.renderer.render(this.scene, this.camera);
        this.composer.render();
        
        this.rafID = requestAnimationFrame(this.render.bind(this));
    }

    destroy() {
        this.isActive = false;
        if (this.asscroll) {
            this.asscroll.disable();
        }
        cancelAnimationFrame(this.rafID);
    }

}

// window.addEventListener('DOMContentLoaded', () => {
//     const container = document.getElementById('container');
//     if (container) {
//         new WorkSketch({
//             domElement: container
//         });
//     }
// });
