# fleetGeoMon
A Node.js backend on resin.io for keeping track of the geo-location of a fleet of drones.

Key features:
 * Communication with the drones via [net.Socket](https://nodejs.org/api/net.html#net_class_net_socket) for minimum data transmission overhead.
 * Supports the connection of multiple listeners (e.x. dashboards, loggers) via [net.Socket](https://nodejs.org/api/net.html#net_class_net_socket) that will be receiving all the updates of the drone location changes packed with the _drone id_ and the _timestamp_.
  * Reporting of the non-moving drones (either disconnected or still) via HTTP GET request. Returns an array of _drone id_.

## Prepare the drones
First step is to prepare the drone software to be able to communicate with our backend. Since @fleetGeoMon uses simple TCP sockets, the client is free to use the language and implementation of choice as long as it complies with the following:
 * Connect to address: "<server-address>:8088". The port 8088 is the fix port of the backend where it accepts the drone sockets.
 * Send the location in JSON format: '{long:31.123123,lat:21.1212122}'
 * Add a new line indicator at the end of each sample. (e.g. "{long:31.123123,lat:21.1212122}\n")

### Node.js example
```node
var net = require('net');
var socket = new net.Socket();

//connect to the fleetGeoMon socket. Use valid IP instead of localhost!
socket.connect(8088, '127.0.0.1', function() {
    console.log('connected to fleetGeoMon.');
});

//retrieve GPS coordinates
...

//report location
socket.write('{"long":31.9724315,"lat":23.7573327}\n');

```

## Prepare the dashboard
Multiple listeners of the drone location changes can be registered to fleetGeoMon by connecting to the appropriate socket. Each location update that is reported by any drone to the backend, it is redirected to all listeners along with the UID of the drone and the timestamp of the update. An example of such a value would be:

```json
{"long":31.97241,"lat":23.75741,"timestamp":1523006421088,"id":"8LnEt6wbaaHEjqC0T8Q+wA=="}
```

In orde for a listener to be able to receive and understand the location update messages, it needs to:
 * Connect to address: "<server-address>:8081". The port 8081 is the fix port of the backend where it accepts the listener sockets.
 * Be able to process that received data from the socket

### Node.js example

```node
var net = require('net');
var socket = new net.Socket();

//connect to the fleetGeoMon socket. Use valid IP instead of localhost!
socket.connect(8081, '127.0.0.1', function() {
    console.log('connected to fleetGeoMon.');
});

//report location
socket.on('data', function(data) {
    let locationInfoArray = data.toString().trim().split('\n');
    if(locationInfoArray === undefined)
        return;

    for(let receivedObject of locationInfoArray)
    {
        //update marker on map receivedObject.long, receivedObject.lat, receivedObject.id
    }
});
```
### Caveat
Using sockets there is no guaranty that each object will be delivered to the listener, upon writting to the socket. Moreover, upon reception, the last object can be fragmented and its continuation would be to the next data that will become available. A solution to this would be some prosessing of the first and last object received to fix the fragmentation. Thus, the socket.on('data') function would become:

```node
let fragmentedTermination = '';
socket.on('data', function(data) {
    let locationInfoArray = data.toString().trim().split('\n');
    if(locationInfoArray === undefined)
        return;

    /////////////////////////
    // fix the first object if needed
    if(fragmentedTermination !== '') {
        locationInfoArray[0] = fragmentedTermination + locationInfoArray[0];
        fragmentedTermination = '';
    }


    /////////////////////////
    // keep the last fragmented item if exists
    let lastObject = locationInfoArray.slice(-1)[0];
    try {
        JSON.parse(lastObject);
    } catch (e) {
        console.log('keeping: ' + lastObject);
        fragmentedTermination = lastObject;
        locationInfoArray.pop();
    }

    for(let receivedObject of locationInfoArray)
    {
        //update marker on map receivedObject.long, receivedObject.lat, receivedObject.id
    }
});
```

## How to run
The project is prepared to be deployed through resin.io. Clone this repo locally:
```
$ git clone https://github.com/ftylitak/fleetGeoMon.git
```
Then add your resin.io application's remote repository to your local repository:
```
$ git remote add resin username@git.resin.io:username/myapp.git
```
and push the code to the newly added remote:
```
$ git push resin master
```

### Manual execution locally
To manually execute the backend, you need to have node.js and npm installed. If those are already setup, clone this repo locally:

```
$ git clone https://github.com/ftylitak/fleetGeoMon.git
```
Go to the create folder:
```
$ cd fleetGeoMon
```
Initialize npm:
```
npm init
```
Install all needed dependencies:
```
npm install
```
Run tests:
```
npm test
```
Start the server:
```
npm start
```

## Assumptions
