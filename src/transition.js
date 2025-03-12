import barba from '@barba/core';
import gsap from 'gsap';
import HomeSketch from './HomeSketch';
import WorkSketch from './WorkSketch';
import { getASScrollInstance, destroyASScrollInstance } from './smoothScroll';
import { initializeAnimations, OutAnimation } from './animation';

let currentSketch = null;
let currentScroll = null;

function cleanupCurrentSketch() {
    if (currentSketch) {
        currentSketch.isActive = false;
        if (currentSketch.rafID) {
            cancelAnimationFrame(currentSketch.rafID);
        }
        if (currentSketch.scene) {
            while(currentSketch.scene.children.length > 0) { 
                const object = currentSketch.scene.children[0];
                if (object.material) {
                    if (object.material.uniforms) {
                        Object.values(object.material.uniforms).forEach(uniform => {
                            if (uniform.value && uniform.value.dispose) {
                                uniform.value.dispose();
                            }
                        });
                    }
                    object.material.dispose();
                }
                if (object.geometry) {
                    object.geometry.dispose();
                }
                currentSketch.scene.remove(object);
            }
        }
        if (currentSketch.renderer) {
            currentSketch.renderer.dispose();
            currentSketch.renderer.domElement.remove();
        }
        if (currentSketch.imageStore) {
            currentSketch.imageStore.forEach(item => {
                if (item.mesh) {
                    if (item.mesh.parent) {
                        item.mesh.parent.remove(item.mesh);
                    }
                    if (item.mesh.geometry) {
                        item.mesh.geometry.dispose();
                    }
                }
                if (item.material) {
                    item.material.dispose();
                }
            });
            currentSketch.imageStore = null;
        }
        if (typeof currentSketch.destroy === 'function') {
            currentSketch.destroy();
        }
        currentSketch = null;
    }
    if (window.homeSketch) {
        window.homeSketch = null;
    }
}

async function initializeSketch(container, namespace) {
    cleanupCurrentSketch();
    destroyASScrollInstance();
    currentScroll = null;
    
    if (container) {
        container.innerHTML = '';
    }

    try {
        currentScroll = getASScrollInstance();
        
        switch (namespace) {
            case 'home':
                currentSketch = new HomeSketch({
                    domElement: container,
                    smoothScroll: currentScroll
                });
                break;
            case 'work':
                currentSketch = new WorkSketch({
                    domElement: container,
                    smoothScroll: currentScroll
                });
                break;
        }

        await new Promise(resolve => setTimeout(resolve, 100));

        if (currentScroll) {
            currentScroll.enable({
                horizontalScroll: namespace === 'home',
                reset: true,
                smartphone: {
                    smooth: false,
                    horizontalScroll: namespace === 'home'
                },
                tablet: {
                    smooth: false,
                    horizontalScroll: namespace === 'home'
                }
            });
        }
    } catch (error) {
        console.error('Error initializing sketch:', error);
    }
}

function createTransitionPromise(element, properties) {
    return new Promise(resolve => {
        gsap.to(element, {
            ...properties,
            onComplete: resolve
        });
    });
}

function ensureScrollEnabled(namespace) {
    if (!currentScroll) {
        currentScroll = getASScrollInstance();
    }
    
    if (currentScroll && !currentScroll.isEnabled) {
        currentScroll.enable({
            horizontalScroll: namespace === 'home',
            reset: true,
            smartphone: {
                smooth: false,
                horizontalScroll: namespace === 'home'
            },
            tablet: {
                smooth: false,
                horizontalScroll: namespace === 'home'
            }
        });
    }
}

export function initializeTransitions() {
    barba.init({
        preventRunning: true,
        transitions: [
            {
                name: 'default-transition',
                async leave(data) {
                    const transitionWrapper = document.querySelector('.transitionWrapper');
                    const transitionBox = transitionWrapper.querySelector('.transitionBox');
                    
                    if (data.current.namespace === 'about') {
                        await OutAnimation();
                    }
                    
                    await createTransitionPromise(data.current.container, {
                        opacity: 0,
                        duration: 0.5,
                        position: 'absolute',
                        width: '100%'
                    });

                    await createTransitionPromise(transitionBox, {
                        height: '100%',
                        duration: 0.7,
                        ease: 'power3.inOut'
                    });

                    cleanupCurrentSketch();
                    destroyASScrollInstance();
                    currentScroll = null;
                    data.current.container.remove();
                },

                async enter(data) {
                    const transitionWrapper = document.querySelector('.transitionWrapper');
                    const transitionBox = transitionWrapper.querySelector('.transitionBox');

                    window.scrollTo(0, 0);

                    gsap.set(data.next.container, {
                        opacity: 0,
                        position: 'relative'
                    });

                    await createTransitionPromise(data.next.container, {
                        opacity: 1,
                        duration: 0.5
                    });

                    await createTransitionPromise(transitionBox, {
                        height: '0%',
                        duration: 0.7,
                        ease: 'power3.inOut'
                    });
                },

                async once(data) {
                    const transitionWrapper = document.querySelector('.transitionWrapper');
                    const transitionBox = transitionWrapper.querySelector('.transitionBox');
                    const loadWrapper = document.querySelector('.loadWrapper');

                    if (loadWrapper) {
                        await createTransitionPromise(loadWrapper, {
                            opacity: 0,
                            duration: 0.5,
                            delay: 0.5
                        });
                        loadWrapper.remove();
                    }

                    gsap.set(transitionBox, { height: '100%' });
                    gsap.set(data.next.container, { opacity: 0 });

                    await createTransitionPromise(data.next.container, {
                        opacity: 1,
                        duration: 0.5
                    });

                    await createTransitionPromise(transitionBox, {
                        height: '0%',
                        duration: 0.7,
                        ease: 'power3.inOut'
                    });
                }
            },
            {
                name: 'sketch-to-sketch',
                from: { namespace: ['home', 'work'] },
                to: { namespace: ['home', 'work'] },
                async leave(data) {
                    const transitionWrapper = document.querySelector('.transitionWrapper');
                    const transitionBox = transitionWrapper.querySelector('.transitionBox');

                    await Promise.all([
                        createTransitionPromise(data.current.container, {
                            opacity: 0,
                            scale: 0.95,
                            duration: 0.6,
                            ease: 'power2.inOut'
                        }),
                        createTransitionPromise(transitionBox, {
                            height: '100%',
                            duration: 0.6,
                            ease: 'power3.inOut'
                        })
                    ]);

                    cleanupCurrentSketch();
                    data.current.container.remove();
                },

                async enter(data) {
                    const transitionWrapper = document.querySelector('.transitionWrapper');
                    const transitionBox = transitionWrapper.querySelector('.transitionBox');

                    window.scrollTo(0, 0);
                    gsap.set(data.next.container, {
                        opacity: 0,
                        scale: 1.05,
                        position: 'relative'
                    });

                    await initializeSketch(document.getElementById('container'), data.next.namespace);

                    await Promise.all([
                        createTransitionPromise(data.next.container, {
                            opacity: 1,
                            scale: 1,
                            duration: 0.6,
                            ease: 'power2.out'
                        }),
                        createTransitionPromise(transitionBox, {
                            height: '0%',
                            duration: 0.6,
                            ease: 'power3.inOut'
                        })
                    ]);
                }
            },
            {
                name: 'home',
                async leave(data) {
                    const done = this.async();
                    cleanupCurrentSketch();
                    
                    gsap.to(data.current.container, {
                        opacity: 0,
                        duration: 0.8,
                        onComplete: () => {
                            if (window.homeSketch) {
                                window.homeSketch.destroy();
                                window.homeSketch = null;
                            }
                            done();
                        }
                    });
                },
                enter(data) {
                    gsap.from(data.next.container, {
                        opacity: 0,
                        duration: 0.8
                    });
                }
            }
        ],
        views: [
            {
                namespace: 'home',
                async beforeEnter({ next }) {
                    document.body.classList.remove('b-inside');
                    if (!['home', 'work'].includes(barba.history.previous?.namespace)) {
                        await initializeSketch(document.getElementById('container'), 'home');
                    }
                },
                afterEnter() {
                    ensureScrollEnabled('home');
                    if (currentSketch && currentSketch.onTransitionComplete) {
                        currentSketch.onTransitionComplete();
                    }
                }
            },
            {
                namespace: 'work',
                async beforeEnter({ next }) {
                    document.body.classList.add('b-inside');
                    if (!['home', 'work'].includes(barba.history.previous?.namespace)) {
                        await initializeSketch(document.getElementById('container'), 'work');
                    }
                },
                afterEnter() {
                    ensureScrollEnabled('work');
                    if (currentSketch && currentSketch.onTransitionComplete) {
                        currentSketch.onTransitionComplete();
                    }
                }
            },
            {
                namespace: 'about',
                beforeEnter() {
                    document.body.classList.add('b-inside');
                    cleanupCurrentSketch();
                    destroyASScrollInstance();
                    currentScroll = null;
                },
                afterEnter() {
                    const tl = gsap.timeline({
                        delay: 0.3
                    });

                    tl.add(() => {
                        initializeAnimations();
                    });

                    if (!currentScroll) {
                        currentScroll = getASScrollInstance();
                    }
                    if (currentScroll) {
                        currentScroll.enable({
                            horizontalScroll: false,
                            reset: true
                        });
                    }
                }
            },
            {
                namespace: 'contact',
                beforeEnter() {
                    document.body.classList.add('b-inside');
                    cleanupCurrentSketch();
                    destroyASScrollInstance();
                    currentScroll = null;
                },
                afterEnter() {
                    if (!currentScroll) {
                        currentScroll = getASScrollInstance();
                    }
                    if (currentScroll) {
                        currentScroll.enable({
                            horizontalScroll: false,
                            reset: true
                        });
                    }
                }
            },
            {
                namespace: 'inside',
                beforeEnter() {
                    document.body.classList.add('b-inside');
                    cleanupCurrentSketch();
                    destroyASScrollInstance();
                    currentScroll = null;
                },
                afterEnter() {
                    if (!currentScroll) {
                        currentScroll = getASScrollInstance();
                    }
                    if (currentScroll) {
                        currentScroll.enable({
                            horizontalScroll: false,
                            reset: true
                        });
                    }
                }
            }
        ]
    });
}