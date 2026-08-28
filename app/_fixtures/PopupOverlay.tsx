"use client";

import { useState } from "react";
import { popupOverlay, popupCloseButton } from "./styles";
import { spGet, type SP } from "@/lib/searchParams";
import { t, type Lang } from "@/lib/i18n";

/**
 * Shared obstructing-modal fixture, available on EVERY interactive host
 * (`inv2-direct` and all five credential hosts: `inv2-login`, `inv2-login-pw`,
 * `inv2-email-gated`, `inv2-email-otp`, `inv2-email-otp-trigger`). Stable
 * selectors (`#popup-overlay` / `#popup-close`) so an automation under test
 * can be coded to detect and dismiss it.
 *
 * Both cases are selectable via `?popup=` on ANY of those hosts, so each
 * host can be exercised against either shape — not just one fixed default:
 *
 *   `?popup=1`          -> DISMISSIBLE (default for any truthy value other
 *                          than 2/trap). Modeled on a cookie-consent banner /
 *                          "verify you're human" / session notice dialog —
 *                          clicking `#popup-close` actually hides it and
 *                          unblocks the form underneath. Positive test: the
 *                          automation must detect, close, and then proceed
 *                          with the credential flow normally.
 *
 *   `?popup=2` (or `trap`) -> PERMANENT TRAP. Closing it does NOT remove it —
 *                          modeled on malvertising popups that keep coming
 *                          back. The underlying action must still fail;
 *                          negative test.
 *
 * No popup param at all -> the baseline "no popup" case (the form is usable
 * immediately, nothing to detect or close).
 */

export interface PopupMode {
  show: boolean;
  dismissible: boolean;
}

export function resolvePopupMode(sp: SP): PopupMode {
  const raw = spGet(sp, "popup");
  if (!raw) {
    return { show: false, dismissible: true };
  }
  const isTrap = raw === "2" || raw.toLowerCase() === "trap";
  return { show: true, dismissible: !isTrap };
}

interface PopupOverlayProps {
  dismissible?: boolean;
  message?: string;
  lang: Lang;
}

export default function PopupOverlay({ dismissible = false, message, lang }: PopupOverlayProps) {
  const dict = t(lang);
  const [closed, setClosed] = useState(false);
  const [closedCount, setClosedCount] = useState(0);

  if (dismissible && closed) {
    return null;
  }

  return (
    <div id="popup-overlay" style={popupOverlay}>
      <p style={{ fontSize: 15, marginBottom: 16 }}>
        {message ?? dict.popup.defaultMessage}
        {closedCount > 0 ? dict.popup.closedCount(closedCount) : ""}
      </p>
      <button
        id="popup-close"
        type="button"
        onClick={() => {
          setClosedCount((c) => c + 1);
          if (dismissible) setClosed(true);
        }}
        style={popupCloseButton}
      >
        {dict.popup.close}
      </button>
    </div>
  );
}
