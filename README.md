# fleetGeoMon
A Node.js backend on resin.io for keeping track of the geo-location of a fleet of drones.

Key features:
 * Communication with the drones via [net.Socket](https://nodejs.org/api/net.html#net_class_net_socket) for minimum data transmission overhead.
 * Supports the connection of multiple listeners (e.x. dashboards, loggers) via [net.Socket](https://nodejs.org/api/net.html#net_class_net_socket) that will be receiving all the updates of the drone location changes packed with the _drone id_ and the _timestamp_.
  * Reporting of the non-moving drones (either disconnected or still) via HTTP GET request. Returns an array of _drone id_.

## Prepare the drones
First step is to prepare the drone software to be able to communicate with our backend. Since @fleetGeoMon uses simple TCP sockets, the client is free to use the language and implementation of choice as long as it complies with the following:
 * Connect to address: "<server-address>:8088". The port 8088 is the fix port of the backend where it accepts the drone sockets.
 * Send the location in JSON format: '{long:31.123123,lat:21.121212}'
 * Add a new line indicator at the end of each sample. (e.g. "{long:31.123123,lat:21.121212}\n")

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
socket.write('{"long":31.972431,"lat":23.757332}\n');

```

## Prepare the dashboard
Multiple listeners of the drone location changes can be registered to fleetGeoMon by connecting to the appropriate socket. Each location update that is reported by any drone to the backend, it is redirected to all listeners along with the UID of the drone and the timestamp of the update. An example of such a value would be:

```json
{"long":31.972410,"lat":23.757410,"timestamp":1523006421088,"id":"8LnEt6wbaaHEjqC0T8Q+wA=="}
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
```bash
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

```bash
$ git clone https://github.com/ftylitak/fleetGeoMon.git
```
Go to the created folder:
```bash
$ cd fleetGeoMon
```
Initialize npm:
```bash
$ npm init
```
Install all needed dependencies:
```bash
$ npm install
```
Run tests:
```bash
$ npm test
```
Start the server:
```bash
$ npm start
```

## Assumptions

As with every problem, there are many approaches to achieve a solution.

### Sockets
The first decision that needed to be taken was the connection method between the drones and the backend. Our use case required the retrieval of location data from the connected drones every one second with as minimum overhead as possible. This ruled out the HTTP POST (or PUT) messages as this would add too much overhead in the size of the transmitted message (HTTP headers) and would require a new connection to be established every time.

The above drawbacks were solved by adopting TCP sockets. The connection is established once and every message is sent without any further overhead. This being said, the optimization efforts pass to the data content itself.

### Data format transmitted from drones
For the purpose of this project, it has been selected deliberately to directly transmit unencrypted and uncompressed messages of plain text to achieve better human readability and easier testing. Moreover, JSON format has been selected to facilitate the serialization and deserialization of messages. This leads us to the following format:

```json
"{"long":31.123123,"lat":21.121212}\n"
```
#### Data length
This format has maximum size of 37 bytes out of which 17 bytes are format overhead. The overhead is marked with bold in the following example: **{"long":** 31.123123 **,"lat":** 21.121212 **}\n**. The rest 20 bytes of data are calculated on the idea that the [maximum decimal places needed](https://stackoverflow.com/a/16743805) to have 0,1m precision is 6 places. This, combined with the negative mark when it exists leads us to the longest recommended value of "-31.123123" which is 10 bytes.

#### Optimizations

 * **Shrink the JSON property tag names**: Instead of using _long_ and _lat_ use single letter variables (e.g. "long" -> "l" and "lat" -> "t"). This will save us 5 bytes per message lowering the maximum message size to 32 bytes.
 * **Drop JSON format over simple text**: instead of compiling to JSON format, we could use simple text like: **31.123123,21.121212**. This would also need a termination character so lets consider this text: **31.123123,21.121212\n**. Its size is maximum 2\*20 bytes for the location data + 2 bytes overhead = 22 bytes. The downside of this option is that it needs slightly more processing from the server to use the data.
 * **Compress data**: Probably any message could be compressed though their message is already very small so the overhead of compressing seems questionable.

### UUID generation
An easy and persistent solution of drone identification would be that the drones were to provide their UUID in each message that they transmit. This would add a constant overhead to each message and for this reason the solution was rejected.

As a workaround, based on the term "live monitoring", the backend is mainly interested in the drones that are currently active. Based on our assumptions, an active drone would have also a connected socket with our backend. For this reason, it was decided that upon the connection of a new socket to our backend, a UUID would be generated for that socket. Thus, any updates provided by that socket would update our stored location data for that specific drone. For the sake of simplicity the following code generates the UUIDs:

```node
const crypto = require('crypto');
let uuid = crypto.randomBytes(16).toString('base64');
```

### Detection of non-moving drones
As previously mentioned, each message that is received from the socket has JSON format. This means that it can be parsed and used as a typical JavaScript object. Having validated the message format and parsed it into object, the unique id of the socket is also assigned along with the timestamp of the time of message arrival. This "enhanced" object is stored in a Map in storage.js. The keys are the unique id of the socket and the value is the "enhanced" object.

In this was we have cached the when a drones was where. Thus, it is quire straightforward to filter out all records whose timestamp is more that 10s older than "now" and report its id.

## Issues & feedback
You are welcomed to provide any feedback, suggestions, issue reporting through [project's issue page](https://github.com/ftylitak/fleetGeoMon/issues).
