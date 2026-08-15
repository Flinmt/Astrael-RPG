const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const manifest = readJson("system.json");
const locales = Object.fromEntries(manifest.languages.map(({ lang, path: localePath }) => [lang, readJson(localePath)]));
const errors = [];

for (const relativePath of [...manifest.esmodules, ...manifest.styles, ...manifest.languages.map(({ path: localePath }) => localePath)]) {
  if (!fs.existsSync(path.join(root, relativePath))) errors.push(`Missing manifest path: ${relativePath}`);
}

const [referenceLocale, ...otherLocales] = Object.entries(locales);
const referenceKeys = Object.keys(referenceLocale[1]).sort();
for (const [locale, messages] of otherLocales) {
  const keys = Object.keys(messages).sort();
  const missing = referenceKeys.filter((key) => !Object.hasOwn(messages, key));
  const extra = keys.filter((key) => !Object.hasOwn(referenceLocale[1], key));
  if (missing.length) errors.push(`${locale} is missing localization keys: ${missing.join(", ")}`);
  if (extra.length) errors.push(`${locale} has extra localization keys: ${extra.join(", ")}`);
}

const sourceFiles = [
  "scripts/astrael-rpg.js",
  ...fs.readdirSync(path.join(root, "templates"), { recursive: true })
    .filter((entry) => entry.endsWith(".hbs"))
    .map((entry) => path.join("templates", entry))
];
const templateFiles = sourceFiles.filter((relativePath) => relativePath.endsWith(".hbs"));
const usedKeys = new Set();
for (const relativePath of sourceFiles) {
  const source = fs.readFileSync(path.join(root, relativePath), "utf8");
  for (const match of source.matchAll(/ASTRAEL\.[A-Za-z0-9.]+/g)) usedKeys.add(match[0]);
}
const missingUsedKeys = [...usedKeys].filter((key) => !Object.hasOwn(referenceLocale[1], key)).sort();
if (missingUsedKeys.length) errors.push(`Missing localization keys used by source: ${missingUsedKeys.join(", ")}`);

for (const relativePath of templateFiles) {
  const source = fs.readFileSync(path.join(root, relativePath), "utf8");
  const stack = [];
  for (const match of source.matchAll(/{{([#/])(if|each|unless)\b[^}]*}}/g)) {
    if (match[1] === "#") stack.push(match[2]);
    else if (stack.pop() !== match[2]) errors.push(`Unbalanced Handlebars block in ${relativePath}: ${match[0]}`);
  }
  if (stack.length) errors.push(`Unclosed Handlebars blocks in ${relativePath}: ${stack.join(", ")}`);
}

for (const relativePath of manifest.styles) {
  const source = fs.readFileSync(path.join(root, relativePath), "utf8");
  const openingBraces = source.match(/{/g)?.length ?? 0;
  const closingBraces = source.match(/}/g)?.length ?? 0;
  if (openingBraces !== closingBraces) errors.push(`Unbalanced CSS braces in ${relativePath}`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated manifest paths and ${referenceKeys.length} synchronized localization keys.`);
}
