import SplitType from 'split-type'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)


function scrambleText(element, finalText, duration = 1.6, speed = 0.03, delay = 0) {
    const chars = '#@%!%&$*()fghijklmnopq-=+{}]^?><rstuvwxyzabcde'
    let frame = 0
    const totalFrames = duration * 1000 / (speed * 1000)
    let isAnimating = true

    return new Promise((resolve) => {
        setTimeout(() => {
            const update = () => {
                if (!isAnimating) return

                frame++
                let progress = frame / totalFrames
                let newText = ''
                
                for (let i = 0; i < finalText.length; i++) {
                    if (progress >= 1) {
                        newText += finalText[i]
                    } else {
                        newText += chars[Math.floor(Math.random() * chars.length)]
                    }
                }
                
                element.textContent = newText

                if (progress < 1) {
                    requestAnimationFrame(update)
                } else {
                    resolve()
                }
            }
            requestAnimationFrame(update)
        }, delay * 1000)
    })
}

// Helper function to check if elements exist
function checkElements(selector) {
    const elements = document.querySelectorAll(selector)
    return elements && elements.length > 0
}

// Helper function to ensure text content is ready
function waitForElement(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

// Main animation function
function animateText(selector) {
    const elements = document.querySelectorAll(selector)
    
    elements.forEach(element => {
        if (!element || !element.textContent.trim()) return

        const split = new SplitType(element, { 
            types: 'words',
            tagName: 'span'
        })

        split.words?.forEach((word) => {
            const originalText = word.textContent
            
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: word,
                    start: "top bottom",
                }
            })

            tl.fromTo(word, 
                {
                    x: '200%',
                    opacity: 0,
                }, 
                {
                    x: '0%',
                    opacity: 1,
                    duration: 1.6,
                    ease: "expo.out",
                    onStart: () => {
                        scrambleText(word, originalText, 1.6)
                    }
                }
            )
        })
    })
}

export function initializeAnimations() {
    // Add a small delay to ensure DOM is ready
    setTimeout(() => {
        const container = document.querySelector('[data-barba="container"]')
        if (!container) return

        // Only initialize animations for elements that exist in the current container
        if (container.querySelector('.mainText')) animateText('.mainText')
        if (container.querySelector('.ab-t')) animateText('.ab-t')
        if (container.querySelector('.info2')) animateText('.info2')
    }, 300)
}

export function OutAnimation() {
    const elements = document.querySelectorAll('.mainText, .ab-t, .info2')
    
    elements.forEach(element => {
        if (!element || !element.textContent.trim()) return

        const split = new SplitType(element, { 
            types: 'words',
            tagName: 'span'
        })

        split.words?.forEach(word => {
            const originalText = word.textContent
            gsap.to(word, {
                duration: 1.8,
                x: '-200%',
                opacity: 0,
                ease: "expo.out",
                onStart: () => {
                    scrambleText(word, originalText, 1.8, 0.02)
                }
            })
        })
    })
}


export function initializeInsideAnimations() {
    animateText('.projecth1')
    animateText('.projecth2')
}

// Test function for info2 elements only
export function aboutPageAnimation() {
    return new Promise(async (resolve) => {
        console.log('Starting about page animation');
        
        // Wait for Barba transition
        await new Promise(resolve => setTimeout(resolve, 300));

        // Get the container first
        const container = document.querySelector('[data-barba="container"]');
        console.log('Container found:', container);

        if (!container) {
            console.warn('No Barba container found');
            resolve();
            return;
        }

        try {
            // Get elements within the container
            const elements = {
                title: container.querySelector('.mainText'),
                bio: container.querySelector('.ab-t'),
                sections: container.querySelectorAll('.info2')
            };

            console.log('Elements found:', {
                title: !!elements.title,
                bio: !!elements.bio,
                sectionsCount: elements.sections.length
            });

            // Animate sections first (since we know these work)
            elements.sections.forEach((section, index) => {
                const split = new SplitType(section, {
                    types: 'words',
                    tagName: 'span'
                });

                split.words?.forEach(word => {
                    const originalText = word.textContent;
                    gsap.fromTo(word,
                        { x: '200%', opacity: 0 },
                        {
                            x: '0%',
                            opacity: 1,
                            duration: 1.6,
                            delay: 0.1 * index,
                            ease: "expo.out",
                            onStart: () => scrambleText(word, originalText, 1.6)
                        }
                    );
                });
            });

            // Then animate title if it exists
            if (elements.title) {
                const titleSplit = new SplitType(elements.title, {
                    types: 'words',
                    tagName: 'span'
                });

                titleSplit.words?.forEach((word, index) => {
                    const originalText = word.textContent;
                    gsap.fromTo(word,
                        { x: '200%', opacity: 0 },
                        {
                            x: '0%',
                            opacity: 1,
                            duration: 1.6,
                            delay: index * 0.1,
                            ease: "expo.out",
                            onStart: () => scrambleText(word, originalText, 1.6)
                        }
                    );
                });
            }

            // Finally animate bio if it exists
            if (elements.bio) {
                const bioSplit = new SplitType(elements.bio, {
                    types: 'words',
                    tagName: 'span'
                });

                bioSplit.words?.forEach((word, index) => {
                    const originalText = word.textContent;
                    gsap.fromTo(word,
                        { x: '200%', opacity: 0 },
                        {
                            x: '0%',
                            opacity: 1,
                            duration: 1.6,
                            delay: 0.2 + (index * 0.05),
                            ease: "expo.out",
                            onStart: () => scrambleText(word, originalText, 1.6)
                        }
                    );
                });
            }

        } catch (error) {
            console.warn('Error in aboutPageAnimation:', error);
        }

        resolve();
    });
}

// About page exit animation
export function aboutPageOutAnimation() {
    return new Promise(async (resolve) => {
        const elements = {
            title: document.querySelector('.mainText'),
            bio: document.querySelector('.ab-t'),
            sections: document.querySelectorAll('.info2')
        };

        // Animate out main title
        if (elements.title) {
            const titleSplit = new SplitType(elements.title, {
                types: 'words',
                tagName: 'span'
            });

            titleSplit.words?.forEach(word => {
                const originalText = word.textContent;
                gsap.to(word, {
                    x: '-200%',
                    opacity: 0,
                    duration: 1.8,
                    ease: "expo.out",
                    onStart: () => {
                        scrambleText(word, originalText, 1.8, 0.02);
                    }
                });
            });
        }

        // Animate out bio and sections similarly
        [elements.bio, ...elements.sections].forEach(element => {
            if (!element) return;
            
            const split = new SplitType(element, {
                types: 'words',
                tagName: 'span'
            });

            split.words?.forEach(word => {
                const originalText = word.textContent;
                gsap.to(word, {
                    x: '-200%',
                    opacity: 0,
                    duration: 1.8,
                    ease: "expo.out",
                    onStart: () => {
                        scrambleText(word, originalText, 1.8, 0.02);
                    }
                });
            });
        });

        // Give animations time to complete
        setTimeout(resolve, 2000);
    });
}
