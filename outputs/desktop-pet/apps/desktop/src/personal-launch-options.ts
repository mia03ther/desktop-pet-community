import { isAbsolute } from "node:path";

export type PersonalLaunchIntent = "pet" | "studio";

export function readPersonalLaunchOptions(argv: readonly string[], environmentProfileDir?: string): {
  readonly profileDir: string | undefined;
  readonly intent: PersonalLaunchIntent | undefined;
} {
  const profileArgument = argv.find((argument) => argument.startsWith("--desktop-pet-profile-dir="));
  const profileDir = profileArgument?.slice("--desktop-pet-profile-dir=".length) ?? environmentProfileDir;
  if (profileDir !== undefined && (!profileDir.trim() || !isAbsolute(profileDir))) {
    throw new Error("桌宠数据目录必须是绝对路径。");
  }
  let intent: PersonalLaunchIntent | undefined;
  if (argv.includes("--open-studio")) intent = "studio";
  else if (argv.includes("--show-pet")) intent = "pet";
  return { profileDir, intent };
}
