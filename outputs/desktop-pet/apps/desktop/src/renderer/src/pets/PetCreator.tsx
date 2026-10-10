import { useEffect, useRef, useState } from "react";
import type { PetAuthoringInput, PetAuthoringResult, PetAuthoringSelection } from "../../../pet-authoring-types.js";
import { useI18n } from "../i18n.js";
import { Button } from "../components/ui/Button.js";
import { GlassCard } from "../components/ui/GlassCard.js";
import { SpriteFrame } from "../components/PetSprite.js";
import "./pet-creator.css";

export interface PetCreatorApi {
  choosePetSpritesheet(): Promise<PetAuthoringSelection | null>;
  createPet(selectionId: string, input: PetAuthoringInput): Promise<PetAuthoringResult | null>;
  discardPetDraft(selectionId?: string): Promise<void>;
}

export function PetCreator({ api, onClose, onCreated }: {
  api: PetCreatorApi;
  onClose(): void;
  onCreated(result: PetAuthoringResult): Promise<void>;
}) {
  const { t } = useI18n();
  const [selection, setSelection] = useState<PetAuthoringSelection | null>(null);
  const [input, setInput] = useState<PetAuthoringInput>({ id: "", displayName: "", description: "" });
  const [busy, setBusy] = useState<"" | "choosing" | "creating">("");
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const selectedRef = useRef<PetAuthoringSelection | null>(null);
  const generation = useRef(0);
  const mounted = useRef(true);
  const closing = useRef(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<() => void>(() => undefined);

  function isCurrent(operation: number): boolean {
    return mounted.current && generation.current === operation;
  }

  async function close(): Promise<void> {
    if (closing.current) return;
    closing.current = true;
    generation.current += 1;
    setCancelling(true);
    setError("");
    try {
      await api.discardPetDraft();
      selectedRef.current = null;
      onClose();
    } catch (err) {
      if (mounted.current) {
        setError(t("pets.create.cancelFailed", { reason: String((err as Error)?.message ?? err) }));
        setCancelling(false);
        closing.current = false;
      }
    }
  }
  closeRef.current = () => { void close(); };

  useEffect(() => {
    mounted.current = true;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.querySelector<HTMLElement>(".pet-creator-panel button")?.focus();
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
      }
      if (event.key !== "Tab") return;
      const controls = dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]):not(.plugin-config-backdrop), input:not([disabled]), textarea:not([disabled])");
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      mounted.current = false;
      generation.current += 1;
      window.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
      // 卸载时也取消尚在选择或校验的操作；已提交的宠物不会因此删除。
      void api.discardPetDraft().catch(() => console.warn("桌宠制作草稿清理未完成。"));
    };
  }, [api]);

  async function chooseImage(): Promise<void> {
    if (busy || closing.current) return;
    const operation = ++generation.current;
    const previous = selectedRef.current;
    selectedRef.current = null;
    setSelection(null);
    setBusy("choosing");
    setError("");
    setNotice("");
    try {
      if (previous) await api.discardPetDraft(previous.selectionId);
      if (!isCurrent(operation)) return;
      const next = await api.choosePetSpritesheet();
      if (!isCurrent(operation)) {
        if (next) await api.discardPetDraft(next.selectionId);
        return;
      }
      selectedRef.current = next;
      setSelection(next);
      if (next) {
        setInput((current) => ({
          ...current,
          id: current.id || next.suggestedPetId,
        }));
      } else {
        setNotice(t("pets.create.chooseCancelled"));
      }
    } catch (err) {
      if (isCurrent(operation)) setError(t("pets.create.chooseFailed", { reason: String((err as Error)?.message ?? err) }));
    } finally {
      if (mounted.current) setBusy("");
    }
  }

  const validInput = /^[a-z0-9][a-z0-9_-]{0,63}$/.test(input.id)
    && input.id !== "builtin" && !!input.displayName.trim() && !!input.description.trim();

  async function create(): Promise<void> {
    const draft = selectedRef.current;
    if (!draft || busy || closing.current || !validInput) return;
    const operation = ++generation.current;
    setBusy("creating");
    setError("");
    setNotice("");
    let result: PetAuthoringResult | null;
    try {
      result = await api.createPet(draft.selectionId, {
        id: input.id,
        displayName: input.displayName.trim(),
        description: input.description.trim(),
      });
    } catch (err) {
      if (isCurrent(operation)) {
        setError(t("pets.create.failed", { reason: String((err as Error)?.message ?? err) }));
      }
      if (mounted.current) setBusy("");
      return;
    }
    if (!isCurrent(operation)) {
      if (mounted.current) setBusy("");
      return;
    }
    selectedRef.current = null;
    if (!result) {
      setSelection(null);
      setNotice(t("pets.create.cancelled"));
      setBusy("");
      return;
    }
    setNotice(t("pets.create.created", { name: result.displayName }));
    try {
      await onCreated(result);
    } catch (err) {
      if (isCurrent(operation)) {
        setSelection(null);
        setError(t("pets.create.refreshFailed", { name: result.displayName, reason: String((err as Error)?.message ?? err) }));
      }
    } finally {
      if (mounted.current) setBusy("");
    }
  }

  const disabled = !!busy || cancelling;
  const previews = [
    { state: "idle" as const, label: t("pets.detail.preview.idle") },
    { state: "thinking" as const, label: t("pets.detail.preview.thinking") },
    { state: "happy" as const, label: t("pets.detail.preview.happy") },
    { state: "wave" as const, label: t("pets.detail.preview.wave") },
  ];

  return (
    <div className="plugin-config-overlay pet-creator" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="pet-creator-title">
      <button className="plugin-config-backdrop" type="button" tabIndex={-1} aria-label={t("common.close")} onClick={() => void close()} disabled={cancelling} />
      <GlassCard className="plugin-inspector pet-creator-panel">
        <div className="plugin-inspector-head">
          <h2 id="pet-creator-title">{t("pets.create.title")}</h2>
          <Button variant="secondary" size="compact" onClick={() => void close()} disabled={cancelling}>{t("common.close")}</Button>
        </div>
        <p className="pet-creator-copy">{t("pets.create.description")}</p>
        <form onSubmit={(event) => { event.preventDefault(); void create(); }}>
          <div className="pet-creator-fields">
            <label>
              {t("pets.create.id")}
              <input
                value={input.id}
                onChange={(event) => setInput({ ...input, id: event.target.value })}
                maxLength={64}
                pattern={"[a-z0-9][a-z0-9_\\-]{0,63}"}
                required
                disabled={disabled}
                spellCheck={false}
                placeholder="my-pet"
              />
              <small>{t("pets.create.idHint")}</small>
            </label>
            <label>
              {t("pets.create.name")}
              <input value={input.displayName} onChange={(event) => setInput({ ...input, displayName: event.target.value })} maxLength={80} required disabled={disabled} />
            </label>
            <label>
              {t("pets.create.petDescription")}
              <textarea value={input.description} onChange={(event) => setInput({ ...input, description: event.target.value })} maxLength={500} rows={3} required disabled={disabled} />
            </label>
          </div>
          <div className="pet-creator-source">
            <Button variant="secondary" disabled={disabled} onClick={() => void chooseImage()}>
              {busy === "choosing" ? t("pets.create.choosing") : selection ? t("pets.create.replace") : t("pets.create.choose")}
            </Button>
            <p className="pet-creator-copy">{t("pets.create.imageHint")}</p>
            {selection && (
              <>
                <p className="pet-creator-file">{selection.fileName}</p>
                <p className="pet-creator-copy">{t("pets.create.validated")}</p>
                <div className="pet-creator-previews">
                  {previews.map((preview) => (
                    <article key={preview.state}>
                      <SpriteFrame src={selection.previewDataUrl} spriteLayout={selection.spriteLayout} state={preview.state} label={preview.label} size="mini" />
                      <span>{preview.label}</span>
                    </article>
                  ))}
                </div>
              </>
            )}
          </div>
          {error && <p className="error" role="alert">{error}</p>}
          {notice && <p className="pet-creator-copy" role="status">{notice}</p>}
          <div className="pet-creator-actions">
            <Button variant="secondary" onClick={() => void close()} disabled={cancelling}>{cancelling ? t("pets.create.cancelling") : t("common.cancel")}</Button>
            <Button type="submit" disabled={disabled || !selection || !validInput}>{busy === "creating" ? t("pets.create.creating") : t("pets.create.submit")}</Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
