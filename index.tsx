import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
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

const map = L.map("map").setView([60.25, 24.93], 11);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const legend = L.control({ position: "bottomright" });
legend.onAdd = () => {
  const div = L.DomUtil.create("div", "legend");
  div.innerHTML = "<h4>Nopeusrajoitus</h4>" +
    Object.entries(COLORS).map(([speed, color]) =>
      '<div class="legend-item">' +
      '<span class="legend-color" style="background:' + color + '"></span>' +
      speed + ' km/h</div>'
    ).join("") +
    '<div class="legend-item"><span class="legend-color" style="background:' + DEFAULT_COLOR + '"></span>Muu</div>';
  return div;
};
legend.addTo(map);

// --- Spatial grid index for speed limit lookup ---
const GRID_SIZE = 0.002; // ~200m cells
const grid = {};
let speedingCount = 0;
let totalBuses = 0;

function gridKey(lat, lng) {
  return Math.floor(lat / GRID_SIZE) + "," + Math.floor(lng / GRID_SIZE);
}

function distSq(lat1, lng1, lat2, lng2) {
  const dlat = lat1 - lat2;
  const dlng = (lng1 - lng2) * 0.55; // rough cos(60°) correction
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
  // Check 3x3 neighboring cells
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
  // Only match if within ~50m (0.0005° ≈ 55m)
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
        "<b>" + (road.name || "Nimetön tie") + "</b><br>" +
        "Tyyppi: " + (road.highway || "-") + "<br>" +
        "Nopeusrajoitus: " + (road.maxspeed ? road.maxspeed + " km/h" : "Ei tiedossa")
      );
    });
    connectMqtt();
  });

// --- HSL real-time buses via MQTT ---
const busMarkers = {};
// Track speeding state per bus: { since, coords, totalExcess, samples }
const busSpeedingState = {};
const SPEEDING_THRESHOLD = 3; // km/h over limit
const SPEEDING_DURATION = 3;  // seconds

const trailLayer = L.layerGroup().addTo(map);

function makeBusIcon(speeding) {
  return L.divIcon({
    className: "bus-icon",
    html: '<div class="bus-dot ' + (speeding ? "bus-speeding" : "") + '"></div>',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

function updateStatusBar() {
  document.getElementById("bus-status").textContent =
    "Bussit: " + totalBuses + " | Ylinopeudella: " + speedingCount;
}

function commitTrail(id, state) {
  if (state.coords.length < 2) return;
  const avgExcess = state.totalExcess / state.samples;
  const trail = L.polyline(state.coords, {
    color: "#ff0000",
    weight: 5,
    opacity: 0.7,
    dashArray: "8 6",
  }).addTo(trailLayer);
  const tooltip =
    "<b>Ylinopeus-trail</b><br>" +
    "Linja: " + state.route + "<br>" +
    "Liikennöitsijä: " + (OPERATORS[state.oper] || state.oper) + "<br>" +
    "Ajoneuvo: " + id + "<br>" +
    "Keskim. ylinopeus: +" + avgExcess.toFixed(1) + " km/h<br>" +
    "Rajoitus: " + state.limitKmh + " km/h<br>" +
    "Kesto: " + state.samples + " s";
  trail.bindTooltip(tooltip, { sticky: true });
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
    btn.textContent = "Pysäytä";
    document.getElementById("bus-status").textContent =
      "Bussit: " + totalBuses + " | Ylinopeudella: " + speedingCount;
  } else {
    mqttClient.unsubscribe(HFP_TOPIC);
    mqttPaused = true;
    btn.textContent = "Jatka";
    document.getElementById("bus-status").textContent =
      "Bussit: pysäytetty (" + totalBuses + " kartalla)";
  }
}

document.getElementById("hfp-toggle").addEventListener("click", toggleHfp);

function connectMqtt() {
  const client = mqtt.connect("wss://mqtt.hsl.fi:443/");
  mqttClient = client;

  client.on("connect", () => {
    console.log("Connected to HSL MQTT");
    client.subscribe(HFP_TOPIC);
    document.getElementById("bus-status").textContent = "Bussit: yhdistetty";
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

      // --- Speeding trail tracking ---
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
          };
        } else {
          const s = busSpeedingState[id];
          s.coords.push([lat, lng]);
          s.totalExcess += excess;
          s.samples++;
          s.limitKmh = limitKmh;
          // Commit trail once duration threshold met, then keep extending
          if (now - s.since >= SPEEDING_DURATION && !s.committed) {
            s.committed = true;
            s._trail = L.polyline(s.coords, {
              color: "#ff0000", weight: 5, opacity: 0.7, dashArray: "8 6",
            }).addTo(trailLayer);
            const avg = s.totalExcess / s.samples;
            s._trail.bindTooltip(
              "<b>Ylinopeus-trail</b><br>Linja: " + s.route +
              "<br>Liikennöitsijä: " + (OPERATORS[s.oper] || s.oper) +
              "<br>Ajoneuvo: " + id +
              "<br>Keskim. ylinopeus: +" + avg.toFixed(1) + " km/h" +
              "<br>Rajoitus: " + s.limitKmh + " km/h" +
              "<br>Kesto: " + s.samples + " s",
              { sticky: true }
            );
          } else if (s.committed && s._trail) {
            // Extend existing trail polyline
            s._trail.setLatLngs(s.coords);
            const avg = s.totalExcess / s.samples;
            s._trail.setTooltipContent(
              "<b>Ylinopeus-trail</b><br>Linja: " + s.route +
              "<br>Liikennöitsijä: " + (OPERATORS[s.oper] || s.oper) +
              "<br>Ajoneuvo: " + id +
              "<br>Keskim. ylinopeus: +" + avg.toFixed(1) + " km/h" +
              "<br>Rajoitus: " + s.limitKmh + " km/h" +
              "<br>Kesto: " + s.samples + " s"
            );
          }
        }
      } else {
        // Speeding ended — finalize trail if it was short-lived uncommitted
        if (busSpeedingState[id] && !busSpeedingState[id].committed) {
          // Duration too short, discard
        }
        delete busSpeedingState[id];
      }

      // --- Bus marker ---
      const popupHtml =
        "<b>Bussi " + route + "</b><br>" +
        "Nopeus: " + speedStr + " km/h<br>" +
        (limitKmh != null
          ? "Rajoitus: " + limitKmh + " km/h" + (limit.name ? " (" + limit.name + ")" : "") + "<br>"
          : "") +
        (speeding
          ? '<span style="color:red;font-weight:bold">Ylinopeus: +' + excess.toFixed(0) + ' km/h</span><br>'
          : "") +
        "Liikennöitsijä: " + (OPERATORS[vp.oper] || vp.oper) + "<br>" +
        "Ajoneuvo: " + id;

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
    document.getElementById("bus-status").textContent = "Bussit: virhe";
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
      `}</style>
    </head>
    <body>{children}</body>
  </html>
);

const MapPage: FC = () => (
  <Layout>
    <div id="map" />
    <div class="loading" id="loading">Ladataan dataa...</div>
    <div class="top-bar">
      <div id="bus-status">Bussit: yhdistetään...</div>
      <button id="hfp-toggle">Pysäytä</button>
    </div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" />
    <script src="https://unpkg.com/mqtt@5.10.4/dist/mqtt.min.js" />
    <script dangerouslySetInnerHTML={{ __html: clientScript }} />
  </Layout>
);

const app = new Hono();

app.use("/helsinki-speeds.json", serveStatic({ root: "./public" }));
app.get("/", (c) => c.html(<MapPage />));

serve({ fetch: app.fetch, port: 3000 }, (info) => {
  console.log(`http://localhost:${info.port}`);
});
