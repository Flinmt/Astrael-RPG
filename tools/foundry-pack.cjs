const fs = require("node:fs");
const path = require("node:path");
const { ClassicLevel } = require("classic-level");

const action = process.argv[2];
const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "system.json"), "utf8"));
const requestedPack = process.argv[3];
const packs = manifest.packs.map((pack) => ({
  ...pack,
  packPath: path.join(root, pack.path),
  sourcePath: path.join(root, "packs", "_source", pack.name)
}));

if (!new Set(["pack", "unpack"]).has(action)) {
  console.error("Usage: foundry-pack.cjs <pack|unpack> [pack-name]");
  process.exit(1);
}

const selectedPacks = requestedPack ? packs.filter(({ name }) => name === requestedPack) : packs;
if (!selectedPacks.length) {
  console.error(`Unknown pack: ${requestedPack}`);
  process.exit(1);
}

async function unpack(pack) {
  if (!fs.existsSync(pack.packPath)) throw new Error(`Missing generated pack: ${pack.path}`);
  const db = new ClassicLevel(pack.packPath, { keyEncoding: "utf8", valueEncoding: "utf8" });
  const temporaryPath = `${pack.sourcePath}.tmp`;
  fs.rmSync(temporaryPath, { recursive: true, force: true });
  fs.mkdirSync(temporaryPath, { recursive: true });

  let count = 0;
  try {
    await db.open();
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

  fs.writeFileSync(path.join(temporaryPath, ".gitkeep"), "");
  fs.rmSync(pack.sourcePath, { recursive: true, force: true });
  fs.renameSync(temporaryPath, pack.sourcePath);
  console.log(`Exported ${count} record(s) to packs/_source/${pack.name}.`);
}

async function buildPack(pack) {
  const files = fs.readdirSync(pack.sourcePath).filter((file) => file.endsWith(".json")).sort();

  const records = files.map((file) => {
    const record = JSON.parse(fs.readFileSync(path.join(pack.sourcePath, file), "utf8"));
    const key = record._key;
    if (!key) throw new Error(`${file} does not define _key.`);
    delete record._key;
    return [key, JSON.stringify(record)];
  });
  if (new Set(records.map(([key]) => key)).size !== records.length) {
    throw new Error(`${pack.name} source contains duplicate LevelDB keys.`);
  }

  const temporaryPath = `${pack.packPath}.tmp`;
  fs.rmSync(temporaryPath, { recursive: true, force: true });
  const db = new ClassicLevel(temporaryPath, { keyEncoding: "utf8", valueEncoding: "utf8", createIfMissing: true });
  try {
    await db.open();
    for (const [key, value] of records) {
      await db.put(key, value);
    }
  } finally {
    await db.close();
  }
  fs.rmSync(pack.packPath, { recursive: true, force: true });
  fs.renameSync(temporaryPath, pack.packPath);
  console.log(`Built packs/${pack.name} from ${files.length} source record(s).`);
}

(async () => {
  for (const pack of selectedPacks) await (action === "pack" ? buildPack(pack) : unpack(pack));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
