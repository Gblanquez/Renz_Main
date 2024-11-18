import barba from '@barba/core';
import gsap from 'gsap';
import ScrollTrigger from "gsap/ScrollTrigger";
import HomeSketch from './HomeSketch';
import WorkSketch from './WorkSketch';
import { initializeAnimations, OutAnimation, initializeInsideAnimations } from './animation';

let homeSketch
let workSketch


const socialLinks = document.querySelectorAll('.social-link');
const navbarLinks = document.querySelectorAll('.navbarsLink');
const loadWrapper = document.querySelector('.loadWrapper'); 
const loadTime = document.querySelector('.time-location');


function animateSocialLinksOut() {
    return gsap.fromTo(socialLinks,
        {
            y: 0,
            opacity: 1
        },
        {
            y: 120,
            opacity: 0,
            duration: 1.8,
            ease: "expo.out",
            stagger: { each: 0.05 }
        }
    );
}

function animateSocialLinksIn() {
    return gsap.fromTo(socialLinks,
        {
            y: 120,
            opacity: 1
        },
        {
            y: 0,
            opacity: 1,
            duration: 1.8,
            ease: "expo.out",
            stagger: { each: 0.05 }
        }
    );
}

gsap.registerPlugin(ScrollTrigger);

function loadAnimation() {
    return new Promise((resolve, reject) => {

        let loadValue = 0;
        const loadLine = document.querySelector('.loadLine');
        const numberLoad = document.querySelector('.numberLoad');
        const percentSymbol = document.querySelector('.percentSymbol');

        // Set the initial state for links
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

                // Hide loading elements
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

                tl.to(loadLine, {
                    scaleX: 0,
                    transformOrigin: "left",
                    duration: 1.2,
                    ease: "power2.inOut"
                }, 0);
            }
        }, 30);
    }).then(() => {


        homeSketch = new HomeSketch({
            domElement: document.getElementById('container')
        });

        new App({
            domElement: document.getElementById('container'),
            homeSketch: homeSketch,
            workSketch: workSketch
        });

        const tl = gsap.timeline({
            onComplete: () => {
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

        // Animate social links
        tl.fromTo([socialLinks, navbarLinks], 
            { opacity: 0, y: '120%' },
            { 
                opacity: 1,
                y: '0%',
                duration: 1.4,
                ease: "expo.out",
                stagger: { each: 0.05 }
            }, 0.1);
    });
}

export default class App {
    constructor(options) {
        this.container = options.domElement;
        this.homeSketch = options.homeSketch;
        this.workSketch = options.workSketch;
        this.barba();


    }

    barba() {
        let that = this;
        this.animationRunning = false;

        barba.init({
            debug: true,
            transitions: [
                {
                    // Home to About
                    name: 'home-to-about',
                    from: { namespace: ['home'] },
                    to: { namespace: ['about'] },
                    sync: true,
                    leave(data) {
                        that.animationRunning = true;
                        const tl = gsap.timeline();

                        tl.add(animateSocialLinksOut(), 0.2)
                        
                        if (that.homeSketch) {
                            that.homeSketch.imageStore.forEach((o, index) => {
                                const delay = 0.02 + index * 0.16;

                                tl.to(o.material.uniforms.uPositionOffset.value, {
                                    x: -10,
                                    duration: 1.2,
                                    delay: delay,
                                    ease: "expo.inOut",
                                    onUpdate: () => {
                                        o.material.uniforms.uPositionOffset.needsUpdate = true;
                                    }
                                }, 0);

                                tl.to(o.material.uniforms.uAlpha, {
                                    value: 0,
                                    duration: 1,
                                    delay: delay,
                                    ease: "expo.out"
                                }, 0);
                            });

                            tl.add(() => {
                                while(that.homeSketch.scene.children.length > 0) {
                                    that.homeSketch.scene.remove(that.homeSketch.scene.children[0]);
                                }
                                
                                that.homeSketch.imageStore = [];
                                that.homeSketch.materials = [];
                                
                                if (that.homeSketch.renderer) {
                                    that.homeSketch.renderer.dispose();
                                    that.homeSketch.renderer.domElement.remove();
                                }
                                
                                that.homeSketch.isActive = false;
                                that.homeSketch = null;
                            });
                        }

                        return tl.to(data.current.container, {
                            opacity: 0,
                            duration: 0.5
                        }, );
                    },
                    enter(data) {
                        return gsap.timeline()
                            .from(data.next.container, {
                                opacity: 0,
                                duration: 0.5
                            })
                            .add(() => {
                                gsap.to('.aboutWrapper', {
                                    opacity: 1,
                                    duration: 0.5
                                });
                                initializeAnimations();
                            }, "+=1.01");
                    }
                },
                {
                    // Home to Work
                    name: 'home-to-work',
                    from: { namespace: ['home'] },
                    to: { namespace: ['work'] },
                    sync: true,
                    leave(data) {
                        that.animationRunning = true;

                        const tl = gsap.timeline();

                        tl.add(animateSocialLinksOut(), 0.2)
                        
                        if (that.homeSketch) {
                            that.homeSketch.imageStore.forEach((o, index) => {
                                const delay = 0.02 + index * 0.16;

                                tl.to(o.material.uniforms.uPositionOffset.value, {
                                    x: -10,
                                    duration: 1.2,
                                    delay: delay,
                                    ease: "expo.inOut",
                                    onUpdate: () => {
                                        o.material.uniforms.uPositionOffset.needsUpdate = true;
                                    }
                                }, 0);

                                tl.to(o.material.uniforms.uAlpha, {
                                    value: 0,
                                    duration: 1,
                                    delay: delay,
                                    ease: "expo.out"
                                }, 0);
                            });

                            // Cleanup
                            tl.add(() => {
                                while(that.homeSketch.scene.children.length > 0) {
                                    that.homeSketch.scene.remove(that.homeSketch.scene.children[0]);
                                }
                                
                                that.homeSketch.imageStore = [];
                                that.homeSketch.materials = [];
                                
                                if (that.homeSketch.renderer) {
                                    that.homeSketch.renderer.dispose();
                                    that.homeSketch.renderer.domElement.remove();
                                }
                                
                                that.homeSketch.isActive = false;
                                that.homeSketch = null;
                            });
                        }

                        return tl.to(data.current.container, {
                            opacity: 0,
                            duration: 0.3
                        });
                    },
                    enter(data) {
                        return gsap.timeline()
                            .from(data.next.container, {
                                opacity: 0,
                                duration: 0.3
                            }, "+=1.5")
                            .add(() => {
                                // Initialize WorkSketch
                                that.workSketch = new WorkSketch({
                                    domElement: that.container
                                });
                                that.container.style.visibility = "visible";
                            }, "+=1.5");
                    }
                },
                {
                    // Home to Inside
                    name: 'home-to-inside',
                    from: { namespace: ['home'] },
                    to: { namespace: ['inside'] },
                    // sync: true,
                    leave(data) {
                        that.animationRunning = true;
                        const tl = gsap.timeline();


                        tl.add(animateSocialLinksOut(), 0.2)

                        if (that.homeSketch) {

                            that.homeSketch.materials.forEach(material => {
                                gsap.to(material.uniforms.hoverState, {
                                    duration: 0.4,
                                    value: 0
                                });
                            });
                    
                            tl.to({}, {
                                duration: 1.2,  
                            });
                        }
                    
                
                        return tl.to(data.current.container, {
                            opacity: 0,
                            duration: 0.5
                        });
                    },
                    enter(data) {
                        return gsap.timeline()
                            .from(data.next.container, {
                                opacity: 0,
                                onComplete: () => {

                                    const tl = gsap.timeline();

                                    tl.fromTo('.single__top-inner', 
                                        { opacity: 0 },
                                        { 
                                            opacity: 1,
                                            duration: 0.1,
                                            ease: "expo.out"
                                        }, 
                                        0  // Position parameter
                                    );
                                    
                                    tl.add(() => {
                                        initializeInsideAnimations();
                                    }, 0);



                                    while(that.homeSketch.scene.children.length > 0) {
                                        that.homeSketch.scene.remove(that.homeSketch.scene.children[0]);
                                    }
                                    
                                    that.homeSketch.imageStore = [];
                                    that.homeSketch.materials = [];
                                    
                                    if (that.homeSketch.renderer) {
                                        that.homeSketch.renderer.dispose();
                                        that.homeSketch.renderer.domElement.remove();
                                    }
                                    
                                    that.homeSketch.isActive = false;
                                    that.homeSketch = null;
                                }
                            });
                    }
                },
                {
                    // About to Home
                    name: 'about-to-home',
                    from: { namespace: ['about'] },
                    to: { namespace: ['home'] },
                    sync: true,
                    leave(data) {
                        const tl = gsap.timeline();
                        OutAnimation(); // Your existing out animation
                        return tl.to(data.current.container, {
                            opacity: 0,
                            duration: 0.5
                        });
                    },
                    enter(data) {
                        return gsap.timeline()
                            .from(data.next.container, {
                                opacity: 0,
                                onComplete: () => {
                                    // Initialize HomeSketch
                                    that.homeSketch = new HomeSketch({
                                        domElement: that.container
                                    });

                                    animateSocialLinksIn();
                                }
                            });
                    }
                },
                {
                    // About to Work
                    name: 'about-to-work',
                    from: { namespace: ['about'] },
                    to: { namespace: ['work'] },
                    leave(data) {
                        const tl = gsap.timeline();
                        OutAnimation(); // Your existing out animation
                        return tl.to(data.current.container, {
                            opacity: 0,
                            duration: 0.5
                        });
                    },
                    enter(data) {
                        return gsap.timeline()
                            .from(data.next.container, {
                                opacity: 0,
                                onComplete: () => {

                                that.workSketch = new WorkSketch({
                                    domElement: that.container
                                });
                                that.container.style.visibility = "visible";
                                }
                            });
                    }
                },
                {
                    // Work to Inside
                    name: 'work-to-inside',
                    from: { namespace: ['work'] },
                    to: { namespace: ['inside'] },
                    leave(data) {



                        const tl = gsap.timeline();
                        if (that.workSketch) {
                            // Add hover state animation similar to homeSketch
                            that.workSketch.materials.forEach(material => {
                                gsap.to(material.uniforms.hoverState, {
                                    duration: 0.4,
                                    value: 0
                                });
                            });
                
                            tl.to({}, {
                                duration: 1.2,
                            });
                
                            tl.to(data.current.container, {
                                opacity: 0,
                                duration: 0.5
                            });
                        }
                        return tl;
                    },
                    enter(data) {
                        return gsap.timeline()
                            .from(data.next.container, {
                                opacity: 0,
                                onComplete: () => {
                                    const tl = gsap.timeline();
                    
                                    tl.fromTo('.single__top-inner', 
                                        { opacity: 0 },
                                        { 
                                            opacity: 1,
                                            duration: 0.1,
                                            ease: "expo.out"
                                        }, 
                                        0
                                    );
                                    
                                    tl.add(() => {
                                        initializeInsideAnimations();
                                    }, 0);
                    
                                    // Clean up WorkSketch similar to HomeSketch cleanup
                                    while(that.workSketch.scene.children.length > 0) {
                                        that.workSketch.scene.remove(that.workSketch.scene.children[0]);
                                    }
                                    
                                    that.workSketch.imageStore = [];
                                    that.workSketch.materials = [];
                                    
                                    if (that.workSketch.renderer) {
                                        that.workSketch.renderer.dispose();
                                        that.workSketch.renderer.domElement.remove();
                                    }
                                    
                                    that.workSketch.isActive = false;
                                    that.workSketch = null;
                                }
                            });
                    }
                },
                {
                    // Work to About
                    name: 'work-to-about',
                    from: { namespace: ['work'] },
                    to: { namespace: ['about'] },
                    sync: true,
                    leave(data) {
                        const tl = gsap.timeline();
                        
                        if (that.workSketch) {
                            // First, animate all meshes to stack on top of each other
                            that.workSketch.imageStore.forEach((o, index) => {
                                const delay = 0.02 + index * 0.16;
                                
                                // Move meshes to center and stack them
                                tl.to(o.mesh.position, {
                                    y: 0,
                                    duration: 1.2,
                                    delay: delay,
                                    ease: "expo.inOut"
                                }, 0);
                    
                                // Animate position offset and alpha
                                tl.to(o.material.uniforms.uPositionOffset.value, {
                                    x: -20,
                                    duration: 1.2,
                                    delay: delay,
                                    ease: "expo.inOut",
                                    onUpdate: () => {
                                        o.material.uniforms.uPositionOffset.needsUpdate = true;
                                    }
                                }, 0.1);
                    
                                tl.to(o.material.uniforms.uAlpha, {
                                    value: 0,
                                    duration: 0.5,
                                    delay: delay,
                                    ease: "expo.out"
                                }, 0.3);
                            });
                    

                            tl.add(() => {

                                while(that.workSketch.scene.children.length > 0) {
                                    that.workSketch.scene.remove(that.workSketch.scene.children[0]);
                                }
                                
                                // Clear arrays
                                that.workSketch.imageStore = [];
                                that.workSketch.materials = [];
                                
                                // Dispose renderer and remove canvas
                                if (that.workSketch.renderer) {
                                    that.workSketch.renderer.dispose();
                                    that.workSketch.renderer.domElement.remove();
                                }
                                
                                // Deactivate WorkSketch
                                that.workSketch.isActive = false;
                                that.workSketch = null;
                            });
                    
                            // Final fade out of the container
                            tl.to(data.current.container, {
                                opacity: 0,
                                duration: 0.5
                            });
                        }
                        
                        return tl;
                    },
                    enter(data) {
                        return gsap.timeline()
                        .from(data.next.container, {
                            opacity: 0,
                            duration: 0.5
                        })
                        .add(() => {
                            gsap.to('.aboutWrapper', {
                                opacity: 1,
                                duration: 0.5
                            });
                            initializeAnimations();
                        });
                    }
                },
                {
                    // Work to Home
                    name: 'work-to-home',
                    from: { namespace: ['work'] },
                    to: { namespace: ['home'] },
                    sync: true,
                    leave(data) {
                        const tl = gsap.timeline();
                        
                        if (that.workSketch) {
                            // First, animate all meshes to stack on top of each other
                            that.workSketch.imageStore.forEach((o, index) => {
                                const delay = 0.02 + index * 0.16;
                                
                                // Move meshes to center and stack them
                                tl.to(o.mesh.position, {
                                    y: 0,
                                    duration: 0.8,
                                    delay: delay,
                                    ease: "expo.out"
                                }, 0);
                    
                                // Animate position offset and alpha
                                tl.to(o.material.uniforms.uPositionOffset.value, {
                                    x: -20,
                                    duration: 0.8,
                                    delay: delay,
                                    ease: "expo.out",
                                    onUpdate: () => {
                                        o.material.uniforms.uPositionOffset.needsUpdate = true;
                                    }
                                }, 0.1);
                    
                                tl.to(o.material.uniforms.uAlpha, {
                                    value: 0,
                                    duration: 0.5,
                                    delay: delay,
                                    ease: "expo.out"
                                }, 0.3);
                            });
                    

                            tl.add(() => {

                                while(that.workSketch.scene.children.length > 0) {
                                    that.workSketch.scene.remove(that.workSketch.scene.children[0]);
                                }
                                
                                // Clear arrays
                                that.workSketch.imageStore = [];
                                that.workSketch.materials = [];
                                
                                // Dispose renderer and remove canvas
                                if (that.workSketch.renderer) {
                                    that.workSketch.renderer.dispose();
                                    that.workSketch.renderer.domElement.remove();
                                }
                                
                                // Deactivate WorkSketch
                                that.workSketch.isActive = false;
                                that.workSketch = null;
                            });
                    
                            // Final fade out of the container
                            tl.to(data.current.container, {
                                opacity: 0,
                                duration: 0.5
                            });
                        }
                        
                        return tl;
                    },
                    enter(data) {
                        return gsap.timeline()
                            .from(data.next.container, {
                                opacity: 0,
                                onComplete: () => {
                                    // Initialize HomeSketch
                                    that.homeSketch = new HomeSketch({
                                        domElement: that.container
                                    });

                                    animateSocialLinksIn();
                                }
                            });
                    }
                },
                {
                    // Inside to About
                    name: 'inside-to-about',
                    from: { namespace: ['inside'] },
                    to: { namespace: ['about'] },
                    leave(data) {
                        const tl = gsap.timeline();
                        return tl.to(data.current.container, {
                            opacity: 0,
                            duration: 0.5
                        });
                    },
                    enter(data) {
                        return gsap.timeline()
                        .from(data.next.container, {
                            opacity: 0,
                            duration: 0.5
                        })
                        .add(() => {
                            gsap.to('.aboutWrapper', {
                                opacity: 1,
                                duration: 0.5
                            });
                            initializeAnimations();
                        });
                    }
                },
                {
                    // Inside to Work
                    name: 'inside-to-work',
                    from: { namespace: ['inside'] },
                    to: { namespace: ['work'] },
                    leave(data) {
                        const tl = gsap.timeline();
                        return tl.to(data.current.container, {
                            opacity: 0,
                            duration: 0.5
                        });
                    },
                    enter(data) {
                        return gsap.timeline()
                            .from(data.next.container, {
                                opacity: 0,
                                duration: 0.3
                            }, "+=1.5")
                            .add(() => {
                                // Initialize WorkSketch
                                that.workSketch = new WorkSketch({
                                    domElement: that.container
                                });
                                that.container.style.visibility = "visible";
                            }, "+=1.5");
                    }
                },
                {
                    // Inside to Home
                    name: 'inside-to-home',
                    from: { namespace: ['inside'] },
                    to: { namespace: ['home'] },
                    leave(data) {
                        const tl = gsap.timeline();
                        return tl.to(data.current.container, {
                            opacity: 0,
                            duration: 0.5
                        });
                    },
                    enter(data) {
                        return gsap.timeline()
                            .from(data.next.container, {
                                opacity: 0,
                                onComplete: () => {
                                    // Initialize HomeSketch
                                    that.homeSketch = new HomeSketch({
                                        domElement: that.container
                                    });

                                    animateSocialLinksIn();
                                }
                            });
                    }
                }
            ]
        });
    }
}

// Start the load animation
loadAnimation();
// homeSketch = new HomeSketch({
//     domElement: document.getElementById('container')
// });




