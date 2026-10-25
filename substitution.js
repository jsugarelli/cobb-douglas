import { ALPHA, BETA } from './math.js';
import { marginalUtility } from './marginal-math.js';
import { quantityOnIndifference, substitutionValues, substitutionPlotRange } from './substitution-math.js';

export function createSubstitutionSimulation({ t, locale, showError }) {
  const $ = id => document.getElementById(id);
  const red = '#DA002A', blue = '#4A7EBB', grey = '#555555';
  const f = (x, digits = 3) => new Intl.NumberFormat(locale(), { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(x);
  const config = { responsive: true, displayModeBar: false, scrollZoom: false };
  let step = 1, active = false, initialized = false, running = false, frame = null, busy = false, pending = false;
  const values = () => substitutionValues(Number($('mrs-point').value), Number($('mrs-gap').value), Number($('mrs-compensation').value) / 100);
  const interpolate = (key, replacements) => Object.entries(replacements).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), t(key));
  function labels(s) {
    $('mrs-kicker').textContent = t(step === 1 ? 'mrsExchangeKicker' : 'mrsLimitKicker');
    $('mrs-heading').textContent = t(step === 1 ? 'mrsExchangeHeading' : 'mrsLimitHeading');
    $('mrs-intro').textContent = t(step === 1 ? 'mrsExchangeIntro' : 'mrsLimitIntro');
    $('mrs-context').innerHTML = `U(x₁, x₂) = x₁<sup>${f(ALPHA, 1)}</sup> · x₂<sup>${f(BETA, 1)}</sup> &nbsp; · &nbsp; Ū = ${f(s.baseUtility)}`;
    $('mrs-point-value').textContent = f(s.a, 1);
    $('mrs-gap-value').textContent = f(s.gap, 2);
    $('mrs-gap-min').textContent = t(step === 1 ? 'mrsNoAddition' : 'muLimitEnd');
    $('mrs-gap-max').textContent = t(step === 1 ? 'mrsAdditionEnd' : 'muSecantEnd');
    $('mrs-compensation-value').textContent = `${f(Number($('mrs-compensation').value), 0)} %`;
    for (const id of ['mrs-point', 'mrs-gap', 'mrs-compensation']) $(id).setAttribute('aria-valuetext', $(`${id}-value`).textContent);
    $('mrs-compensation-control').hidden = step !== 1;
    $('mrs-animate').textContent = t(running ? 'muPause' : step === 1 ? (Number($('mrs-compensation').value) === 100 ? 'mrsReplayExchange' : 'mrsAnimateExchange') : (s.gap === 0 ? 'muReplay' : 'muAnimate'));
    $('mrs-control-help').textContent = t(step === 1 ? 'mrsCompensationHelp' : 'muAnimateHelp');
    $('mrs-a-values').textContent = `A: x₁ = ${f(s.a, 2)} · x₂ = ${f(s.yA, 2)}`;
    $('mrs-b-values').textContent = `B: x₁ = ${f(s.b, 2)} · x₂ = ${f(s.yB, 2)}`;
    $('mrs-blue-legend').textContent = t(step === 1 ? 'mrsAddedCurve' : 'mrsSecant');
    $('mrs-grey-legend').textContent = t(step === 1 ? 'mrsCompensationPath' : 'muTangent');
    $('mrs-plot-note').textContent = t(step === 1 ? 'mrsExchangePlotNote' : 'muZoomNote');
    $('mrs-next').textContent = t(step === 1 ? 'mrsNext' : 'mrsBack');
    $('mrs-bottom-note').textContent = t(step === 1 ? 'mrsExchangeBottom' : 'mrsLimitBottom');
    const metrics = step === 1 ? [
      ['mrsBaseUtility', s.baseUtility, 'U(A) = Ū'], ['mrsAddedUtility', s.addedUtility, 'U(C)'],
      ['mrsCurrentUtility', s.currentUtility, 'U(D)'], ['mrsUtilityDifference', s.currentUtility - s.baseUtility, 'U(D) − Ū']
    ] : [
      ['mrsExtraGood1', s.gap, 'Δx₁'], ['mrsSacrificeGood2', s.sacrifice, '−Δx₂'],
      ['mrsAverage', s.average, '−Δx₂ / Δx₁'], ['mrsMarginal', s.mrs, 'MRS = MU₁ / MU₂']
    ];
    metrics.forEach(([key, value, symbol], i) => {
      $(`mrs-metric-label-${i + 1}`).textContent = t(key);
      $(`mrs-metric-value-${i + 1}`).textContent = value === null ? '—' : f(value);
      $(`mrs-metric-symbol-${i + 1}`).textContent = symbol;
    });
    const compensated = Math.abs(s.currentUtility - s.baseUtility) < 1e-9;
    $('mrs-explanation-heading').textContent = t(step === 1 ? compensated ? 'mrsBalancedHeading' : 'mrsUnbalancedHeading' : s.gap === 0 ? 'mrsReachedHeading' : 'mrsApproachingHeading');
    $('mrs-explanation-text').textContent = step === 1
      ? interpolate(compensated ? 'mrsBalancedText' : 'mrsUnbalancedText', { gain: f(s.addedUtility - s.baseUtility), sacrifice: f(s.sacrifice), level: f(s.baseUtility) })
      : t(s.gap === 0 ? 'mrsReachedText' : 'mrsApproachingText');
    $('mrs-formula').innerHTML = step === 1
      ? `U(A) = Ū &nbsp; → &nbsp; U(C) ≥ Ū &nbsp; → &nbsp; U(B) = Ū`
      : `MRS = MU₁ / MU₂ = (${f(ALPHA, 1)} / ${f(BETA, 1)}) · (x₂ / x₁)`;
    $('mrs-substitution-details').hidden = step === 1;
    $('mrs-substitution-label').textContent = step === 1 ? '' : t('mrsSubstitutionFormula');
    $('mrs-substitution').innerHTML = step === 1 ? ''
      : `MRS(A) = (${f(ALPHA, 1)} / ${f(BETA, 1)}) · (${f(s.yA)} / ${f(s.a, 1)}) ≈ <strong>${f(s.mrs)}</strong><br>MU₁(A) ≈ ${f(marginalUtility(1, s.a, s.yA))} &nbsp; · &nbsp; MU₂(A) ≈ ${f(marginalUtility(2, s.yA, s.a))}<br>${t('mrsSignedSlope')}: dx₂/dx₁ = −MRS ≈ ${f(s.slope)}`;
  }
  function curve(level, color, dash = 'solid') {
    const minX = Math.max(.1, (level / 10 ** BETA) ** (1 / ALPHA));
    const xs = Array.from({ length: 240 }, (_, i) => minX + (10 - minX) * i / 239);
    return { type: 'scatter', mode: 'lines', x: xs, y: xs.map(x => quantityOnIndifference(x, level)), line: { color, width: 3, dash, simplify: false }, hovertemplate: `x₁: %{x:.3f}<br>x₂: %{y:.3f}<br>U = ${f(level)}<extra></extra>` };
  }
  const line = (x, y, color, dash = 'solid', width = 2) => ({ type: 'scatter', mode: 'lines', x, y, line: { color, dash, width }, hoverinfo: 'skip' });
  const point = (x, y, text, color, hollow = false) => ({ type: 'scatter', mode: 'markers+text', x: [x], y: [y], text: [text], textposition: 'top right', marker: { color: hollow ? '#ffffff' : color, size: 10, line: { color, width: 2 } }, textfont: { color, size: 13 }, hovertemplate: 'x₁: %{x:.3f}<br>x₂: %{y:.3f}<extra></extra>' });
  async function draw(s) {
    const range = step === 1 ? { x: [0, 10], y: [0, 10] } : substitutionPlotRange(s.a);
    const traces = [curve(s.baseUtility, red)];
    if (step === 1) {
      if (s.gap > 0) traces.push(curve(s.addedUtility, blue, 'dot'));
      traces.push(line([s.a, s.b], [s.yA, s.yA], blue, 'solid', 3), line([s.b, s.b], [s.yA, s.yB], '#aaaaaa', 'dot'));
      traces.push(line([s.b, s.b], [s.yA, s.yCurrent], blue, 'solid', 4));
      traces.push(point(s.a, s.yA, 'A', red));
      if (s.gap > 0) {
        const compensation = Number($('mrs-compensation').value);
        if (compensation !== 0) traces.push(point(s.b, s.yA, 'C', blue, true));
        if (compensation !== 100) traces.push(point(s.b, s.yB, 'B', red, true));
        traces.push(point(s.b, s.yCurrent, compensation === 100 ? 'D = B' : compensation === 0 ? 'D = C' : 'D', compensation === 100 ? red : blue));
      }
    } else {
      traces.push(line(range.x, range.x.map(x => s.yA + s.slope * (x - s.a)), s.gap === 0 ? blue : grey, s.gap === 0 ? 'solid' : 'dash', 3));
      if (s.gap > 0) {
        traces.push(line(range.x, range.x.map(x => s.yA - s.average * (x - s.a)), blue, 'solid', 3));
        traces.push(line([s.a, s.b, s.b], [s.yA, s.yA, s.yB], grey, 'dot'));
        traces.push(point(s.b, s.yB, 'B', blue));
      }
      traces.push(point(s.a, s.yA, s.gap === 0 ? 'A = B' : 'A', red));
    }
    const annotations = s.gap === 0 ? [] : [
      { x: (s.a + s.b) / 2, y: s.yA, text: `Δx₁ = ${f(s.gap, 2)}`, yshift: 20, showarrow: false, bgcolor: '#ffffff', font: { size: 11, color: blue } },
      { x: s.b, y: (s.yA + s.yB) / 2, text: `−Δx₂ = ${f(s.sacrifice)}`, xshift: 12, xanchor: 'left', showarrow: false, bgcolor: '#ffffff', font: { size: 11, color: grey } }
    ];
    const axis = (title, values) => ({ title: { text: title, font: { size: 12 } }, range: values, fixedrange: true, gridcolor: '#e7e7e7', zerolinecolor: '#bbbbbb', nticks: 6, tickfont: { size: 11 } });
    await Plotly.react('mrs-plot', traces, {
      width: $('mrs-plot').clientWidth, margin: { l: 55, r: window.innerWidth < 760 ? 25 : 100, b: 55, t: 35 },
      paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', showlegend: false,
      font: { family: 'Segoe UI, Arial, sans-serif', color: grey }, separators: locale() === 'de' ? ',.' : '.,',
      xaxis: axis(t('good1'), range.x), yaxis: axis(t('good2'), range.y), annotations
    }, config);
  }
  async function render() {
    pending = true;
    if (busy || !active) return;
    busy = true;
    try { while (pending && active) { pending = false; const s = values(); labels(s); await draw(s); } }
    catch (error) { pause(); showError(error); }
    finally { busy = false; }
  }
  function pause() { running = false; if (frame !== null) cancelAnimationFrame(frame); frame = null; }
  async function selectStep(next) {
    pause(); step = next;
    for (const [id, number] of [['mrs-step-exchange', 1], ['mrs-step-limit', 2]]) {
      if (next === number) $(id).setAttribute('aria-current', 'step'); else $(id).removeAttribute('aria-current');
    }
    if (step === 2) $('mrs-compensation').value = '100';
    else { $('mrs-compensation').value = '0'; if (Number($('mrs-gap').value) === 0) $('mrs-gap').value = '3'; }
    await render();
  }
  function animate() {
    if (running) { pause(); render(); return; }
    const slider = $(step === 1 ? 'mrs-compensation' : 'mrs-gap');
    if (step === 1 && Number(slider.value) === 100) slider.value = '0';
    if (step === 2 && Number(slider.value) === 0) slider.value = '3';
    const startValue = Number(slider.value), start = performance.now(); running = true;
    const tick = now => {
      if (!running) return;
      const progress = Math.min(1, (now - start) / 5000);
      slider.value = step === 1 ? String(Math.round(startValue + (100 - startValue) * progress)) : progress === 1 ? '0' : Math.max(.01, startValue * (1 - progress) ** 2).toFixed(2);
      if (progress === 1) { running = false; frame = null; }
      render(); if (running) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  }
  return {
    async show() {
      active = true;
      if (!initialized) {
        initialized = true;
        for (const id of ['mrs-point', 'mrs-gap', 'mrs-compensation']) $(id).addEventListener('input', () => { pause(); if (step === 1 && id !== 'mrs-compensation') $('mrs-compensation').value = '0'; render(); });
        $('mrs-step-exchange').addEventListener('click', () => selectStep(1));
        $('mrs-step-limit').addEventListener('click', () => selectStep(2));
        $('mrs-next').addEventListener('click', () => selectStep(step === 1 ? 2 : 1));
        $('mrs-animate').addEventListener('click', animate);
        window.addEventListener('resize', render);
      }
      await render();
    },
    async translate() { pause(); if (initialized) await render(); },
    pause() { pause(); active = false; }
  };
}
