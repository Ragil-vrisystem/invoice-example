"use client";

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import {
  popupOverlay,
  popupCloseButton,
  obstructCookieBanner,
  obstructAcceptButton,
  obstructToast,
  obstructToastSticky,
  obstructChatWidget,
  obstructChatWidgetClose,
  obstructInvisibleOverlay,
  obstructStickyHeader,
  obstructSpinnerOverlay,
  obstructSpinnerCircle,
  obstructScrollLockSpacer,
} from "./styles";
import { spGet, type SP } from "@/lib/searchParams";
import { t, type Lang } from "@/lib/i18n";

/**
 * Composable "obstruction" fixture system — realistic UI obstacles that
 * block/trip web RPA (modals, native dialogs, toasts, banners, invisible
 * overlays, etc.), on top of (never replacing) the existing `?popup=`
 * fixture in `PopupOverlay.tsx`.
 *
 * `?obstruct=` takes a comma-separated list of obstruction types, each with
 * an optional `:N` numeric argument, e.g.:
 *
 *   ?obstruct=cookie-banner,chat-widget,toast
 *   ?obstruct=spinner:5,delayed-modal:10
 *
 * Unknown types are ignored silently so the param composes safely with
 * anything else. See README.md for the full catalog table.
 *
 * Selector convention (exact, automation-facing): container `#obstruct-<type>`,
 * dismiss control `#obstruct-<type>-close` (`-accept` for the cookie banner).
 *
 * Split into three pieces:
 *   - `parseObstructions(sp)` -> typed `ObstructionSet`
 *   - `<Obstructions set lang />` -> renders every DOM-based / mount-effect
 *     obstruction (cookie-banner, toast, toast-sticky, chat-widget,
 *     invisible-overlay, sticky-header, spinner, delayed-modal, scroll-lock,
 *     alert, prompt)
 *   - `useObstructionGate(set, lang)` -> click-time gating for `confirm` /
 *     `new-window`, plus the `beforeunload` handler registration
 */

export type ObstructionType =
  | "cookie-banner"
  | "toast"
  | "toast-sticky"
  | "chat-widget"
  | "invisible-overlay"
  | "sticky-header"
  | "spinner"
  | "delayed-modal"
  | "scroll-lock"
  | "alert"
  | "confirm"
  | "prompt"
  | "beforeunload"
  | "new-window";

const ALL_TYPES: ObstructionType[] = [
  "cookie-banner",
  "toast",
  "toast-sticky",
  "chat-widget",
  "invisible-overlay",
  "sticky-header",
  "spinner",
  "delayed-modal",
  "scroll-lock",
  "alert",
  "confirm",
  "prompt",
  "beforeunload",
  "new-window",
];

function isObstructionType(v: string): v is ObstructionType {
  return (ALL_TYPES as string[]).includes(v);
}

export interface ObstructionSet {
  types: Set<ObstructionType>;
  args: Partial<Record<ObstructionType, number>>;
}

/** Reads `?obstruct=type[:N],type[:N],...`. Unknown types are ignored silently. */
export function parseObstructions(sp: SP): ObstructionSet {
  const raw = spGet(sp, "obstruct");
  const types = new Set<ObstructionType>();
  const args: Partial<Record<ObstructionType, number>> = {};
  if (!raw) return { types, args };

  for (const part of raw.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const [namePart, argPart] = trimmed.split(":");
    const name = namePart.trim();
    if (!isObstructionType(name)) continue;
    types.add(name);
    if (argPart !== undefined) {
      const n = Number(argPart.trim());
      if (Number.isFinite(n) && n >= 0) {
        args[name] = n;
      }
    }
  }
  return { types, args };
}

function has(set: ObstructionSet, type: ObstructionType): boolean {
  return set.types.has(type);
}

/* ------------------------------ sub-pieces ------------------------------ */

function CookieBanner({ lang }: { lang: Lang }) {
  const dict = t(lang);
  const [closed, setClosed] = useState(false);
  if (closed) return null;
  return (
    <div id="obstruct-cookie-banner" style={obstructCookieBanner}>
      <span>{dict.obstruct.cookieBannerMessage}</span>
      <button id="obstruct-cookie-accept" type="button" style={obstructAcceptButton} onClick={() => setClosed(true)}>
        {dict.obstruct.cookieAccept}
      </button>
    </div>
  );
}

function Toast({ lang }: { lang: Lang }) {
  const dict = t(lang);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, []);
  if (!visible) return null;
  return (
    <div id="obstruct-toast" style={obstructToast}>
      {dict.obstruct.toastMessage}
    </div>
  );
}

function ToastSticky({ lang }: { lang: Lang }) {
  const dict = t(lang);
  const [closed, setClosed] = useState(false);
  if (closed) return null;
  return (
    <div id="obstruct-toast-sticky" style={obstructToastSticky}>
      <span>{dict.obstruct.toastStickyMessage}</span>
      <button
        id="obstruct-toast-sticky-close"
        type="button"
        style={{ ...popupCloseButton, color: "#222", borderColor: "#999" }}
        onClick={() => setClosed(true)}
      >
        {dict.obstruct.toastStickyClose}
      </button>
    </div>
  );
}

function ChatWidget({ lang }: { lang: Lang }) {
  const dict = t(lang);
  const [closed, setClosed] = useState(false);
  if (closed) return null;
  return (
    <>
      <div id="obstruct-chat-widget" style={obstructChatWidget} title={dict.obstruct.chatWidgetTitle}>
        💬
      </div>
      <button
        id="obstruct-chat-widget-close"
        type="button"
        style={obstructChatWidgetClose}
        aria-label={dict.obstruct.chatWidgetClose}
        onClick={() => setClosed(true)}
      >
        ×
      </button>
    </>
  );
}

function InvisibleOverlay() {
  return <div id="obstruct-invisible-overlay" style={obstructInvisibleOverlay} />;
}

function StickyHeader({ lang }: { lang: Lang }) {
  const dict = t(lang);
  return (
    <div id="obstruct-sticky-header" style={obstructStickyHeader}>
      {dict.obstruct.stickyHeaderTitle}
    </div>
  );
}

function Spinner({ lang, seconds }: { lang: Lang; seconds?: number }) {
  const dict = t(lang);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (seconds === undefined) return; // no arg -> never resolves
    const timer = setTimeout(() => setVisible(false), seconds * 1000);
    return () => clearTimeout(timer);
  }, [seconds]);
  if (!visible) return null;
  return (
    <>
      <style>{"@keyframes obstruct-spin { to { transform: rotate(360deg); } }"}</style>
      <div id="obstruct-spinner" style={obstructSpinnerOverlay}>
        <div style={obstructSpinnerCircle} />
        <span style={{ fontSize: 13, color: "#444" }}>{dict.obstruct.spinnerMessage}</span>
      </div>
    </>
  );
}

function DelayedModal({ lang, seconds }: { lang: Lang; seconds: number }) {
  const dict = t(lang);
  const [shown, setShown] = useState(false);
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShown(true), seconds * 1000);
    return () => clearTimeout(timer);
  }, [seconds]);
  if (!shown || closed) return null;
  return (
    <div id="obstruct-delayed-modal" style={{ ...popupOverlay, zIndex: 47 }}>
      <p style={{ fontSize: 15, marginBottom: 16 }}>{dict.obstruct.delayedModalMessage}</p>
      <button id="obstruct-delayed-modal-close" type="button" style={popupCloseButton} onClick={() => setClosed(true)}>
        {dict.obstruct.delayedModalClose}
      </button>
    </div>
  );
}

function ScrollLock() {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);
  return <div id="obstruct-scroll-lock" style={obstructScrollLockSpacer} />;
}

function AlertEffect({ lang }: { lang: Lang }) {
  const dict = t(lang);
  const firedOnce = useRef(false);
  useEffect(() => {
    if (firedOnce.current) return;
    firedOnce.current = true;
    window.alert(dict.obstruct.alertMessage);
    // Fires exactly once on mount; `dict` is derived from a stable `lang`
    // prop so it's safe to omit from deps here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function PromptEffect({ lang }: { lang: Lang }) {
  const dict = t(lang);
  const firedOnce = useRef(false);
  useEffect(() => {
    if (firedOnce.current) return;
    firedOnce.current = true;
    window.prompt(dict.obstruct.promptMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

/* --------------------------------- API ---------------------------------- */

interface ObstructionsProps {
  set: ObstructionSet;
  lang: Lang;
}

/** Renders every DOM-based / mount-effect obstruction present in `set`. */
export function Obstructions({ set, lang }: ObstructionsProps) {
  if (set.types.size === 0) return null;
  return (
    <>
      {has(set, "cookie-banner") && <CookieBanner lang={lang} />}
      {has(set, "toast") && <Toast lang={lang} />}
      {has(set, "toast-sticky") && <ToastSticky lang={lang} />}
      {has(set, "chat-widget") && <ChatWidget lang={lang} />}
      {has(set, "invisible-overlay") && <InvisibleOverlay />}
      {has(set, "sticky-header") && <StickyHeader lang={lang} />}
      {has(set, "spinner") && <Spinner lang={lang} seconds={set.args.spinner} />}
      {has(set, "delayed-modal") && <DelayedModal lang={lang} seconds={set.args["delayed-modal"] ?? 3} />}
      {has(set, "scroll-lock") && <ScrollLock />}
      {has(set, "alert") && <AlertEffect lang={lang} />}
      {has(set, "prompt") && <PromptEffect lang={lang} />}
    </>
  );
}

export interface ObstructionGate {
  /**
   * Wrap the primary action's `onClick` with this. Returns `true` if the
   * action should proceed (call preventDefault()/skip your own handler when
   * it returns `false`, e.g. after a `confirm` dialog was dismissed).
   */
  onActionClick: (e: ReactMouseEvent) => boolean;
}

const NEW_WINDOW_DECOY_URL = "about:blank?obstruct=new-window";

/**
 * Click-time gating (`confirm`, `new-window`) + `beforeunload` handler
 * registration for whichever of those three types are present in `set`.
 */
export function useObstructionGate(set: ObstructionSet, lang: Lang): ObstructionGate {
  const dict = t(lang);

  useEffect(() => {
    if (!set.types.has("beforeunload")) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [set]);

  const onActionClick = (e: ReactMouseEvent): boolean => {
    if (set.types.has("confirm")) {
      const proceed = window.confirm(dict.obstruct.confirmMessage);
      if (!proceed) {
        e.preventDefault();
        return false;
      }
    }
    if (set.types.has("new-window")) {
      window.open(NEW_WINDOW_DECOY_URL, "_blank");
    }
    return true;
  };

  return { onActionClick };
}
