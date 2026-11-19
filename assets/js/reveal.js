/* OPI ROBOTICS — reveal.js
   IntersectionObserver based reveal, plays once. Supports data-reveal types:
   rise | mask | line | stagger | fade (see motion.css). */
(function(){
  if(!('IntersectionObserver' in window)){
    document.querySelectorAll('[data-reveal]').forEach(function(el){ el.classList.add('is-revealed'); });
    return;
  }
  var els = document.querySelectorAll('[data-reveal]');
  var groups = {};
  els.forEach(function(el, i){
    var delayGroup = el.getAttribute('data-reveal-group');
    if(delayGroup){
      groups[delayGroup] = groups[delayGroup] || 0;
      el.style.transitionDelay = (groups[delayGroup] * 90) + 'ms';
      groups[delayGroup]++;
    }
  });
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.classList.add('is-revealed');
        io.unobserve(entry.target);
      }
    });
  }, { threshold:0, rootMargin:'200px 0px 200px 0px' });
  els.forEach(function(el){ io.observe(el); });

  // Home hero: exponential filmstrip. Each tile is twice the width of the one
  // before it, all share one baseline, and the chain slowly zooms toward the
  // right edge; the largest tile leaves the frame and re-enters as the smallest.
  var strip = document.querySelector('.hero-stage--strip .hero-strip');
  if(strip){
    var tiles = [].slice.call(strip.querySelectorAll('.hero-tile'));
    var N = tiles.length, GAP = 6, AR = 9 / 16, PERIOD = 15000;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var W = 0, H = 0, C = 0, phase = 0.25, last = null, running = false, visible = true;
    function measure(){
      W = strip.clientWidth; H = strip.clientHeight;
      C = Math.round(Math.max(10, Math.min(18, W * 0.012)));
    }
    function layout(){
      var wrap = W + C;
      for(var i = 0; i < N; i++){
        var s = (i + phase) % N;
        var w = wrap * Math.pow(2, s - N);
        var tw = Math.max(0, w - GAP), th = tw * AR;
        var x = w - C, el = tiles[i];
        el.style.width = tw.toFixed(2) + 'px';
        el.style.height = th.toFixed(2) + 'px';
        el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + (H - th).toFixed(2) + 'px,0)';
        el.style.visibility = (x + tw <= 0 || x >= W) ? 'hidden' : 'visible';
        el.style.opacity = Math.min(1, tw / 32).toFixed(3);
        el.style.setProperty('--cut', Math.max(4, Math.min(34, tw * 0.09)).toFixed(1) + 'px');
      }
    }
    function frame(t){
      if(!running) return;
      if(last !== null) phase = (phase + (t - last) / PERIOD) % N;
      last = t;
      layout();
      window.requestAnimationFrame(frame);
    }
    function setRunning(on){
      on = on && !reduce && visible && !document.hidden;
      if(on === running) return;
      running = on; last = null;
      if(on) window.requestAnimationFrame(frame);
    }
    measure(); layout();
    strip.classList.add('is-ready');
    window.addEventListener('resize', function(){ measure(); layout(); });
    document.addEventListener('visibilitychange', function(){ setRunning(true); });
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(entries){
        visible = entries[0].isIntersecting; setRunning(true);
      }).observe(strip);
    }
    setRunning(true);
  }
})();
