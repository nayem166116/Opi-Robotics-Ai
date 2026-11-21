/* About: "How we work" — one robot cell, three behaviours, switched by scroll. */
const root = document.querySelector('[data-work]');

if (root) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = [...root.querySelectorAll('.assembly__part')];
  const labels = Object.fromEntries([...root.querySelectorAll('[data-label]')].map(l => [l.dataset.label, l]));
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const progress = () => {
    const r = root.getBoundingClientRect();
    const span = r.height - innerHeight;
    return span > 0 ? clamp(-r.top / span) : 0;
  };
  let manual = 0, shown = -1;
  const stateAt = p => reduce ? manual : Math.min(items.length - 1, Math.floor(clamp(p) * items.length));
  function setActive(i) {
    if (i === shown) return;
    shown = i;
    root.classList.add('has-active');
    items.forEach((li, k) => li.classList.toggle('is-active', k === i));
  }

  items.forEach((li, i) => li.querySelector('button').addEventListener('click', () => {
    if (reduce) { manual = i; setActive(i); root.dispatchEvent(new Event('work:state')); return; }
    const top = root.getBoundingClientRect().top + scrollY;
    scrollTo({ top: top + (i + 0.5) / items.length * (root.offsetHeight - innerHeight), behavior: 'smooth' });
  }));

  if (reduce) root.classList.add('is-static');
  setActive(0);

  import('/assets/js/work-scene.js')
    .then(m => m.mount({ root, labels, reduce, progress, stateAt, setActive, clamp }))
    .catch(err => { console.error('[work]', err); root.classList.add('no-webgl'); });
}
