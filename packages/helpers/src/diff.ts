import { diffLines } from 'diff';

export function diff(oldStr: string, newStr: string): string {
  return diffLines(oldStr, newStr)
    .map(({ value, added, removed }) => {
      const sign = added ? '+' : removed ? '-' : '';

      const isEndedWithNewline = value.endsWith('\n');

      if (isEndedWithNewline) value = value.substring(0, value.length - 1);

      value = value
        .split('\n')
        .map(l => `${sign}${l}`)
        .join('\n');

      if (isEndedWithNewline) value = value + '\n';

      return value;
    })
    .join('');
}
