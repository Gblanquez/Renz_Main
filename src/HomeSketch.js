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
import { getASScrollInstance, initializeScroll, destroyASScrollInstance } from './smoothScroll';

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
        this.isList = false;


        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        // Setup scene
        this.scene = new THREE.Scene()
        
        // Adjust camera
        this.camera = new THREE.PerspectiveCamera(0, this.width/this.height, 100, 2000)
        this.camera.position.z = 800
        this.camera.fov = 2 * Math.atan((this.height / 2) / 800) * 180 / Math.PI

        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true
        })
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.container.appendChild(this.renderer.domElement)
        this.renderer.setSize(this.width, this.height)



        this.smoothScroll = options.smoothScroll;
        if (this.smoothScroll) {
            // Store the update function reference so we can remove it later
            this.scrollUpdateHandler = () => this.updateScrollNumber();
            this.smoothScroll.on('update', this.scrollUpdateHandler);
        }


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
        this.setupContainer()

        this._inCircleView = false;

        this._isDragging = false;
        this._dragInertia = { x: 0, y: 0 };
        this._autoRotate = false;
        this._lastRotationY = 0;
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

        // On mobile, force a more thorough update
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            // Wait a bit for CSS to update before recalculating
            setTimeout(() => this.forceUpdateSizing(), 50);
        } else {
            // Standard desktop update
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
        }

        this.setPosition();
    }

    setupResize(){
        window.addEventListener('resize', () => {
            this.resize.bind(this)();
            // this.setupFontSizing(); 
        });
    }

    addClickEvents() {
        const secondElements = document.querySelectorAll('.second'); // This is the "List" button
        const firstElements = document.querySelectorAll('.first');   // This is the "Carousel" button
        const thirdElements = document.querySelectorAll('.third');   // This is the "Circle" button
        
        // Initial state: disable .first, enable .second and .third
        firstElements.forEach(el => el.style.pointerEvents = 'none');
        secondElements.forEach(el => el.style.pointerEvents = 'auto');
        thirdElements.forEach(el => el.style.pointerEvents = 'auto');
    
        // Third button triggers circle view
        thirdElements.forEach(element => {
            element.addEventListener('click', () => {
                if (this._inCircleView) return; // Don't proceed if already in circle view
                
                console.log('Switching to circle view');
                
                // Hide carousel content
                const carouselContent = document.querySelector('.content');
                if (carouselContent) carouselContent.style.display = 'none';
                
                // Hide list content
                const listContent = document.querySelector('.content-list');
                if (listContent) listContent.style.display = 'none';
                
                // Show/create circle content
                let circleContent = document.querySelector('.content-circle');
                if (!circleContent) {
                    circleContent = document.createElement('div');
                    circleContent.className = 'content-circle';
                    circleContent.style.position = 'absolute';
                    circleContent.style.top = '0';
                    circleContent.style.left = '0';
                    circleContent.style.width = '100%';
                    circleContent.style.height = '100%';
                    document.body.appendChild(circleContent);
                }
                circleContent.style.display = 'block';
                
                // Update view states
                this._inCircleView = true;
                this._inListView = false;
                this.isList = false;
                
                // Animate meshes to circle view
                this.switchToCircleView();
                
                // Update button states
                firstElements.forEach(el => el.style.pointerEvents = 'auto');
                secondElements.forEach(el => el.style.pointerEvents = 'auto');
                thirdElements.forEach(el => el.style.pointerEvents = 'none');
            });
        });
    
        // Second button now triggers list view (existing code)
        secondElements.forEach(element => {
            element.addEventListener('click', () => {
                if (this._inListView) return; // Don't proceed if already in list view
                
                console.log('Switching to list view');
                
                // Hide carousel content, show list content
                document.querySelector('.content').style.display = 'none';
                document.querySelector('.content-list').style.display = 'flex';
                
                // Hide circle content if it exists
                const circleContent = document.querySelector('.content-circle');
                if (circleContent) circleContent.style.display = 'none';
                
                // Update view states
                this._inListView = true;
                this._inCircleView = false;
                this.isList = true;
                
                // Animate meshes to list view
                this.switchToListView();
                
                // Update button states
                firstElements.forEach(el => el.style.pointerEvents = 'auto');
                secondElements.forEach(el => el.style.pointerEvents = 'none');
                thirdElements.forEach(el => el.style.pointerEvents = 'auto');
            });
        });
        
        // First button returns to carousel view (updated for all views)
        firstElements.forEach(element => {
            element.addEventListener('click', () => {
                if (!this._inListView && !this._inCircleView) return; // Only proceed if not in carousel view
                
                console.log('Returning to carousel view');
                
                // Show carousel content, hide other content
                document.querySelector('.content').style.display = 'inline-flex';
                document.querySelector('.content-list').style.display = 'none';
                
                // Hide circle content if it exists
                const circleContent = document.querySelector('.content-circle');
                if (circleContent) circleContent.style.display = 'none';
                
                // Return meshes to original carousel positions
                this.returnToCarouselView();
                
                // Update view states
                this._inListView = false;
                this._inCircleView = false;
                this.isList = false;
                
                // Update button states
                firstElements.forEach(el => el.style.pointerEvents = 'none');
                secondElements.forEach(el => el.style.pointerEvents = 'auto');
                thirdElements.forEach(el => el.style.pointerEvents = 'auto');
            });
        });
    }

    // Create an improved returnToCarouselView with smoother animation and texture fixing
    returnToCarouselView() {
        // Keep track of the current view we're leaving
        const comingFromListView = this.isListViewActive;
        const comingFromCircleView = this._inCircleView;
        
        // Set flags
        this.isListViewActive = false;
        this.isCircleViewActive = false;
        
        // If coming from list view, handle that transition
        if (comingFromListView) {
            console.log("Animating from list to carousel with fast stagger transition");
            
            // Create a master timeline for coordinated animation
            const masterTl = gsap.timeline({
                onComplete: () => {
                    console.log("Carousel transition complete");
                    // Re-enable scrolling after animation completes
                    this.restoreCarouselScroll();
                }
            });
            
            // Faster transition with clean stagger - match the timing of the list view animation
            this.imageStore.forEach((item, i) => {
                if (item._originalCarouselData) {
                    // Make items visible as they move (like in the list view animation)
                    masterTl.to(item.material.uniforms.hoverState, {
                        value: 0.8, // Moderate visibility
                        duration: 0.4,
                        ease: "power1.in",
                        delay: i * 0.02 // Faster stagger
                    }, 0);
                    
                    // Direct animation to final position with quick stagger
                    masterTl.to(item.mesh.position, {
                        x: item._originalCarouselData.x,
                        y: item._originalCarouselData.y,
                        z: item._originalCarouselData.z,
                        duration: 0.8, // Faster animation
                        ease: "power2.out",
                        delay: i * 0.04 // Same stagger timing as list view
                    }, 0.1); // Start after visibility begin
                    
                    // Restore original rotation
                    masterTl.to(item.mesh.rotation, {
                        z: item._originalCarouselData.rotation || 0,
                        duration: 0.7, // Slightly faster than position
                        ease: "power2.out"
                    }, 0.1 + i * 0.04); // Match position timing
                    
                    // Fade back to normal visibility state
                    masterTl.to(item.material.uniforms.hoverState, {
                        value: 0, // Back to normal
                        duration: 0.5,
                        ease: "power1.out"
                    }, 0.5 + i * 0.03); // Slightly faster stagger on the way out
                }
            });
            
            // Keep the timeline moving without calling restoreCarouselScroll yet
            return;
        } 
        // If coming from circle view, handle that transition with stacking effect
        else if (comingFromCircleView) {
            console.log("Animating from circle to carousel view with stacking");
            
            // Create a master timeline for coordinated animation
            const masterTl = gsap.timeline({
                onComplete: () => {
                    console.log("Carousel transition complete");
                    
                    // Move meshes back to main scene from circle container
                    if (this._circleContainer) {
                        while (this._circleContainer.children.length > 0) {
                            const child = this._circleContainer.children[0];
                            // Skip the cylinder wireframe and helper objects
                            if (child !== this._dragCylinder && 
                                child !== this._ringHelper && 
                                child !== this._xAxisHelper && 
                                child !== this._zAxisHelper) {
                                // Get world position/rotation before removing
                                const worldPos = new THREE.Vector3();
                                const worldRot = new THREE.Euler();
                                child.getWorldPosition(worldPos);
                                child.getWorldQuaternion(new THREE.Quaternion().setFromEuler(worldRot));
                                
                                // Remove from container and add to scene
                                this._circleContainer.remove(child);
                                this.scene.add(child);
                            } else {
                                // Just remove helpers and cylinder
                                this._circleContainer.remove(child);
                            }
                        }
                    }
                    
                    // Re-enable scrolling after animation completes
                    this.restoreCarouselScroll();
                }
            });
            
            // Clean up circle view elements - fade out cylinder
            if (this._dragCylinder) {
                masterTl.to(this._dragCylinder.material, {
                    opacity: 0,
                    duration: 0.5,
                    ease: "power1.in",
                    onComplete: () => {
                        // Clean up the cylinder
                        if (this._circleContainer && this._dragCylinder) {
                            this._circleContainer.remove(this._dragCylinder);
                            this._dragCylinder.geometry.dispose();
                            this._dragCylinder.material.dispose();
                            this._dragCylinder = null;
                        }
                    }
                }, 0);
            }
            
            // Rotate container to neutral position
            if (this._circleContainer) {
                masterTl.to(this._circleContainer.rotation, {
                    y: 0,
                    duration: 1.0,
                    ease: "power2.inOut"
                }, 0);
            }
            
            // Define central stacking point
            const stackPosition = new THREE.Vector3(0, 30, 0);
            
            // PHASE 1: First gather all items to the center stack
            this.imageStore.forEach((item, index) => {
                // Only process if we have original position data
                if (!item._carouselPosition) return;
                
                // Calculate timing for gathering
                const gatherDuration = 0.8;
                const gatherDelay = index * 0.03;
                
                // Store initial position for reference
                const initialPos = {
                    x: item.mesh.position.x,
                    y: item.mesh.position.y,
                    z: item.mesh.position.z
                };
                
                // Animate to central stack with slight delay based on index
                masterTl.to(item.mesh.position, {
                    x: stackPosition.x,
                    y: stackPosition.y,
                    z: stackPosition.z,
                    duration: gatherDuration,
                    ease: "power2.inOut",
                    delay: gatherDelay
                }, 0);
                
                // Scale down slightly as items gather
                masterTl.to(item.mesh.scale, {
                    x: item._carouselPosition.scaleX * 0.8,
                    y: item._carouselPosition.scaleY * 0.8,
                    z: 1,
                    duration: gatherDuration,
                    ease: "power2.inOut",
                    delay: gatherDelay
                }, 0);
                
                // Standardize rotation during gathering
                masterTl.to(item.mesh.rotation, {
                    x: 0,
                    y: 0,
                    z: 0,
                    duration: gatherDuration,
                    ease: "power2.inOut",
                    delay: gatherDelay
                }, 0);
                
                // Dim items slightly during gathering
                masterTl.to(item.material.uniforms.hoverState, {
                    value: 0.5,
                    duration: gatherDuration * 0.8,
                    ease: "power1.inOut",
                    delay: gatherDelay
                }, 0);
            });
            
            // Add a brief pause for dramatic effect
            const pauseDuration = 0.3;
            
            // PHASE 2: Fan out to carousel positions with arcs
            this.imageStore.forEach((item, index) => {
                // Only process if we have original position data
                if (!item._carouselPosition) return;
                
                // Reset material side to front only
                item.material.side = THREE.FrontSide;
                
                // Reset any circle-specific shader uniforms
                if (item.material.uniforms.uTransitionProgress) {
                    item.material.uniforms.uTransitionProgress.value = 0;
                }
                
                // Set up start and end positions
                const startPos = {
                    x: stackPosition.x,
                    y: stackPosition.y,
                    z: stackPosition.z
                };
                
                const endPos = {
                    x: item._carouselPosition.x,
                    y: item._carouselPosition.y,
                    z: item._carouselPosition.z
                };
                
                // Calculate 3D distance for arc height
                const distance = Math.sqrt(
                    Math.pow(endPos.x - startPos.x, 2) + 
                    Math.pow(endPos.z - startPos.z, 2) +
                    Math.pow(endPos.y - startPos.y, 2)
                );
                
                // Calculate timing for fan-out
                const fanOutDuration = 1.2;
                const fanOutDelay = index * 0.04; // Stagger by index
                
                // Timing offset after gather + pause
                const timeOffset = 0.8 + pauseDuration;
                
                // Fan out with 3D arc motion
                masterTl.to(item.mesh.position, {
                    duration: fanOutDuration,
                    ease: "power2.inOut",
                    delay: fanOutDelay,
                    onUpdate: function() {
                        // Get current progress (0 to 1)
                        const progress = this.progress();
                        
                        // Linear interpolation for x and z
                        item.mesh.position.x = startPos.x + (endPos.x - startPos.x) * progress;
                        item.mesh.position.z = startPos.z + (endPos.z - startPos.z) * progress;
                        
                        // Apply arc motion
                        const arcHeight = distance * 0.3;
                        const arcOffset = Math.sin(Math.PI * progress) * arcHeight;
                        
                        // Calculate base y-position with linear interpolation
                        const baseY = startPos.y + (endPos.y - startPos.y) * progress;
                        
                        // Apply the arc offset to create the sinc-like motion
                        item.mesh.position.y = baseY + arcOffset;
                    }
                }, timeOffset);
                
                // Animate rotation back to carousel state
                masterTl.to(item.mesh.rotation, {
                    x: item._carouselPosition.rotationX || 0,
                    y: item._carouselPosition.rotationY || 0,
                    z: item._carouselPosition.rotationZ || 0,
                    duration: fanOutDuration,
                    ease: "power2.inOut",
                    delay: fanOutDelay
                }, timeOffset);
                
                // Scale back to original carousel size
                masterTl.to(item.mesh.scale, {
                    x: item._carouselPosition.scaleX,
                    y: item._carouselPosition.scaleY,
                    z: 1, 
                    duration: fanOutDuration,
                    ease: "power1.inOut",
                    delay: fanOutDelay
                }, timeOffset);
                
                // Enhanced visibility during expansion with a brief flash
                masterTl.to(item.material.uniforms.hoverState, {
                    value: 1.1, // Briefly brighter
                    duration: fanOutDuration * 0.3,
                    ease: "power1.out",
                    delay: fanOutDelay
                }, timeOffset);
                
                // Settle back to normal visibility
                masterTl.to(item.material.uniforms.hoverState, {
                    value: 0, // Back to carousel normal
                    duration: fanOutDuration * 0.5,
                    ease: "power2.out",
                    delay: fanOutDelay + 0.3
                }, timeOffset + 0.3);
            });
            
            // Keep the timeline moving without calling restoreCarouselScroll yet
            return;
        } 
        else {
            // Default animation if not coming from list or circle view
            console.log("No specific transition needed");
            
            // Re-enable scrolling and other carousel-specific behavior
            this.restoreCarouselScroll();
        }
    }

    // Completely rewritten restoreCarouselScroll to work reliably
    restoreCarouselScroll() {
        console.log("Restoring carousel scroll with horizontal mode");
        
        // First restore flag and method
        this._inListView = false;
        this._inCircleView = false;
        
        if (this._originalSetPosition) {
            console.log("Restoring original setPosition method");
            this.setPosition = this._originalSetPosition;
            this._originalSetPosition = null;
        }
        
        try {
            // 1. CRITICAL: Fix the body class FIRST
            console.log("Setting body class for horizontal scroll");
            if (document.body.classList.contains('b-inside')) {
                document.body.classList.remove('b-inside');
            }
            
            // 2. Completely destroy any existing scroll instance
            console.log("Destroying previous scroll instance");
            destroyASScrollInstance(); // Use the imported function
            
            // 3. Wait a moment for cleanup to complete
            setTimeout(() => {
                try {
                    // 4. Use the properly imported initializeScroll function
                    console.log("Creating fresh horizontal scroll");
                    this.smoothScroll = initializeScroll(true); // true = horizontal
                    
                    // 5. Re-attach our listener
                    console.log("Re-attaching scroll handler");
                    this.scrollUpdateHandler = () => this.updateScrollNumber();
                    this.smoothScroll.on('update', this.scrollUpdateHandler);
                    
                    // 6. Force a position update after a delay
                    setTimeout(() => {
                        console.log("Final position update for carousel");
                        
                        // Double check scroll direction
                        if (this.smoothScroll && this.smoothScroll.params) {
                            console.log("Current scroll direction:", 
                                this.smoothScroll.params.horizontalScroll ? "horizontal" : "vertical");
                            
                            if (!this.smoothScroll.params.horizontalScroll) {
                                console.log("Correcting to horizontal scroll");
                                this.smoothScroll.params.horizontalScroll = true;
                                this.smoothScroll.resize();
                            }
                        }
                        
                        // Update positions
                        this.setPosition();
                        
                        // Make sure buttons are in correct state
                        const firstElements = document.querySelectorAll('.first');
                        const secondElements = document.querySelectorAll('.second');
                        const thirdElements = document.querySelectorAll('.third');
                        
                        firstElements.forEach(el => el.style.pointerEvents = 'none');
                        secondElements.forEach(el => el.style.pointerEvents = 'auto'); 
                        thirdElements.forEach(el => el.style.pointerEvents = 'auto');
                    }, 200);
                } catch (error) {
                    console.error("Error in scroll restoration:", error);
                    
                    // EXTREME FALLBACK: Direct ASScroll creation
                    try {
                        console.log("Creating direct ASScroll instance");
                        this.smoothScroll = new ASScroll({
                            disableRaf: true,
                            containerElement: document.querySelector('[asscroll-container]'),
                            horizontalScroll: true, // Force horizontal
                            ease: 0.1
                        });
                        
                        // Set up events
                        this.scrollUpdateHandler = () => this.updateScrollNumber();
                        this.smoothScroll.on('update', this.scrollUpdateHandler);
                        
                        // Enable with horizontal mode
                        this.smoothScroll.enable({
                            horizontalScroll: true
                        });
                        
                        // Update positions
                        setTimeout(() => this.setPosition(), 200);
                    } catch (directError) {
                        console.error("Failed to create direct ASScroll instance:", directError);
                    }
                }
            }, 100); // Wait after destroyASScrollInstance
            
        } catch (outerError) {
            console.error("Outer error in scroll restoration:", outerError);
        }
    }

    // Update switchToListView to position items 10% from the bottom of the screen
    switchToListView() {
        // Set flags
        this.isListViewActive = true;
        this.isCircleViewActive = false;
        
        // Before changing positions, store original carousel data for each item
        this.imageStore.forEach(item => {
            item._originalCarouselData = {
                x: item.mesh.position.x,
                y: item.mesh.position.y,
                z: item.mesh.position.z,
                rotation: item.mesh.rotation.z,
                scale: {
                    x: item.mesh.scale.x,
                    y: item.mesh.scale.y,
                    z: item.mesh.scale.z
                }
            };
        });
    
        console.log("Switching to list view - disabling scroll");
        
        // Store the current scroll configuration for later restoration
        this._inListView = true;
        this._wasHorizontalScroll = this.smoothScroll?.params?.horizontalScroll || true;
        
        // Save original setPosition but implement a silent version
        this._originalSetPosition = this.setPosition;
        this.setPosition = () => { /* Empty function with no logging */ };
        
        // Comprehensively disable scroll
        if (this.smoothScroll) {
            console.log("Disabling scroll functionality");
            
            // 1. Remove the update listener
            if (this.scrollUpdateHandler) {
                this.smoothScroll.off('update', this.scrollUpdateHandler);
            }
            
            try {
                // 2. Explicitly disable the scroll instance
                this.smoothScroll.disable();
                
                // 3. We won't change the horizontal property now, just disable it completely
            } catch (error) {
                console.warn("Error disabling scroll:", error);
            }
        }
        
        // Calculate center X and position Y that's 10% from bottom of screen
        const centerX = 0;
        // Calculate Y position: -40% of height from center (since center is 0,0)
        // This places items 10% from the bottom of the screen (changed from 5%)
        const bottomY = -(this.height / 2) * 0.8; // 10% from bottom = 80% of half-height
        
        // Increase the z-spacing between meshes to prevent clashing
        const zSpacing = 25; // Increased from 10 to 25 for better separation
        
        console.log(`Positioning list view items at X: ${centerX}, Y: ${bottomY} (10% from bottom) with z-spacing: ${zSpacing}`);
        
        // Create animation timeline
        const tl = gsap.timeline({
            onComplete: () => {
                console.log("Stack animation complete - meshes positioned near bottom");
                this.setupEnhancedHoverEvents();
            }
        });
        
        // Move all meshes to the new position with staggered timing
        this.imageStore.forEach((item, index) => {
            // Store original position for later reference
            item._originalPosition = {
                x: item.mesh.position.x,
                y: item.mesh.position.y,
                z: item.mesh.position.z
            };
            
            // Move to bottom-center position with increased z-separation
            tl.to(item.mesh.position, {
                x: centerX,
                y: bottomY,
                z: -index * zSpacing, // Increased z-spacing between items
                duration: 0.8,
                ease: "power2.out",
                delay: index * 0.04
            }, 0);
            
            // Set visibility
            tl.to(item.material.uniforms.hoverState, {
                value: index === 0 ? 0.8 : 0.2, // First visible, others dimmed
                duration: 0.5
            }, 0.3 + index * 0.04);
        });
        
        // Set current visible mesh
        this.currentVisibleMeshIndex = 0;
    }

    // Enhanced hover events with fluid, wave-like folder effect for list items
    setupEnhancedHoverEvents() {
        const listItems = document.querySelectorAll('.item-list');
        
        // Clear existing listeners
        listItems.forEach(item => {
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
        });
        
        // Get fresh references
        const freshListItems = document.querySelectorAll('.item-list');
        
        console.log(`Setting up hover events for ${freshListItems.length} list items with fluid card effect`);
        
        // Define consistent spacing and animation parameters
        const zSpacing = 25; // Match the value used in switchToListView
        const popUpAmount = 30; // Maximum amount to move up on y-axis when hovered
        const baseY = -(this.height / 2) * 0.8; // 10% from bottom
        
        // Smoother, faster animations for rapid hovering
        const riseTime = 0.28;    // Even faster rise time for more responsive feel
        const fallTime = 0.22;    // Even faster fall time
        const hoverEase = "back.out(1.7)";  // More pronounced bounce on rise
        const fallEase = "power2.out";      // Smooth fall
        
        // Store animations for each mesh to manage interruptions
        const animations = new Map();
        
        // Keep track of the current hovered index globally
        let currentHoveredIndex = null;
        
        // Pre-position all elements to ensure consistent starting point
        this.imageStore.forEach((item, i) => {
            gsap.set(item.mesh.position, {
                y: baseY,
                z: -i * zSpacing
            });
            
            // Store this position as the reference
            item._stackPosition = {
                y: baseY,
                z: -i * zSpacing
            };
        });
        
        // Function to handle smooth transitions between items
        const smoothlyTransition = (fromIndex, toIndex) => {
            if (!this.imageStore) return;
            
            // Only process indices that exist
            if (fromIndex !== null && fromIndex >= 0 && fromIndex < this.imageStore.length) {
                const prevItem = this.imageStore[fromIndex];
                
                // Kill any existing animation on this item
                if (animations.has(fromIndex)) {
                    animations.get(fromIndex).kill();
                }
                
                // Create new fall animation
                const fallAnim = gsap.to(prevItem.mesh.position, {
                    y: baseY, // Return exactly to base position
                    duration: fallTime,
                    ease: fallEase,
                    onComplete: () => animations.delete(fromIndex)
                });
                
                // Dim the item
                gsap.to(prevItem.material.uniforms.hoverState, {
                    value: fromIndex === 0 ? 0.8 : 0.2, // First item stays more visible
                    duration: fallTime * 0.8,
                    ease: "power1.out"
                });
                
                // Store the animation
                animations.set(fromIndex, fallAnim);
            }
            
            // Process to new index if it exists
            if (toIndex !== null && toIndex >= 0 && toIndex < this.imageStore.length) {
                const newItem = this.imageStore[toIndex];
                
                // Kill any existing animation on this item
                if (animations.has(toIndex)) {
                    animations.get(toIndex).kill();
                }
                
                // Create rise animation
                const riseAnim = gsap.to(newItem.mesh.position, {
                    y: baseY + popUpAmount,
                    duration: riseTime,
                    ease: hoverEase,
                    onComplete: () => animations.delete(toIndex)
                });
                
                // Full visibility with slight overshoot
                gsap.to(newItem.material.uniforms.hoverState, {
                    value: 1.1, // Slightly higher than 1 for a brief "pop"
                    duration: riseTime * 0.7,
                    ease: "power2.inOut",
                    onComplete: () => {
                        // Settle back to exactly 1
                        gsap.to(newItem.material.uniforms.hoverState, {
                            value: 1,
                            duration: 0.2,
                            ease: "power1.out"
                        });
                    }
                });
                
                // Store the animation
                animations.set(toIndex, riseAnim);
            }
        };
        
        // Ensure all items return to base position - critical for fixing hover state issues
        const resetAllItems = () => {
            if (!this.imageStore || !this._inListView) return;
            
            // Reset whatever was previously hovered
            if (currentHoveredIndex !== null) {
                smoothlyTransition(currentHoveredIndex, null);
                currentHoveredIndex = null;
            }
            
            // Force-reset all items to be extra safe
            this.imageStore.forEach((item, i) => {
                // Kill any existing animations
                if (animations.has(i)) {
                    animations.get(i).kill();
                    animations.delete(i);
                }
                
                // Return to base position
                gsap.to(item.mesh.position, {
                    y: baseY,
                    z: -i * zSpacing,
                    duration: 0.3,
                    ease: "power2.out"
                });
                
                // Reset visibility - first item more visible
                gsap.to(item.material.uniforms.hoverState, {
                    value: i === 0 ? 0.8 : 0.2,
                    duration: 0.3
                });
            });
        };
        
        // Add smooth hover effects to each list item
        freshListItems.forEach((item, index) => {
            // Make sure we're working with the correct mesh index
            const meshIndex = parseInt(item.dataset.meshIndex || index);
            
            // Add indicator for debugging (you may want to remove this in production)
            const indicator = document.createElement('div');
            indicator.textContent = `${meshIndex + 1}`;
            indicator.style.position = 'absolute';
            indicator.style.top = '10px';
            indicator.style.right = '10px';
            indicator.style.background = '#FF5722';
            indicator.style.color = 'white';
            indicator.style.borderRadius = '50%';
            indicator.style.width = '24px';
            indicator.style.height = '24px';
            indicator.style.display = 'flex';
            indicator.style.alignItems = 'center';
            indicator.style.justifyContent = 'center';
            indicator.style.fontSize = '12px';
            indicator.style.fontWeight = 'bold';
            item.style.position = 'relative';
            item.appendChild(indicator);
            
            // Mouse enter - smoothly transition between items
            item.addEventListener('mouseenter', () => {
                if (!this.imageStore || !this._inListView) return;
                
                // Only perform transition if this is different from current
                if (currentHoveredIndex !== meshIndex) {
                    smoothlyTransition(currentHoveredIndex, meshIndex);
                    currentHoveredIndex = meshIndex;
                }
            });
            
            // Mouse leave - fix for items staying in hover state
            item.addEventListener('mouseleave', (e) => {
                if (!this.imageStore || !this._inListView) return;
                
                // Check if we're moving to another list item or leaving the list entirely
                // Get the element being entered
                const relatedTarget = e.relatedTarget;
                
                // If not moving to another list item, reset this one
                if (!relatedTarget || !relatedTarget.closest('.item-list')) {
                    // Only reset if we're not entering another list item
                    const isEnteringAnotherItem = Array.from(freshListItems).some(listItem => 
                        listItem !== item && listItem.contains(relatedTarget)
                    );
                    
                    if (!isEnteringAnotherItem) {
                        // We're not entering another item, so start transitioning this one down
                        smoothlyTransition(meshIndex, null);
                        currentHoveredIndex = null;
                    }
                }
            });
            
            // Add click event - with enhanced animation
            item.addEventListener('click', () => {
                if (!this.imageStore || !this._inListView) return;
                
                console.log(`Clicking list item ${meshIndex}`);
                
                // Get the corresponding mesh material
                const meshItem = this.imageStore[meshIndex];
                if (!meshItem) return;
                
                // Create the same corner animation that's used in the original mesh click
                const tl = gsap.timeline({
                    onComplete: () => {
                        this.clickAnimationCompleted = true;
                        
                        // If the list item has a link, follow it
                        const link = item.getAttribute('data-url') || item.querySelector('a')?.getAttribute('href');
                        if (link) {
                            console.log(`Navigating to: ${link}`);
                            setTimeout(() => {
                                window.location.href = link;
                            }, 600); // Delay navigation to allow animation to complete
                        }
                    }
                });
                
                // Use the same corner animation as in your original code
                tl.to(meshItem.material.uniforms.uCorners.value, { x: 1, duration: 1.1, ease: 'expo.out' }, 0.1)
                  .to(meshItem.material.uniforms.uCorners.value, { y: 1, duration: 1.1, ease: 'expo.out' }, 0.3)
                  .to(meshItem.material.uniforms.uCorners.value, { z: 1, duration: 1.1, ease: 'expo.out' }, 0.2)
                  .to(meshItem.material.uniforms.uCorners.value, { w: 1, duration: 1.1, ease: 'expo.out' }, 0.4);
                
                // Add a flash effect to highlight the click
                tl.to(meshItem.material.uniforms.hoverState, {
                    value: 1.5, // Increase beyond normal hover for a flash effect
                    duration: 0.3,
                    ease: 'power2.out',
                    yoyo: true,
                    repeat: 1
        }, 0);
                
                // Add a "pull-out" motion along y-axis to emphasize the click
                tl.to(meshItem.mesh.position, {
                    y: baseY + popUpAmount + 15, // Extra pull out
                    duration: 0.3,
                    ease: 'power2.out',
                    yoyo: true,
                    repeat: 1
                }, 0);
                
                // Prevent default if it's a link to allow our animation to complete
                const linkElement = item.querySelector('a');
                if (linkElement) {
                    linkElement.addEventListener('click', (e) => {
                        e.preventDefault();
                    }, { once: true });
                }
            });
        });
        
        // Add handler for the list container for when mouse leaves the entire list
        const listContainer = document.querySelector('.content-list');
        if (listContainer) {
            listContainer.addEventListener('mouseleave', () => {
                if (!this.imageStore || !this._inListView) return;
                
                // Reset all meshes smoothly when mouse leaves the container
                resetAllItems();
            });
            
            // Add additional mouse move handler on list container to catch gaps between items
            // This acts as a safety net for when mouse moves between items
            let mouseMoveTicking = false;
            let lastMouseEvent = null;
            
            listContainer.addEventListener('mousemove', (e) => {
                lastMouseEvent = e;
                
                if (!mouseMoveTicking) {
                    window.requestAnimationFrame(() => {
                        // Check if we're over a list item
                        const hoveredElement = document.elementFromPoint(
                            lastMouseEvent.clientX, 
                            lastMouseEvent.clientY
                        );
                        
                        // If not hovering an item or hovering the container directly, reset
                        if (hoveredElement === listContainer || 
                            (hoveredElement && !hoveredElement.closest('.item-list'))) {
                            // We're in a gap between items, smoothly reset current item
                            if (currentHoveredIndex !== null) {
                                smoothlyTransition(currentHoveredIndex, null);
                                currentHoveredIndex = null;
                            }
                        }
                        
                        mouseMoveTicking = false;
                    });
                    
                    mouseMoveTicking = true;
                }
            });
        }
        
        // Initially highlight the first item
        if (this.imageStore && this.imageStore.length > 0) {
            gsap.to(this.imageStore[0].material.uniforms.hoverState, {
                value: 0.8,
                duration: 0.3
            });
            this.currentVisibleMeshIndex = 0;
        }
        
        // Extra safety: reset on window blur/focus changes
        window.addEventListener('blur', resetAllItems);
        window.addEventListener('focus', resetAllItems);
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
                uPositionOffset: { value: new THREE.Vector3(0, 0, 0) },
                uViewTransition: { value: 0 },
                uCircleRadius: { value: 2.5 },
                uCircleCenter: { value: new THREE.Vector2(0, 0) },
                uCircleAngle: { value: 0 }
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


        this.circleGeometry = new THREE.CylinderGeometry(300,300, 92);
        this.circleMaterial = new THREE.MeshNormalMaterial()
        this.circleMesh = new THREE.Mesh(this.circleGeometry, this.circleMaterial);
        this.circleMesh.material.wireframe = true;
        this.circleMesh.position.set(0, 0, 0);
        this.circleMesh.rotation.set(0, .90, 0.5);

        // this.scene.add(this.circleMesh);


    
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
    
                    // Make material double-sided
                    m.side = THREE.DoubleSide;
    
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
    // Only run this on home page
    if (!document.querySelector('[data-barba-namespace="home"]')) return;
    
    const nmElement = document.querySelector('.nm');
    if (!nmElement || !this.imageStore || !this.smoothScroll || this.imageStore.length === 0) return;

    try {
        const lastMesh = this.imageStore[this.imageStore.length - 1];
        const lastMeshRight = lastMesh.left + lastMesh.width;
        const totalScrollableDistance = Math.max(this.maxScroll, lastMeshRight - window.innerWidth);
        const scrollX = Math.min(this.smoothScroll?.currentPos || 0, totalScrollableDistance);
        const percentage = Math.round((scrollX / totalScrollableDistance) * 100);

        nmElement.textContent = percentage.toString().padStart(3, '0');
    } catch (error) {
        console.warn('Error updating scroll number:', error);
    }
}


    setPosition() {
        let lastMeshRight = 0;
    
        if (this.imageStore && this.smoothScroll) {  // Add smoothScroll check
            this.imageStore.forEach(o => {
                // Use optional chaining and default to 0 if currentPos is undefined
                const currentPos = this.smoothScroll?.currentPos || 0;
                
                o.mesh.position.x = -currentPos + o.left - this.width / 2 + o.width / 2;
                o.mesh.position.y = -o.top + this.height / 2 - o.height / 2;
    
                lastMeshRight = Math.max(lastMeshRight, o.mesh.position.x + o.width / 2);
            });
    
            this.maxScroll = lastMeshRight - this.width / 2;
        }
    
        this.updateScrollNumber();
    }



    composerPass() {
        this.composer = new EffectComposer(this.renderer);
        this.renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(this.renderPass);
    
        // Detect if we're on mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Use a simpler shader for mobile
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
            fragmentShader: isMobile ? 
            // Simple mobile shader
            `
            uniform sampler2D tDiffuse;
            varying vec2 vUv;
            
            void main() {
                gl_FragColor = texture2D(tDiffuse, vUv);
            }
            ` : 
            // Full desktop shader (your existing shader code)
            `
            uniform sampler2D tDiffuse;
            varying vec2 vUv;
            uniform float scrollSpeed;
            uniform float time;

            void main() {
                vec2 newUV = vUv;

                // Define wave effect area
                float center = 0.5;
                float width = 0.2;
                float smoothRange = 0.1;

                float area = smoothstep(center - width, center - width + smoothRange, vUv.x) * 
                             (1.0 - smoothstep(center + width - smoothRange, center + width, vUv.x));

                float waveEffect = cos(time * 1.0 + (vUv.x - center) * 10.0) * 0.5 + 0.5;
                float edgeFade = smoothstep(width, 0.0, abs(vUv.x - center));  
                float absScrollSpeed = clamp(abs(scrollSpeed), 0.0, 10.0);
                float scaleEffect = 1.0 - absScrollSpeed * 0.014 * waveEffect * area * edgeFade;

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
        
        // Detect if we're on mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Update time
        this.time += isMobile ? 0.03 : 0.05;
        
        // Update shader uniforms
        this.material.uniforms.time.value = this.time;
        this.backgroundMaterial.uniforms.time.value = this.time;
        
        this.materials.forEach(m => {
            m.uniforms.time.value = this.time;
        });
        
        // Only update scroll-related properties if NOT in list view
        if (!this._inListView) {
            // Calculate scroll speed
            if (this.smoothScroll) {
                this.scrollSpeed = (this.smoothScroll.currentPos || 0) - (this.prevScrollPos || 0);
                this.prevScrollPos = this.smoothScroll.currentPos || 0;
            }
            
            // Update positions
            if (this.smoothScroll) {
                this.setPosition();
            }
        }
        
        // Always update custom pass regardless of view mode
        if (this.customPass) {
            this.customPass.uniforms.scrollSpeed.value = this.scrollSpeed || 0;
            this.customPass.uniforms.time.value = this.time;
        }
        
        // Apply inertia and auto-rotation for circle view
        if (this._inCircleView && this._circleContainer) {
            // Apply inertia with decay (Y axis only)
            if (!this._isDragging) {
                // Apply smoother decay curve
                this._dragInertia.x *= 0.96;
                
                if (Math.abs(this._dragInertia.x) > 0.0001) {
                    this._circleContainer.rotation.y += this._dragInertia.x;
                } else {
                    this._dragInertia.x = 0;
                }
            }
            
            // Apply auto-rotation if enabled (Y axis only)
            if (this._autoRotate && !this._isDragging) {
                // Smoother auto-rotation with slight acceleration/deceleration
                const time = this.time * 0.1;
                const baseSpeed = 0.005;
                const variation = Math.sin(time) * 0.002;
                
                this._circleContainer.rotation.y += baseSpeed + variation;
            }
            
            // Update visibility based on rotation
            if (this._lastRotationY !== this._circleContainer.rotation.y) {
                this.updateCylinderVisibility();
                this._lastRotationY = this._circleContainer.rotation.y;
            }
        }
        
        // Render with appropriate method
        if (isMobile) {
            this.renderer.render(this.scene, this.camera);
        } else {
            this.composer.render();
        }
        
        this.rafID = requestAnimationFrame(this.render.bind(this));
    }

    destroy() {
        this.isActive = false;
        
        // Stop the render loop first
        if (this.rafID) {
            cancelAnimationFrame(this.rafID);
            this.rafID = null;
        }

        // Remove scroll update listener
        if (this.smoothScroll) {
            if (this.scrollUpdateHandler) {
                this.smoothScroll.off('update', this.scrollUpdateHandler);
            }
            this.smoothScroll = null;
        }

        // Clear all meshes and materials
        if (this.imageStore) {
            this.imageStore.forEach(item => {
                if (item.mesh) {
                    this.scene.remove(item.mesh);
                    if (item.mesh.geometry) item.mesh.geometry.dispose();
                }
                if (item.material) {
                    if (item.material.uniforms) {
                        Object.values(item.material.uniforms).forEach(uniform => {
                            if (uniform.value && uniform.value.dispose) {
                                uniform.value.dispose();
                            }
                        });
                    }
                    item.material.dispose();
                }
            });
            this.imageStore = null;
        }

        // Clean up renderer
        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }

        // Clean up composer if it exists
        if (this.composer) {
            this.composer.passes.forEach(pass => {
                if (pass.dispose) pass.dispose();
            });
            this.composer = null;
        }

        // Clear scene
        if (this.scene) {
            while(this.scene.children.length > 0) { 
                const object = this.scene.children[0];
                this.scene.remove(object);
            }
        }

        // Clear references
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        window.homeSketch = null;
    }

    setupContainer() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // Use a more mobile-friendly approach
            Object.assign(this.container.style, {
                position: 'absolute',
                top: '0px',
                left: '0px',
                width: '100%',
                height: '100%',
                overflow: 'hidden'
            });
            
            // For iOS specifically
            if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                document.body.style.height = '100%';
                document.documentElement.style.height = '100%';
                document.documentElement.style.overflow = 'hidden';
            }
        } else {
            // Desktop approach
            Object.assign(this.container.style, {
                position: 'fixed',
                top: '0px',
                left: '0px',
                width: '100%',
                height: '100%',
                contain: 'content'
            });
        }
    }

    // Improved fixMeshOrientation method to create a perfect cylinder surface effect
    fixMeshOrientation() {
        if (!this.imageStore || !this._inCircleView) return;
        
        console.log("Fixing mesh orientations for perfect inward-facing cylinder");
        
        // Get all meshes to properly face the center
        this.imageStore.forEach((item) => {
            if (!item._cylinderData) return;
            
            // Get the mesh's position relative to the center
            const meshPosition = item.mesh.position;
            
            // Calculate angle from center to mesh position in the XZ plane
            const angle = Math.atan2(meshPosition.z, meshPosition.x);
            
            // Reset rotation completely to avoid compounding effects
            item.mesh.rotation.set(0, 0, 0);
            
            // Apply precise rotation to face directly toward center
            // This is the key change - exactly PI (180 degrees) from the position angle
            item.mesh.rotation.y = angle + Math.PI;
            
            // Store for reference
            if (!item._cylinderData.originalRotation) {
                item._cylinderData.originalRotation = item.mesh.rotation.clone();
            }
        });
        
        // Force an immediate render to see changes
        if (this.renderer) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    // Update switchToCircleView to add a 360° rotation during the fan-out phase
    switchToCircleView() {
        if (!this.imageStore) return;
        
        console.log("Creating stacked origin expansion with arc transitions and 360° rotation");
        
        // Save original setPosition for later restoration
        if (!this._originalSetPosition) {
            this._originalSetPosition = this.setPosition;
            this.setPosition = () => { /* Empty function */ };
        }
        
        // Disable scroll during transition
        if (this.smoothScroll) {
            try {
                if (this.scrollUpdateHandler) {
                    this.smoothScroll.off('update', this.scrollUpdateHandler);
                }
                this.smoothScroll.disable();
            } catch (error) {
                console.warn("Error disabling scroll:", error);
            }
        }
        
        // Set flag for circle view
        this._inCircleView = true;
        
        // Create or reuse a container for the circle arrangement
        if (!this._circleContainer) {
            this._circleContainer = new THREE.Group();
            this.scene.add(this._circleContainer);
        }
        
        // Calculate optimal cylinder properties
        const numMeshes = this.imageStore.length;
        const radius = 350; // Keep consistent radius
        
        // IMPORTANT: Create the cylinder visual first to establish reference
        this.createDraggableCylinder(radius);
        
        // Get average dimensions for consistent sizing
        const avgWidth = this.imageStore.reduce((sum, item) => sum + item.width, 0) / numMeshes;
        const avgHeight = this.imageStore.reduce((sum, item) => sum + item.height, 0) / numMeshes;
        
        // Spacing factor for good separation
        const spacingFactor = 1.5;
        
        // Calculate the angular spread with spacing
        const totalAngle = Math.PI * 2; // Complete circle
        const anglePerMesh = totalAngle / (numMeshes * (1 + spacingFactor));
        const spacedAnglePerMesh = anglePerMesh * (1 + spacingFactor);
        
        // Define central stack position (slightly elevated for better visibility)
        const stackPosition = new THREE.Vector3(0, 30, 0);
        
        // Pre-calculation phase - store all target positions and states
        this.imageStore.forEach((item, index) => {
            // Store current carousel position
            item._carouselPosition = {
                x: item.mesh.position.x,
                y: item.mesh.position.y,
                z: item.mesh.position.z,
                scaleX: item.mesh.scale.x,
                scaleY: item.mesh.scale.y,
                rotationX: item.mesh.rotation.x,
                rotationY: item.mesh.rotation.y,
                rotationZ: item.mesh.rotation.z
            };
            
            // Calculate evenly spaced angle around circle
            const angle = index * spacedAnglePerMesh;
            
            // Calculate position on cylinder using angle
            const posX = Math.sin(angle) * radius;
            const posZ = Math.cos(angle) * radius;
            
            // Material setup
            item.material.side = THREE.DoubleSide;
            
            // Store data for cylinder view
            item._cylinderData = {
                angle,
                index,
                isHighlighted: false,
                originalPosition: new THREE.Vector3(posX, 0, posZ),
                targetScale: {
                    x: item.mesh.scale.x * 0.75,
                    y: item.mesh.scale.y * 0.75,
                    z: 1
                }
            };
            
            // IMMEDIATELY move mesh to circle container to avoid flickering
            if (this.scene.children.includes(item.mesh)) {
                this.scene.remove(item.mesh);
                this._circleContainer.add(item.mesh);
                
                // Keep the mesh at its current position initially
                item.mesh.position.set(
                    item._carouselPosition.x, 
                    item._carouselPosition.y, 
                    item._carouselPosition.z
                );
            }
        });
        
        // Create master timeline for the animation sequence
        const masterTl = gsap.timeline({
            onComplete: () => {
                console.log("Fan-out animation complete, applying final orientation");
                
                // Apply precise facing-inward rotation after animation completes
                this.imageStore.forEach((item) => {
                    if (!item._cylinderData) return;
                    
                    // Get position relative to center
                    const pos = item.mesh.position;
                    
                    // Calculate angle to center in the XZ plane
                    // This makes the mesh face inward toward the center
                    const angleToCenter = Math.atan2(pos.x, pos.z);
                    
                    // Apply rotation to face inward
                    item.mesh.rotation.set(0, angleToCenter, 0);
                });
                
                // Set up interactions after orientation is fixed
                this.setupCylinderInteractions();
            }
        });
        
        // Define animation timing constants at this scope level
        const gatherDuration = 0.8;
        const pauseDuration = 0.4;
        const fanOutDuration = 2.0; // Extended duration for the fan-out phase to accommodate rotation
        
        // PHASE 1: First gather all items to the center stack
        // Add a subtle scale down during gathering to make the effect more dramatic
        this.imageStore.forEach((item, index) => {
            // Calculate timing for the gathering phase
            const gatherDelay = index * 0.03; // Small stagger for gathering
            
            // Animate to central stack position
            masterTl.to(item.mesh.position, {
                x: stackPosition.x,
                y: stackPosition.y,
                z: stackPosition.z,
                duration: gatherDuration,
                ease: "power2.inOut",
                delay: gatherDelay
            }, 0);
            
            // Slightly scale down while gathering
            masterTl.to(item.mesh.scale, {
                x: item._cylinderData.targetScale.x * 0.8,
                y: item._cylinderData.targetScale.y * 0.8,
                z: 1,
                duration: gatherDuration,
                ease: "power2.inOut",
                delay: gatherDelay
            }, 0);
            
            // Rotate toward center while gathering
            masterTl.to(item.mesh.rotation, {
                x: 0,
                y: 0,
                z: 0,
                duration: gatherDuration,
                ease: "power2.inOut",
                delay: gatherDelay
            }, 0);
            
            // Fade items slightly during gathering
            masterTl.to(item.material.uniforms.hoverState, {
                value: 0.4, // Partially visible
                duration: gatherDuration * 0.8,
                ease: "power1.inOut",
                delay: gatherDelay
            }, 0);
        });
        
        // PHASE 2: Add 360° rotation to the entire container while fanning out
        // Reset container rotation to a starting point first (slightly negative to create momentum)
        masterTl.set(this._circleContainer.rotation, { y: -0.2 }, gatherDuration + pauseDuration * 0.5);
        
        // Perform the 360° rotation during the fan-out phase
        // Using a complete rotation (2*PI radians = 360 degrees)
        masterTl.to(this._circleContainer.rotation, {
            y: Math.PI * 2 - 0.2, // Full rotation (minus initial offset)
            duration: fanOutDuration,
            ease: "power1.inOut" // Smooth acceleration and deceleration
        }, gatherDuration + pauseDuration);
        
        // PHASE 3: Fan out to cylinder positions with beautiful arcs
        // Sort items for organized wave spreading
        const sortedIndices = [...Array(numMeshes).keys()].sort((a, b) => {
            const angleA = this.imageStore[a]._cylinderData.angle;
            const angleB = this.imageStore[b]._cylinderData.angle;
            return angleA - angleB;
        });
        
        // Now animate the fan-out with arcs
        sortedIndices.forEach((itemIndex, sortedIdx) => {
            const item = this.imageStore[itemIndex];
            
            // Calculate timing for the fan-out phase
            const delayFactor = sortedIdx / sortedIndices.length;
            const fanOutDelay = delayFactor * 0.8; // Shorter spread for quicker fan
            
            // Timing offset starts after gathering phase + pause
            const timeOffset = gatherDuration + pauseDuration;
            
            // Set up the start position (stack center) and end position (cylinder position)
            const startPos = {
                x: stackPosition.x,
                y: stackPosition.y,
                z: stackPosition.z
            };
            
            const endPos = {
                x: item._cylinderData.originalPosition.x,
                y: 0, // Final y position
                z: item._cylinderData.originalPosition.z
            };
            
            // Calculate 3D distance for arc height
            const distance = Math.sqrt(
                Math.pow(endPos.x - startPos.x, 2) + 
                Math.pow(endPos.z - startPos.z, 2) +
                Math.pow(endPos.y - startPos.y, 2)
            );
            
            // Fan-out with 3D arc motion
            masterTl.to(item.mesh.position, {
                duration: fanOutDuration,
                ease: "power2.inOut",
                delay: fanOutDelay,
                onUpdate: function() {
                    // Get current progress (0 to 1)
                    const progress = this.progress();
                    
                    // Linear interpolation for x and z
                    item.mesh.position.x = startPos.x + (endPos.x - startPos.x) * progress;
                    item.mesh.position.z = startPos.z + (endPos.z - startPos.z) * progress;
                    
                    // Enhanced arc height - higher for more dramatic effect
                    const arcHeight = distance * 0.35; // Increased height factor
                    const arcOffset = Math.sin(Math.PI * progress) * arcHeight;
                    
                    // Calculate base y-position with linear interpolation
                    const baseY = startPos.y + (endPos.y - startPos.y) * progress;
                    
                    // Apply the arc offset to create the sinc-like motion
                    item.mesh.position.y = baseY + arcOffset;
                }
            }, timeOffset);
            
            // Coordinate rotation during fan-out
            // Note: We don't need to adjust rotation for container rotation since they're parented to the container
            masterTl.to(item.mesh.rotation, {
                x: 0,
                y: item._cylinderData.angle,
                z: 0,
                duration: fanOutDuration,
                ease: "power2.inOut",
                delay: fanOutDelay
            }, timeOffset);
            
            // Scale to final size during fan-out
            masterTl.to(item.mesh.scale, {
                x: item._cylinderData.targetScale.x,
                y: item._cylinderData.targetScale.y,
                z: 1,
                duration: fanOutDuration * 0.8,
                ease: "back.out(1.2)",
                delay: fanOutDelay
            }, timeOffset);
            
            // Enhance visibility during fan-out for dramatic effect
            // Start with a flash of brightness
            masterTl.to(item.material.uniforms.hoverState, {
                value: 1.2, // Briefly brighten
                duration: fanOutDuration * 0.3,
                ease: "power1.out",
                delay: fanOutDelay
            }, timeOffset);
            
            // Settle to final visibility
            masterTl.to(item.material.uniforms.hoverState, {
                value: 0.8, // Final settled state
                duration: fanOutDuration * 0.5,
                ease: "power1.out",
                delay: fanOutDelay + 0.3
            }, timeOffset + 0.3);
        });
        
        return masterTl;
    }

    // Also update createDraggableCylinder to match the new radius
    createDraggableCylinder(radius) {
        console.log("Creating properly oriented cylinder with radius:", radius);
        
        // Clean up existing cylinder
        if (this._dragCylinder) {
            this._circleContainer.remove(this._dragCylinder);
            if (this._dragCylinder.geometry) this._dragCylinder.geometry.dispose();
            if (this._dragCylinder.material) this._dragCylinder.material.dispose();
            this._dragCylinder = null;
        }
        
        // Clean up existing helpers
        if (this._ringHelper) {
            this._circleContainer.remove(this._ringHelper);
            if (this._ringHelper.geometry) this._ringHelper.geometry.dispose();
            if (this._ringHelper.material) this._ringHelper.material.dispose();
            this._ringHelper = null;
        }
        
        // Create cylinder geometry with more segments for smoother appearance
        const cylinderGeometry = new THREE.CylinderGeometry(
            radius, radius, 150, 72, 4, true
        );
        
        // Create a more visible but subtle material
        const cylinderMaterial = new THREE.MeshBasicMaterial({
            color: 0x4da6ff,
            transparent: true,
            opacity: 0.2, // Even more transparent for a subtler wireframe
            wireframe: true,
            wireframeLinewidth: 1.5, // Slightly thinner lines
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        // Create and position the cylinder
        this._dragCylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
        this._dragCylinder.position.set(0, 0, 0);
        
        this._circleContainer.add(this._dragCylinder);
        
        // Make cylinder intercept events
        this._dragCylinder.renderOrder = 1;
        
        // Initialize drag properties
        this._lastRotationY = this._circleContainer.rotation.y || 0;
        this._isDragging = false;
        
        if (!this._dragInertia) {
            this._dragInertia = { x: 0, y: 0 };
        }
        
        // Set up the drag interaction
        this.setupCylinderDrag();
        
        // Store radius for reference
        this.cylinderRadius = radius;
        
        return this._dragCylinder;
    }

    // Update the rotation behavior to feel more natural
    handleDragMove(e) {
        if (!this._inCircleView || !this._isDragging) return;
        
        // Calculate movement since last position
        const deltaX = e.clientX - this._lastMouseX;
        
        // Make rotation speed proportional to screen width for consistent feel
        const rotationFactor = 0.01 * (1000 / window.innerWidth);
        
        // Update rotation based on mouse movement - Y axis only
        this._circleContainer.rotation.y += deltaX * rotationFactor;
        
        // Update inertia for smooth deceleration
        this._dragInertia.x = deltaX * rotationFactor * 0.5;
        
        // Save current position for next calculation
        this._lastMouseX = e.clientX;
        this._lastMouseY = e.clientY;
        
        // Update visibility based on new positions
        if (typeof this.updateCylinderVisibility === 'function') {
            this.updateCylinderVisibility();
        }
        
        // After updating cylinder position via drag, call shared update method
        this.updateCylindersAfterMovement();
    }

    // Add cleanup for new helper objects
    cleanupCylinderEvents() {
        // Existing cleanup code...
        
        // Remove ring helper
        if (this._ringHelper) {
            this._circleContainer.remove(this._ringHelper);
            if (this._ringHelper.geometry) this._ringHelper.geometry.dispose();
            if (this._ringHelper.material) this._ringHelper.material.dispose();
            this._ringHelper = null;
        }
        
        // Remove axis helpers
        if (this._xAxisHelper) {
            this._circleContainer.remove(this._xAxisHelper);
            if (this._xAxisHelper.geometry) this._xAxisHelper.geometry.dispose();
            if (this._xAxisHelper.material) this._xAxisHelper.material.dispose();
            this._xAxisHelper = null;
        }
        
        if (this._zAxisHelper) {
            this._circleContainer.remove(this._zAxisHelper);
            if (this._zAxisHelper.geometry) this._zAxisHelper.geometry.dispose();
            if (this._zAxisHelper.material) this._zAxisHelper.material.dispose();
            this._zAxisHelper = null;
        }
        
        // Remove scroll event listener
        window.removeEventListener('wheel', this.handleScrollRotation);
        
        // ... rest of existing cleanup code...
    }

    // Update which items should be visible based on their position
    updateCylinderVisibility() {
        if (!this._inCircleView || !this.imageStore) return;
        
        // Calculate the front direction in world space
        const frontDirection = new THREE.Vector3(0, 0, -1);
        frontDirection.applyQuaternion(this.camera.quaternion);
        
        this.imageStore.forEach(item => {
            if (!item._cylinderData) return;
            
            // Get world position of this mesh
            const worldPos = new THREE.Vector3();
            item.mesh.getWorldPosition(worldPos);
            
            // Direction from camera to mesh
            const toMesh = worldPos.clone().sub(this.camera.position).normalize();
            
            // Calculate dot product to determine if mesh is facing camera
            const dotProduct = frontDirection.dot(toMesh);
            
            // More visible if facing camera
            const visibility = 0.3 + Math.max(0, dotProduct) * 0.7;
            
            // Update visibility if not currently being hovered
            if (this._hoverIndex !== item._cylinderData.index) {
                gsap.to(item.material.uniforms.hoverState, {
                    value: visibility,
                    duration: 0.2,
                    ease: "power1.out"
                });
            }
        });
    }

    // Setup consistent cylinder interactions
    setupCylinderInteractions() {
        // Clean up any existing handlers first
        this.cleanupCylinderEvents();
        
        // Create mousemove handler
        this._circleModeMouseMove = (e) => {
            if (!this._inCircleView || !this.imageStore || this._isDragging) {
                // Skip hover detection if we're dragging
                return;
            }
            
            // Get normalized mouse coordinates
            const mouse = new THREE.Vector2();
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            
            // Use a more targeted approach
            this.raycaster.setFromCamera(mouse, this.camera);
            
            // Get only the mesh objects we care about
            let meshes = [];
            this.imageStore.forEach(item => {
                if (item.mesh) meshes.push(item.mesh);
            });
            
            const intersects = this.raycaster.intersectObjects(meshes, false);
            
            let foundHover = false;
            let hoveredIndex = null;
            
            if (intersects.length > 0) {
                // Get the index of the intersected mesh
                const mesh = intersects[0].object;
                this.imageStore.forEach((item, idx) => {
                    if (item.mesh === mesh) {
                        hoveredIndex = idx;
                        foundHover = true;
                    }
                });
                
                // If we found a hover and it's different from the current hover
                if (foundHover && this._hoverIndex !== hoveredIndex) {
                    // Reset previous hover if there was one
                    if (this._hoverIndex !== null && this._hoverIndex !== undefined) {
                        if (typeof this.resetCylinderHover === 'function') {
                            this.resetCylinderHover(this._hoverIndex);
                        }
                    }
                    
                    // Set new hover
                    if (typeof this.setCylinderHover === 'function') {
                        this.setCylinderHover(hoveredIndex);
                    }
                    this._hoverIndex = hoveredIndex;
                }
            } else if (!foundHover && this._hoverIndex !== null) {
                // Reset previous hover
                if (typeof this.resetCylinderHover === 'function') {
                    this.resetCylinderHover(this._hoverIndex);
                }
                this._hoverIndex = null;
            }
        };
        
        // Create click handler
        this._circleModeClick = (e) => {
            // Skip if we just finished dragging
            if (!this._inCircleView || this._hoverIndex === null || this._isDragging) {
                return;
            }
            
            // Add a small delay to avoid accidental clicks right after dragging
            setTimeout(() => {
                // Only proceed if we're sure it's a deliberate click
                if (!this._isDragging && this._hoverIndex !== null) {
                    this.handleCylinderClick(this._hoverIndex);
                }
            }, 10);
        };
        
        // Attach the handlers
        window.addEventListener('mousemove', this._circleModeMouseMove);
        window.addEventListener('click', this._circleModeClick);
        
        // Initialize with no hover
        this._hoverIndex = null;
        
        // Set default state for all meshes
        if (this.imageStore) {
            this.imageStore.forEach((item, idx) => {
                // Set neutral state (slightly visible)
                gsap.to(item.material.uniforms.hoverState, {
                    value: 0.8,
                    duration: 0.3
                });
            });
        }
        
        // Add scroll event listener for rotating the cylinder
        this.handleScrollRotation = this.handleScrollRotation.bind(this);
        window.addEventListener('wheel', this.handleScrollRotation);
    }

    handleScrollRotation(event) {
        if (!this._inCircleView) return;
        
        // Get the delta from the scroll event
        const delta = event.deltaY || event.detail || -event.wheelDelta;
        
        // Calculate rotation amount based on scroll delta
        // Adjust the multiplier to control sensitivity
        const rotationAmount = delta * 0.001;
        
        // Apply rotation to the cylinder
        if (this._circleContainer) {
            this._circleContainer.rotation.y += rotationAmount;
            
            // Update visual state of cylinders based on their new position
            this.updateCylindersAfterMovement();
        }
        
        // Prevent default scrolling behavior while in circle view
        event.preventDefault();
    }

    // This method can be called after both drag and scroll interactions
    updateCylindersAfterMovement() {
        // Update the visual appearance of cylinders based on their position in the rotation
        if (!this.imageStore || !this.imageStore.length) return;
        
        this.imageStore.forEach((item, index) => {
            // Calculate the relative position in the rotation
            const angle = ((index / this.imageStore.length) * Math.PI * 2) + this._circleContainer.rotation.y;
            
            // Determine if this item is in the "front" of the rotation
            const isFront = Math.cos(angle) > 0.7;
            
            // Scale up items in the front
            if (isFront && !item._cylinderData.isHighlighted) {
                this.setCylinderHover(index);
            } else if (!isFront && item._cylinderData.isHighlighted) {
                this.resetCylinderHover(index);
            }
        });
    }

    // Handle click on a mesh in cylinder view
    handleCylinderClick(index) {
        if (!this.imageStore[index] || !this._inCircleView) return;
        
        const item = this.imageStore[index];
        console.log(`Cylinder mesh ${index} clicked`);
        
        // Create animation timeline
        const tl = gsap.timeline({
            onComplete: () => {
                this.clickAnimationCompleted = true;
                
                // Navigate if item has a link
                const link = item.img.getAttribute('data-url') || 
                          (item.img.parentElement && item.img.parentElement.getAttribute('href'));
                
                if (link) {
                    setTimeout(() => {
                        window.location.href = link;
                    }, 600);
                }
            }
        });
        
        // Corner animation (same as in carousel)
        tl.to(item.material.uniforms.uCorners.value, { x: 1, duration: 1.1, ease: 'expo.out' }, 0.1)
          .to(item.material.uniforms.uCorners.value, { y: 1, duration: 1.1, ease: 'expo.out' }, 0.3)
          .to(item.material.uniforms.uCorners.value, { z: 1, duration: 1.1, ease: 'expo.out' }, 0.2)
          .to(item.material.uniforms.uCorners.value, { w: 1, duration: 1.1, ease: 'expo.out' }, 0.4);
        
        // Flash effect
        tl.to(item.material.uniforms.hoverState, {
            value: 1.5,
            duration: 0.3,
            ease: 'power2.out',
            yoyo: true,
            repeat: 1
        }, 0);
    }

    // Setup consistent cylinder interactions
    setupCylinderDrag() {
        console.log("Setting up cylinder drag with click pass-through");
        // Track drag state
        this._isDragging = false;
        this._lastMouseX = 0;
        this._lastMouseY = 0;
        
        // Remove any existing event listeners first
        if (this._dragStartHandler) {
            window.removeEventListener('mousedown', this._dragStartHandler);
            window.removeEventListener('mousemove', this._dragMoveHandler);
            window.removeEventListener('mouseup', this._dragEndHandler);
            window.removeEventListener('mouseleave', this._dragLeaveHandler);
            window.removeEventListener('touchstart', this._handleTouchStart);
            window.removeEventListener('touchmove', this._handleTouchMove);
            window.removeEventListener('touchend', this._handleTouchEnd);
            window.removeEventListener('dblclick', this._handleDblClick);
        }
        
        // Define handlers as direct functions (not methods)
        this._dragStartHandler = (e) => {
            if (!this._inCircleView) return;
            
            // Always enable dragging without raycasting for better UX
            this._isDragging = true;
            this._lastMouseX = e.clientX;
            this._lastMouseY = e.clientY;
            
            // Add a visual indicator for dragging
            document.body.style.cursor = 'grabbing';
            
            // Highlight the cylinder to indicate dragging
            if (this._dragCylinder) {
                gsap.to(this._dragCylinder.material, {
                    opacity: 0.4,
                    duration: 0.2
                });
            }
            
            // No longer prevent propagation - allow clicks to pass through
            // e.stopPropagation(); - REMOVED
        };
        
        this._dragMoveHandler = (e) => {
            if (!this._inCircleView || !this._isDragging) return;
            
            // Calculate movement since last position
            const deltaX = e.clientX - this._lastMouseX;
            
            // Make rotation speed proportional to screen width for consistent feel
            const rotationFactor = 0.01 * (1000 / window.innerWidth);
            
            // Update rotation based on mouse movement - Y axis only
            this._circleContainer.rotation.y += deltaX * rotationFactor;
            
            // Update inertia for smooth deceleration
            this._dragInertia.x = deltaX * rotationFactor * 0.5;
            
            // Save current position for next calculation
            this._lastMouseX = e.clientX;
            this._lastMouseY = e.clientY;
            
            // Update visibility based on new positions
            if (typeof this.updateCylinderVisibility === 'function') {
                this.updateCylinderVisibility();
            }
        };
        
        this._dragEndHandler = () => {
            if (!this._inCircleView) return;
            
            this._isDragging = false;
            document.body.style.cursor = 'auto';
            
            // Return cylinder to normal opacity
            if (this._dragCylinder) {
                gsap.to(this._dragCylinder.material, {
                    opacity: 0.3,
                    duration: 0.3
                });
            }
        };
        
        this._dragLeaveHandler = this._dragEndHandler;
        
        // Add event listeners
        window.addEventListener('mousedown', this._dragStartHandler);
        window.addEventListener('mousemove', this._dragMoveHandler);
        window.addEventListener('mouseup', this._dragEndHandler);
        window.addEventListener('mouseleave', this._dragLeaveHandler);
        
        // Add touch support without preventing defaults
        this._handleTouchStart = (e) => {
            if (e.touches.length === 1 && this._inCircleView) {
                const touch = e.touches[0];
                this._isDragging = true;
                this._lastMouseX = touch.clientX;
                this._lastMouseY = touch.clientY;
            }
        };
        
        this._handleTouchMove = (e) => {
            if (e.touches.length === 1 && this._isDragging && this._inCircleView) {
                const touch = e.touches[0];
                const deltaX = touch.clientX - this._lastMouseX;
                const rotationFactor = 0.01 * (1000 / window.innerWidth);
                
                this._circleContainer.rotation.y += deltaX * rotationFactor;
                this._dragInertia.x = deltaX * rotationFactor * 0.5;
                
                this._lastMouseX = touch.clientX;
                this._lastMouseY = touch.clientY;
                
                if (typeof this.updateCylinderVisibility === 'function') {
                    this.updateCylinderVisibility();
                }
                
                // We still need to prevent default on touch move to prevent page scrolling
                e.preventDefault();
            }
        };
        
        this._handleTouchEnd = () => {
            this._isDragging = false;
        };
        
        window.addEventListener('touchstart', this._handleTouchStart, { passive: false });
        window.addEventListener('touchmove', this._handleTouchMove, { passive: false });
        window.addEventListener('touchend', this._handleTouchEnd);
        
        // Add double-click for auto-rotation
        this._handleDblClick = () => {
            if (this._inCircleView) {
                this._autoRotate = !this._autoRotate;
                console.log('Auto-rotate:', this._autoRotate ? 'enabled' : 'disabled');
            }
        };
        
        window.addEventListener('dblclick', this._handleDblClick);
        
        console.log("Cylinder drag events setup complete");
    }

    // Now let's properly implement the setCylinderHover and resetCylinderHover methods
    setCylinderHover(index) {
        console.log(`Setting cylinder hover for index ${index}`);
        if (!this.imageStore || !this.imageStore[index]) return;
        
        const item = this.imageStore[index];
        if (!item._cylinderData) return;
        
        // Highlight the hovered item
        gsap.to(item.material.uniforms.hoverState, {
            value: 1.2, // Increase visibility for hover effect
            duration: 0.3,
            ease: "power2.out"
        });
        
        // Slightly scale up for emphasis
        gsap.to(item.mesh.scale, {
            x: item._cylinderData.targetScale.x * 1.05,
            y: item._cylinderData.targetScale.y * 1.05,
            duration: 0.3,
            ease: "back.out(1.5)"
        });
    }

    resetCylinderHover(index) {
        console.log(`Resetting cylinder hover for index ${index}`);
        if (!this.imageStore || !this.imageStore[index]) return;
        
        const item = this.imageStore[index];
        if (!item._cylinderData) return;
        
        // Return to normal visibility
        gsap.to(item.material.uniforms.hoverState, {
            value: 0.8, // Back to default visibility in circle view
            duration: 0.3,
            ease: "power2.out"
        });
        
        // Return to normal scale
        gsap.to(item.mesh.scale, {
            x: item._cylinderData.targetScale.x,
            y: item._cylinderData.targetScale.y,
            duration: 0.3,
            ease: "power2.out"
        });
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