
export const ToMap = <T, K>(array: Array<T>, fn: (item: T) => [K, T] | undefined): Map<K, T> => new Map<K, T>(array.map(fn).filter(data => !!data))

export const ModelToMapFn = <T extends { props: { id?: string } }>(item: T): [string, T] | undefined => {
    if (!item.props.id) return;

    return [item.props.id, item];
}