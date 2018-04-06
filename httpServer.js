let http = require('http');
let storage = require('./storage.js').locationStorage;

const PORT = 8080;

//create the server that will be providing the UUID list of the non-moving drones
let httpServer = http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/html'});

    if(req.url === '/nonMovingDrones') {
        let result = storage.getRecordsOlderThan(10000);
        if(result === undefined)
            result = '';
        res.end(JSON.stringify(result));
    }
    else
        res.end(`Request ignored: ${req.url}`);
});

let httpServerApp = httpServer.listen(PORT, () => {
    let host = httpServerApp.address().address;
    let port = httpServerApp.address().port;

    console.log(`HTTP server listening at http://${host}:${port}`);
});

module.exports = httpServerApp;
