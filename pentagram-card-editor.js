/* Powerflow Pentagram — visual editor.
 * Plain custom element (no Lit, no build step). Uses Home Assistant's own
 * <ha-entity-picker> rows, grouped by role, plus three display options. */

const GROUPS = [
  {
    title: 'Solar', roles: [
      ['solar', 'Array power (W)', ['sensor']],
    ],
  },
  {
    title: 'Battery', roles: [
      ['batSoc', 'Charge %', ['sensor']],
      ['batKwh', 'Stored energy (kWh)', ['sensor']],
      ['batChargeW', 'Charge power (W)', ['sensor']],
      ['s2b', 'Flow: solar → battery (W)', ['sensor']],
      ['s2h', 'Flow: solar → house (W)', ['sensor']],
      ['s2g', 'Flow: solar → grid (W)', ['sensor']],
      ['b2h', 'Flow: battery → house (W)', ['sensor']],
      ['b2g', 'Flow: battery → grid (W)', ['sensor']],
    ],
  },
  {
    title: 'Grid', roles: [
      ['gridImp', 'Import power (W)', ['sensor']],
    ],
  },
  {
    title: 'House', roles: [
      ['houseTemp', 'Indoor temperature', ['sensor']],
      ['houseHum', 'Indoor humidity', ['sensor']],
      ['houseOutTemp', 'Outdoor temperature', ['sensor']],
      ['poolTemp', 'Pool temperature', ['sensor']],
      ['dhwTemp', 'Hot-water tank temperature', ['sensor']],
    ],
  },
  {
    title: 'Car', roles: [
      ['carSoc', 'Battery %', ['sensor']],
      ['carCharging', 'Charging binary', ['binary_sensor']],
      ['carCharger', 'Plugged-in binary', ['binary_sensor']],
      ['carChargerPower', 'Charger power', ['sensor']],
      ['carInTemp', 'Cabin temperature', ['sensor']],
      ['carRange', 'Range', ['sensor']],
      ['carShiftState', 'Shift state (P/D/R)', ['sensor']],
    ],
  },
  {
    title: 'Finance', roles: [
      ['exportEnergyToday', 'Exported today (kWh)', ['sensor']],
      ['exportRate', 'Export rate (£/kWh)', ['sensor', 'number', 'input_number']],
      ['currentRate', 'Import rate (£/kWh)', ['sensor', 'number', 'input_number']],
      ['importCost', 'Import cost today (£)', ['sensor']],
    ],
  },
];

const OPTIONS = [
  { key: 'offpeak_threshold', label: 'Off-peak below (p/kWh)', type: 'number', def: 10 },
  { key: 'max_solar_w', label: 'Solar array peak (W)', type: 'number', def: 5200 },
  { key: 'show_finance', label: 'Show finance strip', type: 'boolean', def: true },
];

class PentagramCardEditor extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._hass = null;
    this._pickers = [];
  }

  setConfig(config) {
    this._config = { ...(config || {}) };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    for (const p of this._pickers) {
      try { p.hass = hass; } catch (e) { /* picker not ready */ }
    }
  }

  _emit() {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: { ...this._config } },
      bubbles: true,
      composed: true,
    }));
  }

  _row(labelText, control) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:12px;padding:6px 0;';
    const label = document.createElement('div');
    label.style.cssText = 'flex:0 0 200px;font-size:13px;opacity:.85;';
    label.textContent = labelText;
    row.appendChild(label);
    control.style.flex = '1';
    row.appendChild(control);
    return row;
  }

  _render() {
    this.innerHTML = '';
    this._pickers = [];
    const style = document.createElement('style');
    style.textContent = 'h4{margin:14px 0 4px;font-size:13px;letter-spacing:1px;opacity:.7;}';
    this.appendChild(style);
    for (const group of GROUPS) {
      const h = document.createElement('h4');
      h.textContent = group.title;
      this.appendChild(h);
      for (const [key, label, domains] of group.roles) {
        const picker = document.createElement('ha-entity-picker');
        picker.setAttribute('allow-custom-entity', '');
        if (domains && domains.length === 1) picker.setAttribute('domain-filter', domains[0]);
        if (this._hass) { try { picker.hass = this._hass; } catch (e) { /* noop */ } }
        picker.value = this._config[key] || '';
        picker.addEventListener('value-changed', (ev) => {
          this._config[key] = ev.detail.value || undefined;
          if (!this._config[key]) delete this._config[key];
          this._emit();
        });
        this._pickers.push(picker);
        this.appendChild(this._row(label, picker));
      }
    }
    const oh = document.createElement('h4');
    oh.textContent = 'Display';
    this.appendChild(oh);
    for (const opt of OPTIONS) {
      let control;
      if (opt.type === 'boolean') {
        control = document.createElement('ha-switch');
        control.checked = this._config[opt.key] ?? opt.def;
        control.addEventListener('change', () => {
          this._config[opt.key] = control.checked;
          this._emit();
        });
      } else {
        control = document.createElement('ha-textfield');
        control.setAttribute('inputmode', 'decimal');
        control.value = String(this._config[opt.key] ?? opt.def);
        control.addEventListener('change', () => {
          const v = Number(control.value);
          this._config[opt.key] = isNaN(v) ? opt.def : v;
          this._emit();
        });
      }
      this.appendChild(this._row(opt.label, control));
    }
  }
}

customElements.define('pentagram-card-editor', PentagramCardEditor);
