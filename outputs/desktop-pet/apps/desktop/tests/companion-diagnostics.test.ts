import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  deriveCompanionDiagnosticFindings,
  parseCompanionCursorWindow,
  parseCompanionDiagnostics,
} from "../src/companion-diagnostics.js";

const basic = () => ({
  version: 1,
  sampledAt: 1791259200000,
  sampleDurationMs: 1100,
  cpuPercent: null,
  memory: null,
  disks: [],
  processes: [{ pid: 10, name: "限制读取", executablePath: null, workingSetBytes: 100, cpuPercent: null }],
  startupItems: [],
  installedApps: [{ id: "LocalMachine:Registry64:Uninstall\\demo", name: "示例软件", version: "1.0", publisher: "", installLocation: "C:\\demo", source: "LocalMachine/Registry64/Uninstall" }],
  installedAppsComplete: false,
  windows: [],
  collectionIssues: ["软件清单部分读取失败。"],
  coverage: ["只覆盖登记的卸载条目。"],
});

describe("电脑诊断的只读证据协议", () => {
  it("受限读取保留为空，部分清单不能伪装完整，也不把缺失 CPU 当作零", () => {
    const result = parseCompanionDiagnostics(JSON.stringify(basic()));
    assert.equal(result.cpuPercent, null);
    assert.equal(result.memory, null);
    assert.equal(result.processes[0].cpuPercent, null);
    assert.equal(result.processes[0].executablePath, null);
    assert.equal(result.installedAppsComplete, false);
    assert.equal(result.installedApps[0].id, "LocalMachine:Registry64:Uninstall\\demo");
    assert.equal(result.findings.length, 0);
    assert.equal(result.collectionIssues.length, 1);
  });

  it("空间、内存和 CPU 的发现是复查线索，ID 保持稳定以支持忽略", () => {
    const findings = deriveCompanionDiagnosticFindings({
      disks: [
        { name: "C:\\", totalBytes: 1000, freeBytes: 50, usedPercent: 95 },
        { name: "D:\\", totalBytes: 1000, freeBytes: 100, usedPercent: 90 },
      ],
      memory: { totalBytes: 1000, availableBytes: 100, usedPercent: 90 },
      cpuPercent: 85,
    });
    assert.deepEqual(findings.map((finding) => finding.id), ["disk:C:\\", "memory:pressure", "cpu:pressure"]);
    assert.deepEqual(deriveCompanionDiagnosticFindings({ disks: [], memory: null, cpuPercent: 10 }), []);
  });

  it("无效测量值或超大列表拒绝进入界面", () => {
    assert.throws(() => parseCompanionDiagnostics(JSON.stringify({ ...basic(), cpuPercent: -1 })));
    assert.throws(() => parseCompanionDiagnostics(JSON.stringify({ ...basic(), processes: Array(501).fill(basic().processes[0]) })));
    assert.throws(() => parseCompanionDiagnostics(JSON.stringify({ ...basic(), memory: { totalBytes: 100, availableBytes: 50, usedPercent: null } })));
    assert.throws(() => parseCompanionDiagnostics(JSON.stringify({ ...basic(), version: 2 })));
  });

  it("指认只能报告窗口进程归属，空窗口不是成功识别了来源", () => {
    const missing = parseCompanionCursorWindow(JSON.stringify({ version: 1, sampledAt: 1, window: null }));
    assert.equal(missing.window, null);
    const result = parseCompanionCursorWindow(JSON.stringify({ version: 1, sampledAt: 1, window: {
      handle: "100", title: "浏览器", pid: 20, processName: "msedge", executablePath: "C:\\msedge.exe", isForeground: true,
    } }));
    assert.equal(result.window?.pid, 20);
    assert.equal(result.window?.isForeground, true);
    assert.ok(result.note.includes("不能据此判定"));
  });
});
