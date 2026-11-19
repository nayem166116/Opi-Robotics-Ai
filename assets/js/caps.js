/* Features: core capabilities — list on the left drives the media stage on the right */
(function(){
  var root = document.querySelector('[data-caps]');
  if(!root) return;
  var items = [].slice.call(root.querySelectorAll('.caps__item'));
  var media = [].slice.call(root.querySelectorAll('.caps__media'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DURATION = 7000, active = 0, timer = null, inView = false, hovering = false;

  function playVideo(i){
    media.forEach(function(m, k){
      var v = m.querySelector('video');
      if(!v) return;
      if(k === i && inView){ var p = v.play(); if(p && p.catch) p.catch(function(){}); }
      else v.pause();
    });
  }
  function show(i){
    active = i;
    items.forEach(function(b, k){
      var on = k === i;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    media.forEach(function(m, k){ m.classList.toggle('is-active', k === i); });
    playVideo(i);
    schedule();
  }
  function schedule(){
    clearTimeout(timer);
    root.classList.toggle('is-running', !reduce && inView && !hovering);
    if(reduce || !inView || hovering) return;
    timer = setTimeout(function(){ show((active + 1) % items.length); }, DURATION);
  }
  root.style.setProperty('--cap-duration', DURATION + 'ms');

  items.forEach(function(b, k){
    b.addEventListener('click', function(){ show(k); });
    b.addEventListener('keydown', function(e){
      var d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
      if(!d) return;
      e.preventDefault();
      var n = (active + d + items.length) % items.length;
      show(n); items[n].focus();
    });
  });
  var layout = root.querySelector('.caps__layout');
  if(window.matchMedia('(hover: hover)').matches){
    layout.addEventListener('mouseenter', function(){ hovering = true; schedule(); });
    layout.addEventListener('mouseleave', function(){ hovering = false; show(active); });
  }
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){
      inView = es[0].isIntersecting; playVideo(active); schedule();
    }, { threshold:0.35 }).observe(layout);
  } else { inView = true; }
  document.addEventListener('visibilitychange', function(){
    inView = !document.hidden && inView; schedule();
  });
  show(0);
})();
