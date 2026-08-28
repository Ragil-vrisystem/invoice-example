/** Shared helpers for Next 15+/16 async `searchParams` (already-awaited plain object) handling. */

export type SP = Record<string, string | string[] | undefined>;

export function spGet(sp: SP, key: string): string | undefined {
  const v = sp[key];
  if (Array.isArray(v)) return v[0];
  return v;
}

export function spHas(sp: SP, key: string): boolean {
  return spGet(sp, key) !== undefined;
}

export function spFlag(sp: SP, key: string): boolean {
  return spGet(sp, key) === "1";
}

/** Build a query string carrying only the given keys (when present in `sp`). */
export function pickParams(sp: SP, keys: string[]): string {
  const params = new URLSearchParams();
  for (const k of keys) {
    const v = spGet(sp, k);
    if (v !== undefined) params.set(k, v);
  }
  return params.toString();
}
