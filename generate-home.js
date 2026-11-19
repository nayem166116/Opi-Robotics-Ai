const { page, heroStage, btnPrimary, btnText, rowCard } = require('./build.js');

const hero = heroStage({
  heroVideo: 'hero-home',
  eyebrow: 'PHYSICAL AI FOR INDUSTRIAL AUTOMATION',
  heading: 'Machines that read the floor <em>the way your best operator does.</em>',
  lede: 'Opi Robotics gives robots, fixed automation, and inspection systems a shared perception and decision layer \u2014 so drift, wear, and risk get caught before they become downtime.',
  ctas: `${btnPrimary('See how it works', '/features')}`
});

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
  hero, sheet,
  finaleEyebrow:'OPI ROBOTICS',
  finaleText:'The horizon keeps moving. So do we.'
});
