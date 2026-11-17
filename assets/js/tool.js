/* OPI ROBOTICS — tool.js
   Free public tool: Automation Payback Estimator. Fully client-side.
   Only this tool may show a realistic computed result — it is a genuine
   calculation from user-entered numbers, not placeholder content. */
(function(){
  var form = document.querySelector('#roi-form');
  if(!form) return;
  var machines = document.querySelector('#in-machines');
  var downtimeHrs = document.querySelector('#in-downtime');
  var costHr = document.querySelector('#in-cost');
  var laborCost = document.querySelector('#in-labor');
  var outputs = {
    machines: document.querySelector('#out-machines'),
    downtime: document.querySelector('#out-downtime'),
    cost: document.querySelector('#out-cost'),
    labor: document.querySelector('#out-labor')
  };
  var resultPanel = document.querySelector('#roi-result');
  var skeleton = document.querySelector('#roi-skeleton');
  var submitBtn = document.querySelector('#roi-submit');

  function fmt(n){ return (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString('en-US'); }

  function syncOutputs(){
    outputs.machines.textContent = machines.value;
    outputs.downtime.textContent = downtimeHrs.value + ' hrs/mo';
    outputs.cost.textContent = fmt(costHr.value) + '/hr';
    outputs.labor.textContent = fmt(laborCost.value) + '/mo';
  }
  [machines, downtimeHrs, costHr, laborCost].forEach(function(el){
    el.addEventListener('input', syncOutputs);
  });
  syncOutputs();

  function compute(){
    var m = parseFloat(machines.value) || 0;
    var d = parseFloat(downtimeHrs.value) || 0;
    var c = parseFloat(costHr.value) || 0;
    var l = parseFloat(laborCost.value) || 0;

    var monthlyDowntimeCost = m * d * c;
    // Physical-AI perception + predictive control typically recovers 35-55% of
    // unplanned downtime and 20-30% of manual inspection labor — modeled conservatively.
    var downtimeRecoveryRate = 0.42;
    var laborRecoveryRate = 0.24;
    var recoveredDowntime = monthlyDowntimeCost * downtimeRecoveryRate;
    var recoveredLabor = l * laborRecoveryRate;
    var monthlySavings = recoveredDowntime + recoveredLabor;
    var annualSavings = monthlySavings * 12;

    // Published prices are starting rates. Enterprise is custom, so no cost
    // or net estimate can be inferred above the Scale tier's 150 nodes.
    var estMonthlyPlatformCost = m <= 25 ? m * 340 : m <= 150 ? m * 260 : null;
    var netMonthly = estMonthlyPlatformCost === null ? null : monthlySavings - estMonthlyPlatformCost;
    // Payback requires an upfront project cost, which this form does not ask
    // for. A recurring monthly fee must not be treated as a one-time cost.
    return { monthlySavings, annualSavings, estMonthlyPlatformCost, netMonthly };

  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn__cell--label').textContent = 'Calculating…';
    resultPanel.style.display = 'none';
    skeleton.style.display = 'block';
    document.querySelector('#roi-placeholder').style.display = 'none';

    setTimeout(function(){
      var r = compute();
      document.querySelector('#res-monthly').textContent = fmt(r.monthlySavings) + '/mo';
      document.querySelector('#res-annual').textContent = fmt(r.annualSavings) + '/yr';
      document.querySelector('#res-platform').textContent = r.estMonthlyPlatformCost === null ? '—' : fmt(r.estMonthlyPlatformCost) + '/mo';
      document.querySelector('#res-net').textContent = r.netMonthly === null ? '—' : (r.netMonthly >= 0 ? '+' : '') + fmt(r.netMonthly) + '/mo';
      document.querySelector('#res-payback').textContent = '—';

      skeleton.style.display = 'none';
      resultPanel.style.display = 'block';
      resultPanel.querySelectorAll('.result-line').forEach(function(el, i){
        el.style.opacity = '0';
        el.style.transform = 'translateY(10px)';
        setTimeout(function(){
          el.style.transition = 'opacity 340ms cubic-bezier(.16,1,.3,1), transform 340ms cubic-bezier(.16,1,.3,1)';
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }, i * 90);
      });
      resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      submitBtn.disabled = false;
      submitBtn.querySelector('.btn__cell--label').textContent = 'Recalculate';
    }, 900);
  });
})();
