import { utility, indifferenceCurve, MAX_QUANTITY, ALPHA, BETA } from './math.js';
import { levelCamera, rotateCamera } from './camera.js';
import { createMarginalSimulation } from './marginal.js';
import { createSubstitutionSimulation } from './substitution.js';

const $ = id => document.getElementById(id);
const slider = $('utility-level');
const transparency = $('transparency');
const languageSelect = $('language');
const colors = { cut: '#DA002A', projection: '#454545', text: '#555555', grid: '#e3e3e3' };
const initialCamera = { eye: { x: 1.65, y: 1.85, z: 1.2 }, center: { x: 0, y: 0, z: -0.08 }, up: { x: 0, y: 0, z: 1 } };
const config = { responsive: true, displayModeBar: false, scrollZoom: true, showTips: false };
let dictionary, lang = 'de', ready = false;
let rendering = false, pending = false;
let marginalSimulation;
let substitutionSimulation;
const simulationTitle = () => ({ indifference: 'simulationIndifference', marginal: 'simulationMarginal', substitution: 'simulationSubstitution' }[$('simulation').value]);
const t = key => dictionary[lang][key] ?? dictionary.de[key] ?? key;
const number = value => new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
const cloneCamera = () => structuredClone(initialCamera);

function axis(title) {
  return { title: { text: title, font: { size: 11 } }, range: [0, MAX_QUANTITY], tickvals: [0, 2, 4, 6, 8, 10], tickfont: { size: 10 }, gridcolor: colors.grid, zerolinecolor: colors.grid, showbackground: true, backgroundcolor: '#fafafa' };
}
function surfaceLayout() {
  return {
    margin: { l: 0, r: 0, b: 0, t: 5 }, paper_bgcolor: 'rgba(0,0,0,0)',
    font: { family: 'Segoe UI, Arial, sans-serif', color: colors.text }, showlegend: false,
    uirevision: 'keep-camera', separators: lang === 'de' ? ',.' : '.,',
    scene: { xaxis: axis(t('good1')), yaxis: axis(t('good2')), zaxis: axis(t('utility')), aspectmode: 'cube', camera: cloneCamera(), dragmode: 'turntable' }
  };
}
function projectionLayout() {
  return { margin: { l: 45, r: 12, t: 18, b: 43 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', showlegend: false,
    font: { family: 'Segoe UI, Arial, sans-serif', color: colors.text, size: 10 }, separators: lang === 'de' ? ',.' : '.,',
    xaxis: { ...axis(t('good1')), fixedrange: true, constrain: 'domain' },
    yaxis: { ...axis(t('good2')), fixedrange: true, scaleanchor: 'x', scaleratio: 1, constrain: 'domain' }
  };
}
function movingTraces(level) {
  const { x, y } = indifferenceCurve(level);
  const guideX = [], guideY = [], guideZ = [];
  for (let i = 0; i < 7; i++) {
    const j = Math.round(i * (x.length - 1) / 6);
    guideX.push(x[j], x[j], null); guideY.push(y[j], y[j], null); guideZ.push(0, level, null);
  }
  const hover = `x₁: %{x:.2f}<br>x₂: %{y:.2f}<br>U = ${number(level)}<extra></extra>`;
  return [
    { type: 'surface', x: [0, 10], y: [0, 10], z: [[level, level], [level, level]], opacity: .13, colorscale: [[0, colors.cut], [1, colors.cut]], showscale: false, hoverinfo: 'skip' },
    { type: 'scatter3d', mode: 'lines', x: guideX, y: guideY, z: guideZ, line: { color: '#999999', width: 3, dash: 'dot' }, hoverinfo: 'skip' },
    { type: 'scatter3d', mode: 'lines', x, y, z: x.map(() => level), line: { color: colors.cut, width: 8 }, hovertemplate: hover },
    { type: 'scatter3d', mode: 'lines', x, y, z: x.map(() => 0), line: { color: colors.projection, width: 7 }, hovertemplate: hover }
  ];
}
function projectionTrace(level) {
  const { x, y } = indifferenceCurve(level);
  return { type: 'scatter', mode: 'lines', x, y, line: { color: colors.projection, width: 3 }, hovertemplate: `x₁: %{x:.2f}<br>x₂: %{y:.2f}<br>U = ${number(level)}<extra></extra>` };
}
function updateText() {
  const level = Number(slider.value);
  $('level-value').textContent = number(level);
  slider.setAttribute('aria-valuetext', number(level));
  $('insight-text').textContent = t('insight').replace('{level}', number(level));
  const percent = new Intl.NumberFormat(lang, { style: 'percent' }).format(Number(transparency.value) / 100);
  $('transparency-value').textContent = percent;
  transparency.setAttribute('aria-valuetext', percent);
}
async function renderLevel() {
  updateText();
  pending = true;
  if (!ready || rendering) return;
  rendering = true;
  slider.setAttribute('aria-busy', 'true');
  try {
    while (pending) {
      pending = false;
      const level = Number(slider.value);
      const traces = movingTraces(level);
      await Plotly.restyle('surface-plot', { opacity: 1 - Number(transparency.value) / 100 }, [0]);
      await Promise.all([
        Plotly.restyle('surface-plot', {
          x: traces.map(trace => trace.x), y: traces.map(trace => trace.y), z: traces.map(trace => trace.z),
          hovertemplate: traces.map(trace => trace.hovertemplate ?? null)
        }, [1, 2, 3, 4]),
        Plotly.restyle('projection-plot', { x: [traces[2].x], y: [traces[2].y], hovertemplate: [projectionTrace(level).hovertemplate] }, [0])
      ]);
    }
  } catch (error) { showError(error); }
  finally { rendering = false; slider.removeAttribute('aria-busy'); }
}
async function setLanguage(value) {
  lang = value;
  languageSelect.value = lang;
  document.documentElement.lang = lang;
  document.title = t(simulationTitle());
  document.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = t(element.dataset.i18n); });
  $('simulation-title').textContent = t(simulationTitle());
  if (marginalSimulation) await marginalSimulation.translate();
  if (substitutionSimulation) await substitutionSimulation.translate();
  languageSelect.setAttribute('aria-label', t('language'));
  document.querySelectorAll('[data-i18n-label]').forEach(element => {
    element.setAttribute('aria-label', t(element.dataset.i18nLabel));
    element.title = t(element.dataset.i18nLabel);
  });
  $('surface-plot').setAttribute('aria-label', t('surfaceAria'));
  $('projection-plot').setAttribute('aria-label', t('projectionAria'));
  $('min-value').textContent = number(Number(slider.min));
  $('max-value').textContent = number(Number(slider.max));
  $('utility-function-formula').innerHTML = `U(x₁, x₂) = x₁<sup>${number(ALPHA)}</sup> · x₂<sup>${number(BETA)}</sup>`;
  document.querySelector('.formula').innerHTML = `x₂ = (Ū / x₁<sup>${number(ALPHA)}</sup>)<sup>1 / ${number(BETA)}</sup>`;
  updateText();
  try { localStorage.setItem('cobb-douglas-language', lang); } catch { /* Optional preference storage. */ }
  if (ready) {
    await Promise.all([
      Plotly.relayout('surface-plot', { 'scene.xaxis.title.text': t('good1'), 'scene.yaxis.title.text': t('good2'), 'scene.zaxis.title.text': t('utility'), separators: lang === 'de' ? ',.' : '.,' }),
      Plotly.relayout('projection-plot', { 'xaxis.title.text': t('good1'), 'yaxis.title.text': t('good2'), separators: lang === 'de' ? ',.' : '.,' })
    ]);
    await renderLevel();
  }
}
function showError(error) {
  console.error(error);
  $('error').hidden = false;
  $('error').textContent = dictionary ? t('error') : 'Laden fehlgeschlagen / Loading failed. Bitte über einen Webserver öffnen / Please open using a web server (README.md).';
}
async function init() {
  slider.disabled = true;
  transparency.disabled = true;
  document.querySelectorAll('.camera-controls button').forEach(button => { button.disabled = true; });
  const response = await fetch('./translations.json');
  if (!response.ok) throw new Error(`Translations: ${response.status}`);
  dictionary = await response.json();
  let preferred = navigator.language.slice(0, 2);
  try { preferred = localStorage.getItem('cobb-douglas-language') || preferred; } catch { /* Optional preference storage. */ }
  await setLanguage(Object.hasOwn(dictionary, preferred) ? preferred : 'de');
  if (!window.Plotly) throw new Error('Plotly not loaded');
  const values = Array.from({ length: 65 }, (_, i) => MAX_QUANTITY * i / 64);
  const surface = { type: 'surface', x: values, y: values, z: values.map(y => values.map(x => utility(x, y))), opacity: 1 - Number(transparency.value) / 100,
    colorscale: [[0, '#4A7EBB'], [1, '#4A7EBB']], showscale: false,
    lighting: { ambient: .8, diffuse: .65, roughness: .9 },
    hovertemplate: 'x₁: %{x:.2f}<br>x₂: %{y:.2f}<br>U: %{z:.2f}<extra></extra>' };
  await Promise.all([
    Plotly.newPlot('surface-plot', [surface, ...movingTraces(Number(slider.value))], surfaceLayout(), config),
    Plotly.newPlot('projection-plot', [projectionTrace(Number(slider.value))], projectionLayout(), { ...config, scrollZoom: false, staticPlot: false })
  ]);
  ready = true;
  marginalSimulation = createMarginalSimulation({ t, locale: () => lang, showError });
  substitutionSimulation = createSubstitutionSimulation({ t, locale: () => lang, showError });
  async function selectSimulation() {
    const selected = $('simulation').value;
    const isMarginal = selected === 'marginal';
    const isSubstitution = selected === 'substitution';
    $('indifference-view').hidden = selected !== 'indifference';
    $('marginal-view').hidden = !isMarginal;
    $('substitution-view').hidden = !isSubstitution;
    $('simulation-title').textContent = t(simulationTitle());
    document.title = `${t(simulationTitle())} · ${t('eyebrow')}`;
    history.replaceState(null, '', isMarginal ? '#marginal-utility' : isSubstitution ? '#substitution' : '#indifference');
    if (!isMarginal) marginalSimulation.pause();
    if (!isSubstitution) substitutionSimulation.pause();
    if (isMarginal) await marginalSimulation.show();
    else if (isSubstitution) await substitutionSimulation.show();
    else await Promise.all([Plotly.Plots.resize('surface-plot'), Plotly.Plots.resize('projection-plot')]);
  }
  $('simulation').addEventListener('change', () => selectSimulation().catch(showError));
  if (location.hash === '#marginal-utility') { $('simulation').value = 'marginal'; await selectSimulation(); }
  if (location.hash === '#substitution') { $('simulation').value = 'substitution'; await selectSimulation(); }
  slider.disabled = false;
  transparency.disabled = false;
  document.querySelectorAll('.camera-controls button').forEach(button => { button.disabled = false; });
  slider.addEventListener('input', renderLevel);
  transparency.addEventListener('input', renderLevel);
  languageSelect.addEventListener('change', () => setLanguage(languageSelect.value).catch(showError));
  $('reset-view').addEventListener('click', () => Plotly.relayout('surface-plot', { 'scene.camera': cloneCamera() }).catch(showError));
  const currentCamera = () => structuredClone($('surface-plot').layout.scene.camera);
  const moveCamera = transform => Plotly.relayout('surface-plot', { 'scene.camera': transform(currentCamera()) }).catch(showError);
  $('level-view').addEventListener('click', () => moveCamera(levelCamera));
  $('rotate-left').addEventListener('click', () => moveCamera(camera => rotateCamera(camera, -Math.PI / 12)));
  $('rotate-right').addEventListener('click', () => moveCamera(camera => rotateCamera(camera, Math.PI / 12)));
}
init().catch(showError);
