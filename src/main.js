import './styles/style.css'
import Sketch from './app';
import { Core } from '@unseenco/taxi'
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import AboutPage from './transitions/About';
import workPage from './transitions/WorkPage';
import myHome from './transitions/Home';
import workRender from './renders/WorkRender';
import homeRender from './renders/HomeRender';
import aboutRender from './renders/AboutRender';
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { SplitText } from "gsap/SplitText";
import { Flip } from 'gsap/Flip';
import Lenis from '@studio-freight/lenis';
import { each } from 'jquery';
import lottie from 'lottie-web';

// import customRender from './renders/Load';
gsap.registerPlugin(ScrollTrigger, SplitText, Flip);

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

function addScrambleAnimations() {
  // Target the links within .connect-item, .social-links, .social-links-bottom-left, and .navbar-links
  const selector = '.connect-item a, .social-links a, .social-links-bottom-left a, .navbar-links a';
  const connectLinks = document.querySelectorAll(selector);

  connectLinks.forEach(link => {
    let originalText = link.textContent; // Store the original text of each link

    link.addEventListener('mouseover', () => {
      // Start the scramble animation on hover
      gsap.to(link, {
        duration: 0.5,
        scrambleText: {
          text: originalText,
          chars: '#@%!%&$*()fghijklmnopq-=+{}]^?><rstuvwxyzabcde',
          speed: 1.2
        }
      });
    });

    link.addEventListener('mouseout', () => {
      // Return to the original text on mouse out
      gsap.to(link, {
        duration: 0.5,
        scrambleText: {
          text: originalText,
          chars: originalText,
          speed: 1.2
        }
      });
    });
  });
}

// Call the function to apply the animations
addScrambleAnimations();






document.addEventListener('DOMContentLoaded', function() {
  const animation = lottie.loadAnimation({
      container: document.getElementById('lottie-logo'), // the DOM element that will contain the animation
      renderer: 'svg',
      loop: false,
      autoplay: true,
      path: 'https://uploads-ssl.webflow.com/64f92766515fe8ac324ab919/65186a24e392f9569a5bee3f_logo1.json' // the path to the animation JSON
  });
});

document.addEventListener('DOMContentLoaded', function() {
  const DateTime = luxon.DateTime;
  const londonTime = DateTime.now().setZone('Europe/London').toLocaleString(DateTime.TIME_24_SIMPLE);

  document.getElementById('time-location').textContent = `London Time: ${londonTime}`;
});

// const taxi = new Core({
//     renderers: {
//         home: homeRender,
//         work: workRender,
//         about: aboutRender,
        
//     },
//     transitions: {
//         homeTran: myHome,
//         workTran: workPage,
//         aboutTran: AboutPage
//     }
// })



// let lenis = new Lenis({
//   lerp: 0.1,
//   orientation: window.innerWidth < 830 ? 'vertical' : 'horizontal',
//   infinite: true,
//   wheelMultiplier: 0.4,
//   gestureOrientation: "both",
//   normalizeWheel: false,
//   smoothTouch: false,
//   autoResize: true
// })










// gsap.registerPlugin(SplitText);

// document.addEventListener('DOMContentLoaded', function() {
//     // Select your paragraphs
//     document.querySelectorAll('.ab-t').forEach(paragraph => {
//         // Use SplitText to split the paragraph into words
//         let mySplitText = new SplitText(paragraph, {type: "words, lines", linesClass: "split-line"});
//         let words = mySplitText.words; // Array of words

//         // Animate each word
//         words.forEach(word => {
//             gsap.fromTo(word, {
//                 x: '50%',
//                 opacity: 0,
//             }, {
//                 x: '0%',
//                 opacity: 1,
//                 duration: 1.4,
//                 ease: "expo.out",
//                 // Scramble text effect as the word moves into position
//                 onStart: function() {
//                     gsap.to(word, {
//                         duration: 1.8,
//                         scrambleText: {
//                             text: word.textContent,
//                             chars: '#@%!%&$*()fghijklmnopq-=+{}]^?><rstuvwxyzabcde',
//                             speed: 0.3,
//                             revealDelay: 0.5,
//                         },
//                         ease: "none",
//                     });
//                 }
//             });
//         });
//     });
// });



// document.addEventListener('DOMContentLoaded', function() {
//     // Target the .mainText element
//     let mainText = document.querySelector('.mainText');

//     // Use SplitText to split the text into words
//     let mySplitText = new SplitText(mainText, {type: "words, lines", linesClass: "split-line"});
//     let words = mySplitText.words; // Array of words

//     // Animate each word
//     words.forEach(word => {
//         gsap.timeline({
//             scrollTrigger: {
//                 trigger: word,
//                 start: "top bottom", // Adjust as needed
//             }
//         })
//         .fromTo(word, {
//             x: '50%',
//             opacity: 0,
//         }, {
//             x: '0%',
//             opacity: 1,
//             duration: 1.4,
//             ease: "expo.out",
//         })
//         .to(word, {
//             duration: 1.8,
//             scrambleText: {
//                 text: word.textContent,
//                 chars: '#@%!%&$*()fghijklmnopq-=+{}]^?><rstuvwxyzabcde',
//                 speed: 0.3,
//                 revealDelay: 0.5,
//             },
//             ease: "none",
//         }, 0); // Start scramble text effect at the same time as movement
//     });
// });

// document.addEventListener('DOMContentLoaded', function() {
//   // Function to animate elements with the class 'scramble-text'
//   function animateScrambleText(selector) {
//       document.querySelectorAll(selector).forEach(item => {
//           // Use SplitText to split the text into words
//           let mySplitText = new SplitText(item, {type: "words, lines", linesClass: "split-line"});
//           let words = mySplitText.words; // Array of words

//           // Animate each word
//           words.forEach(word => {
//               gsap.timeline({
//                   scrollTrigger: {
//                       trigger: word,
//                       start: "top bottom", 
//                   }
//               })
//               .fromTo(word, {
//                   x: '50%',
//                   opacity: 0,
//               }, {
//                   x: '0%',
//                   opacity: 1,
//                   duration: 1.4,
//                   ease: "expo.out",
//               })
//               .to(word, {
//                   duration: 1.8,
//                   scrambleText: {
//                       text: word.textContent,
//                       chars: '#@%!%&$*()fghijklmnopq-=+{}]^?><rstuvwxyzabcde',
//                       speed: 0.3,
//                       revealDelay: 0.5,
//                   },
//                   ease: "none",
//               }, 0); // Start scramble text effect at the same time as movement
//           });
//       });
//   }

//   // Animate .info2 elements
//   animateScrambleText('.info2');

//   // Animate elements with the class 'scramble-text' inside .service-item, .connect-item, and .request-item
//   animateScrambleText('.service-item .scramble-text');
//   animateScrambleText('.connect-item .scramble-text');
//   animateScrambleText('.request-item .scramble-text');
// });

// document.addEventListener('DOMContentLoaded', function() {
//     // Target all .info2 elements
//     document.querySelectorAll('.info2').forEach(infoText => {
//         // Use SplitText to split the text into words
//         let mySplitText = new SplitText(infoText, {type: "words, lines", linesClass: "split-line"});
//         let words = mySplitText.words; // Array of words

//         // Animate each word
//         words.forEach(word => {
//             gsap.timeline({
//                 scrollTrigger: {
//                     trigger: word,
//                     start: "top bottom", // Adjust as needed
//                 }
//             })
//             .fromTo(word, {
//                 x: '50%',
//                 opacity: 0,
//             }, {
//                 x: '0%',
//                 opacity: 1,
//                 duration: 1.4,
//                 ease: "expo.out",
//             })
//             .to(word, {
//                 duration: 1.8,
//                 scrambleText: {
//                     text: word.textContent,
//                     chars: '#@%!%&$*()fghijklmnopq-=+{}]^?><rstuvwxyzabcde',
//                     speed: 0.3,
//                     revealDelay: 0.5,
//                 },
//                 ease: "none",
//             }, 0); // Start scramble text effect at the same time as movement
//         });
//     });
// });


