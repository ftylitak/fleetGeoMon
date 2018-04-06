const net = require('net');
let storage = require('./storage').locationStorage;
const crypto = require('crypto');

const DRONE_PORT = 8088;
const DASHBOARD_PORT = 8081;

let droneSocketServer = net.createServer();
let dashboardSocketServer = net.createServer();

let activeDashboardSockets = new Map();

droneSocketServer.on('connection', function(socket) {
    socket.id = crypto.randomBytes(16).toString('base64');
    socket.on('data', function(data) {
        let locationInfoArray = data.toString().trim().split('\n');
        if(locationInfoArray === undefined)
            return;

        for(let locationInfo of locationInfoArray)
        {
            let locationObject = storage.insert(socket.id, locationInfo);
            if(locationObject !== undefined)
                activeDashboardSockets.forEach(async (value) => {
                    value.write(JSON.stringify(locationObject) + '\n');
                });
        }
    });
    socket.on('end', function() {
        console.log(`drone socket[${socket.id}] disconnected`);
    });

    socket.on('error', function (e) {
        if (e.code == 'EADDRINUSE') {
            console.log('Address in use.');
        }
    });
});

dashboardSocketServer.on('connection', function(socket) {
    socket.id = crypto.randomBytes(8).toString('base64');
    activeDashboardSockets.set(socket.id, socket);

    socket.on('end', function() {
        console.log(`dashboard socket[${socket.id}] disconnected`);
        activeDashboardSockets.delete(socket.id);
    });
    socket.on('error', function (e) {
        if (e.code == 'EADDRINUSE') {
            console.log('Address in use.');
        }
    });
});

let droneSocketServerApp = droneSocketServer.listen(DRONE_PORT,function() { //'listening' listener
    const host = droneSocketServer.address().address;
    const port = droneSocketServer.address().port;
    console.log(`drone socket server listening at http://${host}:${port}`);
});

let dashboardSocketServerApp = dashboardSocketServer.listen(DASHBOARD_PORT,function() { //'listening' listener
    const host = dashboardSocketServer.address().address;
    const port = dashboardSocketServer.address().port;
    console.log(`dashboard socket server listening at http://${host}:${port}`);
});

module.export = [
    droneSocketServerApp,
    dashboardSocketServerApp
];
