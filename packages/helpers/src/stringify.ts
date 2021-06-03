import { inspect, InspectOptions } from 'util';

export function stringify(o: any, options: InspectOptions = {}): string {
  return inspect(o, { depth: Infinity, colors: true, ...options });
}
