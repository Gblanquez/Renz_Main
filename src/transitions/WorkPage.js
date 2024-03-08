import { Transition } from '@unseenco/taxi'
import gsap from 'gsap'
import SplitType from 'split-type'
import Lenis from '@studio-freight/lenis'
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

gsap.registerPlugin( ScrollTrigger);
export default class workPage extends Transition {
  /**
   * Handle the transition leaving the previous page.
   * @param { { from: HTMLElement, trigger: string|HTMLElement|false, done: function } } props
   */
  onLeave({ from, trigger, done }) {
    // do something ...
    done()
  }

  /**
   * Handle the transition entering the next page.
   * @param { { to: HTMLElement, trigger: string|HTMLElement|false, done: function } } props
   */
  onEnter({ to, trigger, done }) {
    // do something else ...

    // function topFunction() {
    //   document.body.scrollTop = 0; // For Safari
    //   document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    // }

    // topFunction()

    // const tl = gsap.timeline()



    // let lenis;
    // lenis = new Lenis({
    //   lerp: 0.1,
    //   orientation: 'vertical',
    //   infinite: false,
    //   wheelMultiplier: 0.4,
    //   gestureOrientation: "both",
    //   normalizeWheel: false,
    //   smoothTouch: false
    // });

    // function raf(time) {
    //   lenis.raf(time);
    //   requestAnimationFrame(raf);
    // }
    // requestAnimationFrame(raf);
    // scrollTo(0,0)

    // const workTemplateH1 = document.querySelectorAll("[data-a='template-h1']");
    // const workTemplateText = document.querySelectorAll("[data-a='template-text']");

    // const templateH1 = new SplitType(workTemplateH1, { types: 'words, chars, lines'  })
    // const templateT = new SplitType(workTemplateText, { types: 'words, chars, lines'  })

    // const templateImg = [...document.querySelectorAll("[data-a='template-img']")]


    // gsap.from(templateH1.words, {
    //   y: '120%',
    //   duration: 1.8,
    //   ease: 'expo.out',
    //   stagger: {
    //     each: 0.03
    //   }
    // })

    // gsap.from(templateT.lines, {
    //   y: '120%',
    //   opacity: 0,
    //   duration: 1.8,
    //   ease: 'expo.out',
    //   stagger: {
    //     each: 0.03
    //   }
    // })

    // gsap.from(templateImg, {
    //   y: '120%',
    //   opacity: 0,
    //   duration: 1.8,
    //   ease: 'expo.out'
    // })




    done()
  }
}