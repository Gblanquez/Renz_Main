import barba from '@barba/core';
import gsap from 'gsap';
import WorkSketch from './WorkSketch';
import HomeSketch from './HomeSketch';
import { getASScrollInstance, destroyASScrollInstance } from './smoothScroll';

// Global sketch instances
let homeSketchInstance = null;
let workSketchInstance = null;

// Export setter functions
export const setHomeSketchInstance = (instance) => {
  homeSketchInstance = instance;
};

export const setWorkSketchInstance = (instance) => {
  workSketchInstance = instance;
};

// Simple fade transition
const fadeTransition = {
  leave(data) {
    // Clean up before leaving
    if (data.current.namespace === 'home' && homeSketchInstance) {
      homeSketchInstance.destroy();
      homeSketchInstance = null;
    } else if (data.current.namespace === 'work' && workSketchInstance) {
      workSketchInstance.destroy();
      workSketchInstance = null;
    }
    
    // Perform the transition
    return gsap.to(data.current.container, {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.inOut'
    });
  },
  enter(data) {
    window.scrollTo(0, 0);
    
    // Set body class based on namespace
    if (data.next.namespace === 'home') {
      document.body.classList.remove('b-inside');
    } else {
      document.body.classList.add('b-inside');
    }
    
    return gsap.from(data.next.container, {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.inOut'
    });
  },
  after(data) {
    // Initialize sketches after transition is complete
    const container = document.getElementById('container');
    
    if (data.next.namespace === 'home' && container) {
      // Ensure we destroy any existing instance
      if (homeSketchInstance) {
        homeSketchInstance.destroy();
      }
      
      // Create new instance
      homeSketchInstance = new HomeSketch({ domElement: container });
      console.log('HomeSketch initialized');
    } else if (data.next.namespace === 'work' && container) {
      // Ensure we destroy any existing instance
      if (workSketchInstance) {
        workSketchInstance.destroy();
      }
      
      // Create new instance
      workSketchInstance = new WorkSketch({ domElement: container });
      console.log('WorkSketch initialized');
    }
  }
};

// Initialize Barba
export const initBarba = () => {
  barba.init({
    debug: true, // Enable debug mode to see what's happening
    timeout: 5000, // Increase timeout for transitions
    
    transitions: [
      { name: 'default-transition', ...fadeTransition }
    ]
  });
  
  // Initialize for first page load
  barba.hooks.ready(() => {
    const currentNamespace = document.querySelector('[data-barba="container"]')?.getAttribute('data-barba-namespace');
    const container = document.getElementById('container');
    
    // Set body class based on namespace
    if (currentNamespace === 'home') {
      document.body.classList.remove('b-inside');
    } else {
      document.body.classList.add('b-inside');
    }
    
    // Initialize appropriate sketch
    if (currentNamespace === 'home' && container) {
      homeSketchInstance = new HomeSketch({ domElement: container });
      console.log('Initial HomeSketch initialized');
    } else if (currentNamespace === 'work' && container) {
      workSketchInstance = new WorkSketch({ domElement: container });
      console.log('Initial WorkSketch initialized');
    }
  });
};
