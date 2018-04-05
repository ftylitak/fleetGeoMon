var http = require('http');

//create a server object:
http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/html'});

    if(req.url === '/nonMovingDrones')
        res.write(req.url); //write a response to the client
    else
        res.write(`Request ignored: ${req.url}`);

    res.end(); //end the response
}).listen(8080); //the server object listens on port 8080
