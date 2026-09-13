// Minimal dependency-free test runner (Node, ESM). Each tests/*.test.js file
// exports an array of { name, fn } cases via `export const tests = [...]`.
import { readdirSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

const testsDir = path.dirname(fileURLToPath(import.meta.url));

const files = readdirSync(testsDir).filter((f) => f.endsWith('.test.js'));

let passed = 0;
let failed = 0;

for (const file of files) {
  const mod = await import(pathToFileURL(path.join(testsDir, file)).href);
  for (const { name, fn } of mod.tests ?? []) {
    try {
      fn();
      passed += 1;
      console.log(`  ok  ${file} :: ${name}`);
    } catch (err) {
      failed += 1;
      console.error(`FAIL  ${file} :: ${name}`);
      console.error(`      ${err.message}`);
    }
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
