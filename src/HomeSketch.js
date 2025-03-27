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
        if (!this.imageStore) return;

        console.log("Creating fluid interpolation back to carousel");
        
        // Determine which view we're returning from
        const fromCircleView = this._inCircleView;
        
        // Reset view flags immediately
        this._inCircleView = false;
        this._inListView = false;
        
        // If coming from circle view, clean up events
        if (fromCircleView) {
            this.cleanupCylinderEvents();
            
            // Hide visual helpers if any
            if (this._circleHelper) {
                gsap.to(this._circleHelper.material, {
                    opacity: 0,
                    duration: 0.3
                });
            }
        }
        
        // Create master timeline
        const masterTl = gsap.timeline({
            onComplete: () => {
                // Clean up after animation completes
                if (this._circleHelper) {
                    this._circleContainer?.remove(this._circleHelper);
                    this._circleHelper.geometry?.dispose();
                    this._circleHelper.material?.dispose();
                    this._circleHelper = null;
                }
                
                if (this._circleContainer) {
                    // Move meshes back to scene
                    while (this._circleContainer.children.length > 0) {
                        const child = this._circleContainer.children[0];
                        if (child.type === "Mesh" && this.imageStore.some(item => item.mesh === child)) {
                            this._circleContainer.remove(child);
                            this.scene.add(child);
                        } else {
                            this._circleContainer.remove(child);
                            if (child.geometry) child.geometry.dispose();
                            if (child.material) child.material.dispose();
                        }
                    }
                    
                    this.scene.remove(this._circleContainer);
                    this._circleContainer = null;
                }
                
                // Clean up cylinder data
                this.imageStore.forEach(item => {
                    delete item._cylinderData;
                });
                
                // Restore original hover methods
                if (this._originalSetCylinderHover) {
                    this.setCylinderHover = this._originalSetCylinderHover;
                    this._originalSetCylinderHover = null;
                }
                
                if (this._originalResetCylinderHover) {
                    this.resetCylinderHover = this._originalResetCylinderHover;
                    this._originalResetCylinderHover = null;
                }
                
                // Finally restore scroll
                this.restoreCarouselScroll();
            }
        });
        
        // If coming from circle view, apply mirror-like reverse animation
        if (fromCircleView) {
            // Begin rotating container back to flat position
            masterTl.to(this._circleContainer.rotation, {
                x: 0, 
                y: 0.2, // Partial rotation before main animation
                z: 0,
                duration: 1.2,
                ease: "power2.inOut"
            }, 0);
            
            // Create reverse transition for each mesh
            const numMeshes = this.imageStore.length;
            
            this.imageStore.forEach((item, index) => {
                if (!item._cylinderData) return;
                
                // Calculate normalized index and delay
                const normalizedIndex = index / (numMeshes - 1);
                const delay = 0.1 + 0.2 * normalizedIndex;
                
                // Calculate original carousel position
                const originalX = -this.smoothScroll.currentPos + item.originalLeft - this.width / 2 + item.originalWidth / 2;
                const originalY = -item.originalTop + this.height / 2 - item.originalHeight / 2;
                
                // Current position in circle
                const startPos = item.mesh.position.clone();
                
                // Begin shader transition first
                masterTl.to(item.material.uniforms.uTransitionProgress, {
                    value: 0.8,  // Partial retreat to maintain some effect during movement
                    duration: 0.8,
                    ease: "power1.in",
                    delay: delay
                }, 0.2);
                
                // First move to intermediate position (arc start)
                masterTl.to(item.mesh.position, {
                    x: startPos.x * 0.5 + originalX * 0.5,
                    y: startPos.y * 0.5 + 40 - Math.sin(index) * 20, // Arc up
                    z: startPos.z * 0.5 - 20,
                    duration: 0.9,
                    ease: "power2.inOut",
                    delay: delay
                }, 0.4);
                
                // Then move to final carousel position (arc complete)
                masterTl.to(item.mesh.position, {
                    x: originalX,
                    y: originalY,
                    z: 0,
                    duration: 1.0,
                    ease: "power2.inOut"
                }, 0.4 + delay + 0.8);
                
                // Complete shader transition at the end
                masterTl.to(item.material.uniforms.uTransitionProgress, {
                    value: 0.4, // Mid-transition
                    duration: 0.9,
                    ease: "power1.inOut",
                    delay: delay
                }, 0.4);
                
                // Final shader state
                masterTl.to(item.material.uniforms.uTransitionProgress, {
                    value: 0,
                    duration: 1.0,
                    ease: "power3.out"
                }, 0.4 + delay + 0.8);
                
                // Restore scale with slight bounce
                masterTl.to(item.mesh.scale, {
                    x: item.originalWidth,
                    y: item.originalHeight,
                    z: 1,
                    duration: 1.2,
                    ease: "back.out(1.2)",
                    delay: delay + 0.3
                }, 0.6);
                
                // Restore visibility
                masterTl.to(item.material.uniforms.hoverState, {
                    value: 0,
                    duration: 0.6,
                    ease: "power2.inOut",
                    delay: delay + 0.6
                }, 0.8);
                
                // Near the end of the animation, ensure correct rotation
                masterTl.call(() => {
                    // Reset rotation
                    item.mesh.rotation.set(0, 0, 0);
                    
                    // Fix texture orientation if needed
                    if (item.material._isFlippedForCircle) {
                        const currentTexture = item.material.uniforms.uTexture.value;
                        if (currentTexture) {
                            currentTexture.flipY = !currentTexture.flipY;
                            currentTexture.needsUpdate = true;
                            delete item.material._isFlippedForCircle;
                        }
                    }
                }, null, delay + 1.4);
            });
            
            // Final container rotation to ensure flat
            masterTl.to(this._circleContainer.rotation, {
                x: 0, 
                y: 0, 
                z: 0,
                duration: 0.6,
                ease: "power1.inOut"
            }, 1.8);
        }
        
        return masterTl;
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

    // Update switchToListView to better handle the scroll state
    switchToListView() {
        if (!this.imageStore) return;
    
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
        
        // Center coordinates
        const centerX = 0;
        const centerY = 0;
        
        // Create animation timeline
        const tl = gsap.timeline({
            onComplete: () => {
                console.log("Stack animation complete - meshes centered");
                this.setupEnhancedHoverEvents();
            }
        });
        
        // Move all meshes to center with staggered timing
        this.imageStore.forEach((item, index) => {
            // Store original position for later reference
            item._originalPosition = {
                x: item.mesh.position.x,
                y: item.mesh.position.y,
                z: item.mesh.position.z
            };
            
            // Move to center
            tl.to(item.mesh.position, {
                x: centerX,
                y: centerY,
                z: -index * 10, // Clear z separation for stacking
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

    // Enhanced hover events with click functionality for the list items
    setupEnhancedHoverEvents() {
        const listItems = document.querySelectorAll('.item-list');
        
        // Clear existing listeners
        listItems.forEach(item => {
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
        });
        
        // Get fresh references
        const freshListItems = document.querySelectorAll('.item-list');
        
        console.log(`Setting up hover and click events for ${freshListItems.length} list items`);
        
        // Add nice visual hover effects to each list item
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
            
            // Mouse enter - bring mesh to front
            item.addEventListener('mouseenter', () => {
                if (!this.imageStore || !this._inListView) return;
                
                const prevIndex = this.currentVisibleMeshIndex;
                
                // Hide previous mesh
                if (prevIndex !== meshIndex && this.imageStore[prevIndex]) {
                    // Send back to its place in stack
                    gsap.to(this.imageStore[prevIndex].mesh.position, {
                        z: -prevIndex * 10,
                        duration: 0.4,
                        ease: "power2.out"
                    });
                    
                    // Dim it
                    gsap.to(this.imageStore[prevIndex].material.uniforms.hoverState, {
                        value: 0.2,
                        duration: 0.3
                    });
                }
                
                // Show current mesh
                if (this.imageStore[meshIndex]) {
                    // Bring to front with slight bounce effect
                    gsap.to(this.imageStore[meshIndex].mesh.position, {
                        z: 20, // Well in front
                        duration: 0.5,
                        ease: "back.out(1.7)"
                    });
                    
                    // Full visibility
                    gsap.to(this.imageStore[meshIndex].material.uniforms.hoverState, {
                        value: 1,
                        duration: 0.4
                    });
                    
                    // Update current visible
                    this.currentVisibleMeshIndex = meshIndex;
                }
            });
            
            // Add click event - trigger the mesh's click animation
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
                
                // Add some movement to emphasize the click
                tl.to(meshItem.mesh.position, {
                    z: 30, // Push forward slightly
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
        
        // Optional - add handler for the list container for when mouse leaves the entire list
        const listContainer = document.querySelector('.content-list');
        if (listContainer) {
            listContainer.addEventListener('mouseleave', () => {
                if (!this.imageStore || !this._inListView) return;
                
                // Reset to show first mesh when leaving the list container
                this.imageStore.forEach((item, i) => {
                    gsap.to(item.mesh.position, {
                        z: -i * 10, // Return to original stack order
                        duration: 0.4,
                        ease: "power2.out"
                    });
                    
                    // Reset visibility
                    gsap.to(item.material.uniforms.hoverState, {
                        value: i === 0 ? 0.8 : 0.2,
                        duration: 0.3
                    });
                });
                
                // Reset to first mesh
                this.currentVisibleMeshIndex = 0;
            });
        }
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

    // Update switchToCircleView to use a shader-based transition approach
    switchToCircleView() {
        if (!this.imageStore) return;
        
        console.log("Creating fluid interpolation to circle view");
        
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
        
        // Setup parameters for the final circle arrangement
        const numMeshes = this.imageStore.length;
        
        // Calculate base scale for consistent sizing
        const baseScale = (this.width * 0.12) / 
                        Math.max(
                            this.imageStore.reduce((max, item) => Math.max(max, item.originalWidth), 0),
                            this.imageStore.reduce((max, item) => Math.max(max, item.originalHeight), 0)
                        );
        
        // Calculate circle parameters
        const avgScaledWidth = this.imageStore.reduce((sum, item) => 
            sum + item.originalWidth * baseScale, 0) / numMeshes;
        
        const spacingFactor = 0.05;
        const spacing = avgScaledWidth * spacingFactor;
        
        // Calculate circle radius from circumference
        const totalWidth = (avgScaledWidth + spacing) * numMeshes;
        const radius = totalWidth / (2 * Math.PI);
        
        // Save current positions and prepare meshes
        this.imageStore.forEach((item, index) => {
            // IMPORTANT: Store actual current carousel position for transition
            item._carouselPosition = {
                x: item.mesh.position.x,
                y: item.mesh.position.y,
                z: item.mesh.position.z,
                scaleX: item.mesh.scale.x,
                scaleY: item.mesh.scale.y
            };
            
            // Calculate angle for this mesh in the final circle
            const angle = -Math.PI/2 + (Math.PI * 2 / numMeshes) * index;
            
            // Calculate final position on the circle
            const posX = Math.cos(angle) * radius;
            const posY = 0;
            const posZ = Math.sin(angle) * radius;
            
            // Calculate target scale
            const scaledWidth = item.originalWidth * baseScale;
            const scaledHeight = item.originalHeight * baseScale;
            
            // Initialize or update shader uniforms
            if (!item.material.uniforms.uTransitionProgress) {
                item.material.uniforms.uTransitionProgress = { value: 0 };
                item.material.uniforms.uCircleRadius = { value: radius };
                item.material.uniforms.uCircleCenter = { value: new THREE.Vector2(0, 0) };
                item.material.uniforms.uCircleAngle = { value: angle };
            } else {
                // Update existing uniforms
                item.material.uniforms.uCircleRadius.value = radius;
                item.material.uniforms.uCircleCenter.value = new THREE.Vector2(0, 0);
                item.material.uniforms.uCircleAngle.value = angle;
                item.material.uniforms.uTransitionProgress.value = 0;
            }
            
            // Material needs to be double-sided
            item.material.side = THREE.DoubleSide;
            
            // Store target data for later use
            item._cylinderData = {
                angle,
                originalPosition: new THREE.Vector3(posX, posY, posZ),
                direction: new THREE.Vector3(-posX, 0, -posZ).normalize(),
                index,
                targetScale: {
                    x: scaledWidth,
                    y: scaledHeight,
                    z: 1
                }
            };
            
            // Move mesh to circle container for proper transformation
            if (this.scene.children.includes(item.mesh)) {
                this.scene.remove(item.mesh);
                this._circleContainer.add(item.mesh);
            }
        });
        
        // Create master timeline with key phases
        const masterTl = gsap.timeline({
            onComplete: () => {
                this.fixMeshOrientation();
                this.setupCylinderInteractions();
                console.log("Circle view transition complete");
            }
        });
        
        // Phase 1: Initial preparation - slight movement toward center
        this.imageStore.forEach((item, index) => {
            const normalizedIndex = index / (numMeshes - 1);
            const itemDelay = 0.05 * normalizedIndex;
            
            // Ease items slightly toward center
            masterTl.to(item.mesh.position, {
                x: item._carouselPosition.x * 0.8,
                y: item._carouselPosition.y * 0.8,
                z: item._carouselPosition.z,
                duration: 0.7,
                ease: "power2.inOut",
                delay: itemDelay
            }, 0);
            
            // Begin shader transition
            masterTl.to(item.material.uniforms.uTransitionProgress, {
                value: 0.15, // Just start the effect
                duration: 0.7,
                ease: "power1.in",
                delay: itemDelay
            }, 0);
        });
        
        // Rotate container subtly to prepare for the main movement
        masterTl.to(this._circleContainer.rotation, {
            y: 0.2,
            duration: 0.8,
            ease: "power1.inOut"
        }, 0.2);
        
        // Phase 2: Main transition with path movement
        // Using direct interpolation instead of bezier paths
        this.imageStore.forEach((item, index) => {
            const normalizedIndex = index / (numMeshes - 1);
            
            // Calculate item-specific parameters for organic movement
            const orbitDelay = 0.4 + normalizedIndex * 0.2;
            const targetPos = item._cylinderData.originalPosition;
            
            // Store intermediate position for the arc effect
            const initialX = item._carouselPosition.x * 0.8;
            const initialY = item._carouselPosition.y * 0.8;
            const initialZ = item._carouselPosition.z;
            
            // First move up and slightly forward (arc start)
            masterTl.to(item.mesh.position, {
                x: initialX * 0.6 + targetPos.x * 0.4,
                y: initialY * 0.6 + 50 + Math.sin(index) * 30, // Rise up
                z: initialZ * 0.6 + targetPos.z * 0.4 - 20,
                duration: 0.9,
                ease: "power2.inOut",
                delay: orbitDelay
            }, 0.8);
            
            // Then move to final position (arc complete)
            masterTl.to(item.mesh.position, {
                x: targetPos.x,
                y: targetPos.y,
                z: targetPos.z,
                duration: 1.0,
                ease: "power2.inOut"
            }, 0.8 + orbitDelay + 0.8);
            
            // Animate uniform transition progress in sync with position
            masterTl.to(item.material.uniforms.uTransitionProgress, {
                value: 0.5, // Mid-transition
                duration: 0.9,
                ease: "power1.inOut", 
                delay: orbitDelay
            }, 0.8);
            
            // Complete shader transition
            masterTl.to(item.material.uniforms.uTransitionProgress, {
                value: 1,
                duration: 1.0,
                ease: "power1.inOut"
            }, 0.8 + orbitDelay + 0.8);
            
            // Scale to final size with subtle bounce
            masterTl.to(item.mesh.scale, {
                x: item._cylinderData.targetScale.x,
                y: item._cylinderData.targetScale.y,
                z: 1,
                duration: 1.6,
                ease: "back.out(1.3)",
                delay: orbitDelay + 0.3
            }, 0.9);
            
            // Animate hover state based on final position
            const visibilityFactor = 0.5 + (Math.cos(item._cylinderData.angle) + 1) * 0.25;
            masterTl.to(item.material.uniforms.hoverState, {
                value: visibilityFactor,
                duration: 1.2,
                ease: "power1.inOut",
                delay: orbitDelay + 0.5
            }, 1.1);
            
            // Set final orientation
            masterTl.call(() => {
                item.mesh.lookAt(0, 0, 0);
                item.mesh.rotation.z = Math.PI;
                item._cylinderData.originalRotation = item.mesh.rotation.clone();
            }, null, orbitDelay + 1.7);
        });
        
        // Phase 3: Complete rotation to final state
        masterTl.to(this._circleContainer.rotation, {
            x: 0,
            y: 0.6,
            z: -0.5,
            duration: 1.4,
            ease: "power2.inOut"
        }, 1.2);
        
        return masterTl;
    }

    // Setup consistent cylinder interactions
    setupCylinderInteractions() {
        // Clean up any existing handlers first
        this.cleanupCylinderEvents();
        
        // Create mousemove handler
        this._circleModeMouseMove = (e) => {
            if (!this._inCircleView || !this.imageStore) return;
            
            // Get normalized mouse coordinates
            const mouse = new THREE.Vector2();
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            
            // Cast a ray to detect intersections
            this.raycaster.setFromCamera(mouse, this.camera);
            const intersects = this.raycaster.intersectObjects(this.scene.children, true);
            
            // Reset all hover states first
            let foundHover = false;
            
            // Find if we're hovering over any mesh
            if (intersects.length > 0) {
                // Loop through intersections to find the first image mesh
                for (let i = 0; i < intersects.length; i++) {
                    const obj = intersects[i].object;
                    
                    // Look for meshes from our imageStore
                    for (let j = 0; j < this.imageStore.length; j++) {
                        if (this.imageStore[j].mesh === obj) {
                            // Found a hover
                            if (this._hoverIndex !== j) {
                                // Reset previous hover if there was one
                                if (this._hoverIndex !== null && this._hoverIndex !== undefined) {
                                    this.resetCylinderHover(this._hoverIndex);
                                }
                                
                                // Set new hover
                                this.setCylinderHover(j);
                                this._hoverIndex = j;
                            }
                            foundHover = true;
                            break;
                        }
                    }
                    if (foundHover) break;
                }
            }
            
            // If we're not hovering over any mesh, reset all
            if (!foundHover && this._hoverIndex !== null) {
                // Reset previous hover
                this.resetCylinderHover(this._hoverIndex);
                this._hoverIndex = null;
                
                // Reset all meshes to default state
                this.imageStore.forEach((item, idx) => {
                    gsap.to(item.material.uniforms.hoverState, {
                        value: 0.8, // Default visibility in circle view
                        duration: 0.3
                    });
                });
            }
        };
        
        // Create click handler
        this._circleModeClick = (e) => {
            if (!this._inCircleView || this._hoverIndex === null) return;
            
            // Handle click on currently hovered mesh
            this.handleCylinderClick(this._hoverIndex);
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

    // Cleanup cylinder events when switching views
    cleanupCylinderEvents() {
        if (this._circleModeMouseMove) {
            window.removeEventListener('mousemove', this._circleModeMouseMove);
            this._circleModeMouseMove = null;
        }
        if (this._circleModeClick) {
            window.removeEventListener('click', this._circleModeClick);
            this._circleModeClick = null;
        }
        this._hoverIndex = null;
        
        // Reset all hover states
        if (this.imageStore) {
            this.imageStore.forEach(item => {
                gsap.to(item.material.uniforms.hoverState, {
                    value: 0,
                    duration: 0.3
                });
            });
        }
    }

    // Add this update to fixMeshOrientation to keep track of flipped meshes
    fixMeshOrientation() {
        if (!this.imageStore || !this._inCircleView) return;
        
        // Center position for reference
        const centerPosition = new THREE.Vector3(0, 0, 0);
        
        this.imageStore.forEach((item) => {
            if (!item._cylinderData) return;
            
            const angle = item._cylinderData.angle;
            
            // Check if in the back half of the circle (needs flipping)
            if (Math.abs(angle) > Math.PI/2) {
                if (!item.material._isFlippedForCircle) {
                    // Flip the texture
                    const currentTexture = item.material.uniforms.uTexture.value;
                    if (currentTexture) {
                        currentTexture.flipY = !currentTexture.flipY;
                        currentTexture.needsUpdate = true;
                        
                        // Track that we've flipped this texture
                        item.material._isFlippedForCircle = true;
                        console.log(`Flipped texture for mesh at angle ${angle.toFixed(2)}`);
                    }
                }
            } else {
                // Make sure front-facing meshes are not flipped
                if (item.material._isFlippedForCircle) {
                    const currentTexture = item.material.uniforms.uTexture.value;
                    if (currentTexture) {
                        currentTexture.flipY = !currentTexture.flipY;
                        currentTexture.needsUpdate = true;
                        delete item.material._isFlippedForCircle;
                    }
                }
            }
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