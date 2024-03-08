import { Transition } from '@unseenco/taxi'
import gsap from 'gsap'
import SplitType from 'split-type'
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import Lenis from '@studio-freight/lenis'
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";

gsap.registerPlugin(ScrambleTextPlugin);
gsap.registerPlugin( ScrollTrigger);



export default class AboutPage extends Transition {
    /**
     * Handle the transition leaving the previous page.
     * @param { { from: HTMLElement, trigger: string|HTMLElement|false, done: function } } props
     */
 onLeave({ from, trigger, done }) {
      // do something ...



      const mainH1About = [...document.querySelectorAll('[data-a="about-h1"]')];
      const aboutInfo = [...document.querySelectorAll('[data-a="about-text"]')];
      
      const aboutText = new SplitType(mainH1About, { types: 'words, chars, lines'  })
      const aboutTextInfo = new SplitType(aboutInfo, { types: 'words, chars, lines'  })
     
      const allPage = document.querySelector('.home_page_wrapper')

  
      
  

      done()
    }
  
    /**
     * Handle the transition entering the next page.
     * @param { { to: HTMLElement, trigger: string|HTMLElement|false, done: function } } props
     */
    onEnter({ to, trigger, done }) {
      // do something else ...

      function topFunction() {
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
      }
  
      topFunction()


      

      let lenis;
      lenis = new Lenis({
      lerp: 0.1,
      orientation: 'vertical',
      infinite: false,
      wheelMultiplier: 0.4,
      gestureOrientation: "both",
      normalizeWheel: false,
      smoothTouch: false
    });


    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);


      const mainH1About = [...document.querySelectorAll('[data-a="about-h1"]')];
      const aboutInfo = [...document.querySelectorAll('[data-a="about-text"]')];
      
      const aboutText = new SplitType(mainH1About, { types: 'words, chars, lines'  })
      const aboutTextInfo = new SplitType(aboutInfo, { types: 'words, chars, lines'  })

      
      gsap.from(aboutText.lines, {
        y: '120%',
        duration: 1,
        opacity: 0,
        scrambleText: { 
          chars: "upperCase",
          text: "{original}", 
          revealDelay: 1, 
          speed: 0.6, 
        },
      });

      gsap.from(aboutTextInfo.lines, {
        y: '120%',
        duration: 1,
        opacity: 0,
        scrambleText: { 
          chars: "upperCase",
          text: "{original}", 
          revealDelay: 1, 
          speed: 0.6, 
        },
    })

      
      done()
    }
  }
