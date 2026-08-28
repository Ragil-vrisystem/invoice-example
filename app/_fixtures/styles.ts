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
