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
    var W = 0, H = 0, C = 0, phase = 0.25, visible = true, anims = [];
    // The motion runs as compositor animations (Web Animations API) instead of a
    // per-frame JS loop, so it can't stutter when the main thread is busy
    // (video decoding, the 3D section loading). Tiles keep one fixed size and
    // are only translated/scaled, so the videos are never re-laid-out.
    var BW = 1, BH = 1, STEPS = 16;
    function measure(){
      W = strip.clientWidth; H = strip.clientHeight;
      C = Math.round(Math.max(10, Math.min(18, W * 0.012)));
      BW = Math.max(1, W + C - GAP); BH = BW * AR;
      for(var i = 0; i < N; i++){
        tiles[i].style.width = BW.toFixed(1) + 'px';
        tiles[i].style.height = BH.toFixed(1) + 'px';
        tiles[i].style.setProperty('--cut', (BW * 0.04).toFixed(1) + 'px');
      }
    }
    function pose(s){
      var w = (W + C) * Math.pow(2, s - N);
      var tw = Math.max(0, w - GAP), sc = Math.max(1e-4, tw / BW);
      return {
        transform: 'translate3d(' + (w - C).toFixed(2) + 'px,' + (H - BH * sc).toFixed(2) + 'px,0) scale(' + sc.toFixed(6) + ')',
        opacity: Math.min(1, tw / 32)
      };
    }
    function build(){
      var t = anims.length ? anims[0].currentTime : null;
      anims.forEach(function(a){ a.cancel(); });
      anims = [];
      measure();
      for(var i = 0; i < N; i++){
        var s0 = (i + phase) % N;
        if(reduce || !tiles[i].animate){
          var p = pose(s0);
          tiles[i].style.transform = p.transform; tiles[i].style.opacity = p.opacity;
          continue;
        }
        var kf = [];
        for(var j = 0, M = N * STEPS; j <= M; j++){
          var k = pose(j / STEPS); k.offset = j / M; kf.push(k);
        }
        var a = tiles[i].animate(kf, { duration: N * PERIOD, iterations: Infinity, delay: -s0 * PERIOD, easing: 'linear' });
        if(t !== null) a.currentTime = t;
        anims.push(a);
      }
      sync();
    }
    function sync(){
      var on = visible && !document.hidden;
      anims.forEach(function(a){ on ? a.play() : a.pause(); });
    }
    // Chromium/Firefox: draw every clip into one canvas each frame, the same
    // way generalistai.com does it. Positions are sub-pixel exact and come from
    // the clock, so tiles glide instead of snapping between whole pixels.
    // Safari composites scaled video layers well, so it keeps the WAAPI path.
    var ua = navigator.userAgent;
    var safari = /AppleWebKit/.test(ua) && /Safari/.test(ua) && !/Chrome|Chromium|CriOS|Edg|OPR|FxiOS|Android/.test(ua);
    var ffAndroid = /Android/.test(ua) && /Firefox\//.test(ua);
    var canvas = document.createElement('canvas');
    var ctx = !safari && !ffAndroid && !reduce && canvas.getContext && canvas.getContext('2d');
    if(ctx) canvasStrip(); else build();
    strip.classList.add('is-ready');

    function canvasStrip(){
      canvas.className = 'hero-strip__canvas';
      canvas.setAttribute('aria-hidden', 'true');
      strip.appendChild(canvas);
      strip.classList.add('hero-strip--canvas');
      var blurOK = 'filter' in ctx;
      var posters = tiles.map(function(t){
        var v = t.querySelector('video'), src = v && v.getAttribute('poster');
        if(!src) return null;
        var im = new Image(); im.decoding = 'async'; im.src = src; return im;
      });
      var raf = 0, start = performance.now(), elapsed = 0, running = false;
      function size(){
        W = strip.clientWidth; H = strip.clientHeight;
        C = Math.round(Math.max(10, Math.min(18, W * 0.012)));
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.ceil(W * dpr); canvas.height = Math.ceil(H * dpr);
        ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      }
      function draw(i, x, w){
        var h = w * AR, y = H - h, cut = w * 0.04;
        var v = tiles[i].querySelector('video'), p = posters[i];
        var src = v && v.readyState >= 2 && v.videoWidth ? v : (p && p.complete && p.naturalWidth ? p : null);
        ctx.save();
        ctx.globalAlpha = Math.min(1, w / 32);
        ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(x + w - cut, y); ctx.lineTo(x + w, y + cut);
        ctx.lineTo(x + w, H); ctx.lineTo(x, H); ctx.closePath();
        ctx.clip();
        ctx.fillStyle = '#15171a'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
        if(src){
          var sw = src.videoWidth || src.naturalWidth, sh = src.videoHeight || src.naturalHeight;
          var k = Math.max(w / sw, h / sh), cw = w / k, ch = h / k;
          // Tiny tiles get a whisper of blur so the downscaled footage can't shimmer.
          var b = blurOK ? 0.7 * Math.max(0, 1 - w / (W * 0.18)) : 0;
          if(blurOK) ctx.filter = b > 0.02 ? 'blur(' + (b * canvas.width / W).toFixed(2) + 'px)' : 'none';
          // Only sample the part of the clip that is on screen.
          var l = Math.max(x, 0), r = Math.min(x + w, W);
          if(r > l) ctx.drawImage(src, (sw - cw) / 2 + (l - x) / w * cw, (sh - ch) / 2, (r - l) / w * cw, ch, l, y, r - l, h);
          if(blurOK) ctx.filter = 'none';
        }
        var g = ctx.createLinearGradient(0, y, 0, H);
        g.addColorStop(0.7, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.18)');
        ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
        ctx.restore();
      }
      function render(now){
        var t = elapsed + (running ? now - start : 0);
        var s = (t / PERIOD) % N;
        ctx.clearRect(0, 0, W, H);
        for(var i = 0; i < N; i++){
          var w = (W + C) * Math.pow(2, ((i + phase + s) % N) - N);
          var tw = w - GAP;
          if(tw > 0.5 && w - C < W) draw(i, w - C, tw);
        }
      }
      function tick(now){ render(now); raf = requestAnimationFrame(tick); }
      function sync(){
        var on = visible && !document.hidden, now = performance.now();
        if(on && !running){ start = now; running = true; raf = requestAnimationFrame(tick); }
        else if(!on && running){ elapsed += now - start; running = false; cancelAnimationFrame(raf); }
      }
      size(); render(performance.now());
      var rt = 0;
      window.addEventListener('resize', function(){
        clearTimeout(rt);
        rt = setTimeout(function(){ size(); render(performance.now()); }, 60);
      });
      document.addEventListener('visibilitychange', sync);
      if('IntersectionObserver' in window){
        new IntersectionObserver(function(e){ visible = e[0].isIntersecting; sync(); }).observe(strip);
      }
      sync();
    }
    if(ctx) return;
    var rt = 0, lastW = W, lastH = H;
    window.addEventListener('resize', function(){
      clearTimeout(rt);
      rt = setTimeout(function(){
        if(strip.clientWidth === lastW && strip.clientHeight === lastH) return;
        lastW = strip.clientWidth; lastH = strip.clientHeight; build();
      }, 120);
    });
    document.addEventListener('visibilitychange', sync);
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(entries){
        visible = entries[0].isIntersecting; sync();
      }).observe(strip);
    }
  }
})();
