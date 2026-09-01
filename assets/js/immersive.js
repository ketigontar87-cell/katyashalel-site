/* Immersive motion layer. Progressive enhancement only:
   with JS off or prefers-reduced-motion, the page is fully readable and static. */
(function () {
  'use strict';
  if (!window.gsap || !window.ScrollTrigger) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.registerPlugin(ScrollTrigger);
  var mm = gsap.matchMedia();

  /* ---------- all widths ---------- */
  mm.add('(min-width: 0px)', function () {
    var hero = document.querySelector('.imm-hero');
    if (hero) {
      var stage = hero.querySelector('.h3-stage');
      var Z = [
        ['.h3-bg', -90, 1.082], ['.h3-eyebrow', -40, 1.036], ['.imm-line', -55, 1.05],
        ['.h3-fig', 55, 0.95], ['.h3-note', 80, 0.927], ['.imm-script', 120, 0.891]
      ];
      // entrance: the room assembles out of depth
      var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.from('.h3-bg', { z: -320, opacity: 0, duration: 1.5 }, 0)
        .from('.imm-line', { z: -260, opacity: 0, duration: 1.3, stagger: 0.12 }, 0.15)
        .from('.h3-fig', { z: 300, opacity: 0, duration: 1.5 }, 0.3)
        .from('.imm-script', { z: 420, opacity: 0, rotate: -11, duration: 1.2 }, 0.75)
        .from(['.h3-eyebrow', '.h3-note'], { opacity: 0, y: 18, duration: 0.8 }, 0.95);
      // scroll: camera dollies in, planes spread apart
      var spread = { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.4 };
      gsap.to('.h3-bg',     { z: -160, ease: 'none', scrollTrigger: spread });
      gsap.to('.imm-line',  { z: -110, yPercent: -14, ease: 'none', scrollTrigger: spread });
      gsap.to('.h3-fig',    { z: 140, ease: 'none', scrollTrigger: spread });
      gsap.to('.imm-script',{ z: 260, xPercent: 4, ease: 'none', scrollTrigger: spread });
      gsap.to('.h3-note',   { z: 170, opacity: 0, ease: 'none', scrollTrigger: spread });
      // tilt: the space answers the hand
      var rx = gsap.quickTo(stage, 'rotationY', { duration: 0.9, ease: 'power3.out' });
      var ry = gsap.quickTo(stage, 'rotationX', { duration: 0.9, ease: 'power3.out' });
      var fine = window.matchMedia('(pointer: fine)').matches;
      if (fine) {
        hero.addEventListener('pointermove', function (e) {
          var r = hero.getBoundingClientRect();
          rx(((e.clientX - r.left) / r.width - 0.5) * 7);
          ry(-((e.clientY - r.top) / r.height - 0.5) * 5);
        });
        hero.addEventListener('pointerleave', function () { rx(0); ry(0); });
      } else {
        gsap.to(stage, { rotationY: 1.6, duration: 5.5, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      }
    }

    /* essay covers breathe inside their frames */
    gsap.utils.toArray('.essay-image .portrait-img').forEach(function (img) {
      var frame = img.closest('.essay-image');
      if (!frame) return;
      gsap.set(img, { scale: 1.14 });
      gsap.fromTo(img, { yPercent: -6 }, {
        yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: 0.5 }
      });
    });

    /* sheets: content settles as each band slides over the previous one */
    [
      '#legibility .wrap',
      '#sprint .wrap',
      '#track-record .skinbot-grid',
      '#about .about-content',
      '#faq .faq-list',
      '#contact > div:first-child'
    ].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (!el) return;
      var section = el.closest('section');
      gsap.from(el, {
        y: 48, ease: 'none',
        scrollTrigger: { trigger: section, start: 'top 94%', end: 'top 52%', scrub: 0.5 }
      });
    });
  });

  /* ---------- desktop scenes ---------- */
  mm.add('(min-width: 900px)', function () {
    /* the reading scene: sources surface from depth while the argument scrolls */
    var cards = gsap.utils.toArray('.imm-sources .imm-card');
    var seeds = [
      { z: -360, y: 130, x: -46, rx: 10, ry: -9 },
      { z: -260, y: 190, x: 58, rx: -7, ry: 10 },
      { z: -430, y: 250, x: -70, rx: 9, ry: 7 },
      { z: -300, y: 310, x: 44, rx: -10, ry: -7 }
    ];
    cards.forEach(function (card, i) {
      var s = seeds[i % seeds.length];
      gsap.from(card, {
        z: s.z, y: s.y, x: s.x, rotationX: s.rx, rotationY: s.ry,
        opacity: 0, filter: 'blur(6px)', ease: 'none',
        scrollTrigger: {
          trigger: '#what',
          start: (8 + i * 15) + '% 78%',
          end: (40 + i * 15) + '% 42%',
          scrub: 0.6
        }
      });
    });

    /* coined-term deck rises with perspective */
    gsap.utils.toArray('.term-card').forEach(function (card) {
      gsap.from(card, {
        rotationX: 16, y: 72, z: -150, transformOrigin: '50% 100%', ease: 'none',
        scrollTrigger: { trigger: card, start: 'top 97%', end: 'top 55%', scrub: 0.5 }
      });
    });

    /* about: cinematic mask reveal, photograph settles under the type */
    var aboutImage = document.querySelector('.about-image');
    if (aboutImage) {
      gsap.fromTo(aboutImage,
        { clipPath: 'inset(7% 7% 7% 7% round 18px)' },
        { clipPath: 'inset(0% 0% 0% 0% round 4px)', ease: 'none',
          scrollTrigger: { trigger: aboutImage, start: 'top 85%', end: 'top 30%', scrub: 0.5 } });
      var aboutImg = aboutImage.querySelector('img');
      if (aboutImg) {
        gsap.fromTo(aboutImg, { scale: 1.16 }, {
          scale: 1, ease: 'none',
          scrollTrigger: { trigger: aboutImage, start: 'top 85%', end: 'bottom 30%', scrub: 0.5 }
        });
      }
    }
  });

  /* ---------- mobile scenes: lighter physics, same language ---------- */
  mm.add('(max-width: 899px)', function () {
    gsap.utils.toArray('.imm-sources .imm-card, .term-card').forEach(function (card) {
      gsap.from(card, {
        y: 54, ease: 'none',
        scrollTrigger: { trigger: card, start: 'top 97%', end: 'top 68%', scrub: 0.5 }
      });
    });
    var aboutImg = document.querySelector('.about-image img');
    if (aboutImg) {
      gsap.fromTo(aboutImg, { scale: 1.12 }, {
        scale: 1, ease: 'none',
        scrollTrigger: { trigger: '.about-image', start: 'top 90%', end: 'bottom 40%', scrub: 0.5 }
      });
    }
  });
})();
