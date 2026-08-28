import type { CSSProperties } from "react";

/** Shared inline style tokens for the client fixture pages. Kept intentionally plain (no CSS framework, per constraints). */

export const page: CSSProperties = {
  maxWidth: 640,
  margin: "0 auto",
  padding: "40px 20px",
};

export const card: CSSProperties = {
  background: "#fff",
  border: "1px solid #e2e4e8",
  borderRadius: 8,
  padding: "24px 28px",
};

export const heading: CSSProperties = {
  fontSize: 20,
  marginTop: 0,
  marginBottom: 16,
};

export const row: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "6px 0",
  fontSize: 14,
  borderBottom: "1px solid #f0f1f3",
};

export const label: CSSProperties = {
  display: "block",
  fontSize: 13,
  color: "#444",
  marginBottom: 4,
  marginTop: 14,
};

export const input: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "8px 10px",
  fontSize: 14,
  border: "1px solid #ccc",
  borderRadius: 6,
};

export const button: CSSProperties = {
  marginTop: 20,
  padding: "10px 18px",
  fontSize: 14,
  fontWeight: 600,
  color: "#fff",
  background: "#2857c8",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

export const buttonSecondary: CSSProperties = {
  ...button,
  background: "#6b7280",
};

export const errorText: CSSProperties = {
  color: "#b3261e",
  fontSize: 13,
  marginTop: 10,
};

export const noteBox: CSSProperties = {
  background: "#fff7e0",
  border: "1px solid #f0dca0",
  borderRadius: 6,
  padding: "10px 14px",
  fontSize: 13,
  color: "#6b5400",
  marginTop: 16,
};

export const dryRunBox: CSSProperties = {
  background: "#eef4ff",
  border: "1px dashed #7ea3e0",
  borderRadius: 6,
  padding: "12px 14px",
  fontSize: 13,
  color: "#1e3a6e",
  marginTop: 16,
};

export const muted: CSSProperties = {
  fontSize: 13,
  color: "#666",
};

export const popupOverlay: CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "rgba(20,20,20,0.72)",
  borderRadius: 8,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  textAlign: "center",
  padding: 20,
  zIndex: 50,
};

export const popupCloseButton: CSSProperties = {
  padding: "8px 16px",
  fontSize: 13,
  border: "1px solid #fff",
  background: "transparent",
  color: "#fff",
  borderRadius: 6,
  cursor: "pointer",
};

/* ---- Obstruction fixture styles (app/_fixtures/Obstructions.tsx) ---- */

export const obstructCookieBanner: CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 0,
  minHeight: 120,
  background: "#1f2430",
  color: "#fff",
  padding: "18px 24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  zIndex: 9999,
  boxShadow: "0 -4px 16px rgba(0,0,0,0.25)",
};

export const obstructAcceptButton: CSSProperties = {
  padding: "10px 20px",
  fontSize: 13,
  fontWeight: 600,
  border: "none",
  background: "#2857c8",
  color: "#fff",
  borderRadius: 6,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export const obstructToast: CSSProperties = {
  position: "fixed",
  top: 20,
  right: 20,
  width: 280,
  background: "#fff",
  border: "1px solid #d8dbe2",
  borderRadius: 8,
  boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
  padding: "12px 14px",
  fontSize: 13,
  color: "#222",
  zIndex: 9998,
};

export const obstructToastSticky: CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  background: "#fff",
  borderTop: "1px solid #d8dbe2",
  boxShadow: "0 -6px 20px rgba(0,0,0,0.18)",
  padding: "14px 16px",
  fontSize: 13,
  color: "#222",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  zIndex: 45,
  borderRadius: "0 0 8px 8px",
};

export const obstructChatWidget: CSSProperties = {
  position: "fixed",
  bottom: 20,
  right: 20,
  width: 60,
  height: 60,
  borderRadius: "50%",
  background: "#2857c8",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 26,
  cursor: "pointer",
  boxShadow: "0 6px 18px rgba(0,0,0,0.3)",
  zIndex: 9997,
};

export const obstructChatWidgetClose: CSSProperties = {
  position: "fixed",
  bottom: 68,
  right: 16,
  width: 22,
  height: 22,
  borderRadius: "50%",
  background: "#fff",
  color: "#333",
  border: "1px solid #ccc",
  fontSize: 12,
  lineHeight: "20px",
  textAlign: "center",
  cursor: "pointer",
  zIndex: 9998,
  padding: 0,
};

export const obstructInvisibleOverlay: CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "transparent",
  opacity: 0,
  pointerEvents: "auto",
  zIndex: 44,
};

export const obstructStickyHeader: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  height: 140,
  background: "#11151c",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  padding: "0 24px",
  fontSize: 16,
  fontWeight: 600,
  zIndex: 9996,
};

export const obstructSpinnerOverlay: CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "rgba(255,255,255,0.9)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  borderRadius: 8,
  zIndex: 46,
};

export const obstructSpinnerCircle: CSSProperties = {
  width: 36,
  height: 36,
  border: "4px solid #d0d5dd",
  borderTopColor: "#2857c8",
  borderRadius: "50%",
  animation: "obstruct-spin 0.8s linear infinite",
};

export const obstructScrollLockSpacer: CSSProperties = {
  height: 1600,
  width: "100%",
};
