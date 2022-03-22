export function logError(e: unknown): void {
  if (e instanceof Error) {
    console.error(e.stack);
  } else {
    console.error(e);
  }
}

export function logPlain(s: unknown): void {
  console.log(s);
}
