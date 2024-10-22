import * as THREE from 'three';
import gsap from 'gsap';
import { SplitText } from "gsap/SplitText";
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

gsap.registerPlugin(SplitText, ScrollTrigger);

const socialLinks = document.querySelectorAll('.social-link');
const navbarLinks = document.querySelectorAll('.navbarsLink');
const loadWrapper = document.querySelector('.loadWrapper'); 


function loadAnimation() {
    return new Promise((resolve, reject) => {
        let loadValue = 0;
        const loadLine = document.querySelector('.loadLine');
        const numberLoad = document.querySelector('.numberLoad');
        const percentSymbol = document.querySelector('.percentSymbol');


        // Set the initial state for links (hidden and y offset)
        gsap.set([...socialLinks, ...navbarLinks], {
            opacity: 0,
            y: '20%'
        });

        const interval = setInterval(() => {
            loadValue++;
            numberLoad.textContent = loadValue;  

            gsap.to(loadLine, {
                width: `${loadValue}%`,
                duration: 0.1,
                ease: "power2.out"
            });

            if (loadValue >= 100) {
                clearInterval(interval);

                const tl = gsap.timeline({
                    onComplete: resolve  
                });

                // Hide the loading number and symbol
                tl.to(numberLoad, {
                    x: "-30%",
                    opacity: 0,
                    duration: 1.2,
                    ease: "power2.inOut"
                }, 0);

                tl.to(percentSymbol, {
                    x: "-30%",
                    opacity: 0,
                    duration: 1.0,
                    ease: "power2.inOut"
                }, 0);  

                // Scale down the load line
                tl.to(loadLine, {
                    scaleX: 0,
                    transformOrigin: "left",
                    duration: 1.2,
                    ease: "power2.inOut"
                }, 0);
            }
        }, 50);

    }).then(() => {
        
        // Initialize Sketch
        new Sketch({
            domElement: document.getElementById('container')
        });

        const tl = gsap.timeline({
            onComplete: () => {
                // Hide the loadWrapper once all animations are complete
                loadWrapper.style.display = 'none';
            }
        });

        // Play Lottie animation
        tl.add(() => {
            const animation = lottie.loadAnimation({
                container: document.getElementById('lottie-logo'),
                renderer: 'svg',
                loop: false,
                autoplay: true,
                path: 'https://uploads-ssl.webflow.com/64f92766515fe8ac324ab919/65186a24e392f9569a5bee3f_logo1.json'
            });
        }), 0;

        // Animate social links with stagger effect
        tl.fromTo(socialLinks, 
            { opacity: 0,
                y: '120%' },  // Start hidden and offset
            { opacity: 1,
                y: '0%',
                duration: 1.4,
                ease: "expo.out",
                stagger: {
                    each: 0.05
                } }
        ),0.1;

        // Animate navbar links with stagger effect
        tl.fromTo(navbarLinks, 
            { opacity: 0,
                y: '120%' },  // Start hidden and offset
            { opacity: 1,
                y: '0%',
                duration: 1.4,
                ease: "expo.out",
                stagger: {
                    each: 0.05
                } }
        ), 0.1;
    });
}

loadAnimation();

export default class Sketch{
    constructor(options){
        this.container = options.domElement;
        this.width=this.container.offsetWidth;
        this.height=this.container.offsetHeight;

        this.camera = new THREE.PerspectiveCamera( 70, this.width/this.height, 100, 2000 );
        this.camera.position.z = 600;

        this.camera.fov = 2 * Math.atan( (this.height / 2) / 600) * 180 / Math.PI

        this.scene = new THREE.Scene();

        this.renderer = new THREE.WebGLRenderer( { 
            antialias: true,
            alpha: true
         });
        //  this.renderer.setClearColor(0xffffff, 1);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        // this.renderer.setPixelRatio(2);
        this.container.appendChild(this.renderer.domElement);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        const preloadImages = new Promise((resolve, reject) =>{
            imagesLoaded(document.querySelectorAll('img'), {background: true}, resolve);
        })


        this.materials = [];

        this.asscroll = new ASScroll({
            disableRaf: true
        });

        this.asscroll.enable({
            horizontalScroll: !document.body.classList.contains('b-inside')
        })


        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.prevScrollPos = 0;
        this.scrollSpeed = 0;

        this.clickAnimationCompleted = false;

        
        this.time = 0;
        // this.setupSettings()


        this.addObjects()
        this.setPosition()

        // this.updateMouseShaderHover()
        this.addClickEvents()
        this.resize()

        this.barba()
        
        // this.setupResize()
        // In your class or setup function
        this.clock = new THREE.Clock();


        this.composerPass()
        this.mouseMovement()

        this.render();
    }


    composerPass(){
        this.composer = new EffectComposer(this.renderer);
        this.renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(this.renderPass);

            // Add UnrealBloomPass here
    const bloomParams = {
        exposure: 0.1,
        bloomStrength: 0.5,
        bloomThreshold: 0.85,
        bloomRadius: 0.001
    };
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(this.width, this.height), bloomParams.bloomStrength, bloomParams.bloomRadius, bloomParams.bloomThreshold);
    // this.composer.addPass(bloomPass);
    
        //custom shader pass
        var counter = 0.0;
        this.myEffect = {
          uniforms: {
            "tDiffuse": { value: null },
            "scrollSpeed": { value: this.scrollSpeed },
            "time": { value: null },
          },
          vertexShader: `
          varying vec2 vUv;
          uniform float scrollSpeed;
          uniform float time;

          
          void main() {
            vUv = uv;
            
    
            // Simple Y-axis movement based on time
            float yMovement = sin(time) * 20.0; // Adjust the amplitude as needed
            vec3 newPosition = position + vec3(0.0, yMovement, 0.0);
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
          }
          `,
          fragmentShader: `
          uniform sampler2D tDiffuse;
          varying vec2 vUv;
          uniform float scrollSpeed;
          uniform float time;
    
          void main(){
            
            vec2 newUV = vUv;
            float start = 0.2; // Start of the effect area
            float end = 0.6; // End of the effect area
          
            float area = smoothstep(start, start + 0.1, vUv.x) * (1.0 - smoothstep(end - 0.1, end, vUv.x));
          
            // Use only the sine function for the effect
            float sinEffect = sin(time * 0.5 + vUv.x * 3.14) * 0.5 + 0.5;
          
            // Apply the sin effect to scale the UVs, modulated by scrollSpeed and the area
            float scaleEffect = 1.0 - scrollSpeed * 0.008 * sinEffect * area;
          
            // Apply the scale effect, now modulated by the area to ensure it only affects a part of the viewport
            newUV = (newUV - vec2(0.5, 0.5)) * scaleEffect + vec2(0.5, 0.5);
          
            gl_FragColor = texture2D(tDiffuse, newUV);
          
          }
          `
        }
    
        this.customPass = new ShaderPass(this.myEffect);
        this.customPass.renderToScreen = true;
    
        this.composer.addPass(this.customPass);

        this.mouseTrailShader = {
            uniforms: {
                tDiffuse: { value: null },
                resolution: { value: new THREE.Vector2(this.width, this.height) },
                mousePos: { value: new THREE.Vector2(0.5, 0.5) },
                time: { value: 0.5 }
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
              uniform vec2 resolution;
              uniform float time;
              uniform vec2 mousePos;
              varying vec2 vUv;
              uniform float effectSize;
              void main() {

                // Convert mouse position from NDC to UV coordinates
                vec2 mouseUV = mousePos * 0.5 + 0.5;
            
                // Calculate distance to mouse position in UV space
                float distance = length(vUv - mouseUV);
            
                // Define the strength and falloff of the trail effect
                float strength = 0.1; // How strong the effect should be
                float falloff = 0.05; // The rate at which the effect diminishes with distance
            
                // Calculate the effect based on distance
                float effect = smoothstep(falloff, 0.0, distance) * strength;
            
                // Apply a distortion effect to the UVs based on the mouse position
                vec2 distortedUV = vUv + vec2(sin(vUv.y * 2.0 + mousePos.x * 2.0) * 0.02, sin(vUv.x * 2.0 + mousePos.y * 2.0) * 0.02);
            
                // Get the current color from the scene's texture using the distorted UVs
                vec4 texColor = texture2D(tDiffuse, distortedUV);
            
                // Apply the mouse trail effect to the color based on the distance to the mouse
                texColor.rgb += effect; // This will brighten the color; you can change the operation to suit your needs
            
                gl_FragColor = texColor;
              }
              `,
          }
      
          this.mousePass = new ShaderPass(this.mouseTrailShader);
          this.mousePass.renderToScreen = false;
      
        //   this.composer.addPass(this.mousePass);
  




    }





    barba(){

        this.animationRunning = false;
        let that = this;
        barba.init({
          transitions: [{
            // sync: true,
            name: 'from-home-transition',
            from: {
                namespace: ["home"]
            },
            leave(data) {

                that.animationRunning = true;
                that.asscroll.disable();

                return gsap.timeline()

                    .to(data.current.container,{
                        opacity: 0,
                    })

                    
            },
            enter(data) {

                that.asscroll = new ASScroll({
                    disableRaf: true,
                    containerElement: data.next.container.querySelector("[asscroll-container]")
                })
                that.asscroll.enable({
                    newScrollElements: data.next.container.querySelector('.scroll-wrap')
                })

                return gsap.timeline()
                .from(data.next.container,{
                    opacity: 0,
                    onComplete: ()=>{
                        that.container.style.visibility = "hidden";
                        that.animationRunning = false;
                        if(data.next.namespace === 'about'){

                            gsap.to('.aboutWrapper', {
                                opacity: 1,
                                duration: 0.3
                            });
                            initializeAnimations();
                           
                        }

                        if (data.next.namespace === 'inside') {
                            gsap.set('.single__top-inner',{
                                opacity: 0
                            })

                            gsap.to('.single__top-inner',{
                                opacity: 1,
                                duration: 0.3
                            })
                     
                            initializeInsideAnimations(); 
                        }

                        if(data.next.namespace === 'work'){

                            // cleeaning old arrays
                       that.imageStore.forEach(m=>{
                           that.scene.remove(m.mesh)
                       })                       
                       that.imageStore = []
                       that.materials = []
                       that.addObjects();
                       that.setPosition();
                       that.resize();
                       that.addClickEvents()
                       that.container.style.visibility = "visible";
        
                       }



                    }
                })


                


                

                  
            }
          },
          {
            name: 'from-inside-page-transition',
            from: {
                namespace: ["inside"]
            },
            sync:true,
            leave(data) {
                that.asscroll.disable();
                return gsap.timeline()
                    .to(data.current.container,{
                        opacity: 0.
                    })
                    
                   
            },
            enter(data) {
                sync:true,
                that.asscroll = new ASScroll({
                    disableRaf: true,
                    containerElement: data.next.container.querySelector("[asscroll-container]")
                })
                that.asscroll.enable({
                    horizontalScroll: true,
                    newScrollElements: data.next.container.querySelector('.scroll-wrap')
                })


                if(data.next.namespace === 'home'){

                    // cleeaning old arrays
               that.imageStore.forEach(m=>{
                   that.scene.remove(m.mesh)
               })
               that.imageStore = []
               that.materials = []
               that.addObjects();
               that.resize();
               that.addClickEvents()
               that.container.style.visibility = "visible";
               

               return gsap.timeline()
               .from(data.next.container,{
                   opacity: 0.
               })

               }
                
                
            }
          },
             {
            name: 'from-about-page-transition',
            from: {
                namespace: ["about"]
            },
            sync:true,
            leave(data) {
                that.asscroll.disable();
                return gsap.timeline({
                    onStart: ()=>{
                        OutAnimation()
                    }
                })
                    .to(data.current.container,{
                        opacity: 0.
                    }, '1.5')
            },
            enter(data) {
                sync:true,
                that.asscroll = new ASScroll({
                    disableRaf: true,
                    containerElement: data.next.container.querySelector("[asscroll-container]")
                })
                that.asscroll.enable({
                    horizontalScroll: true,
                    newScrollElements: data.next.container.querySelector('.scroll-wrap')
                })

                if(data.next.namespace === 'home'){

                     // cleeaning old arrays
                that.imageStore.forEach(m=>{
                    that.scene.remove(m.mesh)
                })
                that.imageStore = []
                that.materials = []
                that.addObjects();
                that.resize();
                that.addClickEvents()
                that.container.style.visibility = "visible";
                

                return gsap.timeline()
                .from(data.next.container,{
                    opacity: 0.
                })



                }
               
    

                
            }
          },{
            name: 'from-work-page-transition',
            from: {
                namespace: ["work"]
            },
            sync:true,
            leave(data) {
                that.asscroll.disable();
                return gsap.timeline()
                    .to(data.current.container,{
                        opacity: 0.
                    })
                    
                   
            },
            enter(data) {
                sync:true,
                that.asscroll = new ASScroll({
                    disableRaf: true,
                    containerElement: data.next.container.querySelector("[asscroll-container]")
                })
                that.asscroll.enable({
                    horizontalScroll: true,
                    newScrollElements: data.next.container.querySelector('.scroll-wrap')
                })


                if(data.next.namespace === 'home'){

                    // cleeaning old arrays
               that.imageStore.forEach(m=>{
                   that.scene.remove(m.mesh)
               })
               that.imageStore = []
               that.materials = []
               that.addObjects();
               that.resize();
               that.addClickEvents()
               that.container.style.visibility = "visible";
               

               return gsap.timeline()
               .from(data.next.container,{
                   opacity: 0.
               })


               }
                
                
            }
          },

          
        ]
        });
    }

   
    setupSettings(){
        this.setting = {
            progress: 0
        }

        this.gui = new dat.GUI();
        this.gui.add(this.setting,'progress').min(0).max(1).step(0.001);
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


        this.images = [...document.querySelectorAll('.js-image')];

        Promise.all(this.images.map(img => {
            return new Promise((resolve, reject) => {
                let bounds = img.getBoundingClientRect();
                let m = this.material.clone();
                this.materials.push(m);
        
                // Create a new Image object
                let imageObj = new Image();
                imageObj.src = img.src;

                // Create the texture when the image is loaded
                imageObj.onload = () => {
                    let texture = new THREE.Texture(imageObj);
                    texture.needsUpdate = true;
                    m.uniforms.uTexture.value = texture;

                    img.addEventListener('mouseenter', () =>{
                        gsap.to(m.uniforms.hoverState,{
                            duration: 0.4,
                            value: 1,
                        })
                    })

                    img.addEventListener('mouseout', () =>{
                        gsap.to(m.uniforms.hoverState,{
                            duration: 0.4,
                            value: 0,
                        })
                    })

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
                    

                    // img.addEventListener('mouseover', () =>{
                    //     this.tl = gsap.timeline()

                    //     this.tl.to(m.uniforms.uCorners.value,{
                    //         x: 1,
                    //         duration: 0.4,
                    //         ease: 'expo.out'
                    //     }, 0.1)
                    //     this.tl.to(m.uniforms.uCorners.value,{
                    //         y: 1,
                    //         duration: 0.4,
                    //         ease: 'expo.out'
                    //     }, 0.2)
                    //     this.tl.to(m.uniforms.uCorners.value,{
                    //         z: 1,
                    //         duration: 0.4,
                    //         ease: 'expo.out'
                    //     }, 0.3)
                    //     this.tl.to(m.uniforms.uCorners.value,{
                    //         w: 1,
                    //         duration: 0.4,
                    //         ease: 'expo.out'
                    //     }, 0.4)
                    // })

                    // img.addEventListener('mouseout', () =>{
                    //     this.tl = gsap.timeline()

                    //     this.tl.to(m.uniforms.uCorners.value,{
                    //         x: 0,
                    //         duration: 0.4,
                    //         ease: 'expo.out'
                    //     }, 0.1)
                    //     this.tl.to(m.uniforms.uCorners.value,{
                    //         y: 0,
                    //         duration: 0.4,
                    //         ease: 'expo.out'
                    //     }, 0.2)
                    //     this.tl.to(m.uniforms.uCorners.value,{
                    //         z: 0,
                    //         duration: 0.4,
                    //         ease: 'expo.out'
                    //     }, 0.3)
                    //     this.tl.to(m.uniforms.uCorners.value,{
                    //         w: 0,
                    //         duration: 0.4,
                    //         ease: 'expo.out'
                    //     }, 0.4)
                    // })
        
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


// Define a base delay and a stagger amount2
const baseDelay = 0.02; // Delay before the first animation starts
const staggerAmount = 0.16; // Additional delay for each subsequent mesh

// Check if the body has the class 'b-inside'
const isVerticalScroll = document.body.classList.contains('b-inside');

imageStore.forEach(({material}, index) => {
    const delay = baseDelay + index * staggerAmount;

    // Determine the starting position based on 'b-inside' class
    const startPosition = isVerticalScroll ? { x: 0, y: -5, z: 0 } : { x: 5, y: 0, z: 0 };

    // Animate uPositionOffset with the calculated delay
    gsap.fromTo(material.uniforms.uPositionOffset.value, 
        startPosition, 
        {
            x: 0,
            y: 0,
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

            const isVerticalScroll = document.body.classList.contains('b-inside');
    
            this.imageStore.forEach(o => {
                if (isVerticalScroll) {
                    o.mesh.position.x = o.left - this.width / 2 + o.width / 2; 
                    o.mesh.position.y =  this.asscroll.currentPos - o.top + this.height / 2 - o.height / 2; 
                } else {
                    o.mesh.position.x = - this.asscroll.currentPos + o.left - this.width / 2 + o.width / 2; 
                    o.mesh.position.y = -o.top + this.height / 2 - o.height / 2; 
                }
            });
        }
    }

    addClickEvents(){

        
    }

    mouseMovement(){
        // Correct the event listener name
        window.addEventListener('mousemove', (event) => {
            // Ensure 'this' refers to the correct context
            this.mouse.x = (event.clientX / this.width) * 2 - 1;
            this.mouse.y = -(event.clientY / this.height) * 2 + 1;
    
            // Update the raycaster with the new mouse coordinates
            this.raycaster.setFromCamera(this.mouse, this.camera);
    
            // Perform the raycasting
            const intersects = this.raycaster.intersectObjects(this.scene.children, true); 
            if (intersects.length > 0) {
                    let obj = intersects[0].object;
                    obj.material.uniforms.hover.value = intersects[0].uv;
            }
        }, false);
    }

    render(){
        this.time += 0.05;
        this.material.uniforms.time.value = this.time;
        this.backgroundMaterial.uniforms.time.value = this.time;
        // this.material.uniforms.uProgress.value = this.setting.progress;

        this.materials.forEach(m=>{
            m.uniforms.time.value = this.time;
        })

        this.scrollSpeed = this.asscroll.currentPos - this.prevScrollPos;
        this.prevScrollPos = this.asscroll.currentPos;


        this.customPass.uniforms.scrollSpeed.value = this.scrollSpeed;
        this.mousePass.uniforms.time.value = this.time;




        this.asscroll.update()
        this.setPosition()
        // this.tl.progress(this.setting.progress)
        this.mesh.rotation.x = this.time / 2000;
        this.mesh.rotation.y = this.time / 1000;

        // this.renderer.render( this.scene, this.camera );
        // console.log(this.time);

        this.composer.render()
        requestAnimationFrame(this.render.bind(this))
    }

}

// new Sketch({
//     domElement: document.getElementById('container')
// });


