import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it, type TestContext } from "node:test";
import { CompanionFilesService } from "../src/companion-files.js";
import { CompanionToolsService } from "../src/companion-tools.js";
import { installControlCenterCompanionIpcHandlers } from "../src/control-center-companion-ipc.js";
import type { CompanionDownloadsSnapshot, CompanionInstallerEvidence } from "../src/companion-software-types.js";
import type { CompanionToolsSnapshot } from "../src/companion-tools-types.js";

type Dependencies = Parameters<typeof installControlCenterCompanionIpcHandlers>[0];
type Handler = Parameters<Dependencies["registerHandle"]>[1];

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => { resolve = complete; });
  return { promise, resolve };
}

const installerEvidence: CompanionInstallerEvidence = {
  checkedAt: 1_800_000_000_000,
  fileName: "native-picked.exe",
  sizeBytes: 4,
  sha256: "a".repeat(64),
  signatureStatus: "NotSigned",
  signer: null,
  productName: null,
  fileVersion: null,
  productVersion: null,
  publisher: null,
  fileDescription: null,
  zoneId: null,
  sourceHost: null,
  clues: ["签名证据需核对。"],
  conclusion: "只读证据不能证明是否捆绑。",
};

function fixture(t: TestContext) {
  const directory = mkdtempSync(join(tmpdir(), "companion-software-ipc-test-"));
  const tools = new CompanionToolsService({
    statePath: join(directory, "tools.json"),
    collect: async () => { throw new Error("软件 IPC 夹具不读取真实系统诊断。"); },
    notify: () => false,
  });
  const files = new CompanionFilesService({ journalDirectory: join(directory, "operations") });
  const handlers = new Map<string, Handler>();
  const effects: string[] = [];
  const unauthorized = new Error("发送方未授权");
  const downloadsSnapshot: CompanionDownloadsSnapshot = {
    folderPath: null,
    enabled: false,
    scanning: false,
    items: [],
    ignoredIds: [],
    snoozedUntil: {},
    lastError: null,
  };
  const state = {
    pickInstaller: async (_sender: number): Promise<string | null> => null,
    pickDownloads: async (_sender: number): Promise<string | null> => null,
    inspect: async (_path: string, _signal?: AbortSignal): Promise<CompanionInstallerEvidence> => installerEvidence,
    chooseDownloads: async (path: string, signal?: AbortSignal): Promise<CompanionDownloadsSnapshot> => {
      if (signal?.aborted) throw new Error("目录选择已取消。");
      downloadsSnapshot.folderPath = path;
      return structuredClone(downloadsSnapshot);
    },
    checkUninstall: async (id: string, _signal?: AbortSignal): Promise<CompanionToolsSnapshot> => {
      if (id !== "registered-removal") throw new Error("没有这条卸载记录。");
      return tools.getSnapshot();
    },
  };
  t.mock.method(tools, "checkUninstallDirectory", (id: string, signal?: AbortSignal) => {
    effects.push(`uninstall:${id}`);
    return state.checkUninstall(id, signal);
  });
  const downloads: Dependencies["downloads"] = {
    getSnapshot: () => structuredClone(downloadsSnapshot),
    chooseFolder: (path, signal) => {
      effects.push(`downloads-choice:${path}`);
      return state.chooseDownloads(path, signal);
    },
    setEnabled: async (enabled) => {
      effects.push(`downloads-enabled:${enabled}`);
      downloadsSnapshot.enabled = enabled;
      return structuredClone(downloadsSnapshot);
    },
    refresh: async () => {
      effects.push("downloads-refresh");
      return structuredClone(downloadsSnapshot);
    },
    setDisposition: (id, action) => {
      effects.push(`downloads-disposition:${id}:${action}`);
      return structuredClone(downloadsSnapshot);
    },
    resetIgnored: () => {
      effects.push("downloads-restore");
      return structuredClone(downloadsSnapshot);
    },
  };
  const lifecycle = installControlCenterCompanionIpcHandlers({
    assertToolAccess: () => undefined,
    registerHandle: (channel, handler) => handlers.set(channel, handler),
    authorizeSender: (event) => {
      if (event.sender.id !== 1 && event.sender.id !== 2) throw unauthorized;
    },
    tools,
    downloads,
    files,
    inspectInstaller: (path, signal) => {
      effects.push(`inspect:${path}`);
      return state.inspect(path, signal);
    },
    pickInstaller: (sender) => {
      effects.push(`installer-picker:${sender}`);
      return state.pickInstaller(sender);
    },
    pickDownloadsFolder: (sender) => {
      effects.push(`downloads-picker:${sender}`);
      return state.pickDownloads(sender);
    },
    captureWindow: async () => {
      effects.push("capture-window");
      return { version: 1, sampledAt: Date.now(), window: null, note: "测试不采集窗口。" };
    },
    pickFolder: async () => { effects.push("file-folder-picker"); return null; },
    pickFiles: async () => { effects.push("file-picker"); return null; },
    reveal: (path) => { effects.push(`reveal:${path}`); },
    open: async (path) => { effects.push(`open:${path}`); return ""; },
    openSystem: async (uri) => { effects.push(`system:${uri}`); },
    copy: () => { effects.push("copy"); },
  });
  t.after(() => {
    lifecycle.dispose();
    tools.stop();
    rmSync(directory, { recursive: true, force: true });
  });
  return {
    handlers,
    effects,
    state,
    lifecycle,
    unauthorized,
    tools,
    snapshot: downloadsSnapshot,
    invoke: async <T = unknown>(method: string, sender = 1, ...args: unknown[]): Promise<T> => {
      const handler = handlers.get(`openpets:companion-${method}`);
      assert.ok(handler, `缺少 ${method} 软件入口`);
      return await handler({ sender: { id: sender } }, ...args) as T;
    },
  };
}

describe("软件 IPC 的授权、取消与公开参数边界", () => {
  it("全部注册入口先验证发送方，非法参数不能绕过授权或产生副作用", async (t) => {
    const f = fixture(t);
    for (const handler of f.handlers.values()) {
      await assert.rejects(handler({ sender: { id: 99 } }, { path: "C:/forged.exe" }, "invalid"),
        (error: unknown) => error === f.unauthorized);
    }
    assert.deepEqual(f.effects, []);
    assert.equal(f.snapshot.folderPath, null);
    assert.equal(f.snapshot.enabled, false);
  });

  it("安装检查只采用原生选择器结果，渲染器提供的路径不会传给检查器", async (t) => {
    const f = fixture(t);
    f.state.pickInstaller = async () => "C:/native/native-picked.exe";
    let receivedSignal: AbortSignal | undefined;
    f.state.inspect = async (_path, signal) => {
      receivedSignal = signal;
      return installerEvidence;
    };
    const result = await f.invoke("installer", 1, "C:/renderer/forged.exe");
    assert.deepEqual(result, installerEvidence);
    assert.deepEqual(f.effects, ["installer-picker:1", "inspect:C:/native/native-picked.exe"]);
    assert.ok(receivedSignal);
    assert.equal(receivedSignal.aborted, false);
  });

  it("取消软件任务只属于发起窗口，共享任务在检查结束前不能被另一个请求抢占", async (t) => {
    const f = fixture(t);
    const entered = deferred<void>();
    const completion = deferred<CompanionInstallerEvidence>();
    const signals: AbortSignal[] = [];
    f.state.pickInstaller = async () => "C:/native/native-picked.exe";
    f.state.inspect = async (_path, signal) => {
      assert.ok(signal);
      signals.push(signal);
      entered.resolve();
      return completion.promise;
    };
    const checking = f.invoke("installer", 1);
    await entered.promise;
    assert.deepEqual(await f.invoke("cancel-software", 2), { cancelled: false });
    f.lifecycle.cancelForSender(2);
    assert.equal(signals[0].aborted, false);
    const effectCount = f.effects.length;
    await assert.rejects(f.invoke("downloads-choose", 2));
    await assert.rejects(f.invoke("uninstall-check", 2, "registered-removal"));
    assert.equal(f.effects.length, effectCount);
    assert.deepEqual(await f.invoke("cancel-software", 1), { cancelled: true });
    assert.equal(signals[0].aborted, true);
    completion.resolve(installerEvidence);
    assert.equal(await checking, null);
    assert.deepEqual(await f.invoke("cancel-software", 1), { cancelled: false });
  });

  it("关闭检查 owner 会撤销传给检查器的 AbortSignal，迟到证据不返回界面", async (t) => {
    const f = fixture(t);
    const entered = deferred<void>();
    const completion = deferred<CompanionInstallerEvidence>();
    const signals: AbortSignal[] = [];
    f.state.pickInstaller = async () => "C:/native/native-picked.exe";
    f.state.inspect = async (_path, signal) => {
      assert.ok(signal);
      signals.push(signal);
      entered.resolve();
      return completion.promise;
    };
    const checking = f.invoke("installer", 1);
    await entered.promise;
    f.lifecycle.cancelForSender(1);
    assert.equal(signals[0].aborted, true);
    completion.resolve(installerEvidence);
    assert.equal(await checking, null);
  });

  for (const ending of ["owner-close", "owner-cancel", "dispose"] as const) {
    it(`${ending} 后原生安装文件选择晚到不会开始检查`, async (t) => {
      const f = fixture(t);
      const entered = deferred<void>();
      const choice = deferred<string | null>();
      f.state.pickInstaller = async () => { entered.resolve(); return choice.promise; };
      const selecting = f.invoke("installer", 1);
      await entered.promise;
      if (ending === "owner-close") f.lifecycle.cancelForSender(1);
      else if (ending === "owner-cancel") await f.invoke("cancel-software", 1);
      else f.lifecycle.dispose();
      choice.resolve("C:/late/installer.exe");
      assert.equal(await selecting, null);
      assert.deepEqual(f.effects, ["installer-picker:1"]);
    });

    it(`${ending} 后原生下载目录选择晚到不会修改下载范围和开关`, async (t) => {
      const f = fixture(t);
      const entered = deferred<void>();
      const choice = deferred<string | null>();
      f.state.pickDownloads = async () => { entered.resolve(); return choice.promise; };
      const selecting = f.invoke("downloads-choose", 1);
      await entered.promise;
      if (ending === "owner-close") f.lifecycle.cancelForSender(1);
      else if (ending === "owner-cancel") await f.invoke("cancel-software", 1);
      else f.lifecycle.dispose();
      choice.resolve("C:/late/downloads");
      assert.equal(await selecting, null);
      assert.deepEqual(f.effects, ["downloads-picker:1"]);
      assert.equal(f.snapshot.folderPath, null);
      assert.equal(f.snapshot.enabled, false);
    });
  }

  it("下载目录验证期间关窗会把同一个取消信号传给目录 owner", async (t) => {
    const f = fixture(t);
    const entered = deferred<void>();
    const validation = deferred<void>();
    const signals: AbortSignal[] = [];
    f.state.pickDownloads = async () => "C:/native/downloads";
    f.state.chooseDownloads = async (path, signal) => {
      assert.ok(signal);
      signals.push(signal);
      entered.resolve();
      await validation.promise;
      if (signal.aborted) throw new Error("原生选择的授权已撤销。");
      f.snapshot.folderPath = path;
      return f.snapshot;
    };
    const selecting = f.invoke("downloads-choose", 1, "C:/renderer/forged-downloads");
    await entered.promise;
    f.lifecycle.cancelForSender(1);
    assert.equal(signals[0].aborted, true);
    validation.resolve();
    assert.equal(await selecting, null);
    assert.equal(f.snapshot.folderPath, null);
    assert.deepEqual(f.effects, ["downloads-picker:1", "downloads-choice:C:/native/downloads"]);
  });

  it("dispose 后已授权请求也被拒绝，并继续先检查未授权发送方", async (t) => {
    const f = fixture(t);
    f.lifecycle.dispose();
    for (const handler of f.handlers.values()) {
      await assert.rejects(handler({ sender: { id: 1 } }, "registered-removal", true));
      await assert.rejects(handler({ sender: { id: 99 } }), (error: unknown) => error === f.unauthorized);
    }
    assert.deepEqual(f.effects, []);
  });

  it("下载开关只接受布尔值，处置只接受有效字符串 ID 与 ignore/later 枚举", async (t) => {
    const f = fixture(t);
    for (const invalid of [undefined, null, 1, "true", {}]) {
      await assert.rejects(f.invoke("downloads-monitor", 1, invalid));
    }
    for (const invalid of [undefined, null, "delete", "open", {}]) {
      await assert.rejects(f.invoke("downloads-disposition", 1, "package-id", invalid));
    }
    for (const invalid of [undefined, null, "", "bad\0id", { id: "package-id" }]) {
      await assert.rejects(f.invoke("downloads-disposition", 1, invalid, "ignore"));
    }
    assert.deepEqual(f.effects, []);
    assert.equal((await f.invoke<CompanionDownloadsSnapshot>("downloads-monitor", 1, true)).enabled, true);
    assert.equal((await f.invoke<CompanionDownloadsSnapshot>("downloads-monitor", 1, false)).enabled, false);
    await f.invoke("downloads-disposition", 1, "package-id", "ignore");
    await f.invoke("downloads-disposition", 1, "package-id", "later");
    await f.invoke("downloads-refresh");
    await f.invoke("downloads-restore");
    assert.deepEqual(f.effects, [
      "downloads-enabled:true",
      "downloads-enabled:false",
      "downloads-disposition:package-id:ignore",
      "downloads-disposition:package-id:later",
      "downloads-refresh",
      "downloads-restore",
    ]);
  });

  it("卸载核对只接收记录 ID 和取消信号，不采用渲染器注入的安装路径", async (t) => {
    const f = fixture(t);
    let receivedId: string | null = null;
    const signals: AbortSignal[] = [];
    f.state.checkUninstall = async (id, signal) => {
      receivedId = id;
      assert.ok(signal);
      signals.push(signal);
      return f.tools.getSnapshot();
    };
    await assert.rejects(f.invoke("uninstall-check", 1, { id: "registered-removal", installLocation: "C:/forged" }));
    await f.invoke("uninstall-check", 1, "registered-removal", "C:/renderer/forged-installation");
    assert.equal(receivedId, "registered-removal");
    assert.equal(signals[0].aborted, false);
    assert.deepEqual(f.effects, ["uninstall:registered-removal"]);
  });

  it("卸载核对的在途检查归原窗口所有，关窗撤销其信号", async (t) => {
    const f = fixture(t);
    const entered = deferred<void>();
    const completion = deferred<CompanionToolsSnapshot>();
    const signals: AbortSignal[] = [];
    f.state.checkUninstall = async (_id, signal) => {
      assert.ok(signal);
      signals.push(signal);
      entered.resolve();
      return completion.promise;
    };
    const checking = f.invoke("uninstall-check", 1, "registered-removal");
    await entered.promise;
    f.lifecycle.cancelForSender(2);
    assert.equal(signals[0].aborted, false);
    f.lifecycle.cancelForSender(1);
    assert.equal(signals[0].aborted, true);
    completion.resolve(f.tools.getSnapshot());
    await checking;
  });

  it("安全设置入口使用固定 URI，不能传任意 URI、参数或原型属性名", async (t) => {
    const f = fixture(t);
    for (const invalid of ["ms-settings:windowsdefender", "security?target=forged", "__proto__", "toString", { page: "security" }]) {
      await assert.rejects(f.invoke("system", 1, invalid));
    }
    assert.deepEqual(f.effects, []);
    if (process.platform === "win32") {
      await f.invoke("system", 1, "security", "ms-settings:forged");
      assert.deepEqual(f.effects, ["system:ms-settings:windowsdefender"]);
    } else {
      await assert.rejects(f.invoke("system", 1, "security"));
      assert.deepEqual(f.effects, []);
    }
  });
});
