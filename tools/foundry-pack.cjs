const fs = require("node:fs");
const path = require("node:path");
const { ClassicLevel } = require("classic-level");

const action = process.argv[2];
const root = path.resolve(__dirname, "..");
const packPath = path.join(root, "packs", "gm-macros");
const sourcePath = path.join(root, "packs", "_source", "gm-macros");

if (!new Set(["pack", "unpack"]).has(action)) {
  console.error("Usage: foundry-pack.cjs <pack|unpack>");
  process.exit(1);
}

async function unpack() {
  const db = new ClassicLevel(packPath, { keyEncoding: "utf8", valueEncoding: "utf8" });
  const temporaryPath = `${sourcePath}.tmp`;
  fs.rmSync(temporaryPath, { recursive: true, force: true });
  fs.mkdirSync(temporaryPath, { recursive: true });

  let count = 0;
  try {
    for await (const [key, rawValue] of db.iterator()) {
      const value = JSON.parse(rawValue);
      const id = value._id ?? key.replace(/^.*!/, "");
      const record = { _key: key, ...value };
      fs.writeFileSync(path.join(temporaryPath, `${id}.json`), `${JSON.stringify(record, null, 2)}\n`);
      count += 1;
    }
  } finally {
    await db.close();
  }

  fs.rmSync(sourcePath, { recursive: true, force: true });
  fs.renameSync(temporaryPath, sourcePath);
  console.log(`Exported ${count} record(s) to packs/_source/gm-macros.`);
}

async function pack() {
  const files = fs.readdirSync(sourcePath).filter((file) => file.endsWith(".json")).sort();
  if (!files.length) throw new Error("No macro source files found.");

  const records = files.map((file) => {
    const record = JSON.parse(fs.readFileSync(path.join(sourcePath, file), "utf8"));
    const key = record._key;
    if (!key) throw new Error(`${file} does not define _key.`);
    delete record._key;
    return [key, JSON.stringify(record)];
  });
  if (new Set(records.map(([key]) => key)).size !== records.length) {
    throw new Error("Macro source contains duplicate LevelDB keys.");
  }

  const temporaryPath = `${packPath}.tmp`;
  fs.rmSync(temporaryPath, { recursive: true, force: true });
  const db = new ClassicLevel(temporaryPath, { keyEncoding: "utf8", valueEncoding: "utf8", createIfMissing: true });
  try {
    for (const [key, value] of records) {
      await db.put(key, value);
    }
  } finally {
    await db.close();
  }
  fs.rmSync(packPath, { recursive: true, force: true });
  fs.renameSync(temporaryPath, packPath);
  console.log(`Built packs/gm-macros from ${files.length} source record(s).`);
}

(action === "pack" ? pack() : unpack()).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
