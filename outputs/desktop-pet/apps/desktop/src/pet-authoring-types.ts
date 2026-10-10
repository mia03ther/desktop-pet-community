/** 制作界面只持有选择凭证和预览，不接收本机源路径或文件字节。 */
export interface PetAuthoringSelection {
  readonly selectionId: string;
  readonly suggestedPetId: string;
  readonly fileName: string;
  readonly previewDataUrl: string;
  readonly spriteLayout: {
    readonly version: 1 | 2;
    readonly frameWidth: number;
    readonly frameHeight: number;
    readonly columns: number;
    readonly rows: number;
    readonly neutralPose?: { readonly row: number; readonly column: number };
  };
}

export interface PetAuthoringInput {
  readonly id: string;
  readonly displayName: string;
  readonly description: string;
}

export interface PetAuthoringResult {
  readonly petId: string;
  readonly displayName: string;
}
