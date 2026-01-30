import { existsSync, readFileSync, writeFileSync } from "node:fs";

interface Road {
  name: string | null;
  maxspeed: string | null;
  highway: string;
  coords: [number, number][];
}

interface OverpassElement {
  type: "node" | "way";
  id: number;
  lat?: number;
  lon?: number;
  nodes?: number[];
  tags?: Record<string, string>;
}

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const MUNICIPALITIES = [
  "Helsinki",
  "Espoo",
  "Vantaa",
  "Kauniainen",
  "Kirkkonummi",
  "Sipoo",
  "Tuusula",
  "Kerava",
  "Järvenpää",
  "Nurmijärvi",
  "Vihti",
  "Hyvinkää",
  "Mäntsälä",
  "Pornainen",
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(
  url: string,
  opts: RequestInit,
  retries = 3
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, opts);
    if (res.ok) return res;
    if ((res.status === 429 || res.status === 504) && i < retries - 1) {
      const wait = 30 * (i + 1);
      console.log(`    Rate limited, waiting ${wait}s...`);
      await sleep(wait * 1000);
      continue;
    }
    throw new Error(`Overpass API error: ${res.status} ${res.statusText}`);
  }
  throw new Error("Unreachable");
}

async function fetchMunicipality(name: string): Promise<Road[]> {
  const query = `
[out:json][timeout:180];
area["name"="${name}"]["admin_level"="8"]->.a;
way["highway"]["maxspeed"](area.a);
(._;>;);
out body;
`;
  console.log(`  Fetching ${name}...`);
  const res = await fetchWithRetry(OVERPASS_URL, {
    method: "POST",
    body: `data=${encodeURIComponent(query)}`,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const data: { elements: OverpassElement[] } = await res.json();

  const nodes: Record<number, [number, number]> = {};
  const roads: Road[] = [];

  for (const el of data.elements) {
    if (el.type === "node" && el.lat !== undefined && el.lon !== undefined) {
      nodes[el.id] = [el.lat, el.lon];
    }
  }

  for (const el of data.elements) {
    if (el.type === "way" && el.nodes) {
      roads.push({
        name: el.tags?.name ?? null,
        maxspeed: el.tags?.maxspeed ?? null,
        highway: el.tags?.highway ?? "unknown",
        coords: el.nodes.map((id) => nodes[id]).filter(Boolean) as [number, number][],
      });
    }
  }

  console.log(`  ${name}: ${roads.length} segments`);
  return roads;
}

async function main() {
  console.log("Fetching Helsinki region speed limit data...");

  const allRoads: Road[] = [];
  const cache: Record<string, Road[]> = existsSync("helsinki-speeds-partial.json")
    ? JSON.parse(readFileSync("helsinki-speeds-partial.json", "utf-8"))
    : {};

  for (const muni of MUNICIPALITIES) {
    if (cache[muni]) {
      console.log(`  ${muni}: ${cache[muni]!.length} segments (cached)`);
      allRoads.push(...cache[muni]!);
      continue;
    }
    const roads = await fetchMunicipality(muni);
    allRoads.push(...roads);
    cache[muni] = roads;
    writeFileSync("helsinki-speeds-partial.json", JSON.stringify(cache));
    await sleep(15000);
  }

  writeFileSync("helsinki-speeds.json", JSON.stringify(allRoads));
  console.log(`\nSaved ${allRoads.length} road segments to helsinki-speeds.json`);

  const speeds: Record<string, number> = {};
  for (const r of allRoads) {
    const s = r.maxspeed || "unknown";
    speeds[s] = (speeds[s] ?? 0) + 1;
  }
  console.log("Speed distribution:", speeds);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
