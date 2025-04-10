import barba from '@barba/core';
import gsap from 'gsap';
import ASScroll from '@ashthornton/asscroll';
import ScrollTrigger from "gsap/ScrollTrigger";
import HomeSketch from './HomeSketch';
import WorkSketch from './WorkSketch';
import { initializeAnimations, OutAnimation, initializeInsideAnimations } from './animation';
import { initializeTransitions } from './transition.js';

gsap.registerPlugin(ScrollTrigger);

export const setVw = () => {
    // Set --vw to 1% of the current viewport width in pixels
    // This will be used for desktop, and overridden by CSS for mobile
    document.documentElement.style.setProperty('--vw', `${window.innerWidth / 100}px`);
};

// Set the initial value of --vw
document.addEventListener('DOMContentLoaded', () => {
    setVw();
    initializeTransitions();
    initializeAnimations();
});

// Update --vw on window resize
window.addEventListener('resize', setVw);


export default class App {
    constructor(options) {
        this.container = options.domElement;
        this.homeSketch = options.homeSketch;
        this.workSketch = options.workSketch;
        // this.barba(); // Uncomment if using page transitions later
    }
}

// new App({
//     domElement: document.getElementById('container'),
//     homeSketch: new HomeSketch({
//         domElement: document.getElementById('container')
//     }),
// });