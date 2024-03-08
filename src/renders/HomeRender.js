import { Renderer } from '@unseenco/taxi';
import gsap from 'gsap';
import { CustomEase } from "gsap/CustomEase";
import Lenis from '@studio-freight/lenis'
import SplitType from 'split-type'
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(Flip);
gsap.registerPlugin( ScrollTrigger, CustomEase);
gsap.registerPlugin(ScrambleTextPlugin);

export default class homeRender extends Renderer {
  initialLoad() {



    // Get all the elements you want to animate
const loadElements = document.querySelectorAll('.swiper-slide.is-main');

// Add the 'loadState' class to set the initial state
loadElements.forEach((element) => {
  element.classList.add('loadState');
});

// Get the initial state of all elements
const loadStateOne = Flip.getState('.swiper-slide.is-main.loadState');

// Loop over each element again
loadElements.forEach((element) => {
  // Toggle the 'loadState' class to go back to the original state
  element.classList.remove('loadState');
});

// Animate from the initial state to the original state
Flip.from(loadStateOne, {
  duration: 1.5, // Adjust the duration as needed
  ease: "power3", // Adjust the easing as needed
  stagger: {
    each: 0.03 // Adjust the stagger as needed
  },
  onComplete: () => {
    // Your existing animation code here...
  }
});
    // const second = document.querySelectorAll('.swiper-slide')
    // const third = document.querySelectorAll('.swiper-wrapper')

    // const state = Flip.getState(['.swiper, .swiper-wrapper, .swiper-slide, .case_study_link, .main_img_p, .project_main_img_wrapper '])


    // first.classList.toggle('stateone')
    // second.classList.toggle('stateone')
    // third.classList.toggle('stateone')

    // Flip.from(state,{
    //   duration: 1.8,
    //   ease: 'expo.out',
    //   stagger: {
    //     each: 0.03
    //   }
    // })


        // // Get all the elements
        // const elements = document.querySelectorAll('.swiper-slide.is-main');

        // // Loop over each element
        // elements.forEach((element) => {
        //   // Add the 'stateone' class to set the initial state
        //   element.classList.add('stateone');
        // });
        
        // // Get the initial state of all elements
        // const stateOne = Flip.getState('.swiper-slide.is-main.stateone');
        
        // // Loop over each element again
        // elements.forEach((element) => {
        //   // Toggle the 'stateone' class to go back to the original state
        //   element.classList.toggle('stateone');
        // });
        
        // // Animate from the initial state to the original state
        // Flip.from(stateOne, {
        //   duration: 1.5,
        //   ease: "power3",
        //   absolute: true,
        //   stagger: {
        //     each: 0.03
        //   },
        //   onComplete: () => {
        //     // Loop over each element again
        //     elements.forEach((element) => {
        //       // Remove the 'stateone' class
        //       console.log('it should scroll');
        //       element.classList.remove('stateone');
        //     });
        //   }
        // });




    //Lenis Scroll

    // const isMobile = window.innerWidth < 768;
    // isMobile ? "vertical" : "horizontal"
    


//     let lenis;
//     if (Webflow.env("editor") === undefined) {
//       lenis = new Lenis({
//         lerp: 0.1,
//         orientation: window.innerWidth < 830 ? 'vertical' : 'horizontal',
//         infinite: true,
//         wheelMultiplier: 0.4,
//         gestureOrientation: "both",
//         normalizeWheel: false,
//         smoothTouch: false,
//         autoResize: true
//       });



//       function raf(time) {
//         lenis.raf(time);
//         requestAnimationFrame(raf);
        
//       }
//       requestAnimationFrame(raf);
//     }


//     // Debounce function
// function debounce(func, wait) {
//   let timeout;
//   return function executedFunction(...args) {
//     const later = () => {
//       clearTimeout(timeout);
//       func(...args);
//     };
//     clearTimeout(timeout);
//     timeout = setTimeout(later, wait);
//   };
// };

// // Event listener for resize
// window.addEventListener('resize', debounce(function() {
//   lenis.orientation = window.innerWidth < 830 ? 'vertical' : 'horizontal';
// }, 100));


//     $("[data-lenis-start]").on("click", function () {
//       lenis.start();
//     });
//     $("[data-lenis-stop]").on("click", function () {
//       lenis.stop();
//     });
//     $("[data-lenis-toggle]").on("click", function () {
//       $(this).toggleClass("stop-scroll");
//       if ($(this).hasClass("stop-scroll")) {
//         lenis.stop();
//       } else {
//         lenis.start();
//       }
//     });





    
// console.log('it loaded');

// // Get the element you want to animate
// let element = document.querySelectorAll('.main_img_p');

// // Create a proxy object to hold the skew value
// let proxy = { skew: 5 };

// // Create a GSAP quickSetter for the skew
// let skewSetter = gsap.quickSetter(element, "skewY", "deg"); // Assuming you want to skew on the X axis

// // Create a clamp function to limit the skew
// let clamp = gsap.utils.clamp(-30, 30); // Adjust the min and max values as needed

// // Set the transform origin to ensure the skew effect is applied correctly
// gsap.set(element, {
//   transformOrigin: "left center",
//   force3D: true // This can improve performance by promoting the element to its own layer
// });

// // Create a function to update the skew based on the Lenis velocity
// function updateSkew() {
//   // Calculate the skew based on the Lenis velocity
//   let skew = clamp(lenis.velocity / -200);

//   // Log the skew value
//   // Update the proxy skew
//   proxy.skew = skew;

//   // Use GSAP to animate the skew property
//   gsap.to(proxy, {
//     skew: 0,
//     duration: 1.5,
//     ease: "power3",
//     overwrite: true,
//     onUpdate: () => skewSetter(proxy.skew)
//   });

//   // Only request the next animation frame if the velocity is not 0
//   // if (lenis.velocity !== 0) {
//   //   requestAnimationFrame(updateSkew);
//   // }
// }

// // Start the animation
// updateSkew();



    //End Lenis Scroll


    //Lottie File Beging




    //Lottie File End
  // const homeT = document.querySelectorAll("[data-a='home-text']");
  // const homeImg = document.querySelectorAll("[data-a='home-img']");
  // const lineDrag = document.querySelectorAll("[data-a='drag-line']");
  // const loadDrag = document.querySelectorAll("[data-a='drag-load']");
  // const locationT = document.querySelector('.time_text')


  // const heroText = new SplitType(homeT, { types: 'words, chars, lines'  })
  // const locationText = new SplitType(locationT, { types: 'words, chars, lines'  })

  // let customEase =  "M0,0,C0,0,0.13,0.34,0.238,0.442,0.305,0.506,0.322,0.514,0.396,0.54,0.478,0.568,0.468,0.56,0.522,0.584,0.572,0.606,0.61,0.719,0.714,0.826,0.798,0.912,1,1,1,1";
  // let counter = {
  //   value: 0
  // };
  // let loaderDuration = 3;
  
  // function updateLoaderText() {
  //   let progress = Math.round(counter.value);
  //   $(".load_numb").text(progress);
  // }

  // function playLottie (){
  //   $('.trigger').trigger('click');
  //   console.log('playing lottie')
  // }
  // function endLoaderAnimation() {


  // playLottie();


  //   const endLine = [...document.querySelectorAll('.line_static')];
  //   const logoSvg = document.getElementById('logo')
  //   const linkWrap = [...document.querySelectorAll('.case_study_link')]
  


  //   gsap.to(endLine, {
  //       y: '110%',
  //       duration: 1.6,
  //       ease: 'expo.out',
  //       stagger: {
  //           each: 0.02
  //       }
  //   }, 0.1)
  //   gsap.to('.load_wrapper', {
  //       y: '-120%',
  //       opacity: 0,
  //       duration: 1.8,
  //       ease: 'expo.out'
  //   }, 0.2)

  //   gsap.from(heroText.lines, {
  //     y: '110%',
  //     duration: 1.8,
  //     ease: 'expo.out',
  //     stagger:{
  //       each: 0.02
  //     }
  //   })


  //   // gsap.from(linkWrap, {
  //   //   x: '120%',
  //   //   duration: 2.6,
  //   //   ease: 'expo.out',
  //   //   stagger: {
  //   //     each: 0.02
  //   //   }
  //   // })

  //   gsap.from(homeImg, {
  //     skewY: '50%',
  //     skewX: '10%',
  //     scale: 1.1,
  //     opacity: 0,
  //     duration: 1.8,
  //     ease: 'expo.out',
  //     stagger: {
  //       each: 0.02
  //     }
  //   })
    
  //   gsap.from(homeImg, {
  //     x: '-110%',
  //     y: '-30%',
  //     ease: 'expo.out',
  //     duration: 2,
  //     stagger: {
  //       each: 0.02
  //     }
  //   })
  // }
  
  // let tl = gsap.timeline({
  //   onComplete: endLoaderAnimation
  // });
  // tl.to(counter, {
  //   value: 100,
  //   onUpdate: updateLoaderText,
  //   duration: loaderDuration,
  //   ease: CustomEase.create("custom", customEase)
  // });
  // tl.to(".load_line_wrapper_main", {
  //     width: "0%",
  //     duration: loaderDuration,
  //     ease: CustomEase.create("custom", customEase)
  // }, 0);
  // tl.to(loadDrag, {
  //   x: '80dvw',
  //   duration: loaderDuration,
  //   ease: CustomEase.create("custom", customEase)
  // }, 0);



 


  }



  

  onEnter() {
    // run after the new content has been added to the Taxi container



  
  }

  onEnterCompleted() {
    // Get the elements
// const pageLinks = document.querySelectorAll("[data-a='link']");
// const socialLinks = document.querySelectorAll('.social_global_link');

// // Register the ScrambleTextPlugin
// gsap.registerPlugin(ScrambleTextPlugin);

// Function to add animations
// function addAnimations(links) {
//   links.forEach(link => {
//     const textElement = link.querySelector("[data='t-link']");
//     const lineElement = link.querySelector("[data-a='s-link']");
//     let originalText = textElement.textContent;

//     link.addEventListener('mouseover', () => {
//       // Start the scramble animation
//       gsap.to(textElement, {
//         duration: 0.5,
//         scrambleText: {
//           text: originalText,
//           chars: 'abcdefghijklmnopqrstuvwxyz',
//           speed: 0.3
//         }
//       });

//       // Animate the link line
//       gsap.to(lineElement, {
//         scaleX: 1,
//         duration: 0.5,
//         ease: 'power1.out',
//         transformOrigin: 'left'
//       });
//     });

//     link.addEventListener('mouseout', () => {
//       // Stop the scramble animation and return to the original text
//       gsap.to(textElement, {
//         duration: 0.5,
//         scrambleText: {
//           text: originalText,
//           chars: originalText,
//           speed: 0.3
//         }
//       });

//       // Animate the link line
//       gsap.to(lineElement, {
//         scaleX: 0,
//         duration: 0.5,
//         ease: 'power1.out',
//         transformOrigin: 'right'
//       });
//     });
//   });
// }

  // addAnimations(pageLinks);
  // addAnimations(socialLinks);
 
}

  onLeave() {
    // run before the transition.onLeave method is called

    // const tl = gsap.timeline()
    // const homeT = document.querySelectorAll("[data-a='home-text']");
    // const socialL = document.querySelectorAll("[data-a='social-text']");
    // const workText = document.querySelectorAll("[data-a='work-text']");
    // const homeImg = document.querySelectorAll("[data-a='home-img']");
    // // const locationT = document.querySelector('.time_text')
    // const heroText = new SplitType(homeT, { types: 'words, chars, lines'  })
    // const heroWorkText = new SplitType(workText, { types: 'words, chars, lines'  })
    // const heroSocialText = new SplitType(socialL, { types: 'words, chars, lines'  })
    // // const linkWrap = [...document.querySelectorAll('.case_study_link')]




  }

  onLeaveCompleted() {
    // run after the transition.onleave has fully completed
  }
}