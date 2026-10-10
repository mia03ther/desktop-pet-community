export interface PetOriginInput {
  readonly id: string;
  readonly builtIn?: boolean;
  readonly sourceKind?: string;
  readonly source?: { readonly kind?: string };
  readonly claims?: {
    readonly author?: string;
    readonly source?: string;
    readonly license?: string;
  };
}

export interface PetOriginSummary {
  readonly label: string;
  readonly source: string;
  readonly sourceUrl?: string;
  readonly author: string;
  readonly license: string;
  readonly notice: string;
  readonly declaredSource?: string;
  readonly hasUserClaims: boolean;
}

const openPetsCommit = "2d14120cf027c9e80db7ff78e60711be08d39df4";

export function projectPetOrigin(input: PetOriginInput): PetOriginSummary {
  const claims = input.claims;
  const author = claims?.author?.trim() || "待核实";
  const license = claims?.license?.trim() || "待核实";
  const declaredSource = claims?.source?.trim() || undefined;
  const hasUserClaims = Boolean(claims?.author?.trim() || claims?.license?.trim() || declaredSource);
  const declarationNotice = hasUserClaims ? "填写的作者、来源和许可是用户声明，尚未核实。" : "尚未取得可核实的作者与单项素材许可。";

  if (input.builtIn && input.id === "builtin") {
    return {
      label: "OpenPets 内置素材",
      source: "Hoodie Cat 图集来自 OpenPets 固定版本；本项目未原创绘制该外观。",
      sourceUrl: `https://github.com/OpenPetsHQ/openpets/blob/${openPetsCommit}/apps/desktop/assets/default-pet-spritesheet.webp`,
      author,
      license,
      notice: `${declarationNotice} OpenPets 的代码 MIT 许可不能据此当作已核实的素材许可。`,
      declaredSource,
      hasUserClaims,
    };
  }

  if (input.source?.kind === "catalog" || input.sourceKind === "catalog") {
    return {
      label: "OpenPets 图库素材",
      source: "外观由 OpenPets 图库提供；原图和动作通过本地适配使用。",
      sourceUrl: input.id === "toasty-tote" ? "https://openpets.dev/pets/toasty-tote-openpets" : "https://openpets.dev/",
      author,
      license,
      notice: `${declarationNotice} 图库的原创标记不表示由本项目原创，也不替代许可说明。`,
      declaredSource,
      hasUserClaims,
    };
  }

  return {
    label: input.source?.kind === "codex" || input.sourceKind === "codex" ? "本机兼容格式素材" : "用户导入素材",
    source: "由用户在本机导入；导入位置和兼容格式不能证明作者或原创归属。",
    author,
    license,
    notice: declarationNotice,
    declaredSource,
    hasUserClaims,
  };
}
