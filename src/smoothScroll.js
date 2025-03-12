import ASScroll from '@ashthornton/asscroll';

let instance = null;
let eventListeners = [];

export function getASScrollInstance() {
    // Always clean up first
    destroyASScrollInstance();
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    instance = new ASScroll({
        disableRaf: true,
        touchScrollType: isMobile ? 'scrollTop' : 'transform',
        useKeyboard: true,
        ease: 0.1,
        touchEase: isMobile ? 1 : 0.4,
        wheelMultiplier: isMobile ? 0.7 : 1,
    });

    // Store event listeners for cleanup
    const touchStartHandler = (e) => {
        // Touch start logic
    };
    
    const touchMoveHandler = (e) => {
        // Touch move logic
    };
    
    const touchEndHandler = () => {
        // Touch end logic
    };

    if (isMobile) {
        document.addEventListener('touchstart', touchStartHandler, { passive: false });
        document.addEventListener('touchmove', touchMoveHandler, { passive: false });
        document.addEventListener('touchend', touchEndHandler, { passive: true });
        
        eventListeners.push(
            { element: document, type: 'touchstart', handler: touchStartHandler },
            { element: document, type: 'touchmove', handler: touchMoveHandler },
            { element: document, type: 'touchend', handler: touchEndHandler }
        );
    }

    return instance;
}

function setupVerticalToHorizontalScroll(scrollInstance) {
    // Create a touch handler to convert vertical swipes to horizontal scrolling
    let startY = 0;
    let startX = 0;
    let currentX = 0;
    let isScrolling = false;
    
    // Get the scrollable container
    const scrollContainer = document.querySelector('.asscroll-container') || document.querySelector('main');
    
    if (!scrollContainer) return;
    
    // Touch start event
    document.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
        startX = e.touches[0].clientX;
        currentX = scrollInstance.currentPos;
        isScrolling = true;
    }, { passive: false });
    
    // Touch move event
    document.addEventListener('touchmove', (e) => {
        if (!isScrolling) return;
        
        const currentY = e.touches[0].clientY;
        const deltaY = startY - currentY; // How much vertical movement
        
        // Convert vertical movement to horizontal scrolling
        // Adjust the multiplier (2.0) to control sensitivity
        const newPosition = currentX + (deltaY * 2.0);
        
        // Update scroll position
        scrollInstance.currentPos = newPosition;
        
        // Prevent default only if primarily scrolling vertically
        // This allows normal horizontal swiping to still work
        const currentTouchX = e.touches[0].clientX;
        const deltaX = Math.abs(startX - currentTouchX);
        
        if (Math.abs(deltaY) > deltaX) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Touch end event
    document.addEventListener('touchend', () => {
        isScrolling = false;
    }, { passive: true });
}

export function destroyASScrollInstance() {
    if (instance) {
        // Remove all event listeners
        eventListeners.forEach(({ element, type, handler }) => {
            element.removeEventListener(type, handler);
        });
        eventListeners = [];
        
        // Disable and cleanup instance
        instance.disable();
        instance = null;
    }
}