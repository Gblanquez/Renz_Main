import ASScroll from '@ashthornton/asscroll';

let instance = null;
let updateRafId = null; // Track the RAF ID at module level
let currentDirection = null; // null, 'horizontal', or 'vertical'

// Add a simple logging function since we don't have access to the one in transition.js
function log(message) {
    if (typeof console !== 'undefined') console.log(`[Scroll] ${message}`);
}

// Override ASScroll's internal update method to respect our direction setting
const originalUpdate = ASScroll.prototype.update;
ASScroll.prototype.update = function() {
    // Before running the original update, make sure direction is correct
    if (this.params && document.body) {
        const isInsidePage = document.body.classList.contains('b-inside');
        const shouldBeHorizontal = !isInsidePage;
        
        // Force the correct direction based on the page
        if (this.params.horizontalScroll !== shouldBeHorizontal) {
            console.log(`[ASScroll] Forcing scroll direction to ${shouldBeHorizontal ? 'horizontal' : 'vertical'}`);
            this.params.horizontalScroll = shouldBeHorizontal;
        }
    }
    
    // Call the original update method
    return originalUpdate.apply(this, arguments);
};

export function getASScrollInstance(options = {}) {
    // Ensure only one instance exists
    if (instance) {
        console.warn('Existing scroll instance found, destroying it');
        destroyASScrollInstance(); // Fully destroy the existing instance
    }

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const container = document.querySelector('[asscroll-container][data-active="true"]'); // Only target active container
    if (!container) {
        console.warn('No active scroll container found');
        return null;
    }

    // Reset transforms to avoid conflicts
    container.style.transform = '';
    const scrollElements = container.querySelectorAll('.scroll-wrap');
    scrollElements.forEach(el => el.style.transform = '');

    // Create new instance
    instance = new ASScroll({
        disableRaf: true,
        containerElement: container,
        scrollElements: '.scroll-wrap',
        touchScrollType: isMobile ? 'scrollTop' : 'transform',
        ease: 0.1,
        touchEase: isMobile ? 1 : 0.4,
        wheelMultiplier: isMobile ? 0.7 : 1,
        lockScrollDirection: true,
        ...options
    });

    return instance;
}

export function initializeScroll(isHorizontal = false) {
    // Force unwanted scroll libraries to not initialize
    if (window.lenis) {
        console.warn('[Scroll] Detected Lenis scroll instance, disabling it');
        window.lenis.destroy();
        window.lenis = null;
    }
    
    // Make sure body class is correctly set
    const isInsidePage = document.body.classList.contains('b-inside');
    if (isHorizontal && isInsidePage) {
        log('Page class mismatch detected, fixing body class');
        document.body.classList.remove('b-inside');
    } else if (!isHorizontal && !isInsidePage) {
        log('Page class mismatch detected, adding b-inside class');
        document.body.classList.add('b-inside');
    }
    
    // Ensure we stop any existing RAF loops
    if (updateRafId) {
        cancelAnimationFrame(updateRafId);
        updateRafId = null;
    }
    
    // Destroy any existing instance first
    destroyASScrollInstance();
    
    // Set the locked direction for this page
    currentDirection = isHorizontal ? 'horizontal' : 'vertical';
    log(`Setting scroll direction: ${currentDirection}`);

    const scroll = getASScrollInstance();
    if (!scroll) return null;

    // Configure scroll based on direction - use our locked direction
    scroll.enable({
        horizontalScroll: isHorizontal,
        smooth: true,
        reset: true,
        smartphone: { smooth: false, horizontalScroll: isHorizontal },
        tablet: { smooth: false, horizontalScroll: isHorizontal }
    });

    // Start the update loop - simplified to avoid property access issues
    function update() {
        if (scroll && instance === scroll) {
            // Just perform the update without checking properties
            scroll.update();
            updateRafId = requestAnimationFrame(update);
        }
    }
    
    // Ensure existing RAF is canceled before starting a new one
    if (updateRafId) {
        cancelAnimationFrame(updateRafId);
    }
    
    // Start a new update loop with a simpler check
    updateRafId = requestAnimationFrame(() => {
        if (scroll && instance === scroll) {
            scroll.resize();
            scroll.update();
            update();
        }
    });

    // Add a simple periodic checker to maintain correct scroll direction
    const directionMaintainer = setInterval(() => {
        if (!scroll || scroll !== instance || !document.body) {
            clearInterval(directionMaintainer);
            return;
        }

        const currentIsInside = document.body.classList.contains('b-inside');
        const shouldBeHorizontal = !currentIsInside;
        
        // Only attempt to fix if enabled and has params
        if (scroll.enabled && scroll.params && scroll.params.horizontalScroll !== shouldBeHorizontal) {
            log(`Correcting scroll direction to ${shouldBeHorizontal ? 'horizontal' : 'vertical'}`);
            
            // Recreate scroll with correct direction
            destroyASScrollInstance();
            setTimeout(() => initializeScroll(shouldBeHorizontal), 10);
            clearInterval(directionMaintainer);
        }
    }, 1000);

    return scroll;
}

export function destroyASScrollInstance() {
    // Cancel the RAF loop first
    if (updateRafId) {
        cancelAnimationFrame(updateRafId);
        updateRafId = null;
    }
    
    if (instance) {
        log(`Destroying scroll instance (direction: ${instance.params?.horizontalScroll ? 'horizontal' : 'vertical'})`);
        
        // Try to pause any ongoing animations
        if (instance.vs) {
            instance.vs.paused = true;
        }
        
        // Clean up DOM transformations
        const container = instance.containerElement;
        if (container) {
            container.style.transform = '';
            const scrollElements = container.querySelectorAll('.scroll-wrap');
            scrollElements.forEach(el => el.style.transform = '');
        }
        
        // Remove all event listeners
        if (instance.removeEvents) {
            instance.removeEvents();
        }
        
        instance.disable(); // Stop ASScroll functionality
        instance = null; // Clear reference for garbage collection
    }
    
    // Reset direction lock when destroying
    currentDirection = null;
    
    // Reset any asscroll-specific attributes in the DOM
    document.querySelectorAll('[asscroll]').forEach(el => {
        el.removeAttribute('asscroll');
    });
    
    // Also remove any transform styles that might be left
    document.querySelectorAll('.scroll-wrap').forEach(el => {
        el.style.transform = '';
    });
}

// Protect against other libraries overriding our scroll direction
document.addEventListener('DOMContentLoaded', () => {
    // Monitor for competing scroll libraries
    const originalObjectDefineProperty = Object.defineProperty;
    Object.defineProperty = function(obj, prop, descriptor) {
        if (prop === 'horizontalScroll' && instance && instance.params) {
            console.warn('[Scroll] Attempt to modify horizontalScroll property intercepted');
            return instance.params;
        }
        return originalObjectDefineProperty(obj, prop, descriptor);
    };
});