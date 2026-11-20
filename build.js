// OPI ROBOTICS static site generator — authoring convenience only.
// Output is 100% plain static HTML/CSS/JS — no build step required to host.
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;

const NAV_ITEMS = [
  { n:'01', label:'Home', href:'/', desc:'The perception stack, end to end' },
  { n:'02', label:'Features', href:'/features', desc:'Perceive, predict, act' },
  { n:'03', label:'Use Cases', href:'/use-cases', desc:'Where it runs on the floor' },
  { n:'04', label:'Blog', href:'/blog', desc:'Notes on physical AI' },
  { n:'05', label:'About', href:'/about', desc:'The team and the thesis' },
  { n:'06', label:'Contact', href:'/contact', desc:'Talk to an engineer' },
];

function wordmark(){
  return `<a href="/" class="wordmark" aria-label="Opi Robotics home"><img class="wordmark__logo" data-brand="logo" src="/assets/brand/logo-mono.svg" alt="Opi Robotics" width="136" height="40" fetchpriority="high" decoding="sync"><span class="wordmark__mark" aria-hidden="true"></span><span class="wordmark__text">Opi Robotics</span></a>`;
}

function nav(){
  return `
<nav class="site-nav" aria-label="Primary">
  ${wordmark()}
  <ul class="nav-links">
    ${NAV_ITEMS.map(i => `<li><a href="${i.href}">${i.label}</a></li>`).join('\n    ')}
  </ul>
  <div class="nav-actions">
    <button class="nav-trigger" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="nav-overlay" aria-label="Menu">
      <span class="nav-trigger__label">Menu</span>
      <span class="nav-trigger__icon" aria-hidden="true"><span></span></span>
    </button>
  </div>
</nav>
<div class="nav-overlay" id="nav-overlay" aria-hidden="true">
  <div class="nav-overlay__top">
    ${wordmark()}
    <button class="nav-close" type="button" aria-label="Close menu"></button>
  </div>
  <div class="nav-overlay__panel">
    <ul class="nav-index">
      ${NAV_ITEMS.map(i => `<li><a href="${i.href}"><span class="idx">${i.n}</span><span class="nav-index__text"><span class="nav-index__label">${i.label}</span><span class="nav-index__desc">${i.desc}</span></span><span class="nav-index__arrow" aria-hidden="true"></span></a></li>`).join('\n      ')}
    </ul>
  </div>
  <div class="nav-overlay__foot">
    <a href="mailto:hello@opirobotics.com" class="nav-foot__spacer">hello@opirobotics.com</a>
  </div>
</div>`;
}

function footer(){
  return `
<footer class="site-footer">
  <svg class="footer-trace footer-trace--edge" viewBox="0 0 260 520" aria-hidden="true" focusable="false">
    <path class="footer-trace__rail" pathLength="1000" d="M10 -10L118 104C134 121 156 132 180 136C214 142 236 170 236 204V540"/>
    <path class="footer-trace__run footer-trace__run--late" pathLength="1000" d="M10 -10L118 104C134 121 156 132 180 136C214 142 236 170 236 204V540"/>
    <circle class="footer-trace__joint" cx="118" cy="104" r="6"/>
    <circle class="footer-trace__joint" cx="236" cy="204" r="9"/>
  </svg>
  <div class="container">
    <a href="/" class="footer-slab" aria-label="Opi Robotics home"><img src="/assets/brand/logo.svg" alt="Opi Robotics" width="204" height="60" loading="lazy"></a>
    <nav class="footer-directory" aria-label="Footer navigation">
      <svg class="footer-trace footer-trace--mid" viewBox="0 0 160 320" aria-hidden="true" focusable="false">
        <path class="footer-trace__rail" pathLength="1000" d="M40 -10V96C40 124 56 142 84 152L104 159C130 168 138 194 128 218L98 290"/>
        <path class="footer-trace__run" pathLength="1000" d="M40 -10V96C40 124 56 142 84 152L104 159C130 168 138 194 128 218L98 290"/>
        <circle class="footer-trace__joint" cx="40" cy="96" r="5"/>
        <circle class="footer-trace__joint" cx="98" cy="290" r="8"/>
      </svg>
      <div class="footer-directory__row">
        <div class="footer-directory__label">Product</div>
        <div class="footer-directory__links">
          <a href="/features">Features</a><a href="/use-cases">Use cases</a>
        </div>
      </div>
      <div class="footer-directory__row">
        <div class="footer-directory__label">Company</div>
        <div class="footer-directory__links">
          <a href="/about">About</a><a href="/blog">Blog</a><a href="/contact">Contact</a>
        </div>
      </div>
      <div class="footer-directory__row">
        <div class="footer-directory__label">Legal</div>
        <div class="footer-directory__links">
          <a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a><a href="/cookies">Cookie Policy</a>
          <button type="button" data-cookie="manage" style="background:none;border:0;cursor:pointer;padding:0;font-family:inherit;">Cookie Settings</button>
        </div>
      </div>
    </nav>
    <div class="footer-bottom">
      <span>\u00a9 <span data-year></span> Opi Robotics &middot; a brand of 21 Robots LLC &middot; 530-B Harkle Road, Ste 100, Santa Fe, NM 87505, USA &middot; All rights reserved.</span>
      <div class="footer-social">
        <a href="https://linkedin.com" aria-label="Opi Robotics on LinkedIn" target="_blank" rel="noopener"><i class="fa-brands fa-linkedin"></i></a>
        <a href="https://x.com" aria-label="Opi Robotics on X" target="_blank" rel="noopener"><i class="fa-brands fa-x-twitter"></i></a>
        <a href="https://github.com" aria-label="Opi Robotics on GitHub" target="_blank" rel="noopener"><i class="fa-brands fa-github"></i></a>
      </div>
    </div>
  </div>
</footer>`;
}

function cookieUI(){
  return `
<div class="cookie-banner" role="dialog" aria-label="Cookie preferences">
  <p>We use essential cookies to run Opi Robotics, and optional analytics cookies to understand how the site is used. You can change this anytime in Cookie Settings.</p>
  <div class="cookie-banner__actions">
    <button class="btn btn-primary" type="button" data-cookie="accept-all"><span class="btn__cell">Accept all</span></button>
    <button class="btn btn-ghost" type="button" data-cookie="reject">Reject non-essential</button>
    <button class="btn-text" type="button" data-cookie="manage">Manage preferences</button>
  </div>
</div>
<div class="cookie-modal" role="dialog" aria-modal="true" aria-labelledby="cookie-modal-title">
  <div class="cookie-modal__panel">
    <h3 id="cookie-modal-title" style="margin-bottom:8px;">Cookie preferences</h3>
    <p class="lede" style="margin-bottom:0;font-size:14px;">Essential cookies keep the site working and can\u2019t be turned off. Choose whether we can use analytics or marketing cookies below.</p>
    <div class="cookie-toggle-row" style="border-top:0;">
      <div><strong>Essential</strong><div class="hint">Required for core functionality.</div></div>
      <label class="switch"><input type="checkbox" aria-label="Essential" checked disabled><span class="track"></span><span class="thumb"></span></label>
    </div>
    <div class="cookie-toggle-row">
      <div><strong>Analytics</strong><div class="hint">Helps us understand product usage.</div></div>
      <label class="switch"><input type="checkbox" id="pref-analytics" aria-label="Analytics"><span class="track"></span><span class="thumb"></span></label>
    </div>
    <div class="cookie-toggle-row">
      <div><strong>Marketing</strong><div class="hint">Used to measure campaign performance.</div></div>
      <label class="switch"><input type="checkbox" id="pref-marketing" aria-label="Marketing"><span class="track"></span><span class="thumb"></span></label>
    </div>
    <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;">
      <button class="btn btn-primary" type="button" data-cookie="save"><span class="btn__cell">Save preferences</span></button>
      <button class="btn btn-ghost" type="button" data-cookie="close-modal">Cancel</button>
    </div>
  </div>
</div>`;
}

function headTags({ slug, title, description }){
  const url = 'https://opirobotics.com' + (slug === '/' ? '' : slug);
  return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>document.documentElement.classList.add("js")</script>
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<link rel="icon" href="/assets/brand/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png">
<meta property="og:site_name" content="Opi Robotics">
<meta property="og:image" content="https://opirobotics.com/assets/brand/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:image" content="https://opirobotics.com/assets/brand/og-image.png">
<link rel="stylesheet" href="/assets/vendor/fontawesome/css/all.min.css">
<link rel="stylesheet" href="/assets/css/tokens.css">
<link rel="stylesheet" href="/assets/css/base.css">
<link rel="stylesheet" href="/assets/css/components.css">
<link rel="stylesheet" href="/assets/css/pages.css">
<link rel="stylesheet" href="/assets/css/media.css">
<link rel="stylesheet" href="/assets/css/motion.css">
<link rel="preload" href="/assets/fonts/Geist-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/generalist.css">`;
}

function scripts(extra){
  return `<script src="/assets/js/main.js"></script>
<script src="/assets/js/nav.js"></script>
<script src="/assets/js/brand.js"></script>
<script src="/assets/js/cookie-consent.js"></script>
<script src="/assets/js/reveal.js"></script>
<script src="/assets/js/media.js"></script>
${extra ? extra.map(s => `<script src="${s}"></script>`).join('\n') : ''}`;
}

// Hero and section videos use optimized, bundled MP4 files at fixed paths.
// Replace an MP4 or its -poster.jpg companion to update a slot.
const MEDIA_FORMATS = [
  ['mp4', 'video/mp4']
];

// Each video has its OWN slot, plus a shared fallback slot. Sources are emitted
// slot-first, fallback-second, so the browser walks the list until a file
// actually exists: /assets/media/hero-pricing.mp4 wins if you drop it in,
// otherwise that page quietly uses the shared /assets/media/hero.mp4.
// Per-section footage is therefore opt-in per file, with zero code changes.
function videoLayer({ name, fallback, className, poster }){
  const slots = [name, fallback]
    .filter(Boolean)
    .filter((slot, i, all) => all.indexOf(slot) === i);
  const sources = slots
    .map(slot => MEDIA_FORMATS
      .map(([ext, mime]) => `    <source src="/assets/media/${slot}.${ext}" type="${mime}">`)
      .join('\n'))
    .join('\n');
  return `<video class="${className}" data-media="${name}" data-media-slots="${slots.join(',')}" autoplay muted loop playsinline preload="metadata" poster="/assets/media/${poster || name + '-poster.jpg'}" aria-hidden="true" tabindex="-1">
${sources}
  </video>`;
}

// A framed section video with copy layered on top — used for the product /
// perception sections. Replace /assets/media/<name>.mp4 to change the footage.
function mediaVideo({ name, fallback, body, shape, align, caption }){
  return `<div class="media-frame media-frame--${shape || 'wide'}">
  ${videoLayer({ name, fallback: fallback || 'product', className: 'media-video' })}
  <div class="media-frame__scrim" aria-hidden="true"></div>
  <div class="media-frame__body${align === 'center' ? ' media-frame__body--center' : ''}">
${body}
  </div>
</div>${caption ? `\n<p class="media-caption">${caption}</p>` : ''}`;
}

const STRIP = [
  { video:'hero-pricing' },
  { video:'product' },
  { video:'hero-usecases' },
  { video:'product-features' },
  { video:'hero-about' },
  { video:'stack' },
  { video:'hero-home' },
];
function stripTile(t){
  return t.video
    ? `<div class="hero-tile">${videoLayer({ name:t.video, fallback:'hero', className:'hero-tile__media' })}</div>`
    : `<div class="hero-tile"><img class="hero-tile__media" src="/assets/media/${t.img}" alt="" loading="eager" decoding="async"></div>`;
}

function heroStage({ eyebrow, heading, lede, ctas, extraStage, compact, heroVideo }){
  const strip = !compact;
  return `
<header class="hero-stage${compact ? ' hero-stage--compact' : ' hero-stage--strip'}${/hero-(auth|legal)/.test(heroVideo || '') ? ' hero-stage--slim' : ''}">
  <div class="hero-content">
    <div class="hero-content__main">
      ${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ''}
      ${heading ? `<h1 class="hero-heading">${heading}</h1>` : ''}
      ${lede ? `<p class="lede hero-lede">${lede}</p>` : ''}
      ${ctas ? `<div class="hero-ctas">${ctas}</div>` : ''}
    </div>
  </div>
  ${strip ? `<div class="hero-strip" aria-hidden="true">${STRIP.map(stripTile).join('')}</div>` : `<div class="hero-feature">
    ${videoLayer({ name: heroVideo || 'hero', fallback: 'hero', className: 'hero-video' })}
    <button class="hero-pause" type="button" aria-label="Pause video"></button>
  </div>`}
</header>
${extraStage ? `<div class="hero-foot"><div class="container">${extraStage}</div></div>` : ''}`;
}

const COLLAGE = ['photo-cnc.jpg','photo-parcel-hub.jpg','photo-washer-filler.jpg','photo-control-room.jpg','photo-pallet-racking.jpg','photo-forklift.jpg','photo-produce-dock.jpg','photo-body-shop.jpg','photo-excavator.jpg','photo-chassis-line.jpg','photo-robot-arm.jpg','photo-press-line.jpg'];
function collageFor(slug){
  let h = 0;
  for(const c of String(slug || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const keyed = Object.keys(FINALE).indexOf(slug);
  const start = (keyed >= 0 ? keyed * 5 : h) % COLLAGE.length;
  return Array.from({ length:8 }, (_, i) => COLLAGE[(start + i) % COLLAGE.length]);
}
const FINALE = {
  '/':{ eyebrow:'OPI ROBOTICS', text:'The horizon keeps moving. So do we.', sub:'One perception layer for robots, fixed automation, and inspection systems \u2014 running on real floors.' },
  '/features':{ eyebrow:'BUILT AS ONE STACK', text:'Not a dashboard. A nervous system for the floor.', sub:'Perception, prediction, and safety run as one continuous stack, from raw sensor data to a safe decision.' },
  '/use-cases':{ eyebrow:'FOUR VERTICALS, ONE STACK', text:'The physical world doesn\u2019t change by industry. The failure modes do.', sub:'Automotive, warehousing, food & beverage, and heavy equipment \u2014 one perception layer across all four.' },
  '/blog':{ eyebrow:'NOTES FROM THE FLOOR', text:'Written by the people who deploy this, not just market it.', sub:'Field-level thinking on physical AI, industrial reliability, and what it takes to deploy.' },
  '/blog/perception-stack-industrial-robots':{ eyebrow:'PERCEPTION', text:'Built for the production line, not the lab bench.', sub:'Next up: the real payback math behind embodied AI on the plant floor.' },
  '/blog/roi-of-embodied-ai':{ eyebrow:'PAYBACK', text:'Count what it costs to reach the savings.', sub:'Next up: building the safety case for physical AI before your first pilot.' },
  '/blog/safety-case-for-physical-ai':{ eyebrow:'SAFETY', text:'Safety signs off before the pilot, not after.', sub:'Next up: what a perception stack actually needs to survive a factory floor.' },
  '/about':{ eyebrow:'THE TEAM', text:'Built by people who\u2019ve stood on the floor at 2am waiting for a line to restart.', sub:'We hire engineers who\u2019ve spent real time on plant floors.' },
  '/contact':{ eyebrow:'TALK TO US', text:'We read every message ourselves.', sub:'Sales, support, press, or careers \u2014 every inbox reaches a real person.' },
  '/privacy':{ eyebrow:'PRIVACY', text:'Questions about this policy?', sub:'Write to privacy@opirobotics.com and we\u2019ll get back to you.' },
  '/terms':{ eyebrow:'TERMS', text:'Questions about these terms?', sub:'Write to hello@opirobotics.com and we\u2019ll get back to you.' },
  '/cookies':{ eyebrow:'COOKIES', text:'You decide what we store.', sub:'Change your choices anytime in Cookie Settings.' },
  '/404':{ eyebrow:'PAGE NOT FOUND', text:'Even off the map, the horizon is still there.', sub:'Head back home, or start with Features and Use cases.' },
};
function finale(text, eyebrow, slug){
  const copy = FINALE[slug] || { eyebrow, text };
  text = copy.text; eyebrow = copy.eyebrow;
  const photos = collageFor(slug);
  const tile = f => `<img class="finale__tile" src="/assets/media/${f}" alt="" decoding="async">`;
  const column = (list, mod) => `<div class="finale__col${mod ? ' finale__col--' + mod : ''}"><div class="finale__track">${list.concat(list).map(tile).join('')}</div></div>`;
  return `
<div class="finale">
  <div class="finale__inner">
    <div class="finale__copy">
      <p class="eyebrow">${eyebrow || 'OPI ROBOTICS'}</p>
      <p>${text}</p>${copy.sub ? `
      <p class="finale__sub">${copy.sub}</p>` : ''}
    </div>
    <div class="finale__marquee" aria-hidden="true">
      ${column(photos.filter((_, i) => i % 2 === 0), 'up')}
      ${column(photos.filter((_, i) => i % 2 === 1), 'down')}
    </div>
  </div>
</div>`;
}


const LABEL_ICONS = {
  'OPI ROBOTICS':'robot','PHYSICAL AI FOR INDUSTRIAL AUTOMATION':'robot','THE PRODUCT':'robot',
  'THE PERCEPTION STACK':'eye','THE STACK, RUNNING':'pulse','A WORKING PRINCIPLE':'ruler','WHERE IT RUNS':'globe',
  'THE HORIZON LINE':'horizon','DEPLOYMENT':'deploy','FREE TOOL':'calc','YOUR NUMBERS, NOT OURS':'gauge',
  'FEATURES':'sliders','CORE CAPABILITIES':'cube','UNDER THE HOOD':'gear','BUILT AS ONE STACK':'layers',
  'USE CASES':'factory','FOUR VERTICALS, ONE STACK':'layers','01 \u2014 Automotive final assembly':'car',
  '02 \u2014 Warehousing & logistics':'boxes','03 \u2014 Food & beverage lines':'bottle','04 \u2014 Heavy equipment yards':'hook',
  'PRICING':'tag','NODE-BASED PRICING':'tag','FREQUENTLY ASKED':'chat',
  'BLOG':'doc','NOTES FROM THE FLOOR':'clipboard','OPI ROBOTICS BLOG':'doc',
  'ABOUT':'building','WHY WE EXIST':'target','HOW WE WORK':'wrench','WHERE WE\'RE HEADED':'compass',
  'OWNERSHIP &amp; STRUCTURE':'org','COMPANY DETAILS':'idcard','CONTACT':'mail','OFFICE':'pin',
  'LOGIN':'key','WELCOME BACK':'key','REGISTER':'userplus','REQUEST ACCESS':'badge','VERIFY':'shield',
  'ALMOST THERE':'mailcheck','ACCOUNT RECOVERY':'lock','LEGAL':'scale','404':'cone'
};
function labelIcons(html){
  return html;
  return html.replace(/<p class="eyebrow"([^>]*)>([^<]*)<\/p>/g, (m, attrs, text) => {
    if (/data-icon=/.test(attrs)) return m;
    const icon = LABEL_ICONS[text.trim()] || (/^BLOG \u00b7 /.test(text.trim()) ? 'calendar' : null);
    return icon ? `<p class="eyebrow" data-icon="${icon}"${attrs}>${text}</p>` : m;
  });
}

function page({ slug, title, description, hero, sheet, finaleText, finaleEyebrow, extraScripts, bodyAttrs }){
  const html = `<!doctype html>
<html lang="en">
<head>
${headTags({ slug, title, description })}
</head>
<body${bodyAttrs ? ' ' + bodyAttrs : ''}>
<a href="#main" class="skip-link">Skip to content</a>
<div class="route-progress"></div>
${nav()}
${hero}
<main id="main" class="peel-sheet">
  <div class="container">
${sheet}
  </div>
</main>
${finale(finaleText, finaleEyebrow, slug)}
${footer()}
${cookieUI()}
${scripts(extraScripts)}
</body>
</html>`;
  const outDir = slug === '/' ? ROOT : path.join(ROOT, slug.replace(/^\//,''));
  fs.mkdirSync(outDir, { recursive:true });
  fs.writeFileSync(path.join(outDir, 'index.html'), labelIcons(html));
  console.log('wrote', slug);
}

function btnPrimary(label, href, icon){
  return `<a href="${href}" class="btn btn-primary"><span class="btn__cell">${label}</span><span class="btn__cell"><i class="fa-solid ${icon||'fa-arrow-right'}"></i></span></a>`;
}
function btnGhost(label, href){ return `<a href="${href}" class="btn btn-ghost">${label}</a>`; }
function btnText(label, href){ return `<a href="${href}" class="btn-text">${label}</a>`; }

function rowCard(idx, title, body, reveal){
  return `<div class="row-card" data-reveal="${reveal||'rise'}">
    ${idx ? `<div class="row-card__idx">${idx}</div>` : ''}
    <div class="row-card__body"><h3>${title}</h3><p>${body}</p></div>
  </div>`;
}

module.exports = { labelIcons, NAV_ITEMS, nav, footer, cookieUI, headTags, scripts, heroStage, finale, page, btnPrimary, btnGhost, btnText, rowCard, videoLayer, mediaVideo };
