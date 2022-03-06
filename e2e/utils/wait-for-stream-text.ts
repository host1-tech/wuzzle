import { flatten } from 'lodash';
import { Readable } from 'stream';
import waitForExpect from 'wait-for-expect';

export async function waitForStreamText(
  stream: Readable | Readable[],
  text: string,
  timeout: number,
  interval: number = Math.max(0.05 * timeout, 100)
): Promise<void> {
  const streams = flatten([stream]);
  let output: string = '';
  function listener(chunk: Buffer) {
    output += chunk.toString();
  }
  streams.forEach(s => s.on('data', listener));
  try {
    await waitForExpect(
      () => expect(output).toEqual(expect.stringContaining(text)),
      timeout,
      interval
    );
  } finally {
    streams.forEach(s => s.off('data', listener));
  }
}
