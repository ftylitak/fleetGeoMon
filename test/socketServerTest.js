let chai = require('chai');
let assert = chai.assert;
let storage = require('../storage.js').locationStorage;
let _ = require('lodash');
let droneSocketServer = require('../socketServer.js').droneSocketServerApp;
let dashboardSocketServer = require('../socketServer.js').dashboardSocketServerApp;

let net = require('net');

let droneClient = undefined;
let dashboardClient = undefined;

describe('HTTP server', () => {

    beforeEach(() => {
        storage.clear();

        dashboardClient = new net.Socket();
        droneClient = new net.Socket();
        droneClient.connect(8088, '127.0.0.1', function() {
            console.log('[t]: drone connected');
        });

        droneClient.on('error', function(err){
            console.log('[t]: Error: ' +err.message);
        });
    });

    afterEach(function () {
        if(droneClient !== undefined)
            droneClient.destroy();

        if(dashboardClient !== undefined)
            dashboardClient.destroy();
    });

    after(function () {
        if(droneSocketServer !== undefined)
            droneSocketServer.close();

        if(dashboardSocketServer !== undefined)
            dashboardSocketServer.close();
    });

    let _createDroneSockets = (numberOfSockets) => {
        let socketArray = [];
        _.times(numberOfSockets, () => {
            let tmpSocket = new net.Socket();
            tmpSocket.connect(8088, '127.0.0.1', function() {});
            socketArray.push(tmpSocket);
        });
        return socketArray;
    };

    let locationDataSent = [];
    let _sendRandomLocationDataOnCollection = (socketArray, times) => {
        let count = 0;
        locationDataSent = [];
        _.times(times, () => {
            let randomFloat = Math.random();
            let randomIndex = (Math.floor(randomFloat * socketArray.length) + count++) % socketArray.length;
            let randomLocationPorstfix = Math.floor(randomFloat * 9999);
            let locationData = `{"long":31.972${randomLocationPorstfix},"lat":23.757${randomLocationPorstfix}}\n`;
            locationDataSent.push(locationData);
            socketArray[randomIndex].write(locationData);
        });
    };

    let _prepareDashboardSocket = () => {
        dashboardClient.connect(8081, '127.0.0.1', function(){
            console.log('[t]: dashboard connected');
        });

        dashboardClient.on('end', function() {
            console.log('[t]: dashboard disconnected');
        });
    };

    it('receive 1 sample from one drone', function(done) {
        this.timeout(2000);
        assert.equal(_.size(storage.locationDataPerID), 0);
        droneClient.write('{"long":31.9724315,"lat":23.7573327}');

        setTimeout(function () {
            assert.equal(_.size(storage.locationDataPerID), 1);
            done();
        }, 1000);
    });

    it('receive 5 samples information from one drone', function(done) {
        this.timeout(2000);
        assert.equal(_.size(storage.locationDataPerID), 0);

        let count = 0;
        _.times(5, () => {
            droneClient.write(`{"long":31.972431${count++},"lat":23.7573327}\n`);
        });

        setTimeout(function () {
            assert.equal(_.size(storage.locationDataPerID), 1);
            for(let record of storage.locationDataPerID.values()) {
                assert.equal(record.long, 31.9724314);
                done();
            }
        }, 1000);
    });

    it('receive samples from multiple sockets', function(done) {
        this.timeout(2000);
        assert.equal(_.size(storage.locationDataPerID), 0);

        let socketArray = _createDroneSockets(20);
        _sendRandomLocationDataOnCollection(socketArray, 2000);

        setTimeout(function () {
            assert.equal(_.size(storage.locationDataPerID), 20);
            done();
        }, 1000);
    });

    it('receive 1 sample from one drone and validate reception in dashboard', function(done) {
        this.timeout(2000);
        assert.equal(_.size(storage.locationDataPerID), 0);

        _prepareDashboardSocket();

        dashboardClient.on('data', function(data) {
            console.log('[t]: dash: ' + data);//JSON.parse(data));
            done();
        });

        droneClient.write('{"long":31.9724315,"lat":23.7573327}');

        setTimeout(function () {
            assert.fail();
        }, 1500);
    });

    it('receive sample from multiple drone and validate reception in dashboard', function(done) {
        this.timeout(5000);
        assert.equal(_.size(storage.locationDataPerID), 0);

        _prepareDashboardSocket();
        let socketArray = _createDroneSockets(20);
        const times = 2000;

        //let successfullReceptions = 0;
        let incrementalData = '';
        dashboardClient.on('data', function(data) {
            incrementalData += data;
            let locationInfoArray = incrementalData.toString().trim().split('\n');
            if(locationInfoArray === undefined)
                return;

            if(locationInfoArray.length == times)
            {
                assert.equal(locationDataSent.length, locationInfoArray.length);
                for(let receivedObject of locationInfoArray)
                {
                    let obj = _.filter(locationDataSent, x =>
                        (x.long === receivedObject.long) && (x.lat === receivedObject.lat));
                    assert.isDefined(obj);
                }
                done();
            }
        });

        _sendRandomLocationDataOnCollection(socketArray, times);
    });

    it('receive sample from multiple drone and validate reception - handle message fragmentation', function(done) {
        this.timeout(5000);
        assert.equal(_.size(storage.locationDataPerID), 0);

        _prepareDashboardSocket();
        let socketArray = _createDroneSockets(20);
        const times = 2000;

        //let successfullReceptions = 0;
        let countObjects = 0;
        let fragmentedTermination = '';
        dashboardClient.on('data', function(data) {
            let locationInfoArray = data.toString().trim().split('\n');
            if(locationInfoArray === undefined)
                return;

            if(fragmentedTermination !== '') {
                locationInfoArray[0] = fragmentedTermination + locationInfoArray[0];
                fragmentedTermination = '';
            }

            let lastObject = locationInfoArray.slice(-1)[0];
            try {
                JSON.parse(lastObject);
            } catch (e) {
                fragmentedTermination = lastObject;
                locationInfoArray.pop();
            }

            for(let receivedObject of locationInfoArray)
            {
                try {
                    JSON.parse(receivedObject);
                    countObjects++;
                } catch (e) {
                    //ignore
                }
            }

            if(countObjects == times)
                done();
        });

        _sendRandomLocationDataOnCollection(socketArray, times);
    });
});
