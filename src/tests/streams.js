import fs from 'fs'
import { Readable } from 'stream'

class SimulatedStream extends Readable {
    counter = 0;
    name = 'a'

    constructor(sname) {
        super()
        this.name = sname
    }

    _read() {
        if (this.counter < 15) {
            setTimeout(() => {
                this.push(`${this.name} ${this.counter}\n`);
                this.counter++;
            }, 100)
        } else {
            a = 'b'

            setTimeout(() => {
                this.push(null); // End the stream
            }, 100)
        }
    }
}

async function* concatStreams(readableStreams, onError) {
    for (const readable of readableStreams) {
        try {
            for await (const chunk of readable) {
                yield chunk;
            }
        } catch (err) {
            onError(err);
        }
    }
}

async function main() {
    const sample1 = fs.createReadStream('./src/samples/file1.txt')
    const sample2 = fs.createReadStream('./src/samples/file2.txt')
    const sample3 = fs.createReadStream('./src/samples/file3.txt')

    const simulatedStream = new SimulatedStream('a');
    const simulatedStream2 = new SimulatedStream('b');
    const streamConcatenator = concatStreams([sample1, sample2, sample3, simulatedStream, simulatedStream2]);

    setTimeout(() => {
        simulatedStream.emit('error', new Error('Simulated error'));
    }, 1000); // Emit an error after 2 seconds


    for await (const chunk of streamConcatenator) {
        try {
            console.log(chunk.toString());
        } catch (err) {
            console.error(`Error processing chunk: ${err}`);
        }
    }
}

main()
