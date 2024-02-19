import { Transform } from 'node:stream';

/**
 * This class is a Transform stream that limits the number of concurrent requests
 * to a given value. It does this by waiting for a given amount of time when the
 * limit is reached.
 */
export class PromiseLimiter extends Transform {
    /**
     * @param maxValue max number of concurrent processes
     * @param transformOptions options to pass to the Transform stream
     */
    constructor(
        maxValue = 1000,
        transformOptions
    ) {
        super({
            objectMode: true,
            highWaterMark: maxValue,
            ...transformOptions
        });
    }
    _transform(data, _, callback) {
        data
            .then((result) => {
                this.push(result);
                callback();
            })
            .catch((err) => {
                callback(err);
            })
    }
}
