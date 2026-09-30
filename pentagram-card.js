/* Powerflow Pentagram — native Home Assistant Lovelace card.
 * Vanilla custom element, no build step, no dependencies.
 * Data comes from Home Assistant itself via the `hass` property
 * (no tokens, no sockets). Visual engine ported from pp.html. */

const TAG = 'pentagram-card';

/* Entity roles: flat config keys. Values are entity IDs from the user's HA. */
const ROLE_DEFS = [
  { key: 'solar', label: 'Solar — array power (W)', domain: ['sensor'], required: true },
  { key: 'batSoc', label: 'Battery — charge %', domain: ['sensor'], required: true },
  { key: 'batKwh', label: 'Battery — stored energy (kWh)', domain: ['sensor'] },
  { key: 'batChargeW', label: 'Battery — charge power (W)', domain: ['sensor'] },
  { key: 's2b', label: 'Flow — solar to battery (W)', domain: ['sensor'] },
  { key: 's2h', label: 'Flow — solar to house (W)', domain: ['sensor'] },
  { key: 's2g', label: 'Flow — solar to grid / export (W)', domain: ['sensor'] },
  { key: 'b2h', label: 'Flow — battery to house (W)', domain: ['sensor'] },
  { key: 'b2g', label: 'Flow — battery to grid (W)', domain: ['sensor'] },
  { key: 'gridImp', label: 'Grid — import power (W)', domain: ['sensor'], required: true },
  { key: 'carSoc', label: 'Car — battery %', domain: ['sensor'] },
  { key: 'carCharging', label: 'Car — charging binary', domain: ['binary_sensor'] },
  { key: 'carCharger', label: 'Car — plugged-in binary', domain: ['binary_sensor'] },
  { key: 'carChargerPower', label: 'Car — charger power (kW)', domain: ['sensor'] },
  { key: 'carInTemp', label: 'Car — cabin temperature', domain: ['sensor'] },
  { key: 'carRange', label: 'Car — range', domain: ['sensor'] },
  { key: 'houseTemp', label: 'House — indoor temperature', domain: ['sensor'] },
  { key: 'houseHum', label: 'House — indoor humidity', domain: ['sensor'] },
  { key: 'houseOutTemp', label: 'House — outdoor temperature', domain: ['sensor'] },
  { key: 'poolTemp', label: 'House — pool temperature', domain: ['sensor'] },
  { key: 'dhwTemp', label: 'House — hot-water tank temperature', domain: ['sensor'] },
  { key: 'exportEnergyToday', label: 'Finance — exported energy today (kWh)', domain: ['sensor'] },
  { key: 'exportRate', label: 'Finance — export rate (£/kWh)', domain: ['sensor', 'number', 'input_number'] },
  { key: 'currentRate', label: 'Finance — import rate (£/kWh)', domain: ['sensor', 'number', 'input_number'] },
  { key: 'importCost', label: 'Finance — import cost today (£)', domain: ['sensor'] },
  { key: 'carShiftState', label: 'Car — shift state (P/D/R)', domain: ['sensor'] },
];

/* css */
const CSS = `
:host{
  --void:#070510; --panel:#0d0a1c; --gold:#d8b45a;
  --ink:#e8e2d5; --ink-bright:#fff9e8; --dim:#a89a7e; --faint:#6f6486;
  --good:#3dff9e; --bad:#ff3b5c; --med:#ffb000; --idle:#4a4066; --violet:#8b5cf6;
  display:block; font-family:'Rajdhani',system-ui,sans-serif; color:var(--ink);
}
.pp-canvaswrap{
  position:relative; background:linear-gradient(180deg, rgba(16,10,32,.92), rgba(7,5,16,.96));
  border:1px solid var(--faint); border-radius:10px;
  box-shadow:inset 0 0 80px rgba(0,0,0,.6), 0 0 26px rgba(139,92,246,.14);
  padding:10px;
}
.pp-canvas{position:relative;width:100%;aspect-ratio:1100/720}
.pp-canvas svg#starsvg{position:absolute;inset:0;width:100%;height:100%}
.fp{fill:none;stroke-linecap:round;transition:stroke .4s, opacity .4s}
.fp.idle{stroke:var(--ley-idle,#4a4066);stroke-width:1.5;opacity:.55;animation:breathe 4.5s ease-in-out infinite}
@keyframes breathe{0%,100%{opacity:.32}50%{opacity:.62}}
.fp.active{stroke-width:8;opacity:1;animation:flameFlick 1s ease-in-out infinite}
@keyframes flameFlick{0%,100%{opacity:1}50%{opacity:.8}}
.fp-aura{fill:none;stroke-width:14;stroke-linecap:round;opacity:0;filter:url(#blurFlame);transition:opacity .4s}
.fp-aura.on{opacity:.2}
.fp-core{fill:none;stroke:#fff8e6;stroke-width:2;stroke-linecap:round;opacity:0}
.fp-core.on{opacity:.95;animation:flick .9s ease-in-out infinite}
@keyframes flick{0%,100%{opacity:.9}50%{opacity:.5}}
.orb{opacity:0;filter:drop-shadow(0 0 6px currentColor)}
.deco{fill:none;stroke:var(--ley-idle,#6f6486);opacity:.5;animation:breathe 4.5s ease-in-out infinite}
.deco.spin{animation:spin 140s linear infinite, breathe 4.5s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.deco.spinr{animation:spinr 200s linear infinite, breathe 4.5s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes spinr{to{transform:rotate(-360deg)}}
@media (prefers-reduced-motion: reduce){
  .fp.active,.fp-core.on,.fp.idle,.deco.spin,.deco.spinr,.deco{animation:none !important}
}
.node{
  position:absolute;transform:translate(-50%,-50%);width:210px;
  background:linear-gradient(135deg, rgba(24,15,46,.97), rgba(9,6,20,.98));
  border:1.5px solid var(--faint);border-radius:10px;padding:12px 12px 10px;text-align:center;
  box-shadow:0 0 18px rgba(0,0,0,.6), inset 0 0 18px rgba(0,0,0,.5), inset 0 0 0 1px rgba(216,180,90,.38);z-index:3;
}
.node::before,.node::after{
  position:absolute;left:50%;transform:translateX(-50%);line-height:1;
  color:var(--gold);text-shadow:0 0 8px var(--gold);z-index:4;pointer-events:none;
}
.node::before{content:'◆';top:-9px;font-size:11px}
.node::after{content:'◆';bottom:-9px;font-size:8px;opacity:.8}
.node .n-icon{font-size:15px}
.node .n-title{font-family:'Cinzel',serif;font-size:11px;letter-spacing:2px;color:var(--ink-bright);margin:2px 0 4px;line-height:1.5}
.node .n-val{font-family:'Share Tech Mono',monospace;font-size:30px;line-height:1.1;text-shadow:0 0 12px currentColor}
.node .n-val small{font-size:13px;opacity:.75}
.node .n-sub{font-family:'Share Tech Mono',monospace;font-size:10.5px;color:var(--dim);margin-top:3px;line-height:1.6}
.node .n-sub b{color:var(--ink);font-weight:400}
#nd-solar .n-val,#nd-solar .n-icon{color:var(--gold)}
#nd-solar{border-color:var(--gold);box-shadow:0 0 20px rgba(216,180,90,.25), inset 0 0 18px rgba(0,0,0,.5), inset 0 0 0 1px rgba(216,180,90,.38)}
#nd-battery .n-val,#nd-battery .n-icon{color:var(--med)}
#nd-battery{border-color:var(--med)}
#nd-grid .n-val,#nd-grid .n-icon{color:var(--bad)}
#nd-grid.exp .n-val,#nd-grid.exp .n-icon{color:var(--good)}
#nd-house .n-val,#nd-house .n-icon{color:#ff8a3c}
#nd-house{border-color:#ff8a3c}
#nd-car .n-val,#nd-car .n-icon{color:#00ddff}
#nd-car{border-color:#00ddff}
.badges{display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-top:7px}
.badge{font-family:'Share Tech Mono',monospace;font-size:8.5px;letter-spacing:1px;padding:3px 7px;
  border:1px solid #4a4066;background:#000;color:#6e6484;border-radius:3px;opacity:.55}
.badge.on{opacity:1;color:#fff;border-color:currentColor;box-shadow:0 0 8px currentColor}
.sigil{
  position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:3;
  width:168px;height:168px;border-radius:50%;
  background:radial-gradient(circle, #171029 0%, #0a0616 70%);
  border:2px solid var(--gold);
  outline:1px solid rgba(216,180,90,.55);outline-offset:6px;
  box-shadow:0 0 30px rgba(216,180,90,.3), inset 0 0 30px rgba(139,92,246,.25);
  display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:2px;
}
.sigil .s-top{font-family:'Cinzel',serif;font-size:9px;letter-spacing:2px;color:var(--dim)}
.sigil .s-val{font-family:'Share Tech Mono',monospace;font-size:30px;text-shadow:0 0 14px currentColor}
.sigil .s-val small{font-size:12px}
.sigil .s-mid{font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--dim)}
.sigil .s-veil{font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:1px;margin-top:3px}
.pp-fin{display:flex;gap:14px;flex-wrap:wrap;margin-top:10px;
  font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--dim);
  border:1px solid rgba(139,92,246,.35);background:rgba(10,6,24,.6);border-radius:8px;padding:8px 14px}
.pp-fin b{font-weight:400;color:var(--ink)}
.pp-err{padding:16px;font-family:monospace;color:var(--bad)}
`;

/* html */
const TEMPLATE = `
<div class="pp-canvaswrap">
  <div class="pp-canvas">
    <svg id="starsvg" viewBox="0 0 1100 720" preserveAspectRatio="none">
      <defs>
        <filter id="blurFlame" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5"/>
        </filter>
        <filter id="flameWobble" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="2" seed="7" result="n">
            <animate attributeName="baseFrequency" values="0.012 0.03;0.017 0.022;0.011 0.034;0.012 0.03" dur="1.3s" repeatCount="indefinite"/>
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="12" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>
      <g class="deco spin">
        <circle cx="550" cy="360" r="305" stroke-width="1.5" stroke-dasharray="4 10" class="deco"/>
        <circle cx="550" cy="360" r="298" stroke-width="1" class="deco"/>
      </g>
      <g class="deco spinr">
        <circle cx="550" cy="360" r="205" stroke-width="1" stroke-dasharray="2 8" class="deco"/>
      </g>
      <circle cx="550" cy="360" r="305" stroke-width="1" class="deco"/>
      <path id="fp-house-car" class="fp idle" d="M397,562 L703,562"/>
      <path id="fp-sol-bat" class="fp idle" d="M550,110 L303,283"/>
      <path id="fp-sol-grid" class="fp idle" d="M550,110 L797,283"/>
      <path id="fp-sol-house" class="fp idle" d="M550,110 L397,562"/>
      <path id="fp-sol-car" class="fp idle" d="M550,110 L703,562"/>
      <path id="fp-bat-grid" class="fp idle" d="M303,283 L797,283"/>
      <path id="fp-bat-house" class="fp idle" d="M303,283 L397,562"/>
      <path id="fp-bat-car" class="fp idle" d="M303,283 L703,562"/>
      <path id="fp-grid-house" class="fp idle" d="M797,283 L397,562"/>
      <path id="fp-grid-car" class="fp idle" d="M797,283 L703,562"/>
    </svg>
    <div class="node" id="nd-solar" style="left:50%;top:15.3%">
      <div class="n-icon">☉</div><div class="n-title">THE SUN HARVESTER</div>
      <div class="n-val"><span id="solarW">--</span><small> W</small></div>
      <div class="n-sub">EFF <b id="solarEff">--%</b></div>
      <div class="badges">
        <span class="badge" id="solarGen" style="color:var(--gold)">GENERATING</span>
        <span class="badge" id="solarIdle" style="color:var(--gold)">IDLE</span>
      </div>
    </div>
    <div class="node" id="nd-battery" style="left:27.5%;top:39.3%">
      <div class="n-icon">⬡</div><div class="n-title">THE GREAT RESERVOIR</div>
      <div class="n-val"><span id="batPct">--</span><small>%</small></div>
      <div class="n-sub"><span id="batKwh">--</span> kWh · <span id="batPower">--</span> W</div>
      <div class="badges">
        <span class="badge" id="batCharge" style="color:var(--med)">CHARGING</span>
        <span class="badge" id="batDischarge" style="color:var(--med)">DISCHARGING</span>
        <span class="badge" id="batIdle" style="color:var(--med)">IDLE</span>
      </div>
    </div>
    <div class="node" id="nd-grid" style="left:72.5%;top:39.3%">
      <div class="n-icon">⚡</div><div class="n-title">THE ETERNAL CURRENT</div>
      <div class="n-val"><span id="gridW">--</span><small> W</small></div>
      <div class="n-sub"><span id="gridDir">--</span> · <span id="gridRate">--p</span></div>
      <div class="badges">
        <span class="badge" id="gridImport" style="color:var(--bad)">IMPORT</span>
        <span class="badge" id="gridExport" style="color:var(--good)">EXPORT</span>
      </div>
    </div>
    <div class="node" id="nd-house" style="left:36.1%;top:78.1%">
      <div class="n-icon">▣</div><div class="n-title">THE INNER SANCTUM</div>
      <div class="n-val"><span id="houseW">--</span><small> W</small></div>
      <div class="n-sub">IN <span id="houseTemp">--</span> · <span id="houseHum">--</span> · OUT <span id="houseOutTemp">--</span></div>
      <div class="n-sub">POOL <span id="poolTemp">--</span> · DHW <span id="dhwTemp">--</span></div>
      <div class="badges">
        <span class="badge" id="houseCons" style="color:#ff8a3c">CONSUMING</span>
        <span class="badge" id="houseIdle" style="color:#ff8a3c">IDLE</span>
      </div>
    </div>
    <div class="node" id="nd-car" style="left:63.9%;top:78.1%">
      <div class="n-icon">◈</div><div class="n-title">THE CHARIOT</div>
      <div class="n-val"><span id="carSoc">--</span><small>%</small></div>
      <div class="n-sub"><span id="carState">--</span> · CABIN <span id="carInTemp">--</span></div>
      <div class="n-sub">RANGE <span id="carRange">--</span></div>
      <div class="badges">
        <span class="badge" id="carCharge" style="color:#00ddff">CHARGING</span>
        <span class="badge" id="carPlugged" style="color:#00ddff">PLUGGED</span>
      </div>
    </div>
    <div class="sigil" id="sigil">
      <div class="s-top">RITUAL BALANCE</div>
      <div class="s-val" id="sigilVal">--</div>
      <div class="s-mid">AUTONOMY <span id="sigilAuto">--</span></div>
      <div class="s-veil" id="sigilVeil">--</div>
    </div>
  </div>
</div>
<div class="pp-fin" id="finStrip" style="display:none">
  <span>SACRIFICES <b id="finImp">--</b></span>
  <span>GIFTS <b id="finExp">--</b></span>
  <span>BALANCE <b id="finBal">--</b></span>
  <span>TRIBUTE <b id="rateCur">--</b></span>
  <span>BOUNTY <b id="rateExp">--</b></span>
</div>
`;

const ROUTES = ['sol-bat', 'sol-grid', 'sol-house', 'sol-car', 'bat-grid', 'bat-house', 'bat-car', 'grid-house', 'grid-car'];
const SVGNS = 'http://www.w3.org/2000/svg';
const GC = '#3dff9e', BC = '#ff3b5c', MC = '#ffb000';

const fmtT = (v) => { const n = Number(v); return isNaN(n) ? '--' : n.toFixed(1) + '°C'; };
const fmtM = (v) => { const n = Number(v); return isNaN(n) ? '--' : '£' + n.toFixed(2); };

function loadFontsOnce() {
  if (document.getElementById('pentagram-fonts')) return;
  const link = document.createElement('link');
  link.id = 'pentagram-fonts';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap';
  document.head.appendChild(link);
}

class PentagramCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = null;
    this._hass = null;
    this._orbs = {};
    this._uiQueued = false;
    this._rafId = 0;
    this._orbRunning = false;
    this._lastOrbT = 0;
    this._rm = (typeof matchMedia === 'function') && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  static getStubConfig() {
    return {};
  }

  static async getConfigElement() {
    await import('./pentagram-card-editor.js');
    return document.createElement('pentagram-card-editor');
  }

  getCardSize() { return 9; }

  getGridOptions() {
    return { columns: 12, rows: 9, min_rows: 6 };
  }

  setConfig(config) {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      throw new Error('Invalid configuration: expected an object');
    }
    this._config = {
      offpeak_threshold: config.offpeak_threshold ?? 10,
      max_solar_w: config.max_solar_w ?? 5200,
      show_finance: config.show_finance ?? true,
    };
    for (const role of ROLE_DEFS) {
      const v = config[role.key];
      this._config[role.key] = (typeof v === 'string' && v) ? v : undefined;
    }
    this._build();
    if (this._hass) this._schedule();
  }

  set hass(hass) {
    this._hass = hass;
    this._schedule();
  }

  disconnectedCallback() {
    this._orbRunning = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = 0;
  }

  connectedCallback() {
    if (!this._orbRunning && !this._rm) {
      this._orbRunning = true;
      this._rafId = requestAnimationFrame((ts) => this._orbLoop(ts));
    }
  }

  _el(id) {
    return this.shadowRoot ? this.shadowRoot.getElementById(id) : null;
  }

  _badge(id, on) {
    const el = this._el(id);
    if (el) el.classList.toggle('on', !!on);
  }

  _state(key) {
    const id = this._config ? this._config[key] : undefined;
    if (!id || !this._hass) return undefined;
    const s = this._hass.states[id];
    return s ? s.state : undefined;
  }

  _num(key) {
    const v = Number(this._state(key));
    return isNaN(v) ? 0 : v;
  }

  _unit(key) {
    const id = this._config ? this._config[key] : undefined;
    if (!id || !this._hass) return undefined;
    const s = this._hass.states[id];
    return s && s.attributes ? s.attributes.unit_of_measurement : undefined;
  }

  _build() {
    loadFontsOnce();
    const root = this.shadowRoot;
    root.innerHTML = '';
    const style = document.createElement('style');
    style.textContent = CSS;
    root.appendChild(style);
    const wrap = document.createElement('div');
    wrap.innerHTML = TEMPLATE;
    root.appendChild(wrap);
    const fin = this._el('finStrip');
    if (fin) fin.style.display = this._config.show_finance ? '' : 'none';
    // flame layers + spark streams per route
    this._orbs = {};
    for (const id of ROUTES) {
      const p = this._el('fp-' + id);
      let len = 300;
      if (p) { try { len = p.getTotalLength() || 300; } catch (e) { len = 300; } }
      if (!p) continue;
      const aura = document.createElementNS(SVGNS, 'path');
      aura.setAttribute('d', p.getAttribute('d'));
      aura.setAttribute('class', 'fp-aura');
      p.parentNode.insertBefore(aura, p);
      const core = document.createElementNS(SVGNS, 'path');
      core.setAttribute('d', p.getAttribute('d'));
      core.setAttribute('class', 'fp-core');
      p.parentNode.insertBefore(core, p.nextSibling);
      const sparks = [];
      for (const cfg of [[6, 0], [3.5, -0.07], [2.2, -0.14]]) {
        const c = document.createElementNS(SVGNS, 'circle');
        c.setAttribute('r', cfg[0]);
        c.setAttribute('class', 'orb');
        c.style.opacity = '0';
        p.parentNode.appendChild(c);
        sparks.push({ el: c, off: cfg[1] });
      }
      this._orbs[id] = { path: p, aura, core, len, sparks, t: Math.random(), dir: 1, active: false };
    }
    if (this._rm) {
      const svg = this._el('starsvg');
      if (svg && svg.pauseAnimations) { try { svg.pauseAnimations(); } catch (e) { /* noop */ } }
    }
  }

  _paintRoute(id, active, color, reverse) {
    const rec = this._orbs[id];
    if (!rec) return;
    rec.path.classList.toggle('active', !!active);
    rec.path.style.stroke = active ? color : '';
    if (active) rec.path.setAttribute('filter', 'url(#flameWobble)');
    else rec.path.removeAttribute('filter');
    rec.aura.classList.toggle('on', !!active);
    rec.aura.style.stroke = active ? color : '';
    if (active) rec.core.setAttribute('filter', 'url(#flameWobble)');
    else rec.core.removeAttribute('filter');
    rec.core.classList.toggle('on', !!active);
    const show = active && !this._rm;
    rec.active = !!active;
    rec.dir = reverse ? -1 : 1;
    rec.sparks.forEach((s, i) => {
      s.el.style.opacity = show ? (i === 0 ? '1' : (i === 1 ? '.6' : '.35')) : '0';
      s.el.style.color = active ? color : '';
      if (active) s.el.setAttribute('fill', color);
    });
  }

  _orbLoop(ts) {
    if (!this._orbRunning) return;
    this._rafId = requestAnimationFrame((t) => this._orbLoop(t));
    if (this._rm) return;
    const dt = Math.min(0.05, (ts - this._lastOrbT) / 1000 || 0);
    this._lastOrbT = ts;
    for (const k of Object.keys(this._orbs)) {
      const o = this._orbs[k];
      if (!o.active) continue;
      o.t = (o.t + o.dir * dt * 140 / o.len + 1) % 1;
      try {
        o.sparks.forEach((s) => {
          const tt = (((o.t + o.dir * s.off) % 1) + 1) % 1;
          const pt = o.path.getPointAtLength(tt * o.len);
          s.el.setAttribute('cx', pt.x);
          s.el.setAttribute('cy', pt.y);
        });
      } catch (e) { /* path not measurable yet */ }
    }
  }

  _schedule() {
    if (this._uiQueued || !this._config) return;
    this._uiQueued = true;
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => { this._uiQueued = false; this._update(); });
    } else {
      setTimeout(() => { this._uiQueued = false; this._update(); }, 0);
    }
  }

  _update() {
    if (!this.shadowRoot || !this._el('starsvg')) return;
    const solar = this._num('solar'), batChW = this._num('batChargeW');
    const s2b = this._num('s2b'), s2h = this._num('s2h'), s2g = this._num('s2g');
    const b2h = this._num('b2h'), b2g = this._num('b2g'), gImp = this._num('gridImp');
    const chgUnit = String(this._unit('carChargerPower') || 'kW').toLowerCase();
    const chgRaw = this._num('carChargerPower');
    const carChgW = (chgUnit === 'w' || chgUnit === 'watt' || chgUnit === 'watts') ? chgRaw : chgRaw * 1000;
    const exportTotal = s2g + b2g, isExporting = exportTotal > 50;
    const charging = this._state('carCharging') === 'on';
    const plugged = this._state('carCharger') === 'on';
    const curRate = this._num('currentRate'), expRate = this._num('exportRate');
    const curP = Number((curRate * 100).toFixed(2)), expP = Number((expRate * 100).toFixed(2));
    const offPeak = curP < (Number(this._config.offpeak_threshold) || 10);
    const maxSolar = Number(this._config.max_solar_w) || 5200;
    const colGrid = offPeak ? GC : BC;

    let cSol = 0, cGrid = 0, cBatt = 0;
    if (charging && carChgW > 0) {
      const totalCarPower = carChgW;
      if (s2h > 0) cSol = Math.min(solar, totalCarPower);
      const rem = totalCarPower - cSol;
      if (rem > 0) {
        if (gImp >= rem) { cGrid = rem; }
        else { cGrid = Math.max(0, gImp); cBatt = rem - cGrid; }
      }
    }
    const gridToHouse = Math.max(0, gImp - cGrid);
    const houseW = s2h + b2h + gridToHouse;
    const isCh = batChW > 50, isDis = (b2h + b2g) > 50;

    const set = (id, txt) => { const el = this._el(id); if (el) el.textContent = txt; };
    set('solarW', String(solar));
    set('solarEff', Math.min(100, Math.round(solar / maxSolar * 100)) + '%');
    this._badge('solarGen', solar > 50);
    this._badge('solarIdle', solar <= 50);
    const batPct = this._num('batSoc');
    set('batPct', String(batPct));
    set('batKwh', (this._num('batKwh')).toFixed(1));
    set('batPower', isCh ? String(batChW) : (isDis ? String(b2h + b2g) : '0'));
    this._badge('batCharge', isCh);
    this._badge('batDischarge', isDis);
    this._badge('batIdle', !isCh && !isDis);
    set('gridW', gImp > 50 ? String(gImp) : (isExporting ? String(exportTotal) : '0'));
    set('gridDir', gImp > 50 ? 'IMPORTING' : (isExporting ? 'EXPORTING' : 'BALANCED'));
    set('gridRate', (isExporting ? expP : curP) + 'p');
    this._badge('gridImport', gImp > 50);
    this._badge('gridExport', isExporting);
    const gridNode = this._el('nd-grid');
    if (gridNode) gridNode.classList.toggle('exp', isExporting);
    set('houseW', String(houseW));
    set('houseTemp', fmtT(this._state('houseTemp')));
    const hum = Number(this._state('houseHum'));
    set('houseHum', isNaN(hum) ? '--' : hum.toFixed(1) + '%');
    set('houseOutTemp', fmtT(this._state('houseOutTemp')));
    set('poolTemp', fmtT(this._state('poolTemp')));
    set('dhwTemp', fmtT(this._state('dhwTemp')));
    this._badge('houseCons', houseW > 50);
    this._badge('houseIdle', houseW <= 50);
    set('carSoc', String(this._num('carSoc')));
    set('carState', (charging && carChgW > 0) ? ('CHARGING ' + Math.round(carChgW) + 'W') : 'STANDBY');
    set('carInTemp', fmtT(this._state('carInTemp')));
    const rr = this._state('carRange'), rn = Number(rr);
    set('carRange', (rr != null && rr !== '' && rr !== 'unknown' && rr !== 'unavailable' && !isNaN(rn))
      ? ((Math.round(rn * 10) / 10) + ' ' + (this._unit('carRange') || 'mi')) : '--');
    this._badge('carCharge', charging);
    this._badge('carPlugged', plugged);

    this._paintRoute('sol-bat', isCh && s2b > 50, GC, false);
    this._paintRoute('sol-grid', s2g > 50, GC, false);
    this._paintRoute('sol-house', s2h > 50, GC, false);
    this._paintRoute('sol-car', charging && cSol > 50, GC, false);
    this._paintRoute('bat-house', b2h > 50, MC, false);
    this._paintRoute('bat-car', charging && cBatt > 50, MC, false);
    this._paintRoute('grid-house', gridToHouse > 50, colGrid, false);
    this._paintRoute('grid-car', charging && cGrid > 50, colGrid, false);
    const gridBatW = (gImp > 50 && isCh) ? Math.min(gImp, batChW) : 0;
    if (b2g > 50) this._paintRoute('bat-grid', true, MC, false);
    else if (gridBatW > 50) this._paintRoute('bat-grid', true, colGrid, true);
    else this._paintRoute('bat-grid', false, MC, false);

    const net = gImp - exportTotal;
    const sig = this._el('sigilVal');
    if (sig) {
      sig.textContent = '';
      const a = document.createElement('span');
      a.textContent = (net >= 0 ? '+' : '−') + (net >= 1000 || net <= -1000
        ? ((Math.round(Math.abs(net) / 100) / 10) + 'kW')
        : (Math.round(Math.abs(net)) + 'W'));
      sig.appendChild(a);
      const u = document.createElement('small');
      u.textContent = net >= 0 ? ' IMP' : ' EXP';
      sig.appendChild(u);
      sig.style.color = isExporting ? GC : (gImp > 50 ? BC : '#e8e2d5');
    }
    const aut = houseW > 0 ? Math.min(100, Math.round((houseW - gridToHouse) / houseW * 100)) : 100;
    set('sigilAuto', aut + '%');
    const veil = this._el('sigilVeil');
    if (veil) {
      veil.textContent = offPeak ? '☽ OFF-PEAK' : '☀ PEAK';
      veil.style.color = offPeak ? GC : BC;
    }

    if (this._config.show_finance) {
      const expE = this._num('exportEnergyToday'), impC = this._num('importCost');
      const expRev = expE * expRate, bal = expRev - impC;
      set('finExp', '+' + fmtM(expRev));
      set('finImp', '-' + fmtM(impC));
      const fb = this._el('finBal');
      if (fb) {
        fb.textContent = (bal >= 0 ? '+' : '-') + fmtM(Math.abs(bal));
        fb.style.color = bal >= 0 ? GC : BC;
      }
      set('rateCur', '£' + curRate.toFixed(2) + '/kWh');
      set('rateExp', '£' + expRate.toFixed(2) + '/kWh');
    }

    const svg = this._el('starsvg');
    if (svg) {
      if (exportTotal > 50) svg.style.setProperty('--ley-idle', '#3dff9e');
      else if (gImp > 50) svg.style.setProperty('--ley-idle', '#ff3b5c');
    }
  }
}

customElements.define(TAG, PentagramCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: TAG,
  name: 'Powerflow Pentagram',
  description: 'Mystic animated energy-flow pentagram: solar, battery, grid, house and car.',
});
