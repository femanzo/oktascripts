import http from 'http'

const hostname = '127.0.0.1';
const port = 3333;

const server = http.createServer(async (req, res) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello World\n');
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
