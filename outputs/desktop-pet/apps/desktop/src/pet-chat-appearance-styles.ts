import { defaultPetChatAppearance, normalizePetChatAppearance, petChatAccentTextColor, petChatBackground, petChatFontFamily, type PetChatAppearancePreferences, type PetChatSurfaceStyle } from "./pet-chat-appearance.js";
import { compactComposerGeometry } from "./pet-window-shape.js";

function surfaceCss(surface: PetChatSurfaceStyle): string {
  return `background: ${petChatBackground(surface)};
      color: ${surface.textColor};
      border: ${surface.borderWidth}px solid ${surface.borderColor};
      border-radius: ${surface.radius}px;
      box-shadow: ${surface.shadow ? "0 8px 20px rgba(15, 23, 42, 0.14), 0 2px 5px rgba(15, 23, 42, 0.08)" : "none"};`;
}

export function createPetChatAppearanceCss(value: PetChatAppearancePreferences | undefined): string {
  const configuredAppearance = normalizePetChatAppearance(value);
  const appearance = configuredAppearance.enabled ? configuredAppearance : defaultPetChatAppearance;
  const font = petChatFontFamily(appearance.fontFamily);
  const lineHeight = Math.round(appearance.fontSize * 1.4);
  // 边框变粗时为输入区让出空间，保持载体和输入区域的既有边界。
  const textareaMaxHeight = compactComposerGeometry.textareaMaxHeight - Math.max(0, appearance.input.borderWidth - compactComposerGeometry.borderWidth) * 2;

  return `
    .openpets-compact-composer, .openpets-chat-panel,
    .bubble:not(.is-pinned), .bubble:not(.is-pinned) .bubble-header,
    .bubble:not(.is-pinned) .bubble-body, .bubble:not(.is-pinned) .bubble-text,
    .compact-composer-title, .compact-composer-textarea, .chat-textarea, .chat-msg-bubble,
    .bubble:not(.is-pinned) .bubble-action, .bubble:not(.is-pinned) .bubble-input-control {
      font-family: ${font};
    }
    .openpets-compact-composer .compact-composer-textarea, .openpets-chat-panel .chat-textarea, .chat-msg-bubble,
    .bubble:not(.is-pinned), .bubble:not(.is-pinned) .bubble-header,
    .bubble:not(.is-pinned) .bubble-body, .bubble:not(.is-pinned) .bubble-text {
      font-size: ${appearance.fontSize}px;
      font-weight: ${appearance.fontWeight};
      line-height: ${lineHeight}px;
      overflow-wrap: anywhere;
    }
    .openpets-compact-composer, .compact-composer-textarea, .chat-textarea,
    .chat-msg.is-user .chat-msg-bubble {
      ${surfaceCss(appearance.input)}
    }
    .compact-composer-title { color: ${appearance.input.textColor}; font-size: ${Math.min(appearance.fontSize, 14)}px; font-weight: ${appearance.fontWeight}; }
    .openpets-compact-composer::after {
      background: ${petChatBackground(appearance.input)};
      border-right: ${appearance.input.borderWidth}px solid ${appearance.input.borderColor};
      border-bottom: ${appearance.input.borderWidth}px solid ${appearance.input.borderColor};
      box-shadow: none;
    }
    .compact-composer-header { min-height: ${compactComposerGeometry.headerHeight}px; max-height: ${compactComposerGeometry.headerHeight}px; }
    .compact-composer-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .compact-composer-form { min-height: 0; }
    .openpets-compact-composer .compact-composer-textarea {
      background: transparent;
      min-height: ${Math.min(textareaMaxHeight, lineHeight + 10 + appearance.input.borderWidth * 2)}px;
      max-height: ${textareaMaxHeight}px;
      overflow-y: auto;
    }
    .openpets-chat-panel .chat-textarea { min-height: ${Math.max(36, lineHeight + 16 + appearance.input.borderWidth * 2)}px; overflow-y: auto; }
    .compact-composer-textarea::placeholder, .chat-textarea::placeholder {
      color: color-mix(in srgb, ${appearance.input.textColor} 58%, transparent);
    }
    .compact-composer-textarea:focus, .chat-textarea:focus {
      border-color: ${appearance.accentColor};
      box-shadow: 0 0 0 2px color-mix(in srgb, ${appearance.accentColor} 22%, transparent);
    }
    .compact-composer-send-btn:not(:disabled), .chat-send-btn:not(:disabled),
    .compact-composer-send-btn:hover:not(:disabled), .chat-send-btn:hover:not(:disabled) {
      background: ${appearance.accentColor};
      color: ${petChatAccentTextColor(appearance.accentColor)};
      box-shadow: 0 2px 5px color-mix(in srgb, ${appearance.accentColor} 28%, transparent);
    }
    .chat-typing-cursor { background: ${appearance.accentColor}; }
    .chat-msg.is-assistant .chat-msg-bubble,
    .bubble:not(.is-pinned):not(.has-hud) {
      ${surfaceCss(appearance.answer)}
    }
    .chat-msg.is-assistant .chat-msg-bubble strong { color: inherit; }
    .bubble:not(.is-pinned):not(.has-hud) .bubble-body {
      color: ${appearance.answer.textColor};
    }
    .bubble:not(.is-pinned):not(.has-hud)::after {
      background: ${petChatBackground(appearance.answer)};
      border-right: ${appearance.answer.borderWidth}px solid ${appearance.answer.borderColor};
      border-bottom: ${appearance.answer.borderWidth}px solid ${appearance.answer.borderColor};
      box-shadow: none;
    }
    .bubble:not(.is-pinned):not(.has-media) { max-height: 156px; }
    .bubble:not(.is-pinned) .bubble-header { flex-shrink: 0; }
    .bubble:not(.is-pinned) .bubble-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; scrollbar-width: thin; }
    .bubble:not(.is-pinned) .bubble-text { display: block; -webkit-line-clamp: unset; white-space: pre-wrap; }
    .chat-msg-bubble { box-sizing: border-box; min-width: 0; max-width: 100%; }
  `;
}
