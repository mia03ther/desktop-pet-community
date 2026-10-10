import { app } from "electron";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readPersonalLaunchOptions } from "./personal-launch-options.js";

// 启动器把本项目的数据留在项目目录，避免影响已安装的 OpenPets。
const { profileDir } = readPersonalLaunchOptions(process.argv, process.env.DESKTOP_PET_PROFILE_DIR);
if (profileDir) {
  process.env.DESKTOP_PET_PROFILE_DIR = profileDir;
  process.env.OPENPETS_DISABLE_PLUGIN_CATALOG ??= "1";
  mkdirSync(profileDir, { recursive: true });
  app.setPath("userData", profileDir);
  // IPC 发现文件也隔离，避免覆盖另一份 OpenPets 的连接信息。
  process.env.OPENPETS_DISCOVERY_FILE ??= join(profileDir, "runtime", "ipc.json");
}

// 仅为首次启动提供中文和隐藏快捷键，之后保留用户的设置。
const statePath = join(app.getPath("userData"), "openpets-state.json");
if (!existsSync(statePath)) {
  mkdirSync(app.getPath("userData"), { recursive: true });
  writeFileSync(statePath, JSON.stringify({
    version: 1,
    preferences: {
      locale: "zh-Hans",
      openDefaultPetOnLaunch: true,
      onboardingCompleted: true,
      petToggleShortcut: "Control+Shift+H",
    },
  }, null, 2), { encoding: "utf8", flag: "wx" });
}

await import("./bootstrap.js");
