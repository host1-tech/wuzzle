export default function jsonStringify(o: any, space: number = 2): string {
  return JSON.stringify(o, replacer, space);
}

function replacer(k: string, v: any): any {
  if (v instanceof RegExp) {
    return v.toString();
  }
  return v;
}
