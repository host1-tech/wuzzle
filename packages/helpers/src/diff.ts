import { diffLines } from 'diff';

export default function diff(oldStr: string, newStr: string) {
  return diffLines(oldStr, newStr)
    .map(({ value, added, removed }) =>
      added || removed
        ? value
            .split('\n')
            .map(l => `${added ? '+' : '-'}${l}`)
            .join('\n')
        : value
    )
    .join('');
}
