import { describe, expect, it } from 'vitest';
import {
  convertKana,
  hiraganaToKatakana,
  katakanaToHiragana,
  toFullwidth,
  toHalfwidth,
} from './logic';

describe('hiraganaToKatakana', () => {
  it('converts hiragana, including voiced, small and ゔ', () => {
    expect(hiraganaToKatakana('ひらがな')).toBe('ヒラガナ');
    expect(hiraganaToKatakana('がぎぐげご ぱぴぷぺぽ ゔ ぁっゃゅょゎ')).toBe(
      'ガギグゲゴ パピプペポ ヴ ァッャュョヮ',
    );
  });

  it('converts iteration marks and keeps the prolonged sound mark', () => {
    expect(hiraganaToKatakana('ゝゞ')).toBe('ヽヾ');
    expect(hiraganaToKatakana('らーめん')).toBe('ラーメン');
  });

  it('leaves kanji, katakana, Latin, digits, spaces and punctuation alone', () => {
    const text = '漢字カタカナ ABC 123 、。！？「」…';
    expect(hiraganaToKatakana(text)).toBe(text);
  });

  it('handles mixed text and is idempotent', () => {
    expect(hiraganaToKatakana('Hello、こんにちは World 2024')).toBe('Hello、コンニチハ World 2024');
    expect(hiraganaToKatakana(hiraganaToKatakana('あ'))).toBe('ア');
  });

  it('handles empty input and astral characters', () => {
    expect(hiraganaToKatakana('')).toBe('');
    expect(hiraganaToKatakana('😀あ𠮷')).toBe('😀ア𠮷');
  });
});

describe('katakanaToHiragana', () => {
  it('converts katakana, including voiced, small and ヴ', () => {
    expect(katakanaToHiragana('カタカナ')).toBe('かたかな');
    expect(katakanaToHiragana('ガギグゲゴ パピプペポ ヴ ァッャュョヮヵヶ')).toBe(
      'がぎぐげご ぱぴぷぺぽ ゔ ぁっゃゅょゎゕゖ',
    );
  });

  it('keeps the prolonged sound mark and converts iteration marks', () => {
    expect(katakanaToHiragana('ラーメン')).toBe('らーめん');
    expect(katakanaToHiragana('ヽヾ')).toBe('ゝゞ');
  });

  it('keeps characters with no hiragana equivalent and half-width kana', () => {
    expect(katakanaToHiragana('ヷヸヹヺ・')).toBe('ヷヸヹヺ・');
    expect(katakanaToHiragana('ｶﾀｶﾅ')).toBe('ｶﾀｶﾅ');
  });

  it('leaves other text alone', () => {
    const text = 'Tokyo 東京 2024! ひらがな、。';
    expect(katakanaToHiragana(text)).toBe(text);
  });

  it('round-trips plain kana', () => {
    expect(katakanaToHiragana(hiraganaToKatakana('にほんご'))).toBe('にほんご');
  });
});

describe('toHalfwidth', () => {
  it('converts full-width Latin, digits, symbols and the ideographic space', () => {
    expect(toHalfwidth('ＡＢＣ　ａｂｃ　１２３！？（）～＼')).toBe('ABC abc 123!?()~\\');
  });

  it('converts katakana to half-width, splitting dakuten and handakuten', () => {
    expect(toHalfwidth('カタカナ')).toBe('ｶﾀｶﾅ');
    expect(toHalfwidth('ガギグゲゴ')).toBe('ｶﾞｷﾞｸﾞｹﾞｺﾞ');
    expect(toHalfwidth('パピプペポ')).toBe('ﾊﾟﾋﾟﾌﾟﾍﾟﾎﾟ');
    expect(toHalfwidth('ヴ')).toBe('ｳﾞ');
    expect(toHalfwidth('ァィゥェォッャュョ')).toBe('ｧｨｩｪｫｯｬｭｮ');
  });

  it('converts the prolonged sound mark and kana punctuation', () => {
    expect(toHalfwidth('ラーメン、「ＯＫ」。・')).toBe('ﾗｰﾒﾝ､｢OK｣｡･');
  });

  it('leaves hiragana, kanji and already half-width text alone', () => {
    expect(toHalfwidth('ひらがな漢字 abc 123')).toBe('ひらがな漢字 abc 123');
  });

  it('leaves katakana without a half-width form', () => {
    expect(toHalfwidth('ヮヰヱヵヶ')).toBe('ヮヰヱヵヶ');
  });

  it('respects the scope', () => {
    expect(toHalfwidth('ＡＢＣ　カナ', 'ascii')).toBe('ABC カナ');
    expect(toHalfwidth('ＡＢＣ　カナ', 'katakana')).toBe('ＡＢＣ　ｶﾅ');
  });

  it('handles mixed text and empty input', () => {
    expect(toHalfwidth('Ｔｏｋｙｏは東京。')).toBe('Tokyoは東京｡');
    // The ASCII-only scope leaves Japanese punctuation alone.
    expect(toHalfwidth('Ｔｏｋｙｏは東京。', 'ascii')).toBe('Tokyoは東京。');
    expect(toHalfwidth('')).toBe('');
  });
});

describe('toFullwidth', () => {
  it('converts half-width Latin, digits, symbols and spaces', () => {
    expect(toFullwidth('ABC abc 123!?()~\\')).toBe('ＡＢＣ　ａｂｃ　１２３！？（）～＼');
  });

  it('converts half-width katakana to full-width', () => {
    expect(toFullwidth('ｶﾀｶﾅ')).toBe('カタカナ');
    expect(toFullwidth('ｧｨｩｪｫｯｬｭｮｦﾝ')).toBe('ァィゥェォッャュョヲン');
  });

  it('merges dakuten and handakuten into the preceding kana', () => {
    expect(toFullwidth('ｶﾞｷﾞｸﾞｹﾞｺﾞ')).toBe('ガギグゲゴ');
    expect(toFullwidth('ﾊﾟﾋﾟﾌﾟﾍﾟﾎﾟ')).toBe('パピプペポ');
    expect(toFullwidth('ｳﾞ')).toBe('ヴ');
    expect(toFullwidth('ﾊﾞﾋﾞﾌﾞﾍﾞﾎﾞ')).toBe('バビブベボ');
  });

  it('converts a mark that cannot combine on its own', () => {
    expect(toFullwidth('ｱﾞ')).toBe('ア゛');
    expect(toFullwidth('ﾞ')).toBe('゛');
    expect(toFullwidth('ﾟ')).toBe('゜');
    expect(toFullwidth('ｶﾟ')).toBe('カ゜');
  });

  it('converts half-width kana punctuation and the prolonged sound mark', () => {
    expect(toFullwidth('ﾗｰﾒﾝ､｢OK｣｡･')).toBe('ラーメン、「ＯＫ」。・');
  });

  it('leaves line breaks, tabs, hiragana, kanji and full-width text alone', () => {
    expect(toFullwidth('a\nb\tc')).toBe('ａ\nｂ\tｃ');
    expect(toFullwidth('ひらがな漢字ＡＢＣ')).toBe('ひらがな漢字ＡＢＣ');
  });

  it('respects the scope', () => {
    expect(toFullwidth('AB ｶﾅ', 'ascii')).toBe('ＡＢ　ｶﾅ');
    expect(toFullwidth('AB ｶﾅ', 'katakana')).toBe('AB カナ');
  });

  it('round-trips with toHalfwidth', () => {
    const text = 'ガッコウ　２０２４　ＯＫ！　パン、ラーメン。';
    expect(toFullwidth(toHalfwidth(text))).toBe(text);
  });

  it('handles empty input and astral characters', () => {
    expect(toFullwidth('')).toBe('');
    expect(toFullwidth('😀ｱ')).toBe('😀ア');
  });
});

describe('convertKana', () => {
  it('dispatches to every mode', () => {
    expect(convertKana('あ', 'hiragana-to-katakana')).toBe('ア');
    expect(convertKana('ア', 'katakana-to-hiragana')).toBe('あ');
    expect(convertKana('ア', 'to-halfwidth')).toBe('ｱ');
    expect(convertKana('ｱ', 'to-fullwidth')).toBe('ア');
  });
});
