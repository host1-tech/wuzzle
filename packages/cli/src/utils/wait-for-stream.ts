export function waitForStream(
  stream: NodeJS.WritableStream | NodeJS.ReadableStream
): Promise<void> {
  return new Promise((resolve, reject) => stream.on('finish', resolve).on('error', reject));
}
