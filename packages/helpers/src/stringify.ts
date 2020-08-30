export default function jsonStringify(o: any, space: number = 2): string {
  return stringFormat(JSON.stringify(o, jsonReplacer, space));
}

function jsonReplacer(k: string, v: any): any {
  if (v instanceof RegExp) {
    return `#RegExp ${v.toString()}`;
  }
  return v;
}

function stringFormat(v: string): string {
  return v
    .split('\n')
    .map(l => l.replace(/"#RegExp (.+)"/, 'new RegExp("$1")'))
    .join('\n');
}
