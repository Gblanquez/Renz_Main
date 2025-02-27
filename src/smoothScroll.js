import ASScroll from '@ashthornton/asscroll';

let instance = null;

export function getASScrollInstance() {
    if (!instance) {
        // Detect if we're on mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        instance = new ASScroll({
            disableRaf: true,
            touchScrollType: isMobile ? 'scrollTop' : 'transform',
            useKeyboard: true,
            ease: 0.1,
            touchEase: isMobile ? 1 : 0.4,
            wheelMultiplier: isMobile ? 0.7 : 1,
        });

        // Enable with appropriate settings
        instance.enable({
            horizontalScroll: !document.body.classList.contains('b-inside'),
            smartphone: {
                smooth: false,
                horizontalScroll: !document.body.classList.contains('b-inside')
            },
            tablet: {
                smooth: false,
                horizontalScroll: !document.body.classList.contains('b-inside')
            }
        });

        // Add vertical-to-horizontal scroll mapping for mobile on homepage
        if (isMobile && !document.body.classList.contains('b-inside')) {
            // Wait a moment for DOM to be ready
            setTimeout(() => {
                setupVerticalToHorizontalScroll(instance);
            }, 500);
        }
    }
    return instance;
}

function setupVerticalToHorizontalScroll(scrollInstance) {
    // Get the main scrollable element
    const scrollContainer = document.querySelector('.asscroll') || 
                           document.querySelector('main') || 
                           document.body;
    
    if (!scrollContainer) {
        console.warn('Could not find scroll container');
        return;
    }
    
    let startY = 0;
    let lastY = 0;
    let currentScrollPos = 0;
    
    // Directly handle wheel events for vertical scrolling
    window.addEventListener('wheel', (e) => {
        if (document.body.classList.contains('b-inside')) return;
        
        e.preventDefault();
        
        // Convert vertical delta to horizontal scroll
        // Adjust multiplier for sensitivity
        const scrollAmount = e.deltaY * 1.5;
        scrollInstance.currentPos += scrollAmount;
        
        // Force an update
        if (typeof scrollInstance.update === 'function') {
            scrollInstance.update();
        }
    }, { passive: false });
    
    // Handle touch events for mobile
    document.addEventListener('touchstart', (e) => {
        if (document.body.classList.contains('b-inside')) return;
        
        startY = e.touches[0].clientY;
        lastY = startY;
        currentScrollPos = scrollInstance.currentPos;
    }, { passive: false });
    
    document.addEventListener('touchmove', (e) => {
        if (document.body.classList.contains('b-inside')) return;
        
        const currentY = e.touches[0].clientY;
        const deltaY = lastY - currentY;
        lastY = currentY;
        
        // Convert vertical swipe to horizontal scroll
        // Adjust multiplier for sensitivity
        const scrollAmount = deltaY * 2.5;
        
        // Update ASScroll position directly
        scrollInstance.currentPos += scrollAmount;
        
        // Force an update
        if (typeof scrollInstance.update === 'function') {
            scrollInstance.update();
        }
        
        // Prevent default to avoid competing with native scroll
        e.preventDefault();
    }, { passive: false });
    
    // For debugging
    console.log('Vertical to horizontal scroll mapping enabled');
}

export function destroyASScrollInstance() {
    if (instance) {
        instance.disable();
        instance = null;
    }
}