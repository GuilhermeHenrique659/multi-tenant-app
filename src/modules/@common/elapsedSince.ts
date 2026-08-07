/** Milliseconds since a `performance.now()` mark, rounded for the logs. */
export default function elapsedSince(startedAt: number): number {
    return Math.round(performance.now() - startedAt);
}
