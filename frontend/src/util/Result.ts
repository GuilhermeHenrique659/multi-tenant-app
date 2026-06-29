type UnwrapOr<T, E> = (res: Result<T, E>) => T;
type UnwrapOrElse<T, E> = (res: Result<T, E>) => T | null;
type UnwrapOrNone<T, E> = (res: Result<T, E>) => T | null;

type ResultState<T, E> =
    | { readonly type: 'ok'; readonly data: T; readonly error: null }
    | { readonly type: 'error'; readonly data: null; readonly error: E };

export const unwrapOr = <T, E>(data: T): UnwrapOr<T, E> => {
    return (res: Result<T, E>) => res.unwrapOr(data);
}

export const unwrapOrElse = <T, E>(fn: (err: E) => void): UnwrapOrElse<T, E> => {
    return (res: Result<T, E>) => res.unwrapOrElse(fn);
}

export const unwrapOrNone = <T, E>(): UnwrapOrNone<T, E> => {
    return (res: Result<T, E>) => res.unwrapOrNone();
}

export class Result<T = never, E = never> {
    private readonly state: ResultState<T, E>;

    constructor(state: ResultState<T, E>) {
        this.state = state;
    }

    get value(): T | null {
        return this.state.data!;
    }

    get error(): E | null {
        return this.state.error;
    }

    static Ok<T>(data: T): Result<T, never> {
        return new Result<T, never>({ type: 'ok', data: data, error: null });
    }

    static Error<E>(error: E): Result<never, E> {
        return new Result<never, E>({ type: 'error', error, data: null });
    }

    public isOk(): this is Result<T, E> & { value: NonNullable<T>; error: null } {
        return this.state.type === 'ok';
    }

    public isErr(): this is Result<T, E> & { error: NonNullable<E>; value: null } {
        return this.state.type === 'error';
    }

    public unwrap() {
        if (this.state.type === 'error') throw new Error('Result not handle propertly');

        return this.state.data;
    }

    public unwrapOr(defData: T): T {
        if (this.state.type === 'error') return defData;
        return this.state.data;
    }

    public unwrapOrNone(): T | null {
        if (this.state.type === 'error') return null;
        return this.state.data;
    }

    public unwrapOrElse(fn: (err: E) => void): T | null {
        if (this.state.type === 'ok') return this.state.data;
        fn(this.state.error);
        return null;
    }
}