import './styles/style.css';
import gsap from 'gsap';
import SplitType from 'split-type';

// Utility scramble function (unchanged)
function scrambleText(element, finalText, duration = 0.5, speed = 0.02) {
    const chars = '#@%!%&$*()fghijklmnopq-=+{}]^?><rstuvwxyzabcde';
    let frame = 0;
    const totalFrames = duration * 1000 / (speed * 1000); // Convert to milliseconds
    let isAnimating = true;

    const update = () => {
        if (!isAnimating) return;

        frame++;
        let progress = frame / totalFrames;
        let newText = '';
        
        for (let i = 0; i < finalText.length; i++) {
            if (progress >= 1) {
                newText += finalText[i];
            } else {
                newText += chars[Math.floor(Math.random() * chars.length)];
            }
        }
        
        element.textContent = newText;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    };

    return {
        start: () => {
            isAnimating = true;
            frame = 0;
            requestAnimationFrame(update);
        },
        stop: () => {
            isAnimating = false;
            element.textContent = finalText;
        }
    };
}

function addScrambleAnimations() {
    // Base selector for other links
    const baseSelector = '.connect-item a, .social-links a, .social-links-bottom-left a, .navbar-links a';
    const baseLinks = document.querySelectorAll(baseSelector);

    // Handle base links (unchanged)
    baseLinks.forEach(link => {
        const originalText = link.textContent;
        const scrambler = scrambleText(link, originalText);

        link.addEventListener('mouseenter', () => {
            scrambler.start();
        });

        link.addEventListener('mouseleave', () => {
            scrambler.stop();
        });
    });

    // Handle .item-list links with multiple text elements
    const itemListLinks = document.querySelectorAll('.content-list .item-list');
    itemListLinks.forEach(link => {
        // Create scramblers for each text element
        const textElements = {
            title: {
                element: link.querySelector('.indexH2'),
                scrambler: null
            },
            description: {
                element: link.querySelector('.indexP'),
                scrambler: null
            },
            spans: Array.from(link.querySelectorAll('.indexSpan')).map(span => ({
                element: span,
                scrambler: null
            }))
        };

        // Initialize scramblers
        if (textElements.title.element) {
            textElements.title.scrambler = scrambleText(
                textElements.title.element, 
                textElements.title.element.textContent,
                0.4,
                0.02
            );
        }

        if (textElements.description.element) {
            textElements.description.scrambler = scrambleText(
                textElements.description.element, 
                textElements.description.element.textContent,
                0.5,
                0.02
            );
        }

        textElements.spans.forEach(span => {
            if (span.element) {
                span.scrambler = scrambleText(
                    span.element, 
                    span.element.textContent,
                    0.3,
                    0.02
                );
            }
        });

        // Add hover listeners that check for animating class
        link.addEventListener('mouseenter', () => {
            // Only trigger hover effects if not animating
            if (!document.querySelector('.content-list.animating')) {
                if (textElements.title.scrambler) textElements.title.scrambler.start();
                if (textElements.description.scrambler) {
                    setTimeout(() => textElements.description.scrambler.start(), 50);
                }
                textElements.spans.forEach((span, index) => {
                    if (span.scrambler) {
                        setTimeout(() => span.scrambler.start(), index * 30);
                    }
                });
            }
        });

        link.addEventListener('mouseleave', () => {
            // Always stop animations on mouseleave
            if (textElements.title.scrambler) textElements.title.scrambler.stop();
            if (textElements.description.scrambler) textElements.description.scrambler.stop();
            textElements.spans.forEach(span => {
                if (span.scrambler) span.scrambler.stop();
            });
        });
    });
}

// Initialize animations when DOM is ready and after transitions
document.addEventListener('DOMContentLoaded', () => {
    addScrambleAnimations();
});

// Re-initialize after list view transition
// This should be called after setupEnhancedHoverEvents in HomeSketch.js
export function reinitializeListAnimations() {
    addScrambleAnimations();
}

// Export a function to reset all text content
export function resetAllListText() {
    const itemListLinks = document.querySelectorAll('.content-list .item-list');
    itemListLinks.forEach(link => {
        if (typeof link._resetTextContent === 'function') {
            link._resetTextContent();
        }
    });
}