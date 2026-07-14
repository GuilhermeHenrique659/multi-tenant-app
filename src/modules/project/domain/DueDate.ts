export default class DueDate {
    private constructor(private readonly _startAt: Date, private readonly _endAt?: Date) { }

    get startAt() {
        return this._startAt;
    }

    get endAt() {
        return this._endAt;
    }

    static create(startAt: Date, endAt?: Date) {
        if (endAt && startAt.getDate() > endAt?.getDate()) throw new Error('start at must be less than end at');

        return new DueDate(startAt, endAt);
    }
}