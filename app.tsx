import { Hono } from "hono";
import type { FC } from "hono/jsx";

const COLORS: Record<string, string> = {
  "10": "#3498db",
  "20": "#1abc9c",
  "30": "#2ecc71",
  "40": "#f39c12",
  "50": "#e74c3c",
  "60": "#c0392b",
  "70": "#8e44ad",
  "80": "#2c3e50",
  "100": "#1a1a2e",
  "120": "#000000",
};
const DEFAULT_COLOR = "#95a5a6";

const OPERATORS: Record<number, string> = {
  6: "Oy Pohjolan Liikenne Ab",
  12: "Koiviston Auto Oy",
  17: "Tammelundin Liikenne Oy",
  18: "Oy Pohjolan Liikenne Ab",
  20: "Bus Travel Åbergin Linja Oy",
  21: "Bus Travel Oy Reissu Ruoti",
  22: "Nobina Finland Oy",
  30: "Savonlinja Oy",
  36: "Nurmijärven Linja Oy",
  40: "HKL-Raitioliikenne",
  47: "Taksikuljetus Oy",
  50: "HKL-Metroliikenne",
  51: "Korsisaari Oy",
  54: "V-S Bussipalvelut Oy",
  58: "Koillisen Liikennepalvelut Oy",
  59: "Tilausliikenne Nikkanen Oy",
  60: "Suomenlinnan Liikenne Oy",
  64: "Taksikuljetus Harri Vuolle Oy",
  89: "Metropolia",
  90: "VR Oy",
  130: "Matkahuolto",
  195: "Siuntio",
};

const clientScript = `
const COLORS = ${JSON.stringify(COLORS)};
const DEFAULT_COLOR = "${DEFAULT_COLOR}";
const OPERATORS = ${JSON.stringify(OPERATORS)};

const T = {
  fi: {
    title: "Helsingin seutu — nopeusrajoitukset",
    speedLimit: "Nopeusrajoitus",
    other: "Muu",
    loading: "Ladataan dataa...",
    unnamedRoad: "Nimetön tie",
    type: "Tyyppi",
    speedLimitLabel: "Rajoitus",
    notAvailable: "Ei tiedossa",
    bus: "Bussi",
    speed: "Nopeus",
    speeding: "Ylinopeus",
    operator: "Liikennöitsijä",
    vehicle: "Ajoneuvo",
    busesConnecting: "Bussit: yhdistetään...",
    busesConnected: "Bussit: yhdistetty",
    busesLabel: "Bussit",
    speedingLabel: "Ylinopeudella",
    busesPaused: "Bussit: pysäytetty",
    onMap: "kartalla",
    busesError: "Bussit: virhe",
    pause: "Pysäytä",
    resume: "Jatka",
    speedingTrails: "Ylinopeudet",
    trailTitle: "Ylinopeus-trail",
    route: "Linja",
    avgExcess: "Keskim. ylinopeus",
    duration: "Kesto",
    speedLabel: "Nopeus (km/h)",
    limitLabel: "Rajoitus (km/h)",
    timeAxis: "Aika (s)",
    noSpeedingsYet: "Ei ylinopeuksia vielä",
    noFilterResults: "Ei tuloksia suodattimilla",
    showMore: "Näytä lisää",
    filterRoute: "Linja",
    filterOperator: "Liikennöitsijä",
    filterVehicle: "Ajoneuvo",
    filterMinExcess: "Min. ylinopeus",
    filterLimit: "Rajoitus",
    filterMinDuration: "Min. kesto",
    filterAll: "Kaikki",
    filterClear: "Tyhjennä",
    filterRoutePlaceholder: "esim. 550",
    filterVehiclePlaceholder: "esim. 22_801",
    sortLabel: "Järjestys",
    sortRecent: "Uusin ensin",
    sortDuration: "Kesto",
    sortExcess: "Ylinopeus",
  },
  en: {
    title: "Helsinki region — speed limits",
    speedLimit: "Speed limit",
    other: "Other",
    loading: "Loading data...",
    unnamedRoad: "Unnamed road",
    type: "Type",
    speedLimitLabel: "Limit",
    notAvailable: "Not available",
    bus: "Bus",
    speed: "Speed",
    speeding: "Speeding",
    operator: "Operator",
    vehicle: "Vehicle",
    busesConnecting: "Buses: connecting...",
    busesConnected: "Buses: connected",
    busesLabel: "Buses",
    speedingLabel: "Speeding",
    busesPaused: "Buses: paused",
    onMap: "on map",
    busesError: "Buses: error",
    pause: "Pause",
    resume: "Resume",
    speedingTrails: "Speeding trails",
    trailTitle: "Speeding trail",
    route: "Route",
    avgExcess: "Avg. excess",
    duration: "Duration",
    speedLabel: "Speed (km/h)",
    limitLabel: "Limit (km/h)",
    timeAxis: "Time (s)",
    noSpeedingsYet: "No speeding events yet",
    noFilterResults: "No results with current filters",
    showMore: "Show more",
    filterRoute: "Route",
    filterOperator: "Operator",
    filterVehicle: "Vehicle",
    filterMinExcess: "Min. excess",
    filterLimit: "Limit",
    filterMinDuration: "Min. duration",
    filterAll: "All",
    filterClear: "Clear",
    filterRoutePlaceholder: "e.g. 550",
    filterVehiclePlaceholder: "e.g. 22_801",
    sortLabel: "Sort by",
    sortRecent: "Most recent",
    sortDuration: "Duration",
    sortExcess: "Excess speed",
  },
};

let lang = localStorage.getItem("lang") || "fi";
function t(key) { return T[lang][key] || T.fi[key] || key; }

function setLang(newLang) {
  lang = newLang;
  localStorage.setItem("lang", lang);
  document.documentElement.lang = lang;
  document.title = t("title");
  // Update static UI text
  document.querySelectorAll("[data-i18n]").forEach(el => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
  });
  // Update language selector
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-lang") === lang);
  });
  // Re-render legend
  updateLegend();
  // Re-render trail panel
  renderTrailPanel();
  // Update status bar
  updateStatusBar();
  // Update HFP button
  const hfpBtn = document.getElementById("hfp-toggle");
  if (hfpBtn) hfpBtn.textContent = mqttPaused ? t("resume") : t("pause");
}

function updateLegend() {
  const legendEl = document.querySelector(".legend");
  if (!legendEl) return;
  legendEl.innerHTML = "<h4>" + t("speedLimit") + "</h4>" +
    Object.entries(COLORS).map(([speed, color]) =>
      '<div class="legend-item">' +
      '<span class="legend-color" style="background:' + color + '"></span>' +
      speed + ' km/h</div>'
    ).join("") +
    '<div class="legend-item"><span class="legend-color" style="background:' + DEFAULT_COLOR + '"></span>' + t("other") + '</div>';
}

const map = L.map("map").setView([60.25, 24.93], 11);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const legend = L.control({ position: "bottomright" });
legend.onAdd = () => {
  const div = L.DomUtil.create("div", "legend");
  return div;
};
legend.addTo(map);
updateLegend();

// --- Spatial grid index for speed limit lookup ---
const GRID_SIZE = 0.002;
const grid = {};
let speedingCount = 0;
let totalBuses = 0;

function gridKey(lat, lng) {
  return Math.floor(lat / GRID_SIZE) + "," + Math.floor(lng / GRID_SIZE);
}

function distSq(lat1, lng1, lat2, lng2) {
  const dlat = lat1 - lat2;
  const dlng = (lng1 - lng2) * 0.55;
  return dlat * dlat + dlng * dlng;
}

function buildGrid(roads) {
  for (const road of roads) {
    if (!road.maxspeed || road.coords.length < 2) continue;
    for (const [lat, lng] of road.coords) {
      const key = gridKey(lat, lng);
      if (!grid[key]) grid[key] = [];
      grid[key].push({ lat, lng, maxspeed: parseInt(road.maxspeed, 10), name: road.name });
    }
  }
}

function getSpeedLimit(lat, lng) {
  let best = null;
  let bestDist = Infinity;
  const ci = Math.floor(lat / GRID_SIZE);
  const cj = Math.floor(lng / GRID_SIZE);
  for (let di = -1; di <= 1; di++) {
    for (let dj = -1; dj <= 1; dj++) {
      const cell = grid[(ci + di) + "," + (cj + dj)];
      if (!cell) continue;
      for (const pt of cell) {
        const d = distSq(lat, lng, pt.lat, pt.lng);
        if (d < bestDist) {
          bestDist = d;
          best = pt;
        }
      }
    }
  }
  if (best && bestDist < 0.0005 * 0.0005) return best;
  return null;
}

fetch("/helsinki-speeds.json")
  .then(r => r.json())
  .then(roads => {
    document.getElementById("loading").remove();
    buildGrid(roads);
    console.log("Spatial grid built");
    roads.forEach(road => {
      if (road.coords.length < 2) return;
      const color = COLORS[road.maxspeed] || DEFAULT_COLOR;
      const line = L.polyline(road.coords, {
        color,
        weight: 3,
        opacity: 0.8
      }).addTo(map);
      line.bindPopup(
        "<b>" + (road.name || t("unnamedRoad")) + "</b><br>" +
        t("type") + ": " + (road.highway || "-") + "<br>" +
        t("speedLimitLabel") + ": " + (road.maxspeed ? road.maxspeed + " km/h" : t("notAvailable"))
      );
    });
    connectMqtt();
  });

// --- HSL real-time buses via MQTT ---
const busMarkers = {};
const busSpeedingState = {};
const SPEEDING_THRESHOLD = 3;
const SPEEDING_DURATION = 3;

const trailLayer = L.layerGroup().addTo(map);
const committedTrails = [];
let trailPanelPage = 0;
let trailSort = "recent";
const TRAILS_PER_PAGE = 10;

function addCommittedTrail(id, s) {
  committedTrails.unshift({ id, state: s, time: Date.now() });
  renderTrailPanel();
}

const LIMIT_STEPS = [20, 30, 40, 50, 60, 70, 80, 100, 120];

function updateSliderLabel(sliderId) {
  const lo = document.getElementById(sliderId + "-lo");
  const hi = document.getElementById(sliderId + "-hi");
  const label = document.getElementById(sliderId + "-val");
  if (!lo || !hi || !label) return;
  const min = parseInt(lo.min, 10);
  const max = parseInt(hi.max, 10);
  const loVal = parseInt(lo.value, 10);
  const hiVal = parseInt(hi.value, 10);
  const isDefault = loVal === min && hiVal === max;
  const unit = sliderId === "filter-min-duration" ? " s" : " km/h";
  if (isDefault) {
    label.textContent = t("filterAll");
  } else {
    const loStr = loVal === min ? min + "" : loVal + "";
    const hiStr = hiVal >= max ? max + "+" : hiVal + "";
    label.textContent = loStr + "–" + hiStr + unit;
  }
}

function getFilteredTrails() {
  const fRoute = document.getElementById("filter-route").value.trim().toLowerCase();
  const fOper = document.getElementById("filter-oper").value;
  const fVeh = document.getElementById("filter-veh").value.trim().toLowerCase();
  const exLo = document.getElementById("filter-min-excess-lo");
  const exHi = document.getElementById("filter-min-excess-hi");
  const exLoVal = parseInt(exLo.value, 10);
  const exHiVal = parseInt(exHi.value, 10);
  const exDefault = exLoVal === parseInt(exLo.min, 10) && exHiVal === parseInt(exHi.max, 10);
  const limLo = document.getElementById("filter-limit-lo");
  const limHi = document.getElementById("filter-limit-hi");
  const limLoVal = parseInt(limLo.value, 10);
  const limHiVal = parseInt(limHi.value, 10);
  const limDefault = limLoVal === parseInt(limLo.min, 10) && limHiVal === parseInt(limHi.max, 10);
  const durLo = document.getElementById("filter-min-duration-lo");
  const durHi = document.getElementById("filter-min-duration-hi");
  const durLoVal = parseInt(durLo.value, 10);
  const durHiVal = parseInt(durHi.value, 10);
  const durDefault = durLoVal === parseInt(durLo.min, 10) && durHiVal === parseInt(durHi.max, 10);

  const result = committedTrails.filter(t => {
    const s = t.state;
    const avg = s.totalExcess / s.samples;
    if (fRoute && !s.route.toLowerCase().startsWith(fRoute)) return false;
    if (fOper && String(s.oper) !== fOper) return false;
    if (fVeh && !t.id.toLowerCase().startsWith(fVeh)) return false;
    if (!exDefault && (avg < exLoVal || avg > exHiVal)) return false;
    if (!limDefault && (s.limitKmh < limLoVal || s.limitKmh > limHiVal)) return false;
    if (!durDefault && (s.samples < durLoVal || s.samples > durHiVal)) return false;
    return true;
  });
  if (trailSort === "duration") {
    result.sort((a, b) => b.state.samples - a.state.samples);
  } else if (trailSort === "excess") {
    result.sort((a, b) => (b.state.totalExcess / b.state.samples) - (a.state.totalExcess / a.state.samples));
  } else {
    result.sort((a, b) => b.time - a.time);
  }
  return result;
}

function renderTrailPanel() {
  const list = document.getElementById("trail-list");
  const moreBtn = document.getElementById("trail-show-more");
  if (!list) return;

  const sortSelect = document.getElementById("trail-sort");
  if (sortSelect) {
    sortSelect.innerHTML =
      '<option value="recent"' + (trailSort === "recent" ? " selected" : "") + '>' + t("sortRecent") + '</option>' +
      '<option value="excess"' + (trailSort === "excess" ? " selected" : "") + '>' + t("sortExcess") + '</option>' +
      '<option value="duration"' + (trailSort === "duration" ? " selected" : "") + '>' + t("sortDuration") + '</option>';
  }

  updateFilterOptions();
  const filtered = getFilteredTrails();
  const visible = filtered.slice(0, (trailPanelPage + 1) * TRAILS_PER_PAGE);

  list.innerHTML = visible.length === 0
    ? '<div style="color:#999;padding:12px;text-align:center">' +
      (committedTrails.length === 0 ? t("noSpeedingsYet") : t("noFilterResults")) + '</div>'
    : visible.map((tr, i) => {
        const s = tr.state;
        const avg = s.totalExcess / s.samples;
        return '<div class="trail-list-item" data-idx="' + i + '">' +
          '<div class="trail-list-info">' +
            '<div class="trail-list-route">' + t("route") + ' ' + s.route + '</div>' +
            '<div class="trail-list-detail">' +
              (OPERATORS[s.oper] || s.oper) + ' | ' + tr.id + '<br>' +
              '+' + avg.toFixed(1) + ' km/h | ' +
              s.limitKmh + ' km/h | ' +
              s.samples + ' s' +
            '</div>' +
          '</div>' +
          '<canvas class="trail-sparkline" data-idx="' + i + '"></canvas>' +
        '</div>';
      }).join("");

  document.getElementById("trail-count").textContent = filtered.length + " / " + committedTrails.length;

  if (moreBtn) {
    moreBtn.style.display = filtered.length > (trailPanelPage + 1) * TRAILS_PER_PAGE ? "block" : "none";
  }
  list.querySelectorAll(".trail-list-item").forEach(el => {
    el.addEventListener("click", () => {
      const idx = parseInt(el.getAttribute("data-idx"), 10);
      const tr = filtered[idx];
      if (tr && tr.state._trail) {
        map.panTo(tr.state._trail.getCenter());
        showTrailChart(tr.state._trail, tr.state);
      }
    });
  });
  drawSparklines(list, visible);
}

let _sparklineVisible = [];
let _sparklineList = null;

function drawSparklines(list, visible) {
  _sparklineList = list;
  _sparklineVisible = visible;
  _drawSparklines();
}

function _drawSparklines() {
  const list = _sparklineList;
  const visible = _sparklineVisible;
  if (!list || !visible.length) return;
  const MAX_PTS = 100;
  list.querySelectorAll(".trail-sparkline").forEach(canvas => {
    const idx = parseInt(canvas.getAttribute("data-idx"), 10);
    const tr = visible[idx];
    if (!tr || !tr.state.timeSeries || tr.state.timeSeries.length < 2) return;
    const raw = tr.state.timeSeries;
    // Downsample if too many points
    let pts = raw;
    if (raw.length > MAX_PTS) {
      pts = [];
      for (let k = 0; k < MAX_PTS; k++) {
        pts.push(raw[Math.round(k * (raw.length - 1) / (MAX_PTS - 1))]);
      }
    }
    const dpr = window.devicePixelRatio || 1;
    const cssW = 100, cssH = 40;
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const w = cssW, h = cssH;
    const speeds = pts.map(p => p.speed);
    const limit = pts[0].limit;
    let minY = limit - 2, maxY = limit + 2;
    for (let k = 0; k < speeds.length; k++) {
      if (speeds[k] < minY) minY = speeds[k];
      if (speeds[k] > maxY) maxY = speeds[k];
    }
    const rangeY = maxY - minY || 1;
    const xStep = w / (speeds.length - 1);
    // Limit line (green dashed)
    const limY = h - ((limit - minY) / rangeY) * h;
    ctx.strokeStyle = "#2ecc71";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, limY);
    ctx.lineTo(w, limY);
    ctx.stroke();
    ctx.setLineDash([]);
    // Speed line (red)
    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    speeds.forEach((spd, j) => {
      const x = j * xStep;
      const y = h - ((spd - minY) / rangeY) * h;
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  });
}

setInterval(_drawSparklines, 2000);

let allVehicles = [];
let allRoutes = [];

function updateVehDropdown() {
  allVehicles = [...new Set(committedTrails.map(t => t.id))].sort();
  renderVehDropdown();
}
function renderVehDropdown() {
  const input = document.getElementById("filter-veh");
  const dropdown = document.getElementById("filter-veh-dropdown");
  if (!dropdown) return;
  const q = input.value.trim().toLowerCase();
  const filtered = q ? allVehicles.filter(v => v.toLowerCase().startsWith(q)) : allVehicles;
  dropdown.innerHTML = filtered.length === 0
    ? '<div class="combo-item" style="color:#999;pointer-events:none">' + t("noFilterResults") + '</div>'
    : filtered.map(v => '<div class="combo-item" data-val="' + v + '">' + v + '</div>').join("");
}

function updateRouteDropdown() {
  allRoutes = [...new Set(committedTrails.map(t => t.state.route))].sort((a, b) => {
    const na = parseInt(a, 10), nb = parseInt(b, 10);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });
  renderRouteDropdown();
}
function renderRouteDropdown() {
  const input = document.getElementById("filter-route");
  const dropdown = document.getElementById("filter-route-dropdown");
  if (!dropdown) return;
  const q = input.value.trim().toLowerCase();
  const filtered = q ? allRoutes.filter(v => v.toLowerCase().startsWith(q)) : allRoutes;
  dropdown.innerHTML = filtered.length === 0
    ? '<div class="combo-item" style="color:#999;pointer-events:none">' + t("noFilterResults") + '</div>'
    : filtered.map(v => '<div class="combo-item" data-val="' + v + '">' + v + '</div>').join("");
}

function initCombo(inputId, dropdownId, renderFn) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  if (!input || !dropdown) return;

  input.addEventListener("focus", () => {
    renderFn();
    dropdown.classList.add("open");
  });
  input.addEventListener("input", () => {
    renderFn();
    dropdown.classList.add("open");
    trailPanelPage = 0;
    renderTrailPanel();
  });
  dropdown.addEventListener("mousedown", (e) => {
    e.preventDefault();
    const item = e.target.closest(".combo-item");
    if (!item || !item.dataset.val) return;
    input.value = item.dataset.val;
    dropdown.classList.remove("open");
    trailPanelPage = 0;
    renderTrailPanel();
  });
  input.addEventListener("blur", () => {
    setTimeout(() => dropdown.classList.remove("open"), 150);
  });
}
initCombo("filter-veh", "filter-veh-dropdown", renderVehDropdown);
initCombo("filter-route", "filter-route-dropdown", renderRouteDropdown);

function updateFilterOptions() {
  const operSelect = document.getElementById("filter-oper");
  const currentOper = operSelect.value;
  const opers = [...new Set(committedTrails.map(t => t.state.oper))].sort((a, b) => a - b);
  operSelect.innerHTML = '<option value="">' + t("filterAll") + '</option>' +
    opers.map(o => '<option value="' + o + '"' + (String(o) === currentOper ? ' selected' : '') + '>' +
      (OPERATORS[o] || o) + '</option>').join("");

  updateVehDropdown();
  updateRouteDropdown();

  updateSliderLabel("filter-min-excess");
  updateSliderLabel("filter-min-duration");
  updateSliderLabel("filter-limit");
}

function toggleTrailPanel() {
  const panel = document.getElementById("trail-panel");
  panel.classList.toggle("open");
}

document.getElementById("trail-panel-toggle").addEventListener("click", toggleTrailPanel);
document.getElementById("trail-sort").addEventListener("change", (e) => {
  trailSort = e.target.value;
  trailPanelPage = 0;
  renderTrailPanel();
});
document.getElementById("trail-show-more").addEventListener("click", () => {
  trailPanelPage++;
  renderTrailPanel();
});

function clampRange(loId, hiId) {
  const lo = document.getElementById(loId);
  const hi = document.getElementById(hiId);
  if (parseInt(lo.value, 10) > parseInt(hi.value, 10)) {
    lo.value = hi.value;
  }
}
document.querySelectorAll("#trail-filters input, #trail-filters select").forEach(el => {
  if (el.id === "trail-sort") return;
  el.addEventListener("input", () => {
    if (el.classList.contains("range-lo") || el.classList.contains("range-hi")) {
      const base = el.id.replace(/-lo$/, "").replace(/-hi$/, "");
      clampRange(base + "-lo", base + "-hi");
    }
    trailPanelPage = 0;
    renderTrailPanel();
  });
});
document.getElementById("filter-clear").addEventListener("click", () => {
  document.querySelectorAll("#trail-filters input[type=text]").forEach(el => el.value = "");
  document.querySelectorAll("#trail-filters select").forEach(el => el.value = "");
  ["filter-min-excess", "filter-limit", "filter-min-duration"].forEach(id => {
    const lo = document.getElementById(id + "-lo");
    const hi = document.getElementById(id + "-hi");
    lo.value = lo.min;
    hi.value = hi.max;
  });
  trailPanelPage = 0;
  renderTrailPanel();
});

function makeBusIcon(speeding) {
  return L.divIcon({
    className: "bus-icon",
    html: '<div class="bus-dot ' + (speeding ? "bus-speeding" : "") + '"></div>',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

let trailChartInstance = null;

function showTrailChart(trail, s) {
  const ts = s.timeSeries;
  if (!ts || ts.length < 2) return;
  const t0 = ts[0].t;
  const labels = ts.map(p => (p.t - t0).toFixed(0));
  const speeds = ts.map(p => p.speed);
  const limits = ts.map(p => p.limit);

  const canvasId = "trail-canvas-" + Date.now();
  const avg = s.totalExcess / s.samples;
  const html =
    "<b>" + t("route") + ": " + s.route + "</b><br>" +
    t("operator") + ": " + (OPERATORS[s.oper] || s.oper) + "<br>" +
    t("avgExcess") + ": +" + avg.toFixed(1) + " km/h<br>" +
    '<canvas id="' + canvasId + '"></canvas>';

  trail.unbindPopup();
  trail.bindPopup(html, { className: "trail-popup", maxWidth: 400 });
  trail.openPopup();

  setTimeout(() => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    if (trailChartInstance) { trailChartInstance.destroy(); trailChartInstance = null; }
    trailChartInstance = new Chart(canvas, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: t("speedLabel"),
            data: speeds,
            borderColor: "#ff0000",
            backgroundColor: "rgba(255,0,0,0.1)",
            borderWidth: 2,
            pointRadius: 1,
            fill: false,
            tension: 0.3,
          },
          {
            label: t("limitLabel"),
            data: limits,
            borderColor: "#2ecc71",
            backgroundColor: "rgba(46,204,113,0.1)",
            borderWidth: 2,
            borderDash: [6, 3],
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { title: { display: true, text: t("timeAxis") } },
          y: { title: { display: true, text: "km/h" }, beginAtZero: false },
        },
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12 } },
        },
      },
    });
  }, 50);
}

function updateStatusBar() {
  document.getElementById("bus-status").textContent =
    t("busesLabel") + ": " + totalBuses + " | " + t("speedingLabel") + ": " + speedingCount;
}

const HFP_TOPIC = "/hfp/v2/journey/ongoing/vp/bus/#";
let mqttPaused = false;
let mqttClient = null;

function toggleHfp() {
  if (!mqttClient) return;
  const btn = document.getElementById("hfp-toggle");
  if (mqttPaused) {
    mqttClient.subscribe(HFP_TOPIC);
    mqttPaused = false;
    btn.textContent = t("pause");
    updateStatusBar();
  } else {
    mqttClient.unsubscribe(HFP_TOPIC);
    mqttPaused = true;
    btn.textContent = t("resume");
    document.getElementById("bus-status").textContent =
      t("busesPaused") + " (" + totalBuses + " " + t("onMap") + ")";
  }
}

document.getElementById("hfp-toggle").addEventListener("click", toggleHfp);

document.querySelectorAll(".lang-btn").forEach(btn => {
  btn.addEventListener("click", () => setLang(btn.getAttribute("data-lang")));
});
// Initialize language on load
setLang(lang);

function connectMqtt() {
  const client = mqtt.connect("wss://mqtt.hsl.fi:443/");
  mqttClient = client;

  client.on("connect", () => {
    console.log("Connected to HSL MQTT");
    client.subscribe(HFP_TOPIC);
    document.getElementById("bus-status").textContent = t("busesConnected");
    document.getElementById("hfp-toggle").style.display = "inline-block";
  });

  client.on("message", (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      const vp = data.VP;
      if (!vp || vp.lat == null || vp.long == null) return;

      const id = vp.oper + "_" + vp.veh;
      const lat = vp.lat;
      const lng = vp.long;
      const now = Date.now() / 1000;
      const speedKmh = vp.spd != null ? vp.spd * 3.6 : null;
      const speedStr = speedKmh != null ? speedKmh.toFixed(0) : "?";
      const route = vp.desi || "?";

      const limit = getSpeedLimit(lat, lng);
      const limitKmh = limit ? limit.maxspeed : null;
      const excess = (speedKmh != null && limitKmh != null) ? speedKmh - limitKmh : 0;
      const speeding = excess > SPEEDING_THRESHOLD;

      if (excess > SPEEDING_THRESHOLD && limitKmh != null) {
        if (!busSpeedingState[id]) {
          busSpeedingState[id] = {
            since: now,
            coords: [[lat, lng]],
            totalExcess: excess,
            samples: 1,
            route: route,
            oper: vp.oper,
            limitKmh: limitKmh,
            committed: false,
            timeSeries: [{ t: now, speed: speedKmh, limit: limitKmh }],
          };
        } else {
          const s = busSpeedingState[id];
          s.coords.push([lat, lng]);
          s.totalExcess += excess;
          s.samples++;
          s.limitKmh = limitKmh;
          s.timeSeries.push({ t: now, speed: speedKmh, limit: limitKmh });
          if (now - s.since >= SPEEDING_DURATION && !s.committed) {
            s.committed = true;
            s._trail = L.polyline(s.coords, {
              color: "#ff0000", weight: 5, opacity: 0.7, dashArray: "8 6",
            }).addTo(trailLayer);
            const avg = s.totalExcess / s.samples;
            s._trail.bindTooltip(
              "<b>" + t("trailTitle") + "</b><br>" + t("route") + ": " + s.route +
              "<br>" + t("operator") + ": " + (OPERATORS[s.oper] || s.oper) +
              "<br>" + t("vehicle") + ": " + id +
              "<br>" + t("avgExcess") + ": +" + avg.toFixed(1) + " km/h" +
              "<br>" + t("speedLimitLabel") + ": " + s.limitKmh + " km/h" +
              "<br>" + t("duration") + ": " + s.samples + " s",
              { sticky: true }
            );
            s._trail.on("click", () => showTrailChart(s._trail, s));
            addCommittedTrail(id, s);
          } else if (s.committed && s._trail) {
            s._trail.setLatLngs(s.coords);
            const avg = s.totalExcess / s.samples;
            s._trail.setTooltipContent(
              "<b>" + t("trailTitle") + "</b><br>" + t("route") + ": " + s.route +
              "<br>" + t("operator") + ": " + (OPERATORS[s.oper] || s.oper) +
              "<br>" + t("vehicle") + ": " + id +
              "<br>" + t("avgExcess") + ": +" + avg.toFixed(1) + " km/h" +
              "<br>" + t("speedLimitLabel") + ": " + s.limitKmh + " km/h" +
              "<br>" + t("duration") + ": " + s.samples + " s"
            );
          }
        }
      } else {
        delete busSpeedingState[id];
      }

      const popupHtml =
        "<b>" + t("bus") + " " + route + "</b><br>" +
        t("speed") + ": " + speedStr + " km/h<br>" +
        (limitKmh != null
          ? t("speedLimitLabel") + ": " + limitKmh + " km/h" + (limit.name ? " (" + limit.name + ")" : "") + "<br>"
          : "") +
        (speeding
          ? '<span style="color:red;font-weight:bold">' + t("speeding") + ': +' + excess.toFixed(0) + ' km/h</span><br>'
          : "") +
        t("operator") + ": " + (OPERATORS[vp.oper] || vp.oper) + "<br>" +
        t("vehicle") + ": " + id;

      const prev = busMarkers[id];
      const wasSpeeding = prev ? prev._speeding : false;

      if (prev) {
        prev.setLatLng([lat, lng]);
        prev.setPopupContent(popupHtml);
        if (wasSpeeding !== speeding) {
          prev.setIcon(makeBusIcon(speeding));
          prev._speeding = speeding;
          speedingCount += speeding ? 1 : -1;
        }
      } else {
        const marker = L.marker([lat, lng], { icon: makeBusIcon(speeding) })
          .addTo(map)
          .bindPopup(popupHtml);
        marker._speeding = speeding;
        busMarkers[id] = marker;
        totalBuses++;
        if (speeding) speedingCount++;
      }
      updateStatusBar();
    } catch (e) {}
  });

  client.on("error", (err) => {
    console.error("MQTT error:", err);
    document.getElementById("bus-status").textContent = t("busesError");
  });
}
`;

const Layout: FC = ({ children }) => (
  <html lang="fi">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Helsingin seutu — nopeusrajoitukset</title>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: system-ui, sans-serif; }
        #map { height: 100vh; width: 100%; }
        .legend {
          background: white;
          padding: 12px 16px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          line-height: 1.8;
        }
        .legend h4 { margin-bottom: 4px; }
        .legend-item { display: flex; align-items: center; gap: 8px; }
        .legend-color { width: 24px; height: 4px; border-radius: 2px; }
        .loading {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          z-index: 1000; background: white;
          padding: 20px 32px; border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          font-family: system-ui; font-size: 16px;
        }
        .bus-dot {
          width: 12px; height: 12px;
          background: #0078ff;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.4);
          transition: background 0.3s;
        }
        .bus-dot.bus-speeding {
          background: #ff0000;
          width: 14px; height: 14px;
          border: 2px solid #ffff00;
          box-shadow: 0 0 8px rgba(255,0,0,0.6);
        }
        .bus-icon { background: none; border: none; }
        .top-bar {
          position: absolute; top: 10px; right: 10px;
          z-index: 1000; display: flex; gap: 8px; align-items: center;
        }
        #bus-status {
          background: white;
          padding: 6px 12px; border-radius: 6px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          font-family: system-ui; font-size: 13px;
        }
        #hfp-toggle {
          display: none;
          background: white; border: 1px solid #ccc;
          padding: 6px 14px; border-radius: 6px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          font-family: system-ui; font-size: 13px;
          cursor: pointer;
        }
        #hfp-toggle:hover { background: #f0f0f0; }
        .trail-popup .leaflet-popup-content { width: 360px !important; }
        .trail-popup .leaflet-popup-content canvas { width: 100% !important; height: 200px !important; }
        #trail-panel {
          position: absolute; top: 0; right: -360px;
          width: 360px; height: 100vh;
          background: white; z-index: 1001;
          box-shadow: -2px 0 8px rgba(0,0,0,0.2);
          transition: right 0.3s ease;
          display: flex; flex-direction: column;
        }
        #trail-panel.open { right: 0; }
        #trail-panel-header {
          padding: 12px 16px;
          font-weight: bold; font-size: 15px;
          border-bottom: 1px solid #eee;
          display: flex; justify-content: space-between; align-items: center;
        }
        #trail-panel-header button {
          background: none; border: none; font-size: 18px; cursor: pointer; color: #666;
        }
        #trail-list { flex: 1; overflow-y: auto; }
        .trail-list-item {
          padding: 10px 16px; border-bottom: 1px solid #f0f0f0;
          cursor: pointer; transition: background 0.15s;
          display: flex; align-items: center; gap: 10px;
        }
        .trail-list-item:hover { background: #f8f8f8; }
        .trail-list-info { flex: 1; min-width: 0; }
        .trail-list-route { font-weight: 600; font-size: 14px; color: #c0392b; }
        .trail-list-detail { font-size: 12px; color: #666; margin-top: 2px; }
        .trail-sparkline { flex-shrink: 0; }
        #trail-show-more {
          display: none; padding: 10px; text-align: center;
          background: #f8f8f8; border: none; border-top: 1px solid #eee;
          cursor: pointer; font-size: 13px; color: #3498db;
        }
        #trail-show-more:hover { background: #eee; }
        #trail-panel-toggle {
          background: white; border: 1px solid #ccc;
          padding: 6px 14px; border-radius: 6px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          font-family: system-ui; font-size: 13px;
          cursor: pointer;
        }
        #trail-panel-toggle:hover { background: #f0f0f0; }
        #trail-filters {
          padding: 8px 12px; border-bottom: 1px solid #eee;
          background: #fafafa; font-size: 12px;
        }
        .filter-row {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 4px;
        }
        .filter-row label {
          width: 100px; flex-shrink: 0; color: #555;
        }
        .filter-row input[type=text], .filter-row select {
          flex: 1; padding: 3px 6px; border: 1px solid #ddd;
          border-radius: 4px; font-size: 12px; font-family: system-ui;
        }
        .combo-wrap {
          flex: 1; position: relative;
        }
        .combo-wrap input {
          width: 100%; box-sizing: border-box;
        }
        .combo-dropdown {
          display: none; position: absolute; left: 0; right: 0; top: 100%;
          max-height: 180px; overflow-y: auto; background: white;
          border: 1px solid #ddd; border-top: none; border-radius: 0 0 4px 4px;
          z-index: 10; box-shadow: 0 4px 8px rgba(0,0,0,.12);
        }
        .combo-dropdown.open { display: block; }
        .combo-item {
          padding: 4px 8px; cursor: pointer; font-size: 12px;
        }
        .combo-item:hover, .combo-item.active {
          background: #e8f0fe;
        }
        .range-wrap {
          flex: 1; position: relative; height: 20px;
        }
        .range-wrap input[type=range] {
          position: absolute; left: 0; top: 0; width: 100%;
          height: 4px; cursor: pointer; pointer-events: none;
          -webkit-appearance: none; appearance: none;
          background: transparent; margin: 8px 0;
        }
        .range-wrap input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 14px; height: 14px; border-radius: 50%;
          background: #c0392b; cursor: pointer; pointer-events: auto;
          border: 2px solid white; box-shadow: 0 0 2px rgba(0,0,0,.3);
        }
        .range-wrap input[type=range]::-moz-range-thumb {
          width: 14px; height: 14px; border-radius: 50%;
          background: #c0392b; cursor: pointer; pointer-events: auto;
          border: 2px solid white; box-shadow: 0 0 2px rgba(0,0,0,.3);
        }
        .range-wrap .range-lo::-webkit-slider-runnable-track {
          height: 4px; background: #ddd; border-radius: 2px;
        }
        .range-wrap .range-hi::-webkit-slider-runnable-track {
          height: 4px; background: transparent; border-radius: 2px;
        }
        .range-wrap .range-lo::-moz-range-track {
          height: 4px; background: #ddd; border-radius: 2px;
        }
        .range-wrap .range-hi::-moz-range-track {
          height: 4px; background: transparent; border-radius: 2px;
        }
        .slider-val {
          min-width: 52px; text-align: right; font-size: 11px;
          color: #333; font-variant-numeric: tabular-nums;
        }
        #filter-clear {
          padding: 3px 10px; border: 1px solid #ccc; border-radius: 4px;
          background: white; cursor: pointer; font-size: 11px; color: #666;
        }
        #filter-clear:hover { background: #eee; }
        .lang-switcher {
          display: flex; gap: 2px;
          background: white; border-radius: 6px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          overflow: hidden;
        }
        .lang-btn {
          padding: 6px 10px; border: none;
          background: white; cursor: pointer;
          font-family: system-ui; font-size: 12px;
          font-weight: 600; color: #666;
        }
        .lang-btn.active { background: #3498db; color: white; }
        .lang-btn:hover:not(.active) { background: #f0f0f0; }
      `}</style>
    </head>
    <body>{children}</body>
  </html>
);

const MapPage: FC = () => (
  <Layout>
    <div id="map" />
    <div class="loading" id="loading" data-i18n="loading">Ladataan dataa...</div>
    <div class="top-bar">
      <div class="lang-switcher">
        <button class="lang-btn active" data-lang="fi">FI</button>
        <button class="lang-btn" data-lang="en">EN</button>
      </div>
      <div id="bus-status" data-i18n="busesConnecting">Bussit: yhdistetään...</div>
      <button id="hfp-toggle" data-i18n="pause">Pysäytä</button>
      <button id="trail-panel-toggle" data-i18n="speedingTrails">Ylinopeudet</button>
    </div>
    <div id="trail-panel">
      <div id="trail-panel-header">
        <span><span data-i18n="speedingTrails">Ylinopeudet</span> <small id="trail-count" style="font-weight:normal;color:#999"></small></span>
        <button onclick="toggleTrailPanel()">&times;</button>
      </div>
      <div id="trail-filters">
        <div class="filter-row">
          <label data-i18n="filterRoute">Linja</label>
          <div class="combo-wrap">
            <input id="filter-route" type="text" placeholder="esim. 550" data-i18n-placeholder="filterRoutePlaceholder" autocomplete="off" />
            <div id="filter-route-dropdown" class="combo-dropdown" />
          </div>
        </div>
        <div class="filter-row">
          <label data-i18n="filterOperator">Liikennöitsijä</label>
          <select id="filter-oper"><option value="">Kaikki</option></select>
        </div>
        <div class="filter-row">
          <label data-i18n="filterVehicle">Ajoneuvo</label>
          <div class="combo-wrap">
            <input id="filter-veh" type="text" placeholder="esim. 22_801" data-i18n-placeholder="filterVehiclePlaceholder" autocomplete="off" />
            <div id="filter-veh-dropdown" class="combo-dropdown" />
          </div>
        </div>
        <div class="filter-row">
          <label data-i18n="filterMinExcess">Min. ylinopeus</label>
          <div class="range-wrap">
            <input id="filter-min-excess-lo" class="range-lo" type="range" min="3" max="20" value="3" step="1" />
            <input id="filter-min-excess-hi" class="range-hi" type="range" min="3" max="20" value="20" step="1" />
          </div>
          <span class="slider-val" id="filter-min-excess-val">Kaikki</span>
        </div>
        <div class="filter-row">
          <label data-i18n="filterLimit">Rajoitus</label>
          <div class="range-wrap">
            <input id="filter-limit-lo" class="range-lo" type="range" min="0" max="120" value="0" step="10" />
            <input id="filter-limit-hi" class="range-hi" type="range" min="0" max="120" value="120" step="10" />
          </div>
          <span class="slider-val" id="filter-limit-val">Kaikki</span>
        </div>
        <div class="filter-row">
          <label data-i18n="filterMinDuration">Min. kesto</label>
          <div class="range-wrap">
            <input id="filter-min-duration-lo" class="range-lo" type="range" min="5" max="60" value="5" step="5" />
            <input id="filter-min-duration-hi" class="range-hi" type="range" min="5" max="60" value="60" step="5" />
          </div>
          <span class="slider-val" id="filter-min-duration-val">Kaikki</span>
        </div>
        <div class="filter-row">
          <label data-i18n="sortLabel">Järjestys</label>
          <select id="trail-sort">
            <option value="recent">Uusin ensin</option>
            <option value="excess">Ylinopeus</option>
            <option value="duration">Kesto</option>
          </select>
        </div>
        <div class="filter-row" style="justify-content:flex-end">
          <button id="filter-clear" data-i18n="filterClear">Tyhjennä</button>
        </div>
      </div>
      <div id="trail-list" />
      <button id="trail-show-more" data-i18n="showMore">Näytä lisää</button>
    </div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" />
    <script src="https://unpkg.com/mqtt@5.10.4/dist/mqtt.min.js" />
    <script src="https://unpkg.com/chart.js@4/dist/chart.umd.min.js" />
    <script dangerouslySetInnerHTML={{ __html: clientScript }} />
  </Layout>
);

export const app = new Hono();

app.get("/", (c) => c.html(<MapPage />));

export async function renderHtml(): Promise<string> {
  const res = await app.fetch(new Request("http://localhost/"));
  return res.text();
}
