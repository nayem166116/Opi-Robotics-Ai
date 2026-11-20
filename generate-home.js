const { page, heroStage, btnPrimary, btnText, rowCard } = require('./build.js');

const hero = heroStage({
  heroVideo: 'hero-home',
  eyebrow: 'PHYSICAL AI FOR INDUSTRIAL AUTOMATION',
  heading: 'Machines that read the floor <em>the way your best operator does.</em>',
  lede: 'Opi Robotics gives robots, fixed automation, and inspection systems a shared perception and decision layer \u2014 so drift, wear, and risk get caught before they become downtime.',
  ctas: `${btnPrimary('See how it works', '/features')}`
});

const assembly = `
<section class="assembly" data-assembly aria-label="The Opi Robotics stack, taken apart">
  <div class="assembly__sticky">
    <canvas class="assembly__canvas" aria-hidden="true"></canvas>
    <div class="assembly__labels" aria-hidden="true">
      <span class="assembly__label" data-label="perception">Perception head</span>
      <span class="assembly__label" data-label="wear">Joint drives</span>
      <span class="assembly__label" data-label="safety">Safety envelope</span>
      <span class="assembly__label" data-label="integration">Edge controller</span>
    </div>
    <div class="assembly__copy">
      <p class="assembly__kicker">THE PERCEPTION STACK</p>
      <h2 class="assembly__title">Every layer between raw sensor data and a safe decision.</h2>
      <p class="assembly__lede">Opi Robotics is built as one continuous stack — not a dashboard bolted onto someone else's sensors.</p>
      <ol class="assembly__parts">
        <li class="assembly__part" data-part="perception"><button type="button" data-part-btn="0"><span class="assembly__part-name"><i class="fa-solid fa-eye" aria-hidden="true"></i>Perception head</span><span class="assembly__part-body"><span>Vision, vibration, thermal, acoustic, and existing PLC/OT tags are fused into a single, continuously updated spatial model of each cell — no separate dashboards per sensor type.</span></span></button></li>
        <li class="assembly__part" data-part="wear"><button type="button" data-part-btn="1"><span class="assembly__part-name"><i class="fa-solid fa-gears" aria-hidden="true"></i>Joint drives</span><span class="assembly__part-body"><span>Component-level degradation curves trained against your own equipment's operating history, not a generic OEM duty cycle.</span></span></button></li>
        <li class="assembly__part" data-part="safety"><button type="button" data-part-btn="2"><span class="assembly__part-name"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i>Safety envelope</span><span class="assembly__part-body"><span>Defines physical and operational limits per cell; when perception detects a boundary risk, Opi Robotics can trigger a supervised hold before a person or part is at risk.</span></span></button></li>
        <li class="assembly__part" data-part="integration"><button type="button" data-part-btn="3"><span class="assembly__part-name"><i class="fa-solid fa-network-wired" aria-hidden="true"></i>Edge controller</span><span class="assembly__part-body"><span>Native connectors for OPC-UA, Modbus TCP, PROFINET, and MQTT, plus a REST API for MES and CMMS systems you already run.</span></span></button></li>
      </ol>
    </div>
    <p class="assembly__hint" aria-hidden="true"><i class="fa-solid fa-arrow-down"></i> Scroll to take it apart</p>
  </div>
</section>
<script type="module" src="/assets/js/assembly.js"></script>
`;

const sheet = `

<section class="section home-sectors home-bento">
  <div class="bento">
    <div class="bento__head" data-reveal="rise">
      <p class="eyebrow bento__tag">WHERE IT RUNS</p>
      <h2>Built for the floor, <em>not the pilot deck.</em></h2>
    </div>
    <article class="bento__card bento__card--wide" data-reveal="rise">
      <img src="/assets/media/photo-auto-line.jpg" alt="" loading="lazy" decoding="async">
      <div class="bento__copy"><h3>Automotive final assembly</h3><p>Torque, alignment, and fastening cells monitored in real time, with drift flagged before it produces a defect.</p></div>
    </article>
    <article class="bento__card" data-reveal="rise">
      <img src="/assets/media/photo-sortation-conveyor.jpg" alt="" loading="lazy" decoding="async">
      <div class="bento__copy"><h3>Warehousing &amp; logistics</h3><p>AMR fleets and conveyor junctions get a shared spatial map, cutting collision risk and idle routing time.</p></div>
    </article>
    <article class="bento__card" data-reveal="rise">
      <img src="/assets/media/photo-bottling-line.jpg" alt="" loading="lazy" decoding="async">
      <div class="bento__copy"><h3>Food &amp; beverage lines</h3><p>Vibration and thermal sensing on fillers and packaging lines catches bearing wear weeks before failure.</p></div>
    </article>
    <article class="bento__card bento__card--wide" data-reveal="rise">
      <img src="/assets/media/photo-wheel-loader.jpg" alt="" loading="lazy" decoding="async">
      <div class="bento__copy"><h3>Heavy equipment yards</h3><p>Structural and hydraulic stress patterns tracked across a mixed-age fleet without retrofitting OEM sensors.</p></div>
    </article>
    <a class="bento__more" href="/use-cases" data-reveal="rise"><span>See all use cases</span><span class="bento__arrow" aria-hidden="true">\u2192</span></a>
  </div>
</section>
`;

page({
  slug:'/',
  title:'Opi Robotics \u2014 Physical AI for industrial automation',
  description:'Opi Robotics gives industrial robots and fixed automation a shared perception and decision layer, catching drift, wear, and risk before it becomes downtime.',
  hero: hero + assembly, sheet,
  finaleEyebrow:'OPI ROBOTICS',
  finaleText:'The horizon keeps moving. So do we.'
});
