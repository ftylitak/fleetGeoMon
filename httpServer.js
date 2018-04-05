var http = require('http');

let PORT = 8080;

//create the server that will be providing the UUID list of the non-moving drones
var httpServer = http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/html'});

    if(req.url === '/nonMovingDrones')
        res.end(req.url); //write a response to the client
    else
        res.end(`Request ignored: ${req.url}`);
});

var httpServerApp = httpServer.listen(PORT, () => {
    let host = httpServerApp.address().address;
    let port = httpServerApp.address().port;

    console.log(`HTTP server listening at http://${host}:${port}`);
});

module.exports = httpServerApp;
