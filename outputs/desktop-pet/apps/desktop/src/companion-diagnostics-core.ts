import type { CompanionDiagnosticsSnapshot, CompanionDiskEvidence } from "./companion-diagnostics-types.js";
import type { CompanionResourceRecommendation } from "./companion-tools-types.js";

type ResourceSample = Pick<CompanionDiagnosticsSnapshot,
  "sampledAt" | "sampleDurationMs" | "disks" | "memory" | "cpuPercent">;

export function isCompanionDiagnosticSampleFresh(sampledAt: number, now: number): boolean {
  return Number.isFinite(sampledAt) && Number.isFinite(now)
    && sampledAt >= 0 && sampledAt <= now + 60_000 && now - sampledAt <= 15 * 60_000;
}

function validCapacity(totalBytes: number, freeBytes: number): boolean {
  return Number.isFinite(totalBytes) && totalBytes > 0
    && Number.isFinite(freeBytes) && freeBytes >= 0 && freeBytes <= totalBytes;
}

function validDisk(disk: CompanionDiskEvidence): boolean {
  return validCapacity(disk.totalBytes, disk.freeBytes);
}

function gigabytes(bytes: number): string {
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

/** 只根据可用测量生成建议；缺失、异常或过期数据不会触发资源结论。 */
export function deriveCompanionResourceRecommendations(
  snapshot: ResourceSample | null,
  now: number,
): CompanionResourceRecommendation[] {
  if (!snapshot || !isCompanionDiagnosticSampleFresh(snapshot.sampledAt, now)) return [];
  const recommendations: CompanionResourceRecommendation[] = [];
  const memory = snapshot.memory;
  if (memory && validCapacity(memory.totalBytes, memory.availableBytes)) {
    const usedPercent = 100 * (1 - memory.availableBytes / memory.totalBytes);
    if (usedPercent >= 85) {
      recommendations.push({
        id: "resource:memory",
        kind: "memory",
        sampledAt: snapshot.sampledAt,
        title: "先核对内存由哪些应用占用",
        evidence: `物理内存使用约 ${usedPercent.toFixed(1)}%，可用 ${gigabytes(memory.availableBytes)} / 总共 ${gigabytes(memory.totalBytes)}。`,
        steps: [
          "按 Ctrl + Shift + Esc 打开任务管理器，在“进程”中按内存排序，结合正在做的工作核对占用。",
          "先保存工作，再自行关闭暂时不用的应用或浏览器标签；隔一段时间重新检查。",
          "若开机后常有不用的应用运行，可查看系统启动应用设置，逐项核对用途。",
        ],
        limitation: "一次高占用不证明持续卡顿，进程工作集也不能简单相加。调整文件保存路径主要改善磁盘空间，不保证降低 RAM。",
        systemPage: "startup",
      });
    }
  }
  if (snapshot.cpuPercent !== null && Number.isFinite(snapshot.cpuPercent)
    && snapshot.cpuPercent >= 85 && snapshot.cpuPercent <= 100
    && Number.isFinite(snapshot.sampleDurationMs) && snapshot.sampleDurationMs > 0) {
    recommendations.push({
      id: "resource:cpu",
      kind: "cpu",
      sampledAt: snapshot.sampledAt,
      title: "先核对 CPU 占用与当前任务",
      evidence: `约 ${(snapshot.sampleDurationMs / 1000).toFixed(1)} 秒内的 CPU 使用为 ${snapshot.cpuPercent.toFixed(1)}%。`,
      steps: [
        "按 Ctrl + Shift + Esc 打开任务管理器，在“进程”中按 CPU 排序，先确认是否正在安装、编译或运行游戏。",
        "保存工作后自行关闭暂时不用的应用，再次采样；若主要发生在开机后，可核对系统启动应用。",
      ],
      limitation: "短时峰值不能说明持续卡顿或软件有害。本助手不会结束进程或自动禁用自启。",
      systemPage: "startup",
    });
  }
  const disks = snapshot.disks.filter(validDisk);
  for (const disk of disks) {
    const freePercent = 100 * disk.freeBytes / disk.totalBytes;
    if (freePercent >= 10) continue;
    const alternative = disks.filter((other) => other.name !== disk.name
      && other.freeBytes > disk.freeBytes && other.freeBytes / other.totalBytes >= 0.2)
      .sort((left, right) => right.freeBytes - left.freeBytes)[0];
    const steps = [
      "打开系统存储设置，先查看空间分类；也可在文件助手中分析自己选定的资料目录，核对哪些文件较大。",
      "在“系统 → 存储 → 高级存储设置 → 保存新内容的地方”核对新文档、图片等的默认盘；浏览器下载位置需在浏览器中分别设置。",
    ];
    if (alternative) {
      steps.push(`${alternative.name} 本次可用 ${gigabytes(alternative.freeBytes)}，可作为新资料保存位置的候选；先核对实际文件大小和用途，不能保证能容纳全部资料。`);
    }
    steps.push("若要调整微信或 QQ 的存储、下载或缓存位置，使用软件自身提供的设置并按其流程操作；不要手动搬动聊天数据库。");
    recommendations.push({
      id: `resource:disk:${disk.name.toUpperCase()}`,
      kind: "disk",
      sampledAt: snapshot.sampledAt,
      title: `${disk.name} 可先核对保存位置`,
      evidence: `剩余 ${gigabytes(disk.freeBytes)} / 总共 ${gigabytes(disk.totalBytes)}，约 ${freePercent.toFixed(1)}%。`,
      steps,
      limitation: "修改新内容保存位置不会自动迁移已有文件，也不保证降低 RAM。容量无法证明哪些文件可删除，尚未确认微信或 QQ 是本盘的占用来源。",
      systemPage: "storage",
    });
  }
  return recommendations;
}
