/**
 * Go style result: `[error, null]` or `[null, value]`. Used where the caller has
 * to keep going after a failure — the LLM path, for instance, where the worker
 * still has to persist the status of its steps.
 */
export type TupleResult<T> = [Error, null] | [null, T];

export const Ok = <T>(value: T): [null, T] => [null, value];

export const Err = (error: Error | string): [Error, null] => [error instanceof Error ? error : new Error(error), null];
