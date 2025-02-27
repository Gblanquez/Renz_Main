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
            touchScrollType: 'scrollTop',
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
    }
    return instance;
}

export function destroyASScrollInstance() {
    if (instance) {
        instance.disable();
        instance = null;
    }
}