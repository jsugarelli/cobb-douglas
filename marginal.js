import { utility } from './math.js';
import { sectionUtility, slopeValues } from './marginal-math.js';

export function createMarginalSimulation({ t, locale, showError }) {
  const $ = id => document.getElementById(id);
  const red = '#DA002A', blue = '#4A7EBB', grey = '#555555';
  const config = { responsive: true, displayModeBar: false, scrollZoom: false };
  const camera = () => ({ eye: { x: 1.65, y: 1.85, z: 1.2 }, up: { x: 0, y: 0, z: 1 }, center: { x: 0, y: 0, z: -.08 } });
  const values = Array.from({ length: 181 }, (_, i) => 10 * i / 180);
  const mesh = Array.from({ length: 55 }, (_, i) => 10 * i / 54);
  const heights = mesh.map(y => mesh.map(x => utility(x, y)));
  let step = 1, initialized = false, active = false, frame = null, running = false;
  let busy = false, pending = false;
  const format = (value, digits = 3) => new Intl.NumberFormat(locale(), { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
  const variable = () => Number($('mu-variable').value);
  const fixed = () => Number($('mu-fixed').value);
  const symbol = () => variable() === 1 ? 'x₁' : 'x₂';
  const other = () => variable() === 1 ? 'x₂' : 'x₁';
  const exponent = () => variable() === 1 ? '0.7' : '0.3';
  const localExponent = value => locale() === 'de' ? value.replace('.', ',') : value;
  const sectionFormula = () => variable() === 1
    ? `U(x₁, x₂ = ${format(fixed(), 1)}) = x₁<sup>${localExponent('0.7')}</sup> · ${format(fixed(), 1)}<sup>${localExponent('0.3')}</sup>`
    : `U(x₁ = ${format(fixed(), 1)}, x₂) = ${format(fixed(), 1)}<sup>${localExponent('0.7')}</sup> · x₂<sup>${localExponent('0.3')}</sup>`;
  const xyAxis = title => ({ title: { text: title, font: { size: 12 } }, range: [0, 10], dtick: 2, gridcolor: '#e7e7e7', zerolinecolor: '#bbbbbb', fixedrange: true, tickfont: { size: 11 } });
  const baseLayout = () => ({ margin: { l: 55, r: 25, b: 55, t: 25 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', showlegend: false, font: { family: 'Segoe UI, Arial, sans-serif', color: grey }, separators: locale() === 'de' ? ',.' : '.,', xaxis: xyAxis(t(variable() === 1 ? 'good1' : 'good2')), yaxis: xyAxis(t('utility')) });
  function curveTrace(color = red) {
    return { type: 'scatter', mode: 'lines', x: values, y: values.map(x => sectionUtility(variable(), x, fixed())), line: { color, width: 3 }, hovertemplate: `${symbol()}: %{x:.2f}<br>U: %{y:.3f}<extra></extra>` };
  }
  function sliceTraces() {
    const q = fixed(), isOne = variable() === 1;
    return [
      { type: 'surface', x: mesh, y: mesh, z: heights, colorscale: [[0, blue], [1, blue]], showscale: false, opacity: .8, hoverinfo: 'skip', lighting: { ambient: .8, diffuse: .65 } },
      { type: 'surface', x: isOne ? [[0, 10], [0, 10]] : [[q, q], [q, q]], y: isOne ? [[q, q], [q, q]] : [[0, 10], [0, 10]], z: [[0, 0], [10, 10]], colorscale: [[0, grey], [1, grey]], opacity: .2, showscale: false, hoverinfo: 'skip' },
      { type: 'scatter3d', mode: 'lines', x: isOne ? values : values.map(() => q), y: isOne ? values.map(() => q) : values, z: values.map(x => sectionUtility(variable(), x, q)), line: { color: red, width: 8 }, hovertemplate: 'x₁: %{x:.2f}<br>x₂: %{y:.2f}<br>U: %{z:.3f}<extra></extra>' }
    ];
  }
  function updateLabels() {
    $('mu-fixed-label').textContent = `${t('muFixed')} · ${other()}`;
    $('mu-fixed-value').textContent = format(fixed(), 1);
    $('mu-fixed').setAttribute('aria-valuetext', format(fixed(), 1));
    $('mu-section-formula').innerHTML = sectionFormula();
    $('mu-slope-context').innerHTML = sectionFormula();
    $('mu-point-label').textContent = `${t('muPoint')} · ${symbol()}`;
    $('mu-animate').textContent = t(running ? 'muPause' : Number($('mu-gap').value) === 0 ? 'muReplay' : 'muAnimate');
  }
  async function drawSlice() {
    const layout = baseLayout();
    const sceneAxis = title => ({ ...xyAxis(title), showbackground: true, backgroundcolor: '#fafafa' });
    await Promise.all([
      Plotly.react('mu-surface-plot', sliceTraces(), {
        ...layout, width: $('mu-surface-plot').clientWidth, margin: { l: 0, r: 0, t: 0, b: 0 }, uirevision: 'mu-camera',
        scene: { xaxis: sceneAxis(t('good1')), yaxis: sceneAxis(t('good2')), zaxis: sceneAxis(t('utility')), aspectmode: 'cube', dragmode: 'turntable', camera: camera() }
      }, { ...config, scrollZoom: true }),
      Plotly.react('mu-section-plot', [curveTrace()], { ...layout, width: $('mu-section-plot').clientWidth, uirevision: 'mu-section' }, config)
    ]);
  }
  async function drawSlope() {
    const s = slopeValues(variable(), Number($('mu-point').value), Number($('mu-gap').value), fixed());
    const tangent = s.gap === 0;
    $('mu-point-value').textContent = format(s.a, 1);
    $('mu-point').setAttribute('aria-valuetext', format(s.a, 1));
    $('mu-gap-value').textContent = format(s.gap, 2);
    $('mu-gap').setAttribute('aria-valuetext', format(s.gap, 2));
    $('mu-dx').textContent = format(s.gap);
    $('mu-du').textContent = format(s.rise);
    $('mu-secant-value').textContent = tangent ? '—' : format(s.secant);
    $('mu-derivative-value').textContent = format(s.derivative);
    $('mu-derivative-symbol').textContent = `MU${variable() === 1 ? '₁' : '₂'} = ∂U / ∂${symbol()}`;
    $('mu-a-values').textContent = `A: ${symbol()} = ${format(s.a, 2)} · U = ${format(s.ua)}`;
    $('mu-b-values').textContent = tangent ? t('muMerged') : `B: ${symbol()} = ${format(s.b, 2)} · U = ${format(s.ub)}`;
    $('mu-limit-heading').textContent = t(tangent ? 'muReached' : 'muApproaching');
    $('mu-limit-text').textContent = tangent ? t('muReachedText').replace('{slope}', format(s.derivative)) : t('muApproachingText');
    $('mu-limit-box').classList.toggle('reached', tangent);
    const exp = localExponent(exponent()), neg = localExponent(variable() === 1 ? '-0.3' : '-0.7');
    const otherExp = localExponent(variable() === 1 ? '0.3' : '0.7');
    $('mu-derivative-formula').innerHTML = `MU${variable() === 1 ? '₁' : '₂'} = ∂U/∂${symbol()} = ${exp} · ${symbol()}<sup>${neg}</sup> · ${other()}<sup>${otherExp}</sup> = ${format(s.derivative)}`;
    const lineX = [Math.max(0, s.a - 1.8), Math.min(10, Math.max(s.a + 2.3, s.b + .5))];
    const traces = [curveTrace(blue),
      { type: 'scatter', mode: 'lines', x: lineX, y: lineX.map(x => s.ua + s.derivative * (x - s.a)), line: { color: tangent ? red : grey, width: tangent ? 3 : 2, dash: tangent ? 'solid' : 'dash' }, hoverinfo: 'skip' },
      { type: 'scatter', mode: 'lines', x: tangent ? [] : lineX, y: tangent ? [] : lineX.map(x => s.ua + s.secant * (x - s.a)), line: { color: red, width: 3 }, hoverinfo: 'skip' },
      { type: 'scatter', mode: 'lines', x: tangent ? [] : [s.a, s.b, s.b], y: tangent ? [] : [s.ua, s.ua, s.ub], line: { color: '#777777', width: 2, dash: 'dot' }, fill: 'toself', fillcolor: 'rgba(218,0,42,0.07)', hoverinfo: 'skip' },
      { type: 'scatter', mode: 'markers+text', x: tangent ? [s.a] : [s.a, s.b], y: tangent ? [s.ua] : [s.ua, s.ub], text: tangent ? ['A = B'] : ['A', 'B'], textposition: ['top left', 'top right'], textfont: { color: red, size: 13 }, marker: { color: red, size: 9, line: { color: '#ffffff', width: 1 } }, hovertemplate: `${symbol()}: %{x:.3f}<br>U: %{y:.3f}<extra></extra>` }
    ];
    const annotations = tangent ? [] : [
      { x: (s.a + s.b) / 2, y: s.ua, text: `Δ${symbol()} = ${format(s.gap, 2)}`, yshift: -22, showarrow: false, font: { size: 11, color: grey }, bgcolor: '#ffffff' },
      { x: s.b, y: (s.ua + s.ub) / 2, text: `ΔU = ${format(s.rise)}`, xanchor: 'left', xshift: 12, showarrow: false, font: { size: 11, color: grey }, bgcolor: '#ffffff' }
    ];
    await Plotly.react('mu-slope-plot', traces, { ...baseLayout(), width: $('mu-slope-plot').clientWidth, margin: { l: 55, r: window.innerWidth < 760 ? 25 : 100, t: 30, b: 60 }, annotations }, config);
  }
  async function render() {
    pending = true;
    if (busy || !active) return;
    busy = true;
    try {
      while (pending && active) {
        pending = false;
        updateLabels();
        if (step === 1) await drawSlice(); else await drawSlope();
      }
    } catch (error) { pause(); showError(error); }
    finally { busy = false; }
  }
  function pause() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null; running = false;
    updateLabels();
  }
  async function selectStep(value) {
    pause(); step = value;
    $('mu-slice-panel').hidden = value !== 1;
    $('mu-slope-panel').hidden = value !== 2;
    for (const [id, n] of [['mu-step-slice', 1], ['mu-step-slope', 2]]) {
      if (n === value) $(id).setAttribute('aria-current', 'step'); else $(id).removeAttribute('aria-current');
    }
    await render();
  }
  function animate() {
    if (running) { pause(); return; }
    let startGap = Number($('mu-gap').value);
    if (startGap === 0) { startGap = 3; $('mu-gap').value = '3'; }
    running = true; updateLabels();
    const start = performance.now();
    const tick = now => {
      if (!running) return;
      const fraction = Math.min(1, (now - start) / 5500);
      $('mu-gap').value = fraction === 1 ? '0' : Math.max(.01, startGap * (1 - fraction) ** 2).toFixed(2);
      if (fraction === 1) { running = false; frame = null; }
      render();
      if (running) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  }
  return {
    async show() {
      active = true;
      if (!initialized) {
        initialized = true;
        window.addEventListener('resize', render);
        $('mu-variable').addEventListener('change', () => { pause(); render(); });
        $('mu-fixed').addEventListener('input', render);
        for (const id of ['mu-point', 'mu-gap']) $(id).addEventListener('input', () => { pause(); render(); });
        $('mu-step-slice').addEventListener('click', () => selectStep(1));
        $('mu-step-slope').addEventListener('click', () => selectStep(2));
        $('mu-next').addEventListener('click', () => selectStep(2));
        $('mu-back').addEventListener('click', () => selectStep(1));
        $('mu-animate').addEventListener('click', animate);
        $('mu-reset').addEventListener('click', () => Plotly.relayout('mu-surface-plot', { 'scene.camera': camera() }).catch(showError));
      }
      await render();
    },
    async translate() { if (initialized) { pause(); await render(); } },
    pause() { pause(); active = false; }
  };
}
