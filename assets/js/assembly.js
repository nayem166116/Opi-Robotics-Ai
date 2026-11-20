/* Home: "The perception stack" — a cobot cell that comes apart as you scroll.
   Geometry is built procedurally; three.js loads only when the section gets close. */
const root = document.querySelector('[data-assembly]');

if (root) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = [...root.querySelectorAll('.assembly__part')];
  const labels = Object.fromEntries([...root.querySelectorAll('[data-label]')].map(l => [l.dataset.label, l]));
  const hint = root.querySelector('.assembly__hint');
  const KEYS = ['perception', 'wear', 'safety', 'integration'];
  const ACTIVE_FROM = 0.3, ACTIVE_TO = 0.84;

  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const progress = () => {
    const r = root.getBoundingClientRect();
    const span = r.height - innerHeight;
    return span > 0 ? clamp(-r.top / span) : 0.5;
  };
  const activeAt = p => (p < ACTIVE_FROM || p >= ACTIVE_TO) ? -1
    : Math.min(KEYS.length - 1, Math.floor((p - ACTIVE_FROM) / ((ACTIVE_TO - ACTIVE_FROM) / KEYS.length)));

  let shownActive = -2;
  function setActive(i) {
    if (i === shownActive) return;
    shownActive = i;
    root.classList.toggle('has-active', i >= 0);
    items.forEach((li, k) => li.classList.toggle('is-active', k === i));
  }

  items.forEach((li, i) => li.querySelector('button').addEventListener('click', () => {
    if (reduce) { setActive(i); return; }
    const step = (ACTIVE_TO - ACTIVE_FROM) / KEYS.length;
    const p = ACTIVE_FROM + step * (i + 0.5);
    const top = root.getBoundingClientRect().top + scrollY;
    scrollTo({ top: top + p * (root.offsetHeight - innerHeight), behavior: 'smooth' });
  }));

  if (reduce) { root.classList.add('is-static'); setActive(0); }

  const start = () => import('/assets/js/assembly-scene.js')
    .then(m => m.mount({ root, labels, hint, KEYS, reduce, progress, activeAt, setActive, smooth, clamp }))
    .catch(err => { console.error('[assembly]', err); root.classList.add('no-webgl'); setActive(0); });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => {
      if (es.some(e => e.isIntersecting)) { io.disconnect(); start(); }
    }, { rootMargin: '800px 0px' });
    io.observe(root);
  } else start();
}
