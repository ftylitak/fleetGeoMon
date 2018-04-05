var net = require('net');

let PORT = 8088;

var socketServer = net.createServer();

socketServer.on('connection', function(conn) {
    conn.id = Math.floor(Math.random() * 1000);
    conn.on('data', function(data) {
        conn.write('ID: '+conn.id);
        console.log(JSON.stringify(data));
    });
});

var socketServerApp = socketServer.listen(PORT,function() { //'listening' listener
    let host = socketServer.address().address;
    let port = socketServer.address().port;
    console.log(`socket server listening at http://${host}:${port}`);
});

module.export = socketServerApp;
