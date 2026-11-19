const { page, heroStage, btnPrimary } = require('./build.js');

const hero = heroStage({
  heroVideo: 'hero-features',
  eyebrow: 'FEATURES',
  heading: 'Every layer between raw sensor data and a safe decision.',
  lede: 'Opi Robotics is built as one continuous stack \u2014 not a dashboard bolted onto someone else\'s sensors.',
  ctas: `${btnPrimary('Contact us', '/contact')}`,
  compact: true
});

const CAPS = [
  { media:{ video:'product-features' }, title:'Perception fusion', body:'Vision, vibration, thermal, acoustic, and existing PLC/OT tags are fused into a single, continuously updated spatial model of each cell \u2014 no separate dashboards per sensor type.' },
  { media:{ img:'photo-cnc.jpg' }, title:'Predictive wear modeling', body:'Component-level degradation curves trained against your own equipment\'s operating history, not a generic OEM duty cycle.' },
  { media:{ img:'photo-welding-cell.jpg' }, title:'Safety envelope enforcement', body:'Defines physical and operational limits per cell; when perception detects a boundary risk, Opi Robotics can trigger a supervised hold before a person or part is at risk.' },
  { media:{ img:'photo-palletizer.jpg' }, title:'Fleet-wide learning', body:'Patterns learned on one line \u2014 a bearing signature, a fastening drift \u2014 propagate to comparable equipment across your other sites, with your review before rollout.' },
  { media:{ img:'photo-robot-lab.jpg' }, title:'Integration layer', body:'Native connectors for OPC-UA, Modbus TCP, PROFINET, and MQTT, plus a REST API for MES and CMMS systems you already run.' },
  { media:{ img:'photo-control-room.jpg' }, title:'Audit & compliance trail', body:'Every recommendation and automated action is logged with the perception evidence behind it \u2014 built for plants that answer to quality and safety audits.' },
];

const capMedia = (c, i) => `<figure class="caps__media${i === 0 ? ' is-active' : ''}" id="cap-media-${i}" role="tabpanel" aria-label="${c.title}">
      ${c.media.video
        ? `<video class="caps__video" muted loop playsinline preload="metadata" poster="/assets/media/${c.media.video}-poster.jpg"><source src="/assets/media/${c.media.video}.mp4" type="video/mp4"></video>`
        : `<img src="/assets/media/${c.media.img}" alt="" loading="lazy" decoding="async">`}
      <figcaption class="caps__caption">${c.title}</figcaption>
    </figure>`;

const capItem = (c, i) => `<li><button type="button" class="caps__item${i === 0 ? ' is-active' : ''}" role="tab" aria-selected="${i === 0}" aria-controls="cap-media-${i}" data-cap="${i}">
      <span class="caps__bar" aria-hidden="true"><span></span></span>
      <span class="caps__title">${c.title}</span>
      <span class="caps__body"><span>${c.body}</span></span>
    </button></li>`;

const sheet = `
<section class="section capabilities-section caps" data-caps>
  <div class="section-head" data-reveal="rise"><p class="eyebrow">CORE CAPABILITIES</p></div>
  <div class="caps__layout" data-reveal="rise">
    <ol class="caps__list" role="tablist" aria-label="Core capabilities">
    ${CAPS.map(capItem).join('\n    ')}
    </ol>
    <div class="caps__stage">
    ${CAPS.map(capMedia).join('\n    ')}
    </div>
  </div>
</section>

`;

page({
  slug:'/features',
  title:'Features \u2014 Opi Robotics perception stack',
  description:'Perception fusion, predictive wear modeling, safety envelope enforcement, fleet-wide learning, and OT integrations \u2014 the full Opi Robotics stack.',
  hero, sheet,
  finaleEyebrow:'BUILT AS ONE STACK',
  finaleText:'Not a dashboard. A nervous system for the floor.',
  extraScripts:['/assets/js/caps.js']
});
