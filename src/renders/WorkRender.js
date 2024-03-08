import { Renderer } from '@unseenco/taxi';
import gsap from 'gsap';
import SplitType from 'split-type'
import Lenis from '@studio-freight/lenis'
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
gsap.registerPlugin( ScrollTrigger);


export default class workRender extends Renderer {
  onEnter() {
    // run after the new content has been added to the Taxi container


  }

  onEnterCompleted() {
     // run after the transition.onEnter has fully completed
    //  let lenis;
    //  lenis = new Lenis({
    //    lerp: 0.1,
    //    orientation: 'vertical',
    //    infinite: false,
    //    wheelMultiplier: 0.4,
    //    gestureOrientation: "both",
    //    normalizeWheel: false,
    //    smoothTouch: false
    //  });
    //  function raf(time) {
    //    lenis.raf(time);
    //    requestAnimationFrame(raf);
    //  }
    //  requestAnimationFrame(raf);
  }

  onLeave() {
    // run before the transition.onLeave method is called



  }

  onLeaveCompleted() {
    // run after the transition.onleave has fully completed
  }
}