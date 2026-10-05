export const KANA_MODES = [
  { id: 'hiragana-to-katakana', label: 'Hiragana → Katakana' },
  { id: 'katakana-to-hiragana', label: 'Katakana → Hiragana' },
  { id: 'to-halfwidth', label: 'Full-width → Half-width' },
  { id: 'to-fullwidth', label: 'Half-width → Full-width' },
] as const;
export type KanaMode = (typeof KANA_MODES)[number]['id'];

/** Which characters a width conversion touches. */
export const WIDTH_SCOPES = [
  { id: 'all', label: 'Letters, digits, symbols and katakana' },
  { id: 'ascii', label: 'Letters, digits, symbols and spaces only' },
  { id: 'katakana', label: 'Katakana only' },
] as const;
export type WidthScope = (typeof WIDTH_SCOPES)[number]['id'];

// Pairs of [half-width, full-width] characters, written as alternating characters.
const pairs = (text: string): [string, string][] =>
  Array.from({ length: text.length / 2 }, (_, i) => [text[i * 2]!, text[i * 2 + 1]!]);

const PLAIN = pairs(
  'ｧァｨィｩゥｪェｫォｯッｬャｭュｮョｦヲｱアｲイｳウｴエｵオｶカｷキｸクｹケｺコｻサｼシｽスｾセｿソﾀタﾁチﾂツﾃテﾄトﾅナﾆニﾇヌﾈネﾉノﾊハﾋヒﾌフﾍヘﾎホﾏマﾐミﾑムﾒメﾓモﾔヤﾕユﾖヨﾗラﾘリﾙルﾚレﾛロﾜワﾝン' +
    '｡。｢「｣」､、･・ｰー',
);
// Half-width base + ﾞ (dakuten) / ﾟ (handakuten) → one full-width character.
const VOICED = pairs('ｶガｷギｸグｹゲｺゴｻザｼジｽズｾゼｿゾﾀダﾁヂﾂヅﾃデﾄドﾊバﾋビﾌブﾍベﾎボｳヴ');
const SEMI_VOICED = pairs('ﾊパﾋピﾌプﾍペﾎポ');
const HALF_DAKUTEN = 'ﾞ';
const HALF_HANDAKUTEN = 'ﾟ';
const FULL_DAKUTEN = '゛'; // U+309B
const FULL_HANDAKUTEN = '゜'; // U+309C

const halfToFullPlain = new Map(PLAIN);
const halfToFullVoiced = new Map(VOICED);
const halfToFullSemi = new Map(SEMI_VOICED);
const fullToHalf = new Map<string, string>([
  ...PLAIN.map(([half, full]) => [full, half] as [string, string]),
  ...VOICED.map(([half, full]) => [full, half + HALF_DAKUTEN] as [string, string]),
  ...SEMI_VOICED.map(([half, full]) => [full, half + HALF_HANDAKUTEN] as [string, string]),
  [FULL_DAKUTEN, HALF_DAKUTEN],
  [FULL_HANDAKUTEN, HALF_HANDAKUTEN],
]);

const OFFSET = 0x60; // katakana code point − hiragana code point
const FULLWIDTH_ASCII_OFFSET = 0xfee0; // U+FF01 ("！") − U+0021 ("!")
const IDEOGRAPHIC_SPACE = '　';

function shiftRange(text: string, from: number, to: number, delta: number): string {
  let out = '';
  for (const char of text) {
    const code = char.codePointAt(0)!;
    out += code >= from && code <= to ? String.fromCodePoint(code + delta) : char;
  }
  return out;
}

/** ぁ–ゖ and ゝゞ → ァ–ヶ and ヽヾ. ー, punctuation and everything else stay as they are. */
export function hiraganaToKatakana(text: string): string {
  return shiftRange(shiftRange(text, 0x3041, 0x3096, OFFSET), 0x309d, 0x309e, OFFSET);
}

/** ァ–ヶ and ヽヾ → ぁ–ゖ and ゝゞ. ヷ–ヺ have no hiragana form and stay. */
export function katakanaToHiragana(text: string): string {
  return shiftRange(shiftRange(text, 0x30a1, 0x30f6, -OFFSET), 0x30fd, 0x30fe, -OFFSET);
}

/** Full-width → half-width. Voiced kana become base + ﾞ/ﾟ (two characters), as half-width kana require. */
export function toHalfwidth(text: string, scope: WidthScope = 'all'): string {
  let out = '';
  for (const char of text) {
    const code = char.codePointAt(0)!;
    if (scope !== 'katakana') {
      if (code >= 0xff01 && code <= 0xff5e) {
        out += String.fromCodePoint(code - FULLWIDTH_ASCII_OFFSET);
        continue;
      }
      if (char === IDEOGRAPHIC_SPACE) {
        out += ' ';
        continue;
      }
    }
    // Katakana punctuation (。「」、・ー゛゜) belongs with katakana: half-width kana text needs it.
    out += (scope !== 'ascii' && fullToHalf.get(char)) || char;
  }
  return out;
}

/** Half-width → full-width. A ﾞ/ﾟ after a kana that can take it is merged: ｶﾞ → ガ, ﾊﾟ → パ. */
export function toFullwidth(text: string, scope: WidthScope = 'all'): string {
  const chars = [...text];
  let out = '';
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i]!;
    const code = char.codePointAt(0)!;
    if (scope !== 'katakana') {
      if (code >= 0x21 && code <= 0x7e) {
        out += String.fromCodePoint(code + FULLWIDTH_ASCII_OFFSET);
        continue;
      }
      if (char === ' ') {
        out += IDEOGRAPHIC_SPACE;
        continue;
      }
    }
    if (scope === 'ascii') {
      out += char;
      continue;
    }
    const next = chars[i + 1];
    const voiced = next === HALF_DAKUTEN && halfToFullVoiced.get(char);
    const semi = next === HALF_HANDAKUTEN && halfToFullSemi.get(char);
    if (voiced || semi) {
      out += voiced || semi;
      i++;
    } else if (char === HALF_DAKUTEN) {
      out += FULL_DAKUTEN;
    } else if (char === HALF_HANDAKUTEN) {
      out += FULL_HANDAKUTEN;
    } else {
      out += halfToFullPlain.get(char) ?? char;
    }
  }
  return out;
}

export function convertKana(text: string, mode: KanaMode, scope: WidthScope = 'all'): string {
  switch (mode) {
    case 'hiragana-to-katakana':
      return hiraganaToKatakana(text);
    case 'katakana-to-hiragana':
      return katakanaToHiragana(text);
    case 'to-halfwidth':
      return toHalfwidth(text, scope);
    case 'to-fullwidth':
      return toFullwidth(text, scope);
  }
}
