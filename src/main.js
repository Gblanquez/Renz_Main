import './styles/style.css'
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';
import { each } from 'jquery';
import lottie from 'lottie-web';
import SplitType from 'split-type'

// import customRender from './renders/Load';


//Velocity Animation




// Utility scramble function
function scrambleText(element, finalText, duration = 0.5, speed = 0.02) {
    const chars = '#@%!%&$*()fghijklmnopq-=+{}]^?><rstuvwxyzabcde'
    let frame = 0
    const totalFrames = duration * 1000 / (speed * 1000) // Convert to milliseconds
    let isAnimating = true

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
        }
    }

    return {
        start: () => {
            isAnimating = true
            frame = 0
            requestAnimationFrame(update)
        },
        stop: () => {
            isAnimating = false
            element.textContent = finalText
        }
    }
}

function addScrambleAnimations() {
    const selector = '.connect-item a, .social-links a, .social-links-bottom-left a, .navbar-links a'
    const connectLinks = document.querySelectorAll(selector)

    connectLinks.forEach(link => {
        const originalText = link.textContent
        const scrambler = scrambleText(link, originalText)

        link.addEventListener('mouseenter', () => {
            scrambler.start()
        })

        link.addEventListener('mouseleave', () => {
            scrambler.stop()
        })
    })
}

// Call the function to apply the animations
addScrambleAnimations();




// document.addEventListener('DOMContentLoaded', () => {
//     const textarea = document.getElementById('project-idea');

//     // Function to adjust height based on content
//     function adjustHeight() {
//         textarea.style.height = 'auto'; // Reset height to recalculate
//         textarea.style.height = `${textarea.scrollHeight}px`; // Set to content height
//     }

//     // Adjust height on input
//     textarea.addEventListener('input', adjustHeight);

//     // Initial adjustment in case placeholder affects height
//     adjustHeight();
// });











