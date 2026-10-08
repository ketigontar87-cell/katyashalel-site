/* Decorative only. No text splitting, dependencies, tracking, or hidden content. */
(() => {
  'use strict';
  const hero = document.querySelector('.hero');
  const portrait = hero?.querySelector('.portrait');
  const evidence = document.querySelector('.proof');
  const strategy = evidence?.nextElementSibling;
  if (!portrait || !evidence || !strategy || !window.requestAnimationFrame) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.classList.add('motion-register');
  svg.setAttribute('viewBox', '0 0 1000 1000');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = '<path class="register-secondary" d="M0 100H24 M0 500H24 M0 900H24 M976 100H1000 M976 500H1000 M976 900H1000"/>' +
    '<path class="register-trace"/><path class="register-trace register-secondary"/><path class="register-trace"/>' +
    '<circle class="register-node" r="4"/><circle class="register-node" r="4"/><circle class="register-node" r="4"/>';
  // The image keeps its existing accessible name; the control is its sibling.
  portrait.append(svg);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'motion-replay';
  const ru = document.documentElement.lang === 'ru';
  const label = ru ? 'Повторить анимацию' : 'Replay animation';
  button.setAttribute('aria-label', label);
  button.title = label;
  button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8a8 8 0 1 1-1 7M5 3v5h5"/></svg>';
  // An interactive element must not be nested inside role=img.
  hero.append(button);
  evidence.classList.add('motion-evidence');
  strategy.classList.add('motion-strategy');
  const traces = [...svg.querySelectorAll('.register-trace')];
  const nodes = [...svg.querySelectorAll('.register-node')];
  const markers = [...evidence.querySelector('.wrap').children];
  const source = [
    [100, 3, 310, 3, 310, 18, 640, 18],
    [994, 190, 994, 370, 976, 370, 976, 660],
    [890, 993, 670, 993, 670, 978, 360, 978]
  ];
  const resolved = [
    [0, 210, 0, 0, 210, 0, 390, 0],
    [1000, 390, 1000, 0, 790, 0, 610, 0],
    [1000, 790, 1000, 1000, 610, 1000, 0, 1000]
  ];
  const clamp = n => Math.max(0, Math.min(1, n));
  const ease = n => 1 - Math.pow(1 - clamp(n), 3);
  let intro = 1;
  let frame = 0;
  let animation = 0;
  let geometry;
  function measure() {
    const image = portrait.getBoundingClientRect();
    const container = hero.getBoundingClientRect();
    button.style.left = `${image.right - container.left - 56}px`;
    button.style.top = `${image.bottom - container.top - 56}px`;
    const e = evidence.getBoundingClientRect();
    const s = strategy.getBoundingClientRect();
    geometry = { evidence: e.top + scrollY, strategy: s.top + scrollY, height: innerHeight };
  }
  function draw() {
    frame = 0;
    const rail = reduced.matches ? 1 : clamp((scrollY + geometry.height * .88 - geometry.evidence) / (geometry.height * .42));
    const margin = reduced.matches ? 1 : clamp((scrollY + geometry.height * .8 - geometry.strategy) / (geometry.height * .6));
    traces.forEach((path, i) => {
      const progress = reduced.matches ? 1 : ease((intro - i * .13) / .74);
      const points = source[i].map((v, j) => v + (resolved[i][j] - v) * progress);
      path.setAttribute('d', `M${points[0]} ${points[1]}L${points[2]} ${points[3]}L${points[4]} ${points[5]}L${points[6]} ${points[7]}`);
      nodes[i].setAttribute('cx', points[6]);
      nodes[i].setAttribute('cy', points[7]);
    });
    hero.style.setProperty('--motion-rule', reduced.matches ? 1 : ease((intro - .45) / .55));
    evidence.style.setProperty('--rail', rail);
    markers.forEach((marker, i) => marker.style.setProperty('--marker', clamp((rail - i * .25) * 4)));
    strategy.style.setProperty('--margin', margin);
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(draw); }
  function replay() {
    cancelAnimationFrame(animation);
    if (reduced.matches) { intro = 1; draw(); return; }
    let start;
    function step(time) {
      if (start === undefined) start = time;
      intro = clamp((time - start) / 1650);
      draw();
      if (intro < 1) animation = requestAnimationFrame(step);
      else animation = 0;
    }
    animation = requestAnimationFrame(step);
  }
  function preference() {
    cancelAnimationFrame(animation);
    animation = 0;
    intro = 1;
    button.disabled = reduced.matches;
    button.title = reduced.matches ? (ru ? 'Анимация отключена в настройках устройства' : 'Motion disabled in device settings') : label;
    draw();
  }
  button.addEventListener('click', replay);
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', () => { measure(); schedule(); }, { passive: true });
  reduced.addEventListener('change', preference);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(animation); animation = 0; intro = 1; }
    else { measure(); schedule(); }
  });
  measure();
  preference();
  replay();
  document.fonts?.ready.then(() => { measure(); schedule(); });
})();
