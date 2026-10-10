import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deriveCompanionResourceRecommendations } from "../src/companion-diagnostics-core.js";

const now = 1_800_000_000_000;
const gb = 1024 ** 3;
const sample = () => ({
  sampledAt: now,
  sampleDurationMs: 1000,
  memory: null as { totalBytes: number; availableBytes: number; usedPercent: number } | null,
  cpuPercent: null as number | null,
  disks: [] as Array<{ name: string; totalBytes: number; freeBytes: number; usedPercent: number }>,
});

describe("依据资源证据提供手动优化建议", () => {
  it("尚未采样和缺失资源数据不会推断为零或生成高占用建议", () => {
    assert.deepEqual(deriveCompanionResourceRecommendations(null, now), []);
    assert.deepEqual(deriveCompanionResourceRecommendations(sample(), now), []);
  });

  it("高内存和 CPU 附采样证据，优先让用户核对任务管理器和自启", () => {
    const result = deriveCompanionResourceRecommendations({
      ...sample(),
      memory: { totalBytes: 16 * gb, availableBytes: 2 * gb, usedPercent: 87.5 },
      cpuPercent: 85,
    }, now);
    assert.deepEqual(result.map((item) => item.kind), ["memory", "cpu"]);
    assert.ok(result.every((item) => item.sampledAt === now && item.systemPage === "startup"));
    assert.ok(result.every((item) => item.steps.some((step) => step.includes("任务管理器"))));
    assert.ok(result[0].limitation.includes("不保证降低 RAM"));
  });

  it("未达到资源条件时不建议关闭应用或变更路径", () => {
    assert.deepEqual(deriveCompanionResourceRecommendations({
      ...sample(),
      memory: { totalBytes: 1000, availableBytes: 151, usedPercent: 84.9 },
      cpuPercent: 84.9,
      disks: [{ name: "C:\\", totalBytes: 1000, freeBytes: 100, usedPercent: 90 }],
    }, now), []);
  });

  it("低空间建议仅使用有容量证据的候选盘，聊天存储须通过软件设置核对", () => {
    const result = deriveCompanionResourceRecommendations({
      ...sample(),
      disks: [
        { name: "C:\\", totalBytes: 100 * gb, freeBytes: 5 * gb, usedPercent: 95 },
        { name: "D:\\", totalBytes: 200 * gb, freeBytes: 100 * gb, usedPercent: 50 },
        { name: "E:\\", totalBytes: 200 * gb, freeBytes: Number.NaN, usedPercent: 0 },
      ],
    }, now);
    assert.equal(result.length, 1);
    assert.equal(result[0].systemPage, "storage");
    assert.ok(result[0].steps.some((step) => step.includes("D:\\") && step.includes("候选")));
    assert.ok(result[0].steps.every((step) => !step.includes("E:\\")));
    assert.ok(result[0].steps.some((step) => step.includes("不要手动搬动聊天数据库")));
    assert.ok(result[0].limitation.includes("不会自动迁移已有文件"));
    assert.ok(result[0].limitation.includes("尚未确认微信或 QQ"));
  });

  it("零总容量、超出总容量或无效测量不会作为资源证据", () => {
    for (const [totalBytes, freeBytes] of [[0, 0], [100, 101], [100, -1], [Number.NaN, 0]]) {
      assert.deepEqual(deriveCompanionResourceRecommendations({
        ...sample(),
        memory: { totalBytes, availableBytes: freeBytes, usedPercent: 100 },
        disks: [{ name: "C:\\", totalBytes, freeBytes, usedPercent: 100 }],
        cpuPercent: Number.NaN,
      }, now), []);
    }
    assert.deepEqual(deriveCompanionResourceRecommendations({ ...sample(), cpuPercent: 100, sampleDurationMs: 0 }, now), []);
  });

  it("建议只接受十五分钟内样本和至多一分钟的未来钟差", () => {
    const pressure = { ...sample(), cpuPercent: 90 };
    assert.equal(deriveCompanionResourceRecommendations({ ...pressure, sampledAt: now - 15 * 60_000 }, now).length, 1);
    assert.deepEqual(deriveCompanionResourceRecommendations({ ...pressure, sampledAt: now - 15 * 60_000 - 1 }, now), []);
    assert.equal(deriveCompanionResourceRecommendations({ ...pressure, sampledAt: now + 60_000 }, now).length, 1);
    assert.deepEqual(deriveCompanionResourceRecommendations({ ...pressure, sampledAt: now + 60_000 + 1 }, now), []);
  });
});
