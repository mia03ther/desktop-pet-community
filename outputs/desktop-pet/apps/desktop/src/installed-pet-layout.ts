import { codexV1SpriteLayout, getCodexPetSpriteLayout, type CodexPetSpriteLayout } from "./codex-pets-core.js";
import { getPetDir } from "./pet-paths.js";
import { readInstalledPetMetadata } from "./pet-media-files.js";
import { isMediaPetMetadata } from "./pet-media-contract.js";

export async function readInstalledPetSpriteLayout(
  petId: string,
  source: "personal" | "team" = "personal",
): Promise<CodexPetSpriteLayout> {
  const metadata = await readInstalledPetMetadata(getPetDir(petId, source), petId);
  if (isMediaPetMetadata(metadata)) return { ...codexV1SpriteLayout, media: metadata };
  return getCodexPetSpriteLayout(metadata);
}
