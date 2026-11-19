/* OPI ROBOTICS — nav.js
   Handles: nav shrink/solid on scroll, active link aria-current,
   full-screen overlay menu open/close with focus trap + Escape + scroll lock. */
(function(){
  var nav = document.querySelector('.site-nav');
  var overlay = document.querySelector('.nav-overlay');
  var trigger = document.querySelector('.nav-trigger');
  var closeBtn = document.querySelector('.nav-close');
  var lastFocused = null;

  function onScroll(){
    if(!nav) return;
    var solid = window.scrollY > (window.innerHeight * 0.7);
    nav.classList.toggle('is-solid', solid);
    var mini = desk.matches && window.scrollY > 80;
    nav.classList.toggle('is-mini', mini);
    if(!mini) setPeek(false);
  }
  var desk = window.matchMedia('(min-width:1100px)');
  function setPeek(on){
    if(!nav) return;
    nav.classList.toggle('is-peek', on);
    if(trigger && nav.classList.contains('is-mini')) trigger.setAttribute('aria-expanded', on ? 'true' : 'false');
  }
  if(desk.addEventListener) desk.addEventListener('change', onScroll);
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();

  function trapFocus(e){
    if(!overlay || !overlay.classList.contains('is-open')) return;
    if(e.key === 'Escape'){ closeMenu(); return; }
    if(e.key !== 'Tab') return;
    var focusables = overlay.querySelectorAll('a, button');
    if(!focusables.length) return;
    var first = focusables[0], last = focusables[focusables.length - 1];
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  }

  function openMenu(){
    if(!overlay) return;
    lastFocused = document.activeElement;
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden','false');
    if(trigger) trigger.setAttribute('aria-expanded','true');
    document.body.style.overflow = 'hidden';
    document.body.classList.add('nav-open');
    var first = overlay.querySelector('a, button');
    if(first) first.focus();
    document.addEventListener('keydown', trapFocus);
  }
  function closeMenu(){
    if(!overlay) return;
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden','true');
    if(trigger) trigger.setAttribute('aria-expanded','false');
    document.body.style.overflow = '';
    document.body.classList.remove('nav-open');
    document.removeEventListener('keydown', trapFocus);
    if(lastFocused) lastFocused.focus();
  }
  if(trigger) trigger.addEventListener('click', function(e){
    if(nav && nav.classList.contains('is-mini')){
      e.stopPropagation();
      setPeek(!nav.classList.contains('is-peek'));
      return;
    }
    openMenu();
  });
  document.addEventListener('click', function(e){
    if(nav && nav.classList.contains('is-peek') && !nav.contains(e.target)) setPeek(false);
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && nav && nav.classList.contains('is-peek')){ setPeek(false); if(trigger) trigger.focus(); }
  });
  if(closeBtn) closeBtn.addEventListener('click', closeMenu);

  // Close on navigate so a back/bfcache restore never lands on an open menu.
  if(overlay){
    overlay.addEventListener('click', function(e){
      var link = e.target.closest ? e.target.closest('a[href]') : null;
      if(link) closeMenu();
    });
  }
  document.addEventListener('click', function(e){
    if(!overlay || !overlay.classList.contains('is-open')) return;
    if(overlay.contains(e.target) || (trigger && trigger.contains(e.target))) return;
    closeMenu();
  });
  window.addEventListener('pageshow', function(){
    if(overlay && overlay.classList.contains('is-open')) closeMenu();
  });

  // Active link
  var path = window.location.pathname.replace(/\/index\.html$/,'/').replace(/\/$/,'') || '/';
  document.querySelectorAll('.nav-index a, .nav-links a, .footer-directory a').forEach(function(a){
    var href = a.getAttribute('href');
    if(!href) return;
    var clean = href.replace(/\/$/,'') || '/';
    if(clean === path){ a.setAttribute('aria-current','page'); }
  });
})();

(function(){
  document.querySelectorAll('.hero-pause').forEach(function(btn){
    var v = btn.parentNode.querySelector('video');
    if(!v) return;
    btn.addEventListener('click', function(){
      if(v.paused){ v.play(); btn.classList.remove('is-paused'); btn.setAttribute('aria-label','Pause video'); }
      else { v.pause(); btn.classList.add('is-paused'); btn.setAttribute('aria-label','Play video'); }
    });
  });
})();
