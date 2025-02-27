import ASScroll from '@ashthornton/asscroll';

let instance = null;

export function getASScrollInstance() {
    if (!instance) {
        // Detect if we're on mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        instance = new ASScroll({
            disableRaf: true,
            touchScrollType: isMobile ? 'scrollTop' : 'transform', // Use native scrolling on mobile
            useKeyboard: true,
            ease: 0.1,
            touchEase: isMobile ? 1 : 0.4, // No easing on mobile for responsiveness
            wheelMultiplier: isMobile ? 0.7 : 1, // Reduce wheel sensitivity on mobile
        });

        instance.enable({
            horizontalScroll: !document.body.classList.contains('b-inside'),
            smartphone: {
                smooth: false, // Disable smooth scrolling on mobile for better performance
                horizontalScroll: !document.body.classList.contains('b-inside')
            },
            tablet: {
                smooth: false, // Disable smooth scrolling on tablets
                horizontalScroll: !document.body.classList.contains('b-inside')
            }
        });

        // Add vertical-to-horizontal scroll mapping for mobile on homepage
        if (isMobile && !document.body.classList.contains('b-inside')) {
            setupVerticalToHorizontalScroll(instance);
        }
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
        instance.disable();
        instance = null;
    }
}