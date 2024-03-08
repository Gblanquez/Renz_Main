import { Renderer } from '@unseenco/taxi';
import gsap from 'gsap';
import SplitType from 'split-type'
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import Lenis from '@studio-freight/lenis'
gsap.registerPlugin( ScrollTrigger);



export default class aboutRender extends Renderer {
  onEnter() {
    // run after the new content has been added to the Taxi container

  

  }

  onEnterCompleted() {
    // let lenis;
    // lenis = new Lenis({
    //   lerp: 0.1,
    //   orientation: 'vertical',
    //   infinite: false,
    //   wheelMultiplier: 0.4,
    //   gestureOrientation: "both",
    //   normalizeWheel: true,
    //   smoothTouch: false
    // });
    // function raf(time) {
    //   lenis.raf(time);
    //   requestAnimationFrame(raf);
    // }
    // requestAnimationFrame(raf);


    

  }

  

  onLeave() {


    
    
  }

  onLeaveCompleted() {
    // run after the transition.onleave has fully completed


    
  }
}