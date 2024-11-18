import './styles/style.css'
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';
import { each } from 'jquery';
import lottie from 'lottie-web';
import app from './app';
import $ from 'jquery';
import SplitType from 'split-type'

// import customRender from './renders/Load';
gsap.registerPlugin(ScrollTrigger);

//Velocity Animation



//Time Location SetUp

const locations = document.querySelectorAll(".time_wrapper");

const updateTime = function () {
  locations.forEach((location) => {
    const output = location.querySelector(".time_number");

    const now = luxon.DateTime.now().setZone("Europe/London");

    output.innerHTML = now.toFormat("HH:mm:ss");
  });
};

updateTime();

setInterval(function () {
  updateTime();
}, 1000);

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






// document.addEventListener('DOMContentLoaded', function() {
//   const animation = lottie.loadAnimation({
//       container: document.getElementById('lottie-logo'), // the DOM element that will contain the animation
//       renderer: 'svg',
//       loop: false,
//       autoplay: true,
//       path: 'https://uploads-ssl.webflow.com/64f92766515fe8ac324ab919/65186a24e392f9569a5bee3f_logo1.json' // the path to the animation JSON
//   });
// });

document.addEventListener('DOMContentLoaded', function() {
  const DateTime = luxon.DateTime;
  const londonTime = DateTime.now().setZone('Europe/London').toLocaleString(DateTime.TIME_24_SIMPLE);

  document.getElementById('time-location').textContent = `LDN ${londonTime} GMT`;
});












