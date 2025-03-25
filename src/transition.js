import gsap from 'gsap';
import HomeSketch from './HomeSketch';
import { getASScrollInstance, destroyASScrollInstance, initializeScroll as _initializeScroll } from './smoothScroll';
import { initializeAnimations } from './animation';

// Create a wrapper around the imported function
const initializeScroll = (isHorizontal) => {
    const isInsidePage = document.body.classList.contains('b-inside');
    // Use the expected direction based on current page
    const expectedHorizontal = !isInsidePage;
    
    // Log if something is trying to initialize with wrong direction
    if (isHorizontal !== expectedHorizontal) {
        log(`Warning: Attempt to initialize scroll with ${isHorizontal ? 'horizontal' : 'vertical'} when page is ${isInsidePage ? 'inside' : 'home'}`);
    }
    
    // Always use the correct direction for the current page
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
        
        // Force cleanup of all scroll-related DOM elements
        document.querySelectorAll('[asscroll-container]').forEach(container => {
            container.style.transform = '';
            container.querySelectorAll('.scroll-wrap').forEach(el => {
                el.style.transform = '';
            });
        });
        
        // Destroy the ASScroll instance
        destroyASScrollInstance();
        scroll = null;
        
        // Wait for next frame to ensure DOM updates before proceeding
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
        // 1. Fade out and remove current content
        const currentContainer = document.querySelector('[data-barba="container"]');
        if (!currentContainer) {
            log('No current container found, proceeding with transition');
        } else {
            await fadeElement(currentContainer, {
                opacity: 0,
                duration: 0.4,
                position: 'absolute',
                width: '100%'
            });
            currentContainer.remove(); // Remove immediately after fade
        }

        // 2. Cleanup old sketch and scroll - ensure this is thorough
        log('Cleaning up old resources');
        await destroySketch();
        await resetScroll();

        // 3. Ensure wrapper is clean before adding new content
        const wrapper = document.querySelector('[data-barba="wrapper"]');
        if (!wrapper) throw new Error('No wrapper found');
        wrapper.innerHTML = ''; // Clear all existing content

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
            }, 50); // Small delay to ensure DOM stability
        });
        
        const isInsidePage = document.body.classList.contains('b-inside');
        log(`Page type: ${isInsidePage ? 'inside (vertical)' : 'home (horizontal)'}`);

        // Initialize new scroll instance with proper direction locking
        log('Initializing new scroll');
        scroll = initializeScroll(!isInsidePage);
        
        // Add a safeguard to prevent direction changes
        const scrollDirection = !isInsidePage ? 'horizontal' : 'vertical';
        log(`Locking scroll direction to: ${scrollDirection}`);
        
        // 7. Setup sketch for homepage
        if (!isInsidePage) {
            const container = document.getElementById('container');
            if (container) {
                container.innerHTML = '';
                
                // Add this code before creating HomeSketch
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

        // 8. Fade in new content
        await fadeElement(newContainer, { opacity: 1, duration: 0.4 });
        updateHistory(url);
        
        // One final check to make sure scroll direction is correct
        setTimeout(() => {
            const currentIsInside = document.body.classList.contains('b-inside');
            const shouldBeHorizontal = !currentIsInside;
            
            if (scroll && scroll.enabled) {
                log(`Final check: ensuring scroll is ${shouldBeHorizontal ? 'horizontal' : 'vertical'}`);
                
                // If we can safely check and find a mismatch, reset scroll
                if (scroll.params && scroll.params.horizontalScroll !== shouldBeHorizontal) {
                    log('Direction mismatch found, recreating scroll');
                    resetScroll().then(() => {
                        scroll = initializeScroll(shouldBeHorizontal);
                    });
                }
            }
        }, 500);

    } catch (error) {
        console.error('Error during transition:', error);
    }
}

function ensureActiveContainer() {
    // Deactivate all containers (shouldn't be necessary after wrapper cleanup, but kept for safety)
    document.querySelectorAll('[asscroll-container]').forEach(container => {
        container.setAttribute('data-active', 'false');
    });

    // Activate the current container
    const currentContainer = document.querySelector('[data-barba="container"] [asscroll-container]');
    if (currentContainer) {
        currentContainer.setAttribute('data-active', 'true');
    } else {
        log('No asscroll-container found in new content');
    }
}

export function initializeTransitions() {
    // Handle browser back/forward
    window.addEventListener('popstate', (event) => {
        if (event.state?.url) {
            handlePageTransition(event.state.url);
        }
    });

    // Handle link clicks
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.href && link.href.startsWith(window.location.origin)) {
            e.preventDefault();
            if (window.location.href !== link.href) {
                handlePageTransition(link.href);
            }
        }
    });

    // Initial setup
    ensureActiveContainer();
    const isInsidePage = document.body.classList.contains('b-inside');

    // Initialize scroll only once
    if (!scroll) {
        scroll = initializeScroll(!isInsidePage);
    }

    // Setup sketch only for homepage
    if (!isInsidePage) {
        const container = document.getElementById('container');
        if (container) {
            sketch = new HomeSketch({
                domElement: container,
                smoothScroll: scroll
            });
        }
    }

    // Add a class observer to ensure scroll direction matches body class
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