// CJK characters (Hangul, Han, Kana) read as roughly double the visual width
// of a Latin character, so a plain character count doesn't give an even
// "one line" cap across languages — a 40-char Korean sentence is much
// longer on screen than a 40-char English one. Weighting CJK as 2 and
// everything else as 1 makes a single cap (~40) land at roughly the same
// visual line length in either language, or any mix of the two.
const WIDE_CHAR_PATTERN =
  /[ᄀ-ᇿ㄰-㆏가-힣一-鿿぀-ヿ＀-￯]/;

function charWeight(char: string): number {
  return WIDE_CHAR_PATTERN.test(char) ? 2 : 1;
}

export function textWeight(text: string): number {
  let weight = 0;
  for (const char of text) weight += charWeight(char);
  return weight;
}

export function truncateToWeight(text: string, maxWeight: number): string {
  let weight = 0;
  let result = "";
  for (const char of text) {
    const next = weight + charWeight(char);
    if (next > maxWeight) break;
    weight = next;
    result += char;
  }
  return result;
}
