# Powerflow Pentagram 🔮⚡

A mystic animated energy-flow card for Home Assistant dashboards. Solar, battery, grid, house and car sit on the vertices of a pentagram; live power flows burn as flickering flame leys — green for blessed flows, amber for battery outflows, blood red for peak grid imports (absolved to green off-peak). Idle leys hold the star in grey and breathe with net export/import.

![Powerflow Pentagram](https://via.placeholder.com/1100x720.png?text=Powerflow+Pentagram+screenshot)

## Install

### HACS (recommended)

1. HACS → Frontend → ⋮ → Custom repositories → add this repo URL as type **Dashboard**.
2. Install **Powerflow Pentagram**, then hard-refresh the browser (HACS versions the resource URL, so updates re-fetch automatically).

### Manual

1. Copy `pentagram-card.js` (and `pentagram-card-editor.js` for the visual editor) to `<config>/www/`.
2. Settings → Dashboards → ⋮ → Resources → Add resource:
   - URL: `/local/pentagram-card.js?v=1.0.0`
   - Type: **JavaScript Module**
3. **Cache warning:** `/local/` files are cached ~31 days. After every manual update, bump the `?v=` string and hard-refresh (or Companion app → Settings → Reset frontend cache).

## Configuration

Add a card → search **Powerflow Pentagram**, or YAML:

```yaml
type: custom:pentagram-card
solar: sensor.givtcp_fd2324f469_pv_power
batSoc: sensor.givtcp_ac2416g877_battery_soc
batKwh: sensor.givtcp_fd2324f469_soc_kwh
batChargeW: sensor.givtcp_fd2324f469_charge_power
s2b: sensor.givtcp_fd2324f469_solar_to_battery
s2h: sensor.givtcp_fd2324f469_solar_to_house
s2g: sensor.givtcp_fd2324f469_export_power
b2h: sensor.givtcp_fd2324f469_battery_to_house
b2g: sensor.givtcp_fd2324f469_battery_to_grid
gridImp: sensor.givtcp_fd2324f469_import_power
carSoc: sensor.forest_explorer_battery
carCharging: binary_sensor.forest_explorer_charging
carCharger: binary_sensor.forest_explorer_charger
carChargerPower: sensor.forest_explorer_charger_power
carInTemp: sensor.forest_explorer_temperature_inside
carRange: sensor.forest_explorer_range
houseTemp: sensor.helenes_office_temp_temperature
houseHum: sensor.helenes_office_temp_humidity
houseOutTemp: sensor.outsidetemp_temperature
poolTemp: sensor.pooltemp
dhwTemp: sensor.dhw_tank_temp_buffer
exportEnergyToday: sensor.givtcp_fd2324f469_export_energy_today_kwh
exportRate: sensor.octopus_energy_electricity_22j0105517_2000060890050_export_current_rate
currentRate: sensor.octopus_energy_electricity_22j0105517_2000010158490_current_rate
importCost: sensor.octopus_energy_electricity_22j0105517_2000010158490_current_accumulative_cost
carShiftState: sensor.forest_explorer_shift_state
offpeak_threshold: 10
max_solar_w: 5200
show_finance: true
```

### Entity roles

| Key | Meaning | Domain | Required |
|-----|---------|--------|----------|
| `solar` | Solar array power (W) | sensor | yes |
| `batSoc` | Battery charge % | sensor | yes |
| `gridImp` | Grid import power (W) | sensor | yes |
| `batKwh`, `batChargeW` | Battery kWh / charge W | sensor | no |
| `s2b`, `s2h`, `s2g`, `b2h`, `b2g` | GivEnergy-style flow sensors (W) | sensor | no |
| `carSoc`, `carChargerPower`, `carInTemp`, `carRange` | EV telemetry | sensor | no |
| `carCharging`, `carCharger` | EV charging / plugged-in | binary_sensor | no |
| `houseTemp`, `houseHum`, `houseOutTemp`, `poolTemp`, `dhwTemp` | Climate | sensor | no |
| `exportEnergyToday`, `exportRate`, `currentRate`, `importCost` | Finance | sensor | no |
| `carShiftState` | Shift state P/D/R | sensor | no |

Unmapped entities degrade to `--` and their flows stay dormant — the star still renders. Charger power honours the entity's unit (`kW` assumed, `W` respected). Range/odometer-style units (`mi`/`km`) are read from attributes.

### Options

| Key | Default | Meaning |
|-----|---------|---------|
| `offpeak_threshold` | `10` | Import rate below this (p/kWh) counts as off-peak: grid outflows turn green |
| `max_solar_w` | `5200` | Array peak for the solar efficiency % |
| `show_finance` | `true` | Finance strip under the star |

For a sections view the card spans full width (`columns: 12`).

## Notes

- Single file, vanilla JS, no build step, no dependencies. Fonts load from Google Fonts with system fallbacks.
- Honors `prefers-reduced-motion` (flames freeze, sparks park).
- `dev/test-harness.html` in this repo is dev-only scaffolding, not part of the release.
