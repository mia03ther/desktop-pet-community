import { useEffect, useRef, useState } from "react";
import { petShareFieldLimits, type PetPackageExportOptions } from "../../../pet-sharing-contract.js";
import { useI18n } from "../i18n.js";
import { Button } from "../components/ui/Button.js";
import { GlassCard } from "../components/ui/GlassCard.js";
import "./pet-share-dialog.css";

export interface PetShareDialogProps {
  displayName: string;
  sourceUrl?: string;
  busy: boolean;
  error: string;
  onExport(options: PetPackageExportOptions): void;
  onClose(): void;
}

export function PetShareDialog({ displayName, sourceUrl, busy, error, onExport, onClose }: PetShareDialogProps) {
  const { t } = useI18n();
  const [format, setFormat] = useState<PetPackageExportOptions["format"]>("zip");
  const [fields, setFields] = useState({ author: "", source: sourceUrl ?? "", license: "" });
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<() => void>(() => undefined);
  closeRef.current = () => {
    if (!busy) {
      onClose();
    }
  };

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.querySelector<HTMLInputElement>("input:checked")?.focus();
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      const dialog = dialogRef.current;
      const controls = dialog?.querySelectorAll<HTMLElement>(
        "button:not([disabled]):not(.plugin-config-backdrop), input:not([disabled]):not([type=radio]), input[type=radio]:checked:not([disabled])",
      );
      if (!dialog || !controls) {
        return;
      }
      if (!controls.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!dialog.contains(document.activeElement) || document.activeElement === dialog) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      previousFocus?.focus();
    };
  }, []);

  useEffect(() => {
    if (busy) {
      dialogRef.current?.focus();
    } else if (document.activeElement === dialogRef.current) {
      dialogRef.current?.querySelector<HTMLInputElement>("input:checked")?.focus();
    }
  }, [busy]);

  function submit(): void {
    if (busy) {
      return;
    }
    onExport({
      format,
      author: fields.author.trim(),
      source: fields.source.trim(),
      license: fields.license.trim(),
    });
  }

  return (
    <div
      className="plugin-config-overlay pet-share-dialog"
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pet-share-title"
      aria-describedby="pet-share-scope"
      aria-busy={busy}
      tabIndex={-1}
    >
      <button
        className="plugin-config-backdrop"
        type="button"
        tabIndex={-1}
        aria-label={t("common.close")}
        onClick={() => closeRef.current()}
        disabled={busy}
      />
      <GlassCard className="plugin-inspector pet-share-panel">
        <div className="plugin-inspector-head">
          <div className="pet-share-heading">
            <h2 id="pet-share-title">{t("pets.share.title")}</h2>
            <p className="pet-share-name">{displayName}</p>
          </div>
          <Button variant="secondary" size="compact" onClick={() => closeRef.current()} disabled={busy}>
            {t("common.close")}
          </Button>
        </div>
        <p id="pet-share-scope" className="pet-share-copy">{t("pets.share.scope")}</p>
        <form onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}>
          <fieldset className="pet-share-formats" disabled={busy}>
            <legend>{t("pets.share.format")}</legend>
            <div className="pet-share-format-grid">
              <label className={`pet-share-format ${format === "zip" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="pet-share-format"
                  value="zip"
                  checked={format === "zip"}
                  disabled={busy}
                  onChange={() => setFormat("zip")}
                />
                <span>
                  <strong>{t("pets.share.zip")}</strong>
                  <small>{t("pets.share.zipHint")}</small>
                </span>
                <b className="pet-share-recommended">{t("pets.share.recommended")}</b>
              </label>
              <label className={`pet-share-format ${format === "folder" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="pet-share-format"
                  value="folder"
                  checked={format === "folder"}
                  disabled={busy}
                  onChange={() => setFormat("folder")}
                />
                <span>
                  <strong>{t("pets.share.folder")}</strong>
                  <small>{t("pets.share.folderHint")}</small>
                </span>
              </label>
            </div>
          </fieldset>
          <div className="pet-share-fields">
            {(["author", "source", "license"] as const).map((key) => (
              <label key={key}>
                {t(`pets.share.${key}`, { limit: petShareFieldLimits[key] })}
                <input
                  type="text"
                  value={fields[key]}
                  maxLength={petShareFieldLimits[key]}
                  disabled={busy}
                  placeholder={t("pets.share.unverified")}
                  aria-describedby="pet-share-rights"
                  onChange={(event) => setFields({ ...fields, [key]: event.target.value })}
                />
              </label>
            ))}
          </div>
          <p id="pet-share-rights" className="pet-share-copy pet-share-rights">{t("pets.share.rightsHint")}</p>
          {error && <p className="error" role="alert">{error}</p>}
          {busy && <p className="pet-share-copy" role="status">{t("pets.share.busyHint")}</p>}
          <div className="pet-share-actions">
            <Button variant="secondary" onClick={() => closeRef.current()} disabled={busy}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? t("pets.share.exporting") : t("pets.share.submit")}
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
