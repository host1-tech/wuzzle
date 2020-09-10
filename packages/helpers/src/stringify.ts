export default function jsonStringify(o: any, space: number = 2): string {
  return stringFormat(JSON.stringify(o, jsonReplacer, space));
}

function jsonReplacer(k: string, v: any): any {
  if (v instanceof RegExp) {
    return `#RegExp ${encodeURIComponent(v.toString())}`;
  }
  if (v instanceof Function) {
    return `#Function ${encodeURIComponent(v.toString())}`;
  }
  return v;
}

function stringFormat(v: string): string {
  return v
    .split('\n')
    .map(l => {
      const matchRegExp = l.match(/"#RegExp (.+)"/);
      if (matchRegExp) {
        return decodeURIComponent(matchRegExp[1]);
      }
      const matchFunction = l.match(/"#Function (.+)"/);
      if (matchFunction) {
        return decodeURIComponent(matchFunction[1]);
      }
      return l;
    })
    .join('\n');
}
