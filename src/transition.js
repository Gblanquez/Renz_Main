import gsap from 'gsap';
import HomeSketch from './HomeSketch';
import { getASScrollInstance, destroyASScrollInstance, initializeScroll as _initializeScroll } from './smoothScroll';
import { initializeAnimations } from './animation';

// Create a wrapper around the imported function
const initializeScroll = (isHorizontal) => {
    const isInsidePage = document.body.classList.contains('b-inside');
    const expectedHorizontal = !isInsidePage;
    
    if (isHorizontal !== expectedHorizontal) {
        log(`Warning: Attempt to initialize scroll with ${isHorizontal ? 'horizontal' : 'vertical'} when page is ${isInsidePage ? 'inside' : 'home'}`);
    }
    
    return _initializeScroll(expectedHorizontal);
};

// Maintain a single sketch instance
let sketch = null;
let scroll = null;
const DEBUG = true;

function log(message) {
    if (DEBUG) console.log(`[${Date.now()}] ${message}`);
}

function destroySketch() {
    return new Promise(resolve => {
        if (!sketch) {
            resolve();
            return;
        }
        log('Destroying sketch instance');

        if (sketch.smoothScroll) {
            sketch.smoothScroll = null;
        }

        sketch.isActive = false;
        if (sketch.rafID) {
            cancelAnimationFrame(sketch.rafID);
        }

        if (sketch.scene) {
            while (sketch.scene.children.length > 0) {
                const object = sketch.scene.children[0];
                if (object.material) {
                    if (object.material.uniforms) {
                        Object.values(object.material.uniforms).forEach(uniform => {
                            if (uniform.value && uniform.value.dispose) uniform.value.dispose();
                        });
                    }
                    object.material.dispose();
                }
                if (object.geometry) object.geometry.dispose();
                sketch.scene.remove(object);
            }
        }

        if (sketch.renderer) {
            sketch.renderer.dispose();
            sketch.renderer.domElement?.remove();
        }

        if (sketch.imageStore) {
            sketch.imageStore.forEach(item => {
                if (item.mesh) {
                    if (item.mesh.parent) item.mesh.parent.remove(item.mesh);
                    if (item.mesh.geometry) item.mesh.geometry.dispose();
                }
                if (item.material) item.material.dispose();
            });
            sketch.imageStore = null;
        }

        if (typeof sketch.destroy === 'function') {
            sketch.destroy();
        }

        sketch = null;
        window.homeSketch = null;

        requestAnimationFrame(resolve);
    });
}

function resetScroll() {
    return new Promise(resolve => {
        log('Resetting scroll instance');
        
        document.querySelectorAll('[asscroll-container]').forEach(container => {
            container.style.transform = '';
            container.querySelectorAll('.scroll-wrap').forEach(el => {
                el.style.transform = '';
            });
        });
        
        destroyASScrollInstance();
        scroll = null;
        
        requestAnimationFrame(resolve);
    });
}

function fadeElement(element, props) {
    return new Promise(resolve => {
        gsap.to(element, { ...props, onComplete: resolve });
    });
}

async function loadPage(url) {
    const response = await fetch(url);
    const html = await response.text();
    const parser = new DOMParser();
    return parser.parseFromString(html, 'text/html');
}

function updateHistory(url) {
    window.history.pushState({ url }, '', url);
}

async function handlePageTransition(url) {
    try {
        // 1. Fade out current content with animation
        const currentContainer = document.querySelector('[data-barba="container"]');
        const isCurrentInsidePage = document.body.classList.contains('b-inside');
        
        log(`Current page is ${isCurrentInsidePage ? 'inside' : 'home'} page`);
        
        // Run exit animations based on page type
        if (currentContainer) {
            if (isCurrentInsidePage) {
                // If we're leaving an inside page (like about)
                log('Running about page exit animation');
                try {
                    // Import and run the OutAnimation
                    const { OutAnimation } = await import('./animation.js');
                    // Wait for the animation to fully complete
                    await OutAnimation();
                    // Add a small buffer to ensure animation renders
                    await new Promise(resolve => setTimeout(resolve, 300));
                } catch (error) {
                    console.error('Failed to run exit animation:', error);
                    // Fallback to basic fade
                    await fadeElement(currentContainer, {
                        opacity: 0,
                        duration: 0.4
                    });
                }
            } else {
                // Default fade out for homepage
                await fadeElement(currentContainer, {
                    opacity: 0,
                    duration: 0.4
                });
            }
            currentContainer.remove();
        }

        // 2. Cleanup old sketch and scroll
        log('Cleaning up old resources');
        await destroySketch();
        await resetScroll();

        // 3. Ensure wrapper is clean before adding new content
        const wrapper = document.querySelector('[data-barba="wrapper"]');
        if (!wrapper) throw new Error('No wrapper found');
        wrapper.innerHTML = '';

        // 4. Load and insert new content
        const newDocument = await loadPage(url);
        const newContainer = newDocument.querySelector('[data-barba="container"]');
        if (!newContainer) throw new Error('No new container found in loaded page');
        document.body.className = newDocument.body.className;
        wrapper.appendChild(newContainer);

        // 5. Ensure only the new container is active
        log('Setting up active container');
        ensureActiveContainer();

        // 6. Wait for multiple frames to ensure DOM is ready
        await new Promise(resolve => {
            setTimeout(() => {
                requestAnimationFrame(resolve);
            }, 50);
        });
        
        const isInsidePage = document.body.classList.contains('b-inside');
        log(`Page type: ${isInsidePage ? 'inside (vertical)' : 'home (horizontal)'}`);

        // Initialize new scroll instance with proper direction locking
        log('Initializing new scroll');
        scroll = initializeScroll(!isInsidePage);
        
        const scrollDirection = !isInsidePage ? 'horizontal' : 'vertical';
        log(`Locking scroll direction to: ${scrollDirection}`);
        
        // 7. Setup sketch for homepage
        if (!isInsidePage) {
            const container = document.getElementById('container');
            if (container) {
                container.innerHTML = '';
                
                if (scroll && scroll.params) {
                    Object.defineProperty(scroll.params, 'horizontalScroll', {
                        value: true,
                        writable: false,
                        configurable: false
                    });
                }
                
                sketch = new HomeSketch({
                    domElement: container,
                    smoothScroll: scroll
                });
            }
        }

        // 8. Apply appropriate entry animation based on page type
        if (isInsidePage) {
            await import('./animation.js').then(module => {
                setTimeout(() => {
                    module.initializeAnimations();
                }, 0);
            });
        } else {
            await fadeElement(newContainer, { opacity: 1, duration: 0.4 });
        }
        
        updateHistory(url);
        
        setTimeout(() => {
            const currentIsInside = document.body.classList.contains('b-inside');
            const shouldBeHorizontal = !currentIsInside;
            
            if (scroll && scroll.enabled) {
                log(`Final check: ensuring scroll is ${shouldBeHorizontal ? 'horizontal' : 'vertical'}`);
                
                if (scroll.params && scroll.params.horizontalScroll !== shouldBeHorizontal) {
                    log('Direction mismatch found, recreating scroll');
                    resetScroll().then(() => {
                        scroll = initializeScroll(shouldBeHorizontal);
                    });
                }
            }
        }, 100);

    } catch (error) {
        console.error('Error during transition:', error);
    }
}

function ensureActiveContainer() {
    document.querySelectorAll('[asscroll-container]').forEach(container => {
        container.setAttribute('data-active', 'false');
    });

    const currentContainer = document.querySelector('[data-barba="container"] [asscroll-container]');
    if (currentContainer) {
        currentContainer.setAttribute('data-active', 'true');
    } else {
        log('No asscroll-container found in new content');
    }
}

export function initializeTransitions() {
    window.addEventListener('popstate', (event) => {
        if (event.state?.url) {
            handlePageTransition(event.state.url);
        }
    });

    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.href && link.href.startsWith(window.location.origin)) {
            e.preventDefault();
            if (window.location.href !== link.href) {
                handlePageTransition(link.href);
            }
        }
    });

    ensureActiveContainer();
    const isInsidePage = document.body.classList.contains('b-inside');

    if (!scroll) {
        scroll = initializeScroll(!isInsidePage);
    }

    if (!isInsidePage) {
        const container = document.getElementById('container');
        if (container) {
            sketch = new HomeSketch({
                domElement: container,
                smoothScroll: scroll
            });
        }
    }

    const bodyClassObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class' && scroll) {
                const isInsidePage = document.body.classList.contains('b-inside');
                const shouldBeHorizontal = !isInsidePage;
                
                if (scroll.params && scroll.params.horizontalScroll !== shouldBeHorizontal) {
                    log(`Body class changed, updating scroll direction to ${shouldBeHorizontal ? 'horizontal' : 'vertical'}`);
                    scroll.params.horizontalScroll = shouldBeHorizontal;
                }
            }
        });
    });
    
    bodyClassObserver.observe(document.body, { attributes: true });
}