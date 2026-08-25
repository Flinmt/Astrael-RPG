const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const manifest = readJson("system.json");
const locales = Object.fromEntries(manifest.languages.map(({ lang, path: localePath }) => [lang, readJson(localePath)]));
const errors = [];
const listFiles = (directory, extension) => fs.readdirSync(path.join(root, directory), { recursive: true })
  .filter((entry) => entry.endsWith(extension))
  .map((entry) => path.join(directory, entry));

for (const relativePath of [...manifest.esmodules, ...manifest.styles, ...manifest.languages.map(({ path: localePath }) => localePath)]) {
  if (!fs.existsSync(path.join(root, relativePath))) errors.push(`Missing manifest path: ${relativePath}`);
}

const packNames = new Set();
for (const pack of manifest.packs ?? []) {
  if (!pack.name || !pack.label || !pack.type || !pack.system || !pack.path) {
    errors.push(`Incomplete pack configuration: ${JSON.stringify(pack)}`);
    continue;
  }
  if (packNames.has(pack.name)) errors.push(`Duplicate pack name: ${pack.name}`);
  packNames.add(pack.name);
  if (!fs.existsSync(path.join(root, "packs", "_source", pack.name))) {
    errors.push(`Missing pack source directory: packs/_source/${pack.name}`);
  } else {
    for (const entry of fs.readdirSync(path.join(root, "packs", "_source", pack.name))) {
      if (!entry.endsWith(".json")) continue;
      const recordPath = `packs/_source/${pack.name}/${entry}`;
      let record = null;
      try {
        record = readJson(recordPath);
      } catch {
        errors.push(`Invalid pack source JSON: ${recordPath}`);
        continue;
      }
      for (const field of ["_key", "_id", "name", "type"]) {
        if (!record[field]) errors.push(`Missing ${field} in ${recordPath}`);
      }
      if (record.type) {
        const allowedTypes = manifest.documentTypes?.[pack.type];
        const typeList = Array.isArray(allowedTypes) ? allowedTypes : Object.keys(allowedTypes ?? {});
        if (typeList.length && !typeList.includes(record.type)) {
          errors.push(`Pack source type mismatch in ${recordPath}: ${record.type}`);
        }
      }
    }
  }
  if (pack.label.startsWith("ASTRAEL.") && !Object.hasOwn(locales.en, pack.label)) {
    errors.push(`Missing localization key for pack label: ${pack.label}`);
  }
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

const scriptFiles = listFiles("scripts", ".js");
const sourceFiles = [...scriptFiles, ...listFiles("templates", ".hbs")];
const templateFiles = sourceFiles.filter((relativePath) => relativePath.endsWith(".hbs"));

for (const relativePath of scriptFiles) {
  try {
    new vm.SourceTextModule(fs.readFileSync(path.join(root, relativePath), "utf8"), { identifier: relativePath });
  } catch (error) {
    errors.push(`Invalid JavaScript in ${relativePath}: ${error.message}`);
  }

  const source = fs.readFileSync(path.join(root, relativePath), "utf8");
  for (const match of source.matchAll(/(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?["'](\.{1,2}\/[^"']+)["']/g)) {
    const importedPath = path.resolve(path.dirname(path.join(root, relativePath)), match[1]);
    if (!fs.existsSync(importedPath)) errors.push(`Missing local import in ${relativePath}: ${match[1]}`);
  }
}
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
