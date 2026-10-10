import { validateZipEntryName, assertRejectsPath, ZipEntryPathTracker, hasSupportedZipMagic } from "../src/zip-safety.js";
import yauzl from "yauzl";
import assert from "node:assert/strict";

validateZipEntryName("pet-package/");
validateZipEntryName("pet-package/pet.json");
validateZipEntryName("pet-package/spritesheet.webp");
validateZipEntryName("pet.json");
validateZipEntryName("spritesheet.webp");

const validTracker = new ZipEntryPathTracker();
validTracker.accept("pet-package/");
validTracker.accept("pet-package/pet.json");
validTracker.accept("pet-package/spritesheet.webp");

const validFlatTracker = new ZipEntryPathTracker();
validFlatTracker.accept("pet.json");
validFlatTracker.accept("spritesheet.webp");

// 只有本地共创选项允许精确分享说明；仍遵守同一布局及重复路径规则。
assert.throws(() => validateZipEntryName("SHARE.md"));
assert.equal(validateZipEntryName("SHARE.md", true).relativeOutputPath, "SHARE.md");
assert.equal(validateZipEntryName("pet-package/SHARE.md", true).relativeOutputPath, "SHARE.md");
for (const name of ["share.md", "README.md", "../SHARE.md", "pet-package/nested/SHARE.md", "pet-package\\SHARE.md"]) {
  assert.throws(() => validateZipEntryName(name, true));
}
const localTracker = new ZipEntryPathTracker(true);
localTracker.accept("pet.json");
localTracker.accept("spritesheet.webp");
localTracker.accept("SHARE.md");
assert.throws(() => localTracker.accept("SHARE.md"));
assert.throws(() => localTracker.accept("pet-package/SHARE.md"));
const directoryTracker = new ZipEntryPathTracker(true);
directoryTracker.accept("pet-package/pet.json");
directoryTracker.accept("pet-package/SHARE.md");
assert.throws(() => directoryTracker.accept("SHARE.md"));

for (const unsafe of [
  "../pet.json",
  "pet-package/../pet.json",
  "./pet.json",
  "/tmp/pet.json",
  "C:/tmp/pet.json",
  "pet-package\\pet.json",
  "//server/share/pet.json",
  "pet-package/pet.json\0.png",
  "pet-package/extra.js",
  "pet-package/nested/pet.json",
  "pet-package//pet.json",
]) {
  assertRejectsPath(unsafe);
}

assertRejectsEntrySet(["pet-package/pet.json", "pet-package/pet.json"]);
assertRejectsEntrySet(["pet-package/pet.json", "pet-package/PET.json"]);
assertRejectsEntrySet(["pet-package/pet.json", "other-pet/spritesheet.webp"]);
assertRejectsEntrySet(["pet.json", "pet-package/spritesheet.webp"]);
assertRejectsEntrySet(["pet.json", "pet-package/"]);
assertRejectsEntrySet(["spritesheet.webp", "pet-package/"]);
assertRejectsEntrySet(["pet.json", "pet.json"]);
assertRejectsEntrySet(["pet.json", "PET.json"]);

if (!hasSupportedZipMagic(Buffer.from([0x50, 0x4b, 0x03, 0x04]))) {
  throw new Error("Valid local file zip signature was rejected.");
}

if (hasSupportedZipMagic(Buffer.from("not a zip", "utf8"))) {
  throw new Error("Non-zip content was accepted as a zip.");
}

await assertYauzlStrictFileNamesRejects("pet-package\\pet.json");

console.log("Zip safety validation passed.");

function assertRejectsEntrySet(entries: readonly string[]): void {
  const tracker = new ZipEntryPathTracker();
  try {
    for (const entry of entries) {
      tracker.accept(entry);
    }
  } catch {
    return;
  }

  throw new Error(`Unsafe zip entry set was accepted: ${entries.join(", ")}`);
}

async function assertYauzlStrictFileNamesRejects(fileName: string): Promise<void> {
  const buffer = createSingleEmptyFileZip(fileName);

  await new Promise<void>((resolvePromise, rejectPromise) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true, strictFileNames: true, validateEntrySizes: true }, (error, zipFile) => {
      if (error) {
        resolvePromise();
        return;
      }

      if (!zipFile) {
        rejectPromise(new Error("yauzl did not return a zip file."));
        return;
      }

      zipFile.on("error", () => resolvePromise());
      zipFile.on("entry", () => rejectPromise(new Error("yauzl strictFileNames accepted an unsafe file name.")));
      zipFile.on("end", () => rejectPromise(new Error("yauzl strictFileNames ended without rejecting unsafe file name.")));
      zipFile.readEntry();
    });
  });
}

function createSingleEmptyFileZip(fileName: string): Buffer {
  const fileNameBytes = Buffer.from(fileName, "utf8");
  const local = Buffer.alloc(30 + fileNameBytes.length);
  let offset = 0;
  local.writeUInt32LE(0x04034b50, offset); offset += 4;
  local.writeUInt16LE(20, offset); offset += 2;
  local.writeUInt16LE(0, offset); offset += 2;
  local.writeUInt16LE(0, offset); offset += 2;
  local.writeUInt16LE(0, offset); offset += 2;
  local.writeUInt16LE(0, offset); offset += 2;
  local.writeUInt32LE(0, offset); offset += 4;
  local.writeUInt32LE(0, offset); offset += 4;
  local.writeUInt32LE(0, offset); offset += 4;
  local.writeUInt16LE(fileNameBytes.length, offset); offset += 2;
  local.writeUInt16LE(0, offset); offset += 2;
  fileNameBytes.copy(local, offset);

  const central = Buffer.alloc(46 + fileNameBytes.length);
  offset = 0;
  central.writeUInt32LE(0x02014b50, offset); offset += 4;
  central.writeUInt16LE(20, offset); offset += 2;
  central.writeUInt16LE(20, offset); offset += 2;
  central.writeUInt16LE(0, offset); offset += 2;
  central.writeUInt16LE(0, offset); offset += 2;
  central.writeUInt16LE(0, offset); offset += 2;
  central.writeUInt16LE(0, offset); offset += 2;
  central.writeUInt32LE(0, offset); offset += 4;
  central.writeUInt32LE(0, offset); offset += 4;
  central.writeUInt32LE(0, offset); offset += 4;
  central.writeUInt16LE(fileNameBytes.length, offset); offset += 2;
  central.writeUInt16LE(0, offset); offset += 2;
  central.writeUInt16LE(0, offset); offset += 2;
  central.writeUInt16LE(0, offset); offset += 2;
  central.writeUInt16LE(0, offset); offset += 2;
  central.writeUInt32LE(0, offset); offset += 4;
  central.writeUInt32LE(0, offset); offset += 4;
  fileNameBytes.copy(central, offset);

  const end = Buffer.alloc(22);
  offset = 0;
  end.writeUInt32LE(0x06054b50, offset); offset += 4;
  end.writeUInt16LE(0, offset); offset += 2;
  end.writeUInt16LE(0, offset); offset += 2;
  end.writeUInt16LE(1, offset); offset += 2;
  end.writeUInt16LE(1, offset); offset += 2;
  end.writeUInt32LE(central.length, offset); offset += 4;
  end.writeUInt32LE(local.length, offset); offset += 4;
  end.writeUInt16LE(0, offset);

  return Buffer.concat([local, central, end]);
}
