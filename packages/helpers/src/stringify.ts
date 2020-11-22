export default function stringify(o: any, space: number = 2): string {
  return stringFormat(JSON.stringify(o, jsonReplacer, space));
}

function jsonReplacer(k: string, v: any): any {
  const targets: (keyof NodeJS.Global)[] = ['RegExp', 'Function'];
  targets.some(t => {
    if (v instanceof global[t]) return (v = `#${t} ${encodeURIComponent(v.toString())}`);
  });
  return v;
}

function stringFormat(v: string): string {
  const targets = [/"#RegExp (.+)"/, /"#Function (.+)"/];
  return v
    .split('\n')
    .map(l => {
      targets.some(t => {
        const m = l.match(t);
        if (m) return (l = l.replace(m[0], decodeURIComponent(m[1])));
      });
      return l;
    })
    .join('\n');
}
