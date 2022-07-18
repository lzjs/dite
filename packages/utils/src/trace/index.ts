export async function traceAsyncFn<T>(fn: () => T | Promise<T>): Promise<T> {
  try {
    return await fn();
  } finally {
    //
  }
}
