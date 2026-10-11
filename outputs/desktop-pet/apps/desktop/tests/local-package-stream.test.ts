import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import yauzl from "yauzl";
import type { Entry, Options, ZipFile, ZipFileOptions } from "yauzl";
import yazl from "yazl";
import { readLocalPackageFiles } from "../src/local-package-files.js";

const root = await mkdtemp(join(tmpdir(), "desktop-pet-zip-stream-"));
const archivePath = join(root, "fixture.zip");
const limits = { maxBytes: 1024, maxFileBytes: 16, maxFiles: 2 };
const originalFromBuffer = yauzl.fromBuffer;
type ZipCallback = (error: Error | null, zip: ZipFile) => void;
type StreamCallback = (error: Error | null, stream: Readable) => void;

// 保留真实 ZIP 元数据与公开导入入口，仅替换条目流来模拟损坏和中断。
async function readWithStream(makeStream: () => Readable): Promise<{ files: Map<string, Buffer>; stream: Readable }> {
  let opened: Readable | undefined;
  yauzl.fromBuffer = (bytes: Buffer, optionsOrCallback: Options | ZipCallback = {}, callback?: ZipCallback): void => {
    const complete = typeof optionsOrCallback === "function" ? optionsOrCallback : callback!;
    originalFromBuffer(bytes, typeof optionsOrCallback === "function" ? {} : optionsOrCallback, (error, zip) => {
      if (!error) {
        zip.openReadStream = (_entry: Entry, optionsOrComplete: ZipFileOptions | StreamCallback, streamComplete?: StreamCallback): void => {
          opened = makeStream();
          (typeof optionsOrComplete === "function" ? optionsOrComplete : streamComplete!)(null, opened);
        };
      }
      complete(error, zip);
    });
  };
  let deadline: NodeJS.Timeout | undefined;
  try {
    const files = await Promise.race([
      readLocalPackageFiles(archivePath, limits),
      new Promise<never>((_complete, reject) => { deadline = setTimeout(() => reject(new Error("条目流未及时结束")), 2000); }),
    ]);
    assert.ok(opened);
    return { files, stream: opened };
  } finally {
    if (deadline) clearTimeout(deadline);
    yauzl.fromBuffer = originalFromBuffer;
    if (opened) {
      for (const event of ["data", "error", "end", "close"]) assert.equal(opened.listenerCount(event), 0, `终结后应释放 ${event} 监听`);
    }
  }
}

try {
  const zip = new yazl.ZipFile();
  zip.addBuffer(Buffer.from("原件"), "原件.txt");
  const chunks: Buffer[] = [];
  const bytes = new Promise<Buffer>((complete, reject) => {
    zip.outputStream.on("data", (chunk: Buffer) => chunks.push(chunk));
    zip.outputStream.once("error", reject);
    zip.outputStream.once("end", () => complete(Buffer.concat(chunks)));
  });
  zip.end();
  await writeFile(archivePath, await bytes);
  const expected = Buffer.from("原件");
  const intact = await readWithStream(() => Readable.from([expected.subarray(0, 1), expected.subarray(1, 3), expected.subarray(3)], { objectMode: false }));
  assert.deepEqual(intact.files.get("原件.txt"), expected, "多块正常流应完整保留原字节");

  await assert.rejects(() => readWithStream(() => new Readable({ read() { this.destroy(new Error("模拟条目解压错误")); } })), /模拟条目解压错误/);
  await assert.rejects(() => readWithStream(() => new Readable({ read() { this.destroy(); } })), /ZIP 条目流提前关闭/);
  await assert.rejects(() => readWithStream(() => Readable.from([expected.subarray(0, 2)], { objectMode: false })), /ZIP 条目不完整/);
  let excessive: Readable | undefined;
  await assert.rejects(() => readWithStream(() => {
    excessive = Readable.from([expected, Buffer.from("越界")], { objectMode: false });
    return excessive;
  }), /ZIP 条目的实际大小超过声明/);
  assert.equal(excessive!.destroyed, true, "实读越界后应停止条目流");
  await assert.rejects(() => readLocalPackageFiles(archivePath, { ...limits, maxFileBytes: expected.length - 1 }), /超过大小上限/);
  await assert.rejects(() => readLocalPackageFiles(archivePath, { ...limits, maxBytes: 1 }), /ZIP|大小/);
  console.log("本地 ZIP 条目流完整性、异常、中断、实读越界与监听释放验证通过");
} finally {
  yauzl.fromBuffer = originalFromBuffer;
  await rm(root, { recursive: true, force: true });
}
