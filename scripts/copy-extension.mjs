import { copyFile } from "node:fs/promises";

await Promise.all([
  copyFile("extension/manifest.json", "dist/extension/manifest.json"),
  copyFile("extension/service-worker.js", "dist/extension/service-worker.js"),
]);
console.log("Built the demo site and unpacked Chrome extension.");
