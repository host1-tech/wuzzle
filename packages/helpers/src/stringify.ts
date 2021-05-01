import jsonStringifySafe from 'json-stringify-safe';

interface TargetDescription<T = any> {
  Type: new (...args: any[]) => T;
  toIntermediate(k: string, v: T): string;
  intermediateTester: RegExp;
}

const cycleDescription: TargetDescription = {
  Type: class CircularType {},
  toIntermediate() {
    return '#Circular [Circular]';
  },
  intermediateTester: /"#Circular (.+)"/,
};

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
  cycleDescription,
];

function jsonReplacer(k: string, v: any): any {
  targetDescriptions.some(({ Type, toIntermediate }) => {
    if (v instanceof Type) return (v = toIntermediate(k, v));
  });
  return v;
}

function cycleReplacer(k: string, v: any): any {
  return cycleDescription.toIntermediate(k, v);
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
  return stringFormat(jsonStringifySafe(o, jsonReplacer, space, cycleReplacer));
}
