/* A one-time registration at reading boundaries. No reading text is animated. */
(() => {
  'use strict';
  const family = document.body.dataset.motionFamily;
  if (!family) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const headings = [...document.querySelectorAll('h1,h2')].filter(e => !e.closest('.motion-strategy,.tg') && !(family === 'home' && e.closest('.hero')));
  const selectors = {
    home: '.q,.step,.essay,.pull,.offer,.contact',
    service: '.request,.faq',
    essay: '.pull,.note,.related',
    guide: '.step,.entry,.prompt,.note,.card',
    research: '.term,.machine',
    reference: '.term,.step,.note',
    profile: '.pull,.note',
    archive: '.step,.note'
  };
  const boundaries = [...document.querySelectorAll(selectors[family] || '.note')];
  headings.forEach(e => { e.classList.add('motion-heading'); if(e.tagName === 'H1') e.classList.add('motion-title'); });
  boundaries.forEach(e => e.classList.add('motion-boundary'));
  const targets = [...headings,...boundaries];
  let observer;
  function settle() {
    observer?.disconnect();
    targets.forEach(e => e.classList.add('is-registered'));
  }
  if (reduced.matches || !('IntersectionObserver' in window)) settle();
  else {
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) if(entry.isIntersecting) {
        entry.target.classList.add('is-registered');
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
    targets.forEach(e => observer.observe(e));
  }
  // Switching to reduced motion settles every remaining decorative boundary.
  reduced.addEventListener('change', e => { if(e.matches) settle(); });
})();
