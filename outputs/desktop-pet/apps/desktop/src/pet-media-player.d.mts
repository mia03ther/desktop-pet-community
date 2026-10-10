import type { MediaPetMetadata, PetMediaAction } from "./pet-media-contract.js";
export interface PetMediaPlayer {
  setAction(action: PetMediaAction): void;
  setPaused(paused: boolean): void;
  dispose(): void;
}
export function createPetMediaPlayer(canvas: HTMLCanvasElement, metadata: MediaPetMetadata, urlForFile: (file: string) => string): PetMediaPlayer;
export function installPetMediaRenderer(document: Document): () => void;
