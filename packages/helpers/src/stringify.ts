interface TargetDescription<T = any> {
  Type: new (...args: any[]) => T;
  toIntermediate(k: string, v: T): string;
  intermediateTester: RegExp;
}

const targetDescriptions: TargetDescription[] = [
  {
    Type: RegExp,
    toIntermediate(k: string, v: RegExp) {
      return `#RegExp ${encodeURIComponent(v.toString())}`;
    },
    intermediateTester: /"#RegExp (.+)"/,
  },
  {
    Type: Function,
    toIntermediate(k: string, v: Function) {
      const s = v.toString();

      const functionNameMatched = s.match(/^function\s+(\w+)\s*\(/m);
      if (functionNameMatched) {
        k = functionNameMatched[1];
      }

      return `#Function [Function: ${k}]`;
    },
    intermediateTester: /"#Function (.+)"/,
  },
];

function jsonReplacer(k: string, v: any): any {
  targetDescriptions.some(({ Type, toIntermediate }) => {
    if (v instanceof Type) return (v = toIntermediate(k, v));
  });
  return v;
}

function stringFormat(v: string): string {
  return v
    .split('\n')
    .map(l => {
      targetDescriptions.some(({ intermediateTester }) => {
        const m = l.match(intermediateTester);
        if (m) return (l = l.replace(m[0], decodeURIComponent(m[1])));
      });
      return l;
    })
    .join('\n');
}

export default function stringify(o: any, space: number = 2): string {
  return stringFormat(JSON.stringify(o, jsonReplacer, space));
}
