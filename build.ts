import { writeFileSync, copyFileSync, mkdirSync } from "node:fs";

// Dynamic import to get the app module with JSX
const mod = await import("./app.tsx");
const html = await mod.renderHtml();

mkdirSync("dist", { recursive: true });
writeFileSync("dist/index.html", html);
copyFileSync("public/helsinki-speeds.json", "dist/helsinki-speeds.json");
console.log("Built dist/index.html + dist/helsinki-speeds.json");
