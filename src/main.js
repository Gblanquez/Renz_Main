import './styles/style.css'
import Sketch from './app';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';
import { each } from 'jquery';
import lottie from 'lottie-web';
import app from './app';

// import customRender from './renders/Load';
gsap.registerPlugin(ScrollTrigger, Flip);

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

// function addScrambleAnimations() {
//   // Target the links within .connect-item, .social-links, .social-links-bottom-left, and .navbar-links
//   const selector = '.connect-item a, .social-links a, .social-links-bottom-left a, .navbar-links a';
//   const connectLinks = document.querySelectorAll(selector);

//   connectLinks.forEach(link => {
//     let originalText = link.textContent; // Store the original text of each link

//     link.addEventListener('mouseover', () => {
//       // Start the scramble animation on hover
//       gsap.to(link, {
//         duration: 0.5,
//         scrambleText: {
//           text: originalText,
//           chars: '#@%!%&$*()fghijklmnopq-=+{}]^?><rstuvwxyzabcde',
//           speed: 1.2
//         }
//       });
//     });

//     link.addEventListener('mouseout', () => {
//       // Return to the original text on mouse out
//       gsap.to(link, {
//         duration: 0.5,
//         scrambleText: {
//           text: originalText,
//           chars: originalText,
//           speed: 1.2
//         }
//       });
//     });
//   });
// }

// // Call the function to apply the animations
// addScrambleAnimations();






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










