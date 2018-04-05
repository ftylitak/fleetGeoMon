var chai = require('chai');
var _ = require('lodash');
var assert = chai.assert;
var expect = chai.expect;

var storage = require('../storage.js');

var epocMsec;
var originalDateNow = 1522951238123;

function mockDateNow() {
    return epocMsec;
}

describe('Storage testing', () => {

    beforeEach(async () => {
        storage.locationStorage.clear();
        originalDateNow = Date.now;
        Date.now = mockDateNow;
    });

    afterEach(function () {
        Date.now = originalDateNow;
    });

    it('empty size on init', function() { // <= Pass in done callback
        assert.equal(_.size(storage.locationStorage.locationDataPerID), 0);
    });

    it('insert 1 valid location string - with quotes in object', function() {
        var objectStr = '{"long":"37.9724315","lat":"23.7573327"}';
        var transformedObject = storage.locationStorage.insert(1, objectStr);
        assert.isDefined(transformedObject);
        expect(transformedObject).to.have.own.property('id');
        expect(transformedObject).to.have.own.property('timestamp');
        assert.equal(transformedObject.id, 1);
        assert.equal(_.size(storage.locationStorage.locationDataPerID), 1);
    });

    it('insert 1 valid location string - no quotes in value', function() {
        var objectStr = '{"long":37.9724315,"lat":23.7573327}';
        var transformedObject = storage.locationStorage.insert(1, objectStr);
        assert.isDefined(transformedObject);
        expect(transformedObject).to.have.own.property('id');
        expect(transformedObject).to.have.own.property('timestamp');
        assert.equal(transformedObject.id, 1);
        assert.equal(_.size(storage.locationStorage.locationDataPerID), 1);
    });

    it('insert 1 valid location string - no quotes', function() {
        var objectStr = '{long:37.9724315,lat:23.7573327}';
        var transformedObject = storage.locationStorage.insert(1, objectStr);
        assert.isUndefined(transformedObject);
        assert.equal(_.size(storage.locationStorage.locationDataPerID), 0);
    });

    it('insert 1 valid location string - no quotes', function() {
        var objectStr = '{long:37.9724315,lat:23.7573327}';
        var transformedObject = storage.locationStorage.insert(1, objectStr);
        assert.isUndefined(transformedObject);
        assert.equal(_.size(storage.locationStorage.locationDataPerID), 0);
    });

    it('insert valid location object', function() {
        var objectStr = {long:37.9724315,lat:23.7573327};
        var transformedObject = storage.locationStorage.insert(1, objectStr);
        assert.isDefined(transformedObject);
        expect(transformedObject).to.have.own.property('id');
        expect(transformedObject).to.have.own.property('timestamp');
        assert.equal(transformedObject.id, 1);
        assert.equal(_.size(storage.locationStorage.locationDataPerID), 1);
    });

    it('insert invalid object', function() {
        var objectStr = new Map();
        var transformedObject = storage.locationStorage.insert(1, objectStr);
        assert.isUndefined(transformedObject);
        assert.equal(_.size(storage.locationStorage.locationDataPerID), 0);
    });

    it('insert multiple objects', function() {
        var object1 = {long:37.9724315,lat:23.7573327};
        var object2Str = '{"long":"38.9724315","lat":"24.7573327"}';
        var object3Str = '{"long":39.9724315,"lat":25.7573327}';

        storage.locationStorage.insert(1, object1);
        storage.locationStorage.insert(2, object2Str);
        storage.locationStorage.insert(3, object3Str);

        assert.equal(storage.locationStorage.locationDataPerID.get(3).id, 3);
        assert.equal(storage.locationStorage.locationDataPerID.get(2).id, 2);
        assert.equal(storage.locationStorage.locationDataPerID.get(1).id, 1);

        assert.equal(_.size(storage.locationStorage.locationDataPerID), 3);
    });

    it('insert update already existing', function() {
        var object1 = {long:37.9724315,lat:23.7573327};

        var insertedObject1 = storage.locationStorage.insert(10, object1);

        assert.equal(_.size(storage.locationStorage.locationDataPerID), 1);
        var transformedObject1 =  storage.locationStorage.locationDataPerID.get(10);
        assert.equal(transformedObject1.long, 37.9724315);

        var object2 = {long:38.9724315,lat:23.7573327};

        var insertedObject2 = storage.locationStorage.insert(10, object2);

        assert.equal(_.size(storage.locationStorage.locationDataPerID), 1);
        var transformedObject2 =  storage.locationStorage.locationDataPerID.get(10);
        assert.equal(transformedObject2.long, 38.9724315);

        assert.notEqual(transformedObject1, transformedObject2);
        assert.notEqual(insertedObject1, insertedObject2);
    });

    it('insert update already existing - ignored - no movement', function() {
        var object1 = {long:37.9724315,lat:23.7573327};

        var insertedObject1 = storage.locationStorage.insert(10, object1);

        assert.equal(_.size(storage.locationStorage.locationDataPerID), 1);
        var transformedObject1 =  storage.locationStorage.locationDataPerID.get(10);
        assert.equal(transformedObject1.long, 37.9724315);

        var object2 = {long:37.9724315,lat:23.7573327};

        var insertedObject2 = storage.locationStorage.insert(10, object2);

        assert.equal(_.size(storage.locationStorage.locationDataPerID), 1);
        var transformedObject2 =  storage.locationStorage.locationDataPerID.get(10);
        assert.equal(transformedObject2.long, 37.9724315);

        assert.equal(transformedObject1, transformedObject2);
        assert.equal(insertedObject1, insertedObject2);
    });

    it('insert two element and call clear', function() {
        var object1 = {long:37.9724315,lat:23.7573327};
        var object2 = {long:32.9724315,lat:23.7573327};

        storage.locationStorage.insert(10, object1);
        storage.locationStorage.insert(20, object2);

        assert.equal(_.size(storage.locationStorage.locationDataPerID), 2);
        storage.locationStorage.clear();
        assert.equal(_.size(storage.locationStorage.locationDataPerID), 0);
    });

    it('6 elements and get 2 elements that are older than 10 seconds', function() {
        var objectArray = [];
        objectArray.push( {long:31.9724315,lat:23.7573327} );
        objectArray.push( {long:32.9724315,lat:23.7573327} );
        objectArray.push( {long:33.9724315,lat:23.7573327} );
        objectArray.push( {long:34.9724315,lat:23.7573327} );
        objectArray.push( {long:35.9724315,lat:23.7573327} );
        objectArray.push( {long:36.9724315,lat:23.7573327} );

        epocMsec = 1522951209000;
        storage.locationStorage.insert(1, objectArray[0]);

        epocMsec = 1522951211000;
        storage.locationStorage.insert(2, objectArray[1]);

        epocMsec = 1522951202000;
        storage.locationStorage.insert(3, objectArray[2]);

        epocMsec = 1522951212000;
        storage.locationStorage.insert(4, objectArray[3]);

        epocMsec = 1522951204000;
        storage.locationStorage.insert(5, objectArray[4]);

        epocMsec = 1522951200500;
        storage.locationStorage.insert(6, objectArray[5]);

        assert.equal(_.size(storage.locationStorage.locationDataPerID), 6);

        epocMsec = 1522951212500;
        var oldObjects = storage.locationStorage.getRecordsOlderThan(10000);

        assert.equal(_.size(oldObjects), 2);
    });

    it('6 elements and delete the 2 elements that are older than 10 seconds', function() {
        var objectArray = [];
        objectArray.push( {long:31.9724315,lat:23.7573327} );
        objectArray.push( {long:32.9724315,lat:23.7573327} );
        objectArray.push( {long:33.9724315,lat:23.7573327} );
        objectArray.push( {long:34.9724315,lat:23.7573327} );
        objectArray.push( {long:35.9724315,lat:23.7573327} );
        objectArray.push( {long:36.9724315,lat:23.7573327} );

        epocMsec = 1522951209000;
        storage.locationStorage.insert(1, objectArray[0]);

        epocMsec = 1522951211000;
        storage.locationStorage.insert(2, objectArray[1]);

        epocMsec = 1522951202000;
        storage.locationStorage.insert(3, objectArray[2]);

        epocMsec = 1522951212000;
        storage.locationStorage.insert(4, objectArray[3]);

        epocMsec = 1522951204000;
        storage.locationStorage.insert(5, objectArray[4]);

        epocMsec = 1522951200500;
        storage.locationStorage.insert(6, objectArray[5]);

        assert.equal(_.size(storage.locationStorage.locationDataPerID), 6);

        epocMsec = 1522951212500;
        storage.locationStorage.clearRecordsOlderThan(10000);

        assert.equal(_.size(storage.locationStorage.locationDataPerID), 4);

        assert.isDefined(storage.locationStorage.locationDataPerID.get(1));
        assert.isDefined(storage.locationStorage.locationDataPerID.get(2));
        assert.isDefined(storage.locationStorage.locationDataPerID.get(4));
        assert.isDefined(storage.locationStorage.locationDataPerID.get(5));

        assert.isUndefined(storage.locationStorage.locationDataPerID.get(3));
        assert.isUndefined(storage.locationStorage.locationDataPerID.get(6));
    });
});
