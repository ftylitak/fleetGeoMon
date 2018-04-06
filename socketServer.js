var net = require('net');
var storage = require('./storage').locationStorage;
const crypto = require('crypto');

let PORT = 8088;

var droneSocketServer = net.createServer();

droneSocketServer.on('connection', function(socket) {
    socket.id = crypto.randomBytes(16).toString('base64');
    socket.on('data', function(data) {
        let locationInfoArray = data.toString().trim().split('\n');
        if(locationInfoArray === undefined)
            return;

        for(let locationInfo of locationInfoArray)
        {
            let locationObject = storage.insert(socket.id, locationInfo);
            // if(locationObject !== undefined)
            //     console.log('will be redirected');
        }
    });
    socket.on('end', function() {
        console.log('client disconnected');
    });
    socket.on('error', function (e) {
        if (e.code == 'EADDRINUSE') {
            console.log('Address in use.');
        }
    });
});

var droneSocketServerApp = droneSocketServer.listen(PORT,function() { //'listening' listener
    let host = droneSocketServer.address().address;
    let port = droneSocketServer.address().port;
    console.log(`drone socket server listening at http://${host}:${port}`);
});

module.export = droneSocketServerApp;
