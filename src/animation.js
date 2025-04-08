import SplitType from 'split-type'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)


function scrambleText(element, finalText, duration = 1.8, speed = 0.03, delay = 0) {
    const chars = '#@%!%&$*()fghijklmnopq-=+{}]^?><rstuvwxyzabcde'
    let frame = 0
    const totalFrames = duration * 2000 / (speed * 2000)
    let isAnimating = true
    
    // Since we're now animating single characters, we don't need to create spans for each
    // character within the element - the element IS the character

    return new Promise((resolve) => {
        setTimeout(() => {
            const update = () => {
                if (!isAnimating) return

                frame++
                let progress = frame / totalFrames
                
                // Determine character
                let char;
                if (progress >= 1) {
                    char = finalText;
                } else {
                    char = chars[Math.floor(Math.random() * chars.length)];
                }
                
                // Add blinking effect during scrambling
                if (progress < 1) {
                    // Random blink timing
                    const shouldBlink = Math.random() > 0.7;
                    element.style.opacity = shouldBlink ? '0.2' : '1';
                } else {
                    element.style.opacity = '1'; // Final state is fully visible
                }
                
                element.textContent = char;

                if (progress < 1) {
                    requestAnimationFrame(update)
                } else {
                    resolve()
                }
            }
            requestAnimationFrame(update)
        }, delay * 300)
    })
}

// Main animation function
function animateText(selector, options = {}) {
    const elements = document.querySelectorAll(selector)
    
    // Default options that can be overridden
    const defaults = {
        baseDelay: 0.05,         
        maxTotalDelay: 0.8,      
        duration: 1.4,           
        scrambleDuration: 0.8,   
        enterX: '30vw',          
        exitX: '-40vw',          
        isEnter: true            
    };
    
    // Merge provided options with defaults
    const config = { ...defaults, ...options };
    
    elements.forEach(element => {
        if (!element || !element.textContent.trim()) return

        // Immediately set the element to invisible
        gsap.set(element, { opacity: 0 });

        // First split by words to maintain word spacing
        const splitWords = new SplitType(element, { 
            types: 'words',
            tagName: 'spanWord'
        })
        
        // Then split each word into characters
        const splitChars = new SplitType(splitWords.words, {
            types: 'chars',
            tagName: 'spanChar'
        })
        
        if (!splitChars.chars || !splitChars.chars.length) return
        
        // Set initial state for all characters
        splitChars.chars.forEach(char => {
            gsap.set(char, { 
                opacity: 0,
                x: config.enterX
            });
        });
        
        // Now make the parent element visible again
        gsap.set(element, { opacity: 1 });
        
        // Calculate a scaling factor for delays based on text length
        // This ensures even very long texts don't have excessive cumulative delays
        const charCount = splitChars.chars.length;
        const scaleFactor = Math.min(1, config.maxTotalDelay / (charCount * config.baseDelay));
        
        // Animate each character independently
        splitChars.chars.forEach((char, index) => {
            const originalText = char.textContent
            
            // Scale the delay based on text length
            const charDelay = index * config.baseDelay * scaleFactor;
            
            if (config.isEnter) {
                // Enter animation
                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: char,
                        start: "top bottom",
                    }
                })
    
                tl.fromTo(char, 
                    {
                        x: config.enterX,
                        opacity: 0,
                    }, 
                    {
                        x: '0%',
                        opacity: 1,
                        duration: config.duration,
                        delay: charDelay,
                        ease: "expo.out",
                        onStart: () => {
                            scrambleText(char, originalText, config.scrambleDuration)
                        }
                    }
                )
            } else {
                // Exit animation
                gsap.to(char, {
                    duration: config.duration,
                    x: config.exitX,
                    opacity: 0,
                    delay: charDelay,
                    ease: "expo.out",
                    onStart: () => {
                        scrambleText(char, originalText, config.scrambleDuration, 0.02)
                    }
                })
            }
        })
    })
}

export function initializeAnimations() {
    // Set initial opacity of container to 0
    const container = document.querySelector('[data-barba="container"]')
    if (container) {
        gsap.set(container, { opacity: 0 });
    }

    // Add a small delay to ensure DOM is ready
    setTimeout(() => {
        if (!container) return

        // Fade in the container
        gsap.to(container, {
            opacity: 1,
            duration: 0.4,
            ease: "power2.out"
        });

        // Configure specific settings for different text elements
        const mainTextConfig = {
            baseDelay: 0.02,
            maxTotalDelay: 0.6,
            duration: 0.8,
            scrambleDuration: 0.5
        }
        
        const paragraphConfig = {
            baseDelay: 0.01,
            maxTotalDelay: 0.5,
            duration: 0.8,
            scrambleDuration: 0.5
        }
        
        const shortTextConfig = {
            baseDelay: 0.03,
            maxTotalDelay: 0.7,
            duration: 0.8,
            scrambleDuration: 0.5
        }

        // Only initialize animations for elements that exist in the current container
        if (container.querySelector('.mainText')) animateText('.mainText', mainTextConfig)
        if (container.querySelector('.ab-t')) animateText('.ab-t', paragraphConfig)
        if (container.querySelector('.info2')) animateText('.info2', paragraphConfig)
        if (container.querySelectorAll('.scramble-text')) animateText('.scramble-text', shortTextConfig)
    }, 100)
}

export function OutAnimation() {
    return new Promise((resolve) => {
        const elements = document.querySelectorAll('.mainText, .ab-t, .info2, .scramble-text')
        
        // Exit animation configuration
        const exitConfig = {
            baseDelay: 0.01,
            maxTotalDelay: 0.4,
            duration: 0.8,
            scrambleDuration: 0.5,
            enterX: '0%',    // Starting position (current position)
            exitX: '-30vw',  // Exit position (matching the entrance distance)
            isEnter: false   // Specify this is an exit animation
        }

        let animationsCompleted = 0;
        const totalAnimations = elements.length;
        
        elements.forEach((element, index) => {
            if (!element || !element.textContent.trim()) {
                animationsCompleted++;
                if (animationsCompleted === totalAnimations) resolve();
                return;
            }

            // Create a timeline for this element's exit
            const tl = gsap.timeline({
                onComplete: () => {
                    animationsCompleted++;
                    if (animationsCompleted === totalAnimations) resolve();
                }
            });

            // Split and animate with the same pattern as entrance
            const splitWords = new SplitType(element, { 
                types: 'words',
                tagName: 'spanWord'
            });
            
            const splitChars = new SplitType(splitWords.words, {
                types: 'chars',
                tagName: 'spanChar'
            });

            if (!splitChars.chars || !splitChars.chars.length) {
                animationsCompleted++;
                if (animationsCompleted === totalAnimations) resolve();
                return;
            }

            const charCount = splitChars.chars.length;
            const scaleFactor = Math.min(1, exitConfig.maxTotalDelay / (charCount * exitConfig.baseDelay));

            // Animate each character
            splitChars.chars.forEach((char, charIndex) => {
                const originalText = char.textContent;
                const charDelay = charIndex * exitConfig.baseDelay * scaleFactor;

                gsap.to(char, {
                    x: exitConfig.exitX,
                    opacity: 0,
                    duration: exitConfig.duration,
                    delay: charDelay,
                    ease: "expo.in",
                    onStart: () => {
                        scrambleText(char, originalText, exitConfig.scrambleDuration, 0.02);
                    }
                });
            });
        });

        // If no elements found, resolve immediately
        if (totalAnimations === 0) resolve();
    });
}

export function initializeInsideAnimations() {
    // Configure specific settings for project headings
    const headingConfig = {
        baseDelay: 0.025,
        maxTotalDelay: 0.6,
        duration: 1.2,
        scrambleDuration: 1.1
    }
    
    animateText('.projecth1', headingConfig)
    animateText('.projecth2', headingConfig)
}


export function listAnime() {
    const container = document.querySelector('.content-list');
    if (!container) return;

    // Configure settings for list animations
    const listConfig = {
        baseDelay: 0.01,
        maxTotalDelay: 0.3,
        duration: 0.8,
        scrambleDuration: 0.6,
        enterX: '20vw',
        isEnter: true
    };

    // Create a single timeline
    const tl = gsap.timeline();

    // Get all list items
    const listItems = container.querySelectorAll('.item-list');

    listItems.forEach((item, itemIndex) => {
        const elements = [
            { el: item.querySelector('.indexH2.list'), delay: 0 },
            { el: item.querySelector('.indexP.list'), delay: 0.05 },
            ...Array.from(item.querySelectorAll('.indexSpan.list')) // This should match "indexSpan list"
                .map((span, i) => ({ el: span, delay: 0.1 + i * 0.02 }))
        ].filter(({ el }) => el);

        const itemDelay = itemIndex * 0.1; // Stagger between items

        elements.forEach(({ el, delay }) => {
            // Split text into characters using SplitType
            const split = new SplitType(el, {
                types: 'chars',
                tagName: 'spanList'
            });

            if (!split.chars || !split.chars.length) return;

            // Store original text
            el._originalText = el.textContent;

            // Set initial state
            gsap.set(split.chars, {
                opacity: 0,
                x: listConfig.enterX
            });

            // Animate each character
            split.chars.forEach((char, charIndex) => {
                const totalDelay = itemDelay + delay + charIndex * listConfig.baseDelay;

                tl.to(char, {
                    opacity: 1,
                    x: '0%',
                    duration: listConfig.duration,
                    ease: 'expo.out',
                    onStart: () => {
                        scrambleText(char, char.textContent, listConfig.scrambleDuration, 0.03, 0);
                    }
                }, totalDelay);
            });
        });
    });

    return tl;
}


export function listOutAnime() {
    const container = document.querySelector('.content-list');
    if (!container) return;

    // Configure settings for list animations (faster exit version)
    const listConfig = {
        baseDelay: 0.008,       // Faster stagger between characters
        maxTotalDelay: 0.2,     // Quicker overall delay
        duration: 0.5,          // Faster exit duration
        scrambleDuration: 0.4,  // Shorter scramble to fit duration
        exitX: '-20vw',         // Keep left movement
        isEnter: false          // Indicate exit animation
    };

    // Create a single timeline
    const tl = gsap.timeline();

    // Get all list items
    const listItems = container.querySelectorAll('.item-list');

    listItems.forEach((item, itemIndex) => {
        const elements = [
            { el: item.querySelector('.indexH2.list'), delay: 0 },
            { el: item.querySelector('.indexP.list'), delay: 0.03 },
            ...Array.from(item.querySelectorAll('.indexSpan.list'))
                .map((span, i) => ({ el: span, delay: 0.06 + i * 0.015 }))
        ].filter(({ el }) => el);

        const itemDelay = itemIndex * 0.06; // Faster stagger between items

        elements.forEach(({ el, delay }) => {
            // Split text into characters using SplitType
            const split = new SplitType(el, {
                types: 'chars',
                tagName: 'spanList'
            });

            if (!split.chars || !split.chars.length) return;

            // Store original text (not used for final state in exit)
            el._originalText = el.textContent;

            // Set initial state (visible)
            gsap.set(split.chars, {
                opacity: 1,
                x: '0%'
            });

            // Animate each character out
            split.chars.forEach((char, charIndex) => {
                const totalDelay = itemDelay + delay + charIndex * listConfig.baseDelay;

                tl.to(char, {
                    opacity: 0,                  // Fade out completely
                    x: listConfig.exitX,         // Move left
                    duration: listConfig.duration,
                    ease: 'power2.in',           // Smoother exit easing
                    onStart: () => {
                        // Start scrambling with a random target instead of original text
                        scrambleText(char, '', listConfig.scrambleDuration, 0.02, 0);
                    },
                    onUpdate: () => {
                        // Keep scrambling during animation by resetting text randomly
                        if (Math.random() > 0.5) { // Randomly update some chars
                            char.textContent = '#@%!%&$*()fghijklmnopq-=+{}]^?><rstuvwxyzabcde'[Math.floor(Math.random() * 43)];
                        }
                    },
                    onComplete: () => {
                        char.textContent = ''; // Ensure it’s empty when done
                    }
                }, totalDelay);
            });
        });
    });

    return tl;
}

export function workAnime() {
    const container = document.querySelector('.content-circle');
    if (!container || container.style.display === 'none') {
        console.log('workAnime: Container not found or hidden');
        return;
    }

    console.log('workAnime: Starting animation');

    const workConfig = {
        baseDelay: 0.01,
        maxTotalDelay: 0.3,
        duration: 0.8,
        scrambleDuration: 0.6,
        enterX: '20vw',
        isEnter: true
    };

    const tl = gsap.timeline();

    // Animate the title
    animateText('.content-circle .t', workConfig);

    // Animate circle items
    const circleItems = container.querySelectorAll('.item-circle');
    circleItems.forEach((item, itemIndex) => {
        const selectors = [
            '.indexH2.circle',
            '.indexP.circle',
            '.indexSpan.circle' // Will target all spans; we'll handle multiple spans below
        ];

        selectors.forEach((selector, elIndex) => {
            const baseSelector = `.content-circle .item-circle:nth-child(${itemIndex + 1}) ${selector}`;
            const itemDelay = itemIndex * 0.1;
            const adjustedConfig = {
                ...workConfig,
                baseDelay: workConfig.baseDelay + itemDelay
            };

            if (selector === '.indexSpan.circle') {
                // Handle multiple .indexSpan.circle elements within the same .item-circle
                const spans = item.querySelectorAll('.indexSpan.circle');
                spans.forEach((span, spanIndex) => {
                    const spanSelector = `.content-circle .item-circle:nth-child(${itemIndex + 1}) .indexSpan.circle:nth-child(${spanIndex + 1})`;
                    const spanConfig = {
                        ...adjustedConfig,
                        baseDelay: adjustedConfig.baseDelay + (spanIndex * 0.02) // Additional stagger for spans
                    };
                    animateText(spanSelector, spanConfig);
                });
            } else {
                // Single elements like .indexH2.circle and .indexP.circle
                animateText(baseSelector, adjustedConfig);
            }
        });
    });

    return tl;
}

export function workOutAnime() {
    const container = document.querySelector('.content-circle');
    if (!container || container.style.display === 'none') {
        console.log('workOutAnime: Container not found or hidden');
        return;
    }

    console.log('workOutAnime: Starting animation');

    const workConfig = {
        baseDelay: 0.008,
        maxTotalDelay: 0.2,
        duration: 0.5,
        scrambleDuration: 0.4,
        exitX: '-20vw',
        isEnter: false
    };

    const tl = gsap.timeline({
        onComplete: () => console.log('workOutAnime: Animation completed')
    });

    // Animate title
    animateText('.content-circle .t', workConfig);

    // Animate circle items
    const circleItems = container.querySelectorAll('.item-circle');
    circleItems.forEach((item, itemIndex) => {
        const selectors = [
            '.indexH2.circle',
            '.indexP.circle',
            '.indexSpan.circle' // Will target all spans; handled below
        ];

        selectors.forEach((selector, elIndex) => {
            const baseSelector = `.content-circle .item-circle:nth-child(${itemIndex + 1}) ${selector}`;
            const itemDelay = itemIndex * 0.06; // Matches listOutAnime
            const adjustedConfig = {
                ...workConfig,
                baseDelay: workConfig.baseDelay + itemDelay
            };

            if (selector === '.indexSpan.circle') {
                // Handle multiple .indexSpan.circle elements within the same .item-circle
                const spans = item.querySelectorAll('.indexSpan.circle');
                spans.forEach((span, spanIndex) => {
                    const spanSelector = `.content-circle .item-circle:nth-child(${itemIndex + 1}) .indexSpan.circle:nth-child(${spanIndex + 1})`;
                    const spanConfig = {
                        ...adjustedConfig,
                        baseDelay: adjustedConfig.baseDelay + (spanIndex * 0.015) // Matches listOutAnime span stagger
                    };
                    animateText(spanSelector, spanConfig);
                });
            } else {
                // Single elements like .indexH2.circle and .indexP.circle
                animateText(baseSelector, adjustedConfig);
            }
        });
    });

    return tl;
}








