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
import { listAnime, listOutAnime, workAnime, workOutAnime} from './animation';


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

        // Initialize empty registry structure (but not positions yet)
        this.meshRegistry = {
          carousel: [],
          list: [],
          circle: []
        };
      
        // Add after other initialization in constructor
        // this.initializeViewSystem();

        // Initialize registry once image store is ready
        const originalAddObjects = this.addObjects;
        this.addObjects = (...args) => {
          // Call the original method
          originalAddObjects.apply(this, args);
          
          // Calculate initial positions for all views
          if (this.imageStore && this.imageStore.length > 0) {
            console.log("📊 Calculating initial positions for all views");
            
            // Initialize position registries
            this.positionRegistry.carousel = this.calculateCarouselPositions();
            this.positionRegistry.list = this.calculateListPositions();
            this.positionRegistry.circle = this.calculateCirclePositions();
          }
        };

        try {
          // this.cleanupTransitionSystems();
          // this.initializeSingleTransitionSystem();
        } catch (error) {
          console.error("Error initializing transition system:", error);
          
          // Fallback to a simple transition method if all else fails
          this.transitionTo = (targetView) => {
            console.log(`Simple fallback transition to: ${targetView}`);
            
            // Update current view
            this.currentView = targetView;
            
            // Show appropriate content
            document.querySelector('.content').style.display = targetView === 'carousel' ? 'flex' : 'none';
            document.querySelector('.content-list').style.display = targetView === 'list' ? 'flex' : 'none';
            document.querySelector('.content-circle').style.display = targetView === 'circle' ? 'flex' : 'none';
          };
        }

    }

  

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.renderer.setSize(this.width, this.height);
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.camera.fov = 2 * Math.atan((this.height / 2) / 600) * 180 / Math.PI;

        // Update uniforms
        this.materials.forEach(m => {
            m.uniforms.uResolution.value.x = this.width;
            m.uniforms.uResolution.value.y = this.height;
        });

        // Handle circle view resize specifically
        if (this._inCircleView && this._circleContainer) {
            // Recalculate optimal cylinder properties
            const numMeshes = this.imageStore.length;
            
            // Adjust spacing factor based on screen width to maintain proportional spacing
            const baseSpacingFactor = 0.15; // Base spacing as a proportion of screen width
            const spacingFactor = (this.width * baseSpacingFactor) / numMeshes;
            
            // Calculate the angular spread with dynamic spacing
            const totalAngle = Math.PI * 2;
            const anglePerMesh = totalAngle / numMeshes;
            
            // Adjust radius based on screen size and number of meshes
            const baseRadius = this.width * 0.25; // 25% of screen width as base
            const scaleFactor = Math.sqrt(numMeshes / 10);
            const minRadius = this.width * 0.25;
            const maxRadius = this.width * 0.40;
            const radius = Math.min(maxRadius, Math.max(minRadius, baseRadius * scaleFactor));

            // Update cylinder if it exists
            if (this._dragCylinder) {
                this._dragCylinder.geometry.dispose();
                this._dragCylinder.geometry = new THREE.CylinderGeometry(
                    radius, radius, 150, 72, 4, true
                );
            }

            // Update positions of all meshes with proper spacing
            this.imageStore.forEach((item, index) => {
                if (item._cylinderData) {
                    // Calculate angle with even distribution
                    const angle = index * anglePerMesh;
                    
                    // Calculate position on cylinder using angle
                    const posX = Math.sin(angle) * radius;
                    const posZ = Math.cos(angle) * radius;

                    // Update stored data
                    item._cylinderData.angle = angle;
                    item._cylinderData.originalPosition = new THREE.Vector3(posX, 0, posZ);

                    // Update mesh position
                    item.mesh.position.set(posX, 0, posZ);

                    // Scale meshes based on screen size
                    const scaleFactor = Math.min(this.width / 1920, 1) * 0.5; // Adjust scale based on screen width
                    const targetScale = {
                        x: item.originalWidth * scaleFactor,
                        y: item.originalHeight * scaleFactor,
                        z: 1
                    };

                    // Update stored scale data
                    item._cylinderData.targetScale = targetScale;
                    
                    // Apply scale
                    item.mesh.scale.set(targetScale.x, targetScale.y, 1);

                    // Update rotation to face center
                    const angleToCenter = Math.atan2(posX, posZ);
                    item.mesh.rotation.y = angleToCenter;
                }
            });

            // Ensure proper z-index sorting
            this.imageStore.sort((a, b) => {
                const posA = a.mesh.position.z;
                const posB = b.mesh.position.z;
                return posB - posA;
            });

            return; // Exit early since we've handled circle view
        } 
        // Handle list view resize
        else if (this._inListView) {
            const bottomY = -(this.height / 2) * 0.8;
            const zSpacing = 25;
            
            this.imageStore.forEach((item, index) => {
                item.mesh.position.set(0, bottomY, -index * zSpacing);
                
                if (item._originalCarouselData && item._originalCarouselData.scale) {
                    item.mesh.scale.set(
                        item._originalCarouselData.scale.x,
                        item._originalCarouselData.scale.y,
                        1
                    );
                }
            });
            
            return;
        }
        // Standard carousel view update
        else if (this.imageStore && !this._inListView && !this._inCircleView) {
            this.imageStore.forEach(i => {
                const bounds = i.img.getBoundingClientRect();
                
                // ALWAYS set scale directly from bounds in carousel view
                i.mesh.scale.set(bounds.width, bounds.height, 1);
                i.top = bounds.top;
                i.left = bounds.left + (this.smoothScroll ? this.smoothScroll.currentPos : 0);
                i.width = bounds.width;
                i.height = bounds.height;

                if (i.material.uniforms) {
                    i.material.uniforms.uQuadSize.value.x = bounds.width;
                    i.material.uniforms.uQuadSize.value.y = bounds.height;
                    i.material.uniforms.uTextureSize.value.x = bounds.width;
                    i.material.uniforms.uTextureSize.value.y = bounds.height;
                }
            });
            
            this.setPosition();
        }
    }

    // Also update setupResize to properly bind the resize function
    setupResize() {
        // Remove the .bind(this) as it's creating a new function each time
        window.addEventListener('resize', () => {
            this.resize();
        });
    }

    addClickEvents() {
      const secondElements = document.querySelectorAll('.second'); // List button
      const firstElements = document.querySelectorAll('.first');   // Carousel button
      const thirdElements = document.querySelectorAll('.third');   // Circle button
      
      // Initial state: Start in carousel view
      firstElements.forEach(el => el.style.pointerEvents = 'none');
      secondElements.forEach(el => el.style.pointerEvents = 'auto');
      thirdElements.forEach(el => el.style.pointerEvents = 'auto');
  
      // To Circle View (Third button)
      thirdElements.forEach(element => {
          element.addEventListener('click', () => {
              if (this._inCircleView) return;
              
              console.log('Switching to circle view');
              
              const comingFromListView = this._inListView || this.isListViewActive;
              const comingFromCarouselView = !this._inListView && !this._inCircleView;
              
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
  
              const masterTl = gsap.timeline({
                  onComplete: () => {
                      if (comingFromListView) document.querySelector('.content-list').style.display = 'none';
                      if (comingFromCarouselView) document.querySelector('.content').style.display = 'none';
                      this._finalizeCircleViewTransition();
                      const workInTl = workAnime();
                      if (workInTl) workInTl.play();
                  }
              });
  
              if (comingFromListView) {
                  masterTl.add(listOutAnime(), 0);
                  masterTl.call(() => {
                      this.switchToCircleView(comingFromListView, comingFromCarouselView);
                  }, null, 0);
              } else {
                  masterTl.call(() => {
                      this.switchToCircleView(comingFromListView, comingFromCarouselView);
                  }, null, 0);
              }
          });
      });
  
      // To List View (Second button)
      secondElements.forEach(element => {
          element.addEventListener('click', () => {
              if (this._inListView) return;
              
              console.log('Switching to list view');
              
              const comingFromCircleView = this._inCircleView;
              const comingFromCarouselView = !this._inCircleView && !this._inListView;
              
              const listContent = document.querySelector('.content-list');
              if (!listContent) {
                  console.log('List content not found');
                  return;
              }
              listContent.style.display = 'flex';
              
              const masterTl = gsap.timeline({
                  onComplete: () => {
                      if (comingFromCircleView) document.querySelector('.content-circle').style.display = 'none';
                      if (comingFromCarouselView) document.querySelector('.content').style.display = 'none';
                      this._inListView = true;
                      this._inCircleView = false;
                      this.isList = true;
                      this.isListViewActive = true;
                      this.isCircleViewActive = false;
                      firstElements.forEach(el => el.style.pointerEvents = 'auto');
                      secondElements.forEach(el => el.style.pointerEvents = 'none');
                      thirdElements.forEach(el => el.style.pointerEvents = 'auto');
                      const listInTl = listAnime();
                      if (listInTl) listInTl.play();
                  }
              });
  
              if (comingFromCircleView) {
                  masterTl.add(workOutAnime(), 0);
                  masterTl.call(() => {
                      this.switchFromCircleToListView();
                  }, null, 0);
              } else {
                  masterTl.call(() => {
                      this.switchToListView();
                  }, null, 0);
              }
          });
      });
      
      // To Carousel View (First button)
      firstElements.forEach(element => {
          element.addEventListener('click', () => {
              if (!this._inListView && !this._inCircleView) return;
              
              console.log('Returning to carousel view');
              
              const comingFromListView = this._inListView || this.isListViewActive;
              const comingFromCircleView = this._inCircleView || this.isCircleViewActive;
              
              const masterTl = gsap.timeline({
                  onComplete: () => {
                      document.querySelector('.content').style.display = 'inline-flex';
                      if (comingFromListView) document.querySelector('.content-list').style.display = 'none';
                      if (comingFromCircleView) document.querySelector('.content-circle').style.display = 'none';

                  }
              });
              
              if (comingFromListView) {
                  masterTl.add(listOutAnime(), 0);
                  masterTl.call(() => {
                      this.returnToCarouselView(comingFromListView, comingFromCircleView);
                  }, null, 0);
              } else if (comingFromCircleView) {
                  masterTl.add(workOutAnime(), 0);
                  masterTl.call(() => {
                      this.returnToCarouselView(comingFromListView, comingFromCircleView);
                  }, null, 0);
              }
          });
      });
  }
  

  
  // New helper method to finalize Circle view transition
  _finalizeCircleViewTransition() {
      // Update view states
      this._inCircleView = true;
      this._inListView = false;
      this.isList = false;
      this.isListViewActive = false;
      this.isCircleViewActive = true;
      
      // Show circle content
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
      circleContent.style.display = 'flex';
      
      // Update button states
      document.querySelectorAll('.first').forEach(el => el.style.pointerEvents = 'auto');
      document.querySelectorAll('.second').forEach(el => el.style.pointerEvents = 'auto');
      document.querySelectorAll('.third').forEach(el => el.style.pointerEvents = 'none');
  }
  

    // Create an improved returnToCarouselView with smoother animation and texture fixing
    returnToCarouselView(fromListView = null, fromCircleView = null) {
        // Determine which view we're coming from, using parameters if provided
        const comingFromListView = fromListView !== null ? fromListView : this.isListViewActive;
        const comingFromCircleView = fromCircleView !== null ? fromCircleView : this._inCircleView;
        
        console.log("Returning to carousel view from " + (comingFromCircleView ? "circle" : "list") + " view");
        
        // Hide content-circle HTML
        document.querySelector('.content-circle').style.display = 'none';
        
        // Animate cylinder shrinking
        if (this.lineCylinder) {
            gsap.to(this.lineCylinder.scale, {
                y: 0, // Shrink to 0
                duration: 0.8,
                ease: "power2.in",
                onComplete: () => {
                    // Hide when animation completes
                    this.lineCylinder.visible = false;
                }
            });
        }
        
        // Set flags
        this.isListViewActive = false;
        this.isCircleViewActive = false;
        this._inListView = false;
        this._inCircleView = false;
        
        // Prioritize circle view transition if meshes are in circle container,
        // even if we detect coming from list view
        const inCircleContainer = this._circleContainer && 
                                this._circleContainer.children.length > 0 &&
                                this.imageStore.some(item => 
                                    this._circleContainer.children.includes(item.mesh));
        
        // If coming from circle view or meshes are in circle container, use circle transition
        if (comingFromCircleView || inCircleContainer) {
            console.log("Using direct circle to carousel transition");
            
            // Create a master timeline for coordinated animation
            const masterTl = gsap.timeline({
                onComplete: () => {
                    console.log("Carousel transition complete");
                    
                    // Move meshes back to main scene from circle container if needed
                    if (this._circleContainer) {
                        while (this._circleContainer.children.length > 0) {
                            const child = this._circleContainer.children[0];
                            if (child !== this._dragCylinder && 
                                child !== this._ringHelper && 
                                child !== this._xAxisHelper && 
                                child !== this._zAxisHelper) {
                                this._circleContainer.remove(child);
                                this.scene.add(child);
                            } else {
                                this._circleContainer.remove(child);
                            }
                        }
                    }

                    // CRITICAL: Force recalculation of sizes from DOM
                    this.imageStore.forEach(item => {
                        const bounds = item.img.getBoundingClientRect();
                        
                        // Update stored dimensions
                        item.width = bounds.width;
                        item.height = bounds.height;
                        item.top = bounds.top;
                        item.left = bounds.left;

                        // IMPORTANT: Update mesh scale to match DOM exactly
                        item.mesh.scale.set(bounds.width, bounds.height, 1);

                        // Update material uniforms
                        if (item.material.uniforms) {
                            item.material.uniforms.uQuadSize.value.x = bounds.width;
                            item.material.uniforms.uQuadSize.value.y = bounds.height;
                            item.material.uniforms.uTextureSize.value.x = bounds.width;
                            item.material.uniforms.uTextureSize.value.y = bounds.height;
                        }

                        // Clear all transition-related stored data
                        delete item._cylinderData;
                        delete item._carouselPosition;
                        delete item._originalPosition;
                        delete item._originalCarouselData; // Clear this so next transition will store fresh values
                    });

                    // Re-enable scrolling and restore original setPosition
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
            
            // Define animation timing constants for both phases at the top level
            const gatherDuration = 0.6;  // Keep the gathering at a reasonable pace
            const pauseDuration = 0.15;  // Shorter pause (reduced from 0.3)
            const fanOutDuration = 0.7;  // Faster fan out (reduced from 1.2)
            
            // PHASE 1: First gather all items to the center stack
            this.imageStore.forEach((item, index) => {
                // We need carousel position data for the end positions
                if (!item._carouselPosition) {
                    // If no carousel position stored, create one based on current positions
                    item._carouselPosition = {
                        x: item._originalCarouselData ? item._originalCarouselData.x : item.mesh.position.x,
                        y: item._originalCarouselData ? item._originalCarouselData.y : item.mesh.position.y,
                        z: item._originalCarouselData ? item._originalCarouselData.z : item.mesh.position.z,
                        scaleX: item.mesh.scale.x,
                        scaleY: item.mesh.scale.y,
                        rotationX: item.mesh.rotation.x,
                        rotationY: item.mesh.rotation.y,
                        rotationZ: item.mesh.rotation.z
                    };
                }
                
                // Calculate delay for gathering
                const gatherDelay = index * 0.03;
                
                // Animate to central stack with slight delay based on index
                masterTl.to(item.mesh.position, {
                    x: stackPosition.x,
                    y: stackPosition.y,
                    z: stackPosition.z + (index * 8.0),
                    duration: gatherDuration,
                    ease: "power1.inOut",
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
                
            });
            
            // Calculate timeOffset once
            const timeOffset = gatherDuration + pauseDuration;
            
            // PHASE 2: Fan out to carousel positions with arcs
            this.imageStore.forEach((item, index) => {
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
                
                // Determine the target position - use original carousel data if available
                const targetPos = item._originalCarouselData || item._carouselPosition;
                
                const endPos = {
                    x: targetPos.x,
                    y: targetPos.y,
                    z: targetPos.z
                };
                
                // Calculate delay for fan-out - reduce the stagger delay for faster overall animation
                const fanOutDelay = index * 0.025;  // Significantly reduced stagger delay (from 0.04)
                
                // Fan out with linear motion - use a snappier ease
                masterTl.to(item.mesh, {
                    onUpdate: function() {
                        // Get current progress
                        const progress = this.progress();
                        
                        // Simple linear interpolation
                        item.mesh.position.x = startPos.x + (endPos.x - startPos.x) * progress;
                        item.mesh.position.y = startPos.y + (endPos.y - startPos.y) * progress;
                        item.mesh.position.z = startPos.z + (endPos.z - startPos.z) * progress;
                    },
                    duration: fanOutDuration,
                    ease: "power3.out",  // More acceleration at the beginning for snappier feel
                    delay: fanOutDelay
                }, timeOffset);
                
                // Animate rotation back to carousel state - match the faster timing
                masterTl.to(item.mesh.rotation, {
                    x: targetPos.rotationX || 0,
                    y: targetPos.rotationY || 0,
                    z: targetPos.rotation || targetPos.rotationZ || 0,
                    duration: fanOutDuration,
                    ease: "power2.out",  // Snappier ease
                    delay: fanOutDelay
                }, timeOffset);
                
                // Scale back to original carousel size - match the faster timing
                masterTl.to(item.mesh.scale, {
                    x: targetPos.scale ? targetPos.scale.x : targetPos.scaleX,
                    y: targetPos.scale ? targetPos.scale.y : targetPos.scaleY,
                    z: 1, 
                    duration: fanOutDuration,
                    ease: "power2.out",  // Snappier ease
                    delay: fanOutDelay
                }, timeOffset);
                

                
            });
            
            return;
        } 
        // If coming from list view, use that transition
        else if (comingFromListView) {
            // Use existing list-to-carousel transition code...
            console.log("Using direct list to carousel transition");
            
            // Create a master timeline for coordinated animation
            const masterTl = gsap.timeline({
                onComplete: () => {
                    console.log("Carousel transition complete");
                    this.restoreCarouselScroll();
                }
            });
            
            // Use direct animation from list to carousel positions
            this.imageStore.forEach((item, i) => {
                if (item._originalCarouselData) {

                    
                    // Direct animation to final position
                    masterTl.to(item.mesh.position, {
                        x: item._originalCarouselData.x,
                        y: item._originalCarouselData.y,
                        z: item._originalCarouselData.z,
                        duration: 0.8,
                        ease: "power2.out",
                        delay: i * 0.04
                    }, 0.1);
                    
                    // Restore original rotation
                    masterTl.to(item.mesh.rotation, {
                        z: item._originalCarouselData.rotation || 0,
                        duration: 0.7,
                        ease: "power2.out"
                    }, 0.1 + i * 0.04);
                    
                    // Fade back to normal

                }
            });
            
            return;
        } 
        else {
            // Default animation if not coming from list or circle view
            console.log("No specific transition needed");
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
        
        // Store original carousel data ONLY if not already stored
        this.imageStore.forEach(item => {
            if (!item._originalCarouselData) {
                const bounds = item.img.getBoundingClientRect();
                item._originalCarouselData = {
                    x: item.mesh.position.x,
                    y: item.mesh.position.y,
                    z: item.mesh.position.z,
                    rotation: item.mesh.rotation.z,
                    scale: {
                        x: bounds.width,  // Use bounds directly instead of current scale
                        y: bounds.height, // Use bounds directly instead of current scale
                        z: 1
                    }
                };
            }
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
        
        
        // Show list content immediately but hide text elements
        const listContent = document.querySelector('.content-list');
        if (listContent) {
            gsap.set(listContent, { display: 'flex', opacity: 1 });
            // Hide text elements initially
            listContent.querySelectorAll('.indexH2.list, .indexP.list, .indexSpan.list').forEach(el => {
                gsap.set(el, { opacity: 0 });
            });
        }

        const tl = gsap.timeline({
            onStart: () => {
                // Show list content immediately but hide text elements
                const listContent = document.querySelector('.content-list');
                if (listContent) {
                    gsap.set(listContent, { display: 'flex', opacity: 1 });
                    // Hide text elements initially
                    listContent.querySelectorAll('.indexH2.list, .indexP.list, .indexSpan.list').forEach(el => {
                        gsap.set(el, { opacity: 0 });
                    });
                }

                listAnime();
            },
            onComplete: () => {


                // this.setupEnhancedHoverEvents();


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
                

            });
        };
        
        // Add smooth hover effects to each list item
        freshListItems.forEach((item, index) => {
            // Make sure we're working with the correct mesh index
            const meshIndex = parseInt(item.dataset.meshIndex || index);
            

            
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
            },
            vertexShader: vertex,
            fragmentShader: fragment,
        });
    
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.scale.set(300, 300, 1);
        // this.scene.add(this.mesh);

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
            
            // Add the animation offset property
            this._initialAnimationOffset = 1000;
            
            // Animate position offset to zero
            gsap.to(this, {
                _initialAnimationOffset: 0,
                duration: 1.8,
                ease: "expo.out"
            });
            
            // Use your existing scale animation which is already good
            imageStore.forEach(({ mesh, material }, index) => {
                const delay = 0.02 + index * 0.16;

                const tl = gsap.timeline()
                
                tl.from(mesh.scale, {
                    x: 0,
                    y: 0,
                    z: 0,
                    duration: 1.8,
                    ease: 'expo.out',
                    delay: delay
                });
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
                
                o.mesh.position.x = -currentPos + o.left - this.width / 2 + o.width / 2 + (this._initialAnimationOffset || 0);
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
        // Set renderToScreen to false since we'll add another pass
        this.customPass.renderToScreen = false;
        this.composer.addPass(this.customPass);
        
        // Add a noise effect shader pass
        this.noiseEffect = {
            uniforms: {
                "tDiffuse": { value: null },
                "time": { value: 0.0 },
                "noiseIntensity": { value: 0.05 }, // Adjust this for more/less noise
                "noiseScale": { value: 4.0 }       // Adjust this for noise size
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
                uniform float time;
                uniform float noiseIntensity;
                uniform float noiseScale;
                
                // Simple pseudo-random function
                float random(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
                }
                
                // 2D noise
                float noise(vec2 st) {
                    vec2 i = floor(st);
                    vec2 f = fract(st);
                    
                    // Four corners in 2D of a tile
                    float a = random(i);
                    float b = random(i + vec2(1.0, 0.0));
                    float c = random(i + vec2(0.0, 1.0));
                    float d = random(i + vec2(1.0, 1.0));
                    
                    // Smoothstep interpolation
                    vec2 u = smoothstep(0.0, 1.0, f);
                    
                    // Mix 4 corners percentages
                    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
                }
                
                void main() {
                    // Get the original pixel color
                    vec4 originalColor = texture2D(tDiffuse, vUv);
                    
                    // Generate noise value
                    vec2 noiseCoord = vUv * noiseScale;
                    noiseCoord.y += time * 0.2; // Animate noise over time
                    float noiseValue = noise(noiseCoord) * noiseIntensity;
                    
                    // Add noise to the original color
                    vec4 finalColor = originalColor + vec4(vec3(noiseValue), 0.0);
                    
                    gl_FragColor = finalColor;
                }
            `
        };
        
        this.noisePass = new ShaderPass(this.noiseEffect);
        this.noisePass.renderToScreen = true;
        this.composer.addPass(this.noisePass);
    }

    render() {
        if (!this.isActive) return;
        
        // Detect if we're on mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Update time
        this.time += isMobile ? 0.03 : 0.05;
        
        // Update shader uniforms
        this.material.uniforms.time.value = this.time;

        
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


    // Update switchToCircleView to add a 360° rotation during the fan-out phase
    switchToCircleView() {
        if (!this.imageStore) return;
        
        console.log("Creating stacked origin expansion with arc transitions and 360° rotation");
        
        
        // Show content-circle HTML element
        document.querySelector('.content-circle').style.display = 'flex';
        
        
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


        // Spacing factor for good separation
        const spacingFactor = numMeshes * 100;

        // Calculate the angular spread with spacing
        const totalAngle = Math.PI * 2; // Complete circle
        const anglePerMesh = totalAngle / (numMeshes * (1 + spacingFactor));
        const spacedAnglePerMesh = anglePerMesh * (1 + spacingFactor);

        // Base radius that looks good for a typical number of meshes
        const baseRadius = this.width * 0.10;

        // Scale factor based on the number of meshes (square root provides a nice balance)
        // This means radius grows more slowly as mesh count increases
        const scaleFactor = Math.sqrt(numMeshes / 10); // Normalized to look good around 10 meshes

        // Calculate final radius with a minimum and maximum
        const minRadius = this.width * 0.25;
        const maxRadius = this.width * 0.50;
        const radius = Math.min(maxRadius, Math.max(minRadius, baseRadius * scaleFactor));

        // IMPORTANT: Create the cylinder visual first to establish reference
        this.createDraggableCylinder(radius);
        
        // Define central stack position (slightly elevated for better visibility)
        const stackPosition = new THREE.Vector3(0, 0, 0);
        
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
                    x: item.mesh.scale.x * 0.5,
                    y: item.mesh.scale.y * 0.5,
                    z: 0
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
        const fanOutDuration = 1.2; // Extended duration for the fan-out phase to accommodate rotation
        
        // PHASE 1: First gather all items to the center stack
        // Add a subtle scale down during gathering to make the effect more dramatic
        this.imageStore.forEach((item, index) => {
            // Calculate timing for the gathering phase
            const gatherDelay = index * 0.03; // Small stagger for gathering
            
            // Animate to central stack position
            masterTl.to(item.mesh.position, {
                x: stackPosition.x,
                y: stackPosition.y,
                z: stackPosition.z - (index * 5.0),
                duration: gatherDuration,
                ease: "power2.inOut",
                delay: gatherDelay
            }, 0);
            
            // Slightly scale down while gathering
            masterTl.to(item.mesh.scale, {
                x: item._cylinderData.targetScale.x * 0.50,
                y: item._cylinderData.targetScale.y * 0.50,
                z: 0,
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
            

            
            // Fan-out with 3D arc motion
            masterTl.to(item.mesh, {
                // other properties remain the same
                // ...
                onUpdate: function() {
                    // Get current progress
                    const progress = this.progress();
                    
                    // Simple linear interpolation without arc effects
                    item.mesh.position.x = startPos.x + (endPos.x - startPos.x) * progress;
                    item.mesh.position.y = startPos.y + (endPos.y - startPos.y) * progress;
                    item.mesh.position.z = startPos.z + (endPos.z - startPos.z) * progress;
                    
                    // No arcOffset or forwardPush to keep it linear
                }
            }, timeOffset);
            
            // Coordinate rotation during fan-out
            // Note: We don't need to adjust rotation for container rotation since they're parented to the container
            masterTl.to(item.mesh.rotation, {
                x: 0,
                y: item._cylinderData.angle,
                z: 0,
                duration: 0,
                ease: "power2.inOut",
                delay: fanOutDelay
            }, timeOffset);
            
            // Scale to final size during fan-out
            masterTl.to(item.mesh.scale, {
                x: item._cylinderData.targetScale.x,
                y: item._cylinderData.targetScale.y,
                z: 1,
                duration: fanOutDuration * 0.5,
                ease: "expo.out",
                delay: fanOutDelay
            }, timeOffset);
            

        });
        
        // After the gathering phase, but before the fan-out, activate ribbon effect
        masterTl.call(() => {
            // Enable ribbon-like deformation effect
            this.imageStore.forEach(item => {
                if (item.material && item.material.uniforms) {
                    // Set bending amount (adjust value as needed for best visual)

                    // item.material.uniforms.uCylinderRadius.value = radius; // Use your calculated radius
                }
            });
        }, null, gatherDuration + pauseDuration * 0.5);
        
        // After the gathering phase, activate mesh bending during fan-out
        masterTl.call(() => {
            // Enable mesh bending effect

        }, null, gatherDuration + pauseDuration * 0.5);
        
        // Add z-index offset based on index to prevent overlapping
        this.imageStore.forEach((item, i) => {
            // Apply a larger z-offset based on index (0.1 instead of 0.01)
            const zOffset = i * 0.1;
            item.mesh.position.z += zOffset;
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
            opacity: 0, // Even more transparent for a subtler wireframe
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
        const frontDirection = new THREE.Vector3(0, 0, 1);
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
                    }, 600); // Delay navigation to allow animation to complete
                }
            }
        });
        
        // Corner animation (same as in carousel)
        tl.to(item.material.uniforms.uCorners.value, { x: 1, duration: 1.1, ease: 'expo.out' }, 0.1)
          .to(item.material.uniforms.uCorners.value, { y: 1, duration: 1.1, ease: 'expo.out' }, 0.3)
          .to(item.material.uniforms.uCorners.value, { z: 1, duration: 1.1, ease: 'expo.out' }, 0.2)
          .to(item.material.uniforms.uCorners.value, { w: 1, duration: 1.1, ease: 'expo.out' }, 0.4);

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
            
            // No longer prevent propagation - allow clicks to pass through
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
        
    }

    setCylinderHover(index) {
        console.log(`Setting cylinder hover for index ${index}`);
        if (!this.imageStore || !this.imageStore[index]) return;
        
        const item = this.imageStore[index];
        if (!item._cylinderData) return;
          

    }

    resetCylinderHover(index) {

        if (!this.imageStore || !this.imageStore[index]) return;
        
        const item = this.imageStore[index];
        if (!item._cylinderData) return;

    }

    // Add a new method to transition directly from circle view to list view
    switchFromCircleToListView() {
        if (!this.imageStore) return;
        
        // Hide circle content, show list content
        document.querySelector('.content-circle').style.display = 'none';
        document.querySelector('.content-list').style.display = 'flex';
        
        // Prepare the list content - hide text elements initially for animation
        const listContent = document.querySelector('.content-list');
        if (listContent) {
            // Hide text elements initially for animation
            listContent.querySelectorAll('.indexH2.list, .indexP.list, .indexSpan.list').forEach(el => {
                gsap.set(el, { opacity: 0 });
            });
        }
        
        // Clean up cylinder events
        this.cleanupCylinderEvents();
        
        // Animate cylinder shrinking
        if (this.lineCylinder) {
            gsap.to(this.lineCylinder.scale, {
                y: 0, // Shrink to 0
                duration: 0.8,
                ease: "power2.in",
                onComplete: () => {
                    // Hide when animation completes
                    this.lineCylinder.visible = false;
                }
            });
        }
        
        // Create master timeline for the animation sequence
        const masterTl = gsap.timeline({
            onStart: () => {
                // Trigger the text animations for list view
                listAnime();
            },
            onComplete: () => {
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
                
                // Set up list-specific interactions
                this.setupEnhancedHoverEvents();
                
                // Update state flags
                this._inListView = true;
                this._inCircleView = false;
                this.isList = true;
                this.isListViewActive = true;
                this.isCircleViewActive = false;
            }
        });
        
        // Clean up circle view elements - fade out drag cylinder
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
        
        // Define central stacking point (similar to returnToCarouselView)
        const stackPosition = new THREE.Vector3(0, 30, 0);
        
        // Define animation timing constants for both phases
        const gatherDuration = 0.8;
        const pauseDuration = 0.3;
        const fanOutDuration = 0.8;
        
        // PHASE 1: First gather all items to the center stack (from circle view)
        this.imageStore.forEach((item, index) => {
            // Calculate delay for gathering
            const gatherDelay = index * 0.03;
            
            // Animate to central stack with slight delay based on index
            masterTl.to(item.mesh.position, {
                x: stackPosition.x,
                y: stackPosition.y,
                z: stackPosition.z + (index * 8.0),
                duration: gatherDuration,
                ease: "power1.inOut",
                delay: gatherDelay
            }, 0);
            
            // Scale down slightly as items gather
            masterTl.to(item.mesh.scale, {
                x: item.mesh.scale.x * 0.8,
                y: item.mesh.scale.y * 0.8,
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
        });
        
        // PHASE 2: Fan out to list view positions (similar to switchToListView)
        
        // Calculate center X and position Y that's 10% from bottom of screen (from switchToListView)
        const centerX = 0;
        const bottomY = -(this.height / 2) * 0.8; // 10% from bottom
        const zSpacing = 25; // Increased z-spacing between items
        
        // Timing offset after gather + pause
        const timeOffset = gatherDuration + pauseDuration;
        
        // Move all meshes to the list position with staggered timing
        this.imageStore.forEach((item, index) => {
            // Store original position for later reference (like in switchToListView)
            item._originalPosition = {
                x: item.mesh.position.x,
                y: item.mesh.position.y,
                z: item.mesh.position.z
            };
            
            // Calculate delay for fan-out
            const fanOutDelay = index * 0.04;
            
            // Move to bottom-center position with increased z-separation
            masterTl.to(item.mesh.position, {
                x: centerX,
                y: bottomY,
                z: -index * zSpacing, // Increased z-spacing between items
                duration: fanOutDuration,
                ease: "power2.out",
                delay: fanOutDelay
            }, timeOffset);
            
            // Use a fixed scale based on original dimensions
            const targetScale = {
                x: item.originalWidth,  // Use the original width stored when mesh was created
                y: item.originalHeight, // Use the original height stored when mesh was created
                z: 1
            };
            
            // Apply the scale
            masterTl.to(item.mesh.scale, {
                x: targetScale.x,
                y: targetScale.y,
                z: targetScale.z,
                duration: fanOutDuration,
                ease: "power2.out",
                delay: fanOutDelay,
                onComplete: () => {
                    // Update material uniforms to match scale
                    if (item.material.uniforms) {
                        item.material.uniforms.uQuadSize.value.x = targetScale.x;
                        item.material.uniforms.uQuadSize.value.y = targetScale.y;
                        item.material.uniforms.uTextureSize.value.x = targetScale.x;
                        item.material.uniforms.uTextureSize.value.y = targetScale.y;
                    }
                }
            }, timeOffset);

            // Store the dimensions we used
            item.width = targetScale.x;
            item.height = targetScale.y;
        });
        
        // Set current visible mesh for list view
        this.currentVisibleMeshIndex = 0;
    }

}