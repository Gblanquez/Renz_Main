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

// Main animation function
function animateText(selector, options = {}) {
    const elements = document.querySelectorAll(selector)
    
    elements.forEach(element => {
        const split = new SplitType(element, { 
            types: 'words',
            tagName: 'span'
        })

        split.words.forEach((word) => {
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


            if (options.blink) {
                tl.to(word, {
                    opacity: 0,
                    repeat: 8,
                    yoyo: true,
                    duration: 0.05,
                    ease: "expo.out",
                }, 0)
            }
        })
    })
}


export function initializeAnimations() {
    animateText('.ab-t')
    animateText('.mainText')
    animateText('.info2')
    animateText('.service-item .scramble-text')
    animateText('.connect-item .scramble-text')
    animateText('.request-item .scramble-text')
}

export function OutAnimation() {
    function reverseAnimations(selector, moveX = '-200%') {
        document.querySelectorAll(selector).forEach(element => {
            const split = new SplitType(element, { 
                types: 'words',
                tagName: 'span'
            })

            split.words.forEach(word => {
                const originalText = word.textContent
                gsap.timeline()
                    .to(word, {
                        duration: 1.8,
                        x: moveX,
                        opacity: 0,
                        ease: "expo.out",
                        onStart: () => {
                            scrambleText(word, originalText, 1.8, 0.02)
                        }
                    })
            })
        })
    }


    reverseAnimations('.ab-t')
    reverseAnimations('.mainText')
    reverseAnimations('.info2', '0%')
    reverseAnimations('.info2 .scramble-text')
    reverseAnimations('.service-item .scramble-text')
    reverseAnimations('.connect-item .scramble-text')
    reverseAnimations('.request-item .scramble-text')
}


export function initializeInsideAnimations() {
    animateText('.projecth1', { blink: true })
    animateText('.projecth2', { blink: true })
}
