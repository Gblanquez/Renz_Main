// import { gsap } from "gsap";



// export function initializeAnimations() {
//     gsap.registerPlugin(SplitText);

// document.querySelectorAll('.ab-t').forEach(paragraph => {
//     let mySplitText = new SplitText(paragraph, {type: "words, lines", linesClass: "split-line"});
//     let words = mySplitText.words;
//     words.forEach(word => {
//         gsap.fromTo(word, {
//             x: '200%',
//             opacity: 0,
//         }, {
//             x: '0%',
//             opacity: 1,
//             duration: 1.6,
//             ease: "expo.out",
//             onStart: function() {
//                 gsap.to(word, {
//                     duration: 1.8,
//                     scrambleText: {
//                         text: word.textContent,
//                         chars: '#@%!%&$*()fghijklmnopq-=+{}]^?><rstuvwxyzabcde',
//                         speed: 1,
//                         revealDelay: 0.8,
//                     },
//                     ease: "none",
//                 });
//             }
//         });
//     });
// });

// // Animate '.mainText'
// let mainText = document.querySelector('.mainText');
// if (mainText) { // Check if '.mainText' exists
//     let mySplitText = new SplitText(mainText, {type: "words, lines", linesClass: "split-line"});
//     let words = mySplitText.words;
//     words.forEach(word => {
//         gsap.timeline({
//             scrollTrigger: {
//                 trigger: word,
//                 start: "top bottom",
//             }
//         })
//         .fromTo(word, {
//             x: '200%',
//             opacity: 0,
//         }, {
//             x: '0%',
//             opacity: 1,
//             duration: 1.6,
//             ease: "expo.out",
//         })
//         .to(word, {
//             duration: 1.8,
//             scrambleText: {
//                 text: word.textContent,
//                 chars: '#@%!%&$*()fghijklmnopq-=+{}]^?><rstuvwxyzabcde',
//                 speed: 1,
//                 revealDelay: 0.8,
//             },
//             ease: "none",
//         }, 0);
//     });
// }

// // Animate elements with class 'scramble-text'
// animateScrambleText('.info2');
// animateScrambleText('.service-item .scramble-text');
// animateScrambleText('.connect-item .scramble-text');
// animateScrambleText('.request-item .scramble-text');

    
//     // Function to animate elements with the class 'scramble-text'
//     function animateScrambleText(selector) {
//         document.querySelectorAll(selector).forEach(item => {
//             let mySplitText = new SplitText(item, {type: "words, lines", linesClass: "split-line"});
//             let words = mySplitText.words;
//             words.forEach(word => {
//                 gsap.timeline({
//                     scrollTrigger: {
//                         trigger: word,
//                         start: "top bottom",
//                     }
//                 })
//                 .fromTo(word, {
//                     x: '200%',
//                     opacity: 0,
//                 }, {
//                     x: '0%',
//                     opacity: 1,
//                     duration: 1.6,
//                     ease: "expo.out",
//                 })
//                 .to(word, {
//                     duration: 1.8,
//                     scrambleText: {
//                         text: word.textContent,
//                         chars: '#@%!%&$*()fghijklmnopq-=+{}]^?><rstuvwxyzabcde',
//                         speed: 1,
//                         revealDelay: 0.8,
//                     },
//                     ease: "none",
//                 }, 0);
//             });
//         });
//     }
// }

// export function OutAnimation() {

// // Helper function to reverse animations for a given selector, applying both scramble and movement simultaneously
// function reverseAnimations(selector, moveX = '-200%') {
//     document.querySelectorAll(selector).forEach(item => {
//         let mySplitText = new SplitText(item, {type: "words, lines"});
//         let words = mySplitText.words;
//         words.forEach(word => {
//             // Simultaneously apply scramble and movement animations
//             gsap.timeline()
//             .to(word, {
//                 duration: 1.8,
//                 scrambleText: {
//                     text: word.textContent, // Scramble to original text
//                     chars: '#@%!%&$*()fghijklmnopq-=+{}]^?><rstuvwxyzabcde',
//                     speed: 0.7,
//                     revealDelay: 1,
//                 },
//                 x: moveX, 
//                 opacity: 0, 
//                 ease: "expo.out",
//             });
//         });
//     });
// }

// // Apply reverse animations to all targeted elements
// reverseAnimations('.ab-t');
// reverseAnimations('.mainText');


// reverseAnimations('.info2', '0%'); 
// reverseAnimations('.info2 .scramble-text');
// reverseAnimations('.service-item .scramble-text');
// reverseAnimations('.connect-item .scramble-text');
// reverseAnimations('.request-item .scramble-text');

        
// }

// export function initializeInsideAnimations() {
//     // Animate '.projecth1'
//     let projectH1 = document.querySelector('.projecth1');
//     if (projectH1) {
//         let mySplitTextH1 = new SplitText(projectH1, {type: "words, lines", linesClass: "split-line"});
//         mySplitTextH1.words.forEach(word => {
//             const tl = gsap.timeline({
//                 scrollTrigger: {
//                     trigger: word,
//                     start: "top bottom",
//                 }
//             });

//             tl.fromTo(word, {
//                 x: '200%',
//                 opacity: 0,
//             }, {
//                 x: '0%',
//                 opacity: 1,
//                 duration: 1.2,
//                 ease: "expo.out",
//             })
//             .to(word, {
//                 duration: 1.2,
//                 scrambleText: {
//                     text: word.textContent,
//                     chars: '#@%!%&$*()fghijklmnopq-=+{}]^?><rstuvwxyzabcde',
//                     speed: 1,
//                     revealDelay: 0.8,
//                 },
//                 ease: "none",
//             }, 0) // Start at the beginning of the timeline
//             .to(word, {
//                 opacity: 0,
//                 repeat: 8,
//                 yoyo: true,
//                 duration: 0.05,
//                 ease: "expo.out",
//             }, 0); // Add blinking effect
//         });
//     }

//     // Animate '.projecth2'
//     let projectH2 = document.querySelector('.projecth2');
//     if (projectH2) {
//         let mySplitTextH2 = new SplitText(projectH2, {type: "words, lines", linesClass: "split-line"});
//         mySplitTextH2.words.forEach(word => {
//             const tl = gsap.timeline({
//                 scrollTrigger: {
//                     trigger: word,
//                     start: "top bottom",
//                 }
//             });

//             tl.fromTo(word, {
//                 x: '200%',
//                 opacity: 0,
//             }, {
//                 x: '0%',
//                 opacity: 1,
//                 duration: 1.2,
//                 ease: "expo.out",
//             })
//             .to(word, {
//                 duration: 1.2,
//                 scrambleText: {
//                     text: word.textContent,
//                     chars: '#@%!%&$*()fghijklmnopq-=+{}]^?><rstuvwxyzabcde',
//                     speed: 1,
//                     revealDelay: 0.8,
//                 },
//                 ease: "none",
//             }, 0) // Start at the beginning of the timeline
//             .to(word, {
//                 opacity: 0,
//                 repeat: 8,
//                 yoyo: true,
//                 duration: 0.05,
//                 ease: "expo.out",
//             }, 0); // Add blinking effect
//         });
//     }
// }