export type ExternalAiIntegrationId = "codex" | "zcode" | "deepseek-harness" | "doubao";

export type ExternalAiSetupAction =
  | "codex-install" | "codex-remove" | "codex-test" | "codex-docs"
  | "zcode-install" | "zcode-remove" | "zcode-test" | "zcode-docs"
  | "deepseek-harness-install" | "deepseek-harness-remove" | "deepseek-harness-test" | "deepseek-harness-docs"
  | "doubao-install" | "doubao-remove" | "doubao-test" | "doubao-docs";

export const externalAiSetupActions: readonly ExternalAiSetupAction[] = [
  "codex-install", "codex-remove", "codex-test", "codex-docs",
  "zcode-install", "zcode-remove", "zcode-test", "zcode-docs",
  "deepseek-harness-install", "deepseek-harness-remove", "deepseek-harness-test", "deepseek-harness-docs",
  "doubao-install", "doubao-remove", "doubao-test", "doubao-docs",
];

export interface ExternalAiSetup {
  readonly id: ExternalAiIntegrationId;
  readonly name: string;
  readonly state: "configured" | "needs_setup" | "not_detected" | "error" | "conflict";
  readonly label: string;
  readonly description: string;
  readonly details: string;
  readonly instructions: readonly string[];
  readonly configPath?: string;
  readonly canInstall: boolean;
  readonly canRemove: boolean;
  readonly canTest: boolean;
  readonly installLabel: string;
  readonly preview?: string;
  readonly docsUrl: string;
  readonly program: {
    readonly detected: boolean | null;
    readonly label: string;
    readonly details: string;
  };
  readonly session: ExternalAiSessionStatus;
}

export interface ExternalAiSessionStatus {
  readonly state: "unconfirmed" | "observed";
  readonly details: string;
  readonly lastActivityAt?: number;
}
