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
      var heroTrig = { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 };
      gsap.to('.imm-portrait', { yPercent: 9, ease: 'none', scrollTrigger: heroTrig });
      gsap.to('.imm-line', { yPercent: -20, ease: 'none', scrollTrigger: heroTrig });
      gsap.to('.imm-script', { yPercent: -36, xPercent: 4, ease: 'none', scrollTrigger: heroTrig });
      gsap.to('.imm-note', { yPercent: -70, ease: 'none', scrollTrigger: heroTrig });
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
