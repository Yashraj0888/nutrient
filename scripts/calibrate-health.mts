import { __calibrateFoodHealth } from "../lib/food-health";

const results = __calibrateFoodHealth();
console.log("\nFood health calibration:\n");
for (const r of results) {
  const mark = r.ok ? "✓" : "✗";
  console.log(`${mark} ${r.name.padEnd(16)} score=${r.score} (${r.label}) expected=${r.expect} got=${r.bucket}`);
}
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) process.exit(1);
