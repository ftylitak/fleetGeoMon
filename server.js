var http = require('http');

//create a server object:
var httpServer = http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/html'});

    if(req.url === '/nonMovingDrones')
        res.end(req.url); //write a response to the client
    else
        res.end(`Request ignored: ${req.url}`);
});

var httpServerApp = httpServer.listen(8080, () => {
    let host = httpServerApp.address().address;
    let port = httpServerApp.address().port;

    console.log(`App listening at http://${host}:${port}`);
});

module.exports = httpServerApp;
