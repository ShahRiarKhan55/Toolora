export type HtmlDecodeResult =
  { ok: true; value: string } | { ok: false; error: 'unknown-entity'; entities: string[] };

const BASIC: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escapes the five HTML-sensitive characters; `nonAscii` also writes everything above U+007F as `&#N;`. */
export function encodeHtmlEntities(input: string, nonAscii = false): string {
  const escaped = input.replace(/[&<>"']/g, (char) => BASIC[char]!);
  if (!nonAscii) return escaped;
  // Iterating by code point keeps astral characters (emoji) as one entity instead of two surrogates.
  return Array.from(escaped, (char) => {
    const code = char.codePointAt(0)!;
    return code > 0x7f ? `&#${code};` : char;
  }).join('');
}

// A textarea's content is parsed as plain text with character references decoded and tags left
// alone, and this element is never attached to the document, so nothing here can execute.
function decodeWithBrowser(text: string): string {
  const el = document.createElement('textarea');
  el.innerHTML = text;
  return el.value;
}

const ENTITY = /&(#[xX][0-9a-fA-F]+|#[0-9]+|[A-Za-z][A-Za-z0-9]*);/g;

// Browsers also decode legacy names without checking the rest (&notarealentity; → ¬arealentity;), so
// a real entity is one whose whole name decodes to a single character (at most 2 UTF-16 units).
function isKnownNamed(entity: string): boolean {
  const decoded = decodeWithBrowser(entity);
  return decoded !== entity && decoded.length <= 2;
}

function isValidNumeric(entity: string): boolean {
  const body = entity.slice(2, -1);
  const code = /^[xX]/.test(body) ? parseInt(body.slice(1), 16) : parseInt(body, 10);
  return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff);
}

/**
 * Decodes named and numeric entities. A well-formed-looking `&something;` that is not a real entity
 * (or a numeric one outside Unicode) is reported rather than silently left in the text. A bare `&`
 * that does not start an entity is ordinary text and is kept.
 */
export function decodeHtmlEntities(input: string): HtmlDecodeResult {
  const unknown = new Set<string>();
  for (const [entity] of input.matchAll(ENTITY)) {
    const valid = entity.startsWith('&#') ? isValidNumeric(entity) : isKnownNamed(entity);
    if (!valid) unknown.add(entity);
  }
  if (unknown.size > 0) return { ok: false, error: 'unknown-entity', entities: [...unknown] };
  return { ok: true, value: decodeWithBrowser(input) };
}
