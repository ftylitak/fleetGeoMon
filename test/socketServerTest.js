var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var storage = require('../storage.js').locationStorage;
var _ = require('lodash');
var socketServer = require('../socketServer.js').droneSocketServerApp;

var net = require('net');

var client = undefined;

describe('HTTP server', () => {

    beforeEach(() => {
        storage.clear();

        client = new net.Socket();
        client.connect(8088, '127.0.0.1', function() {
            console.log('Connected');
        });

        client.on('error', function(err){
            console.log('Error: ' +err.message);
        });
    });

    afterEach(function () {
        if(client !== undefined)
            client.destroy();

        //Date.now = originalDateNow;
    });

    after(function () {
        if(socketServer !== undefined)
            socketServer.close();
    });

    it('receive 1 sample from one drone', function(done) {
        this.timeout(2000);
        assert.equal(_.size(storage.locationDataPerID), 0);
        client.write('{"long":31.9724315,"lat":23.7573327}');

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
            client.write(`{"long":31.972431${count++},"lat":23.7573327}\n`);
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

        let socketArray = [];
        _.times(20, () => {
            let tmpSocket = new net.Socket();
            tmpSocket.connect(8088, '127.0.0.1', function() {});
            socketArray.push(tmpSocket);
        });

        _.times(2000, () => {
            let randomFloat = Math.random();
            let randomIndex = Math.floor(randomFloat * 20);
            let randomLocationPorstfix = Math.floor(randomFloat * 9999);
            socketArray[randomIndex].write(`{"long":31.972${randomLocationPorstfix},"lat":23.757${randomLocationPorstfix}}\n`);
        });

        setTimeout(function () {
            assert.equal(_.size(storage.locationDataPerID), 20);
            done();
        }, 1000);
    });
});
