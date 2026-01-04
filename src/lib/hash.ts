// Small deterministic hash to generate a short “project id” on the client.
// Not cryptographic; used only for UX (copy/paste id).
export function fnv1a(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // Convert to 8-hex
  return (h >>> 0).toString(16).padStart(8, '0');
}
