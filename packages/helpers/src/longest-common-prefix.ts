export function longestCommonPrefix(strs: string[]): string {
  if (!strs.length) return '';

  let k = strs[0].length;
  for (let i = 1, n = strs.length; i < n; i++) {
    k = Math.min(k, strs[i].length);
    for (let j = 0; j < k; j++)
      if (strs[i][j] !== strs[0][j]) {
        k = j;
        break;
      }
  }
  return strs[0].substring(0, k);
}
