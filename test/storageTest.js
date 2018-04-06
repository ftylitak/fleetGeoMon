let chai = require('chai');
let _ = require('lodash');
let assert = chai.assert;
let expect = chai.expect;

let storage = require('../storage.js').locationStorage;

let epocMsec;
let originalDateNow = 1522951238123;

function mockDateNow() {
    return epocMsec;
}

describe('Storage testing', () => {

    beforeEach(async () => {
        storage.clear();
        originalDateNow = Date.now;
        Date.now = mockDateNow;
    });

    afterEach(function () {
        Date.now = originalDateNow;
    });

    it('empty size on init', function() { // <= Pass in done callback
        assert.equal(_.size(storage.locationDataPerID), 0);
    });

    it('insert 1 valid location string - with quotes in object', function() {
        let objectStr = '{"long":"37.9724315","lat":"23.7573327"}';
        let transformedObject = storage.insert(1, objectStr);
        assert.isDefined(transformedObject);
        expect(transformedObject).to.have.own.property('id');
        expect(transformedObject).to.have.own.property('timestamp');
        assert.equal(transformedObject.id, 1);
        assert.equal(_.size(storage.locationDataPerID), 1);
    });

    it('insert 1 valid location string - no quotes in value', function() {
        let objectStr = '{"long":37.9724315,"lat":23.7573327}';
        let transformedObject = storage.insert(1, objectStr);
        assert.isDefined(transformedObject);
        expect(transformedObject).to.have.own.property('id');
        expect(transformedObject).to.have.own.property('timestamp');
        assert.equal(transformedObject.id, 1);
        assert.equal(_.size(storage.locationDataPerID), 1);
    });

    it('insert 1 valid location string - no quotes', function() {
        let objectStr = '{long:37.9724315,lat:23.7573327}';
        let transformedObject = storage.insert(1, objectStr);
        assert.isUndefined(transformedObject);
        assert.equal(_.size(storage.locationDataPerID), 0);
    });

    it('insert valid location object', function() {
        let objectStr = {long:37.9724315,lat:23.7573327};
        let transformedObject = storage.insert(1, objectStr);
        assert.isDefined(transformedObject);
        expect(transformedObject).to.have.own.property('id');
        expect(transformedObject).to.have.own.property('timestamp');
        assert.equal(transformedObject.id, 1);
        assert.equal(_.size(storage.locationDataPerID), 1);
    });

    it('insert invalid object', function() {
        let objectStr = new Map();
        let transformedObject = storage.insert(1, objectStr);
        assert.isUndefined(transformedObject);
        assert.equal(_.size(storage.locationDataPerID), 0);
    });

    it('insert multiple objects', function() {
        let object1 = {long:37.9724315,lat:23.7573327};
        let object2Str = '{"long":"38.9724315","lat":"24.7573327"}';
        let object3Str = '{"long":39.9724315,"lat":25.7573327}';

        storage.insert(1, object1);
        storage.insert(2, object2Str);
        storage.insert(3, object3Str);

        assert.equal(storage.locationDataPerID.get(3).id, 3);
        assert.equal(storage.locationDataPerID.get(2).id, 2);
        assert.equal(storage.locationDataPerID.get(1).id, 1);

        assert.equal(_.size(storage.locationDataPerID), 3);
    });

    it('insert update already existing', function() {
        let object1 = {long:37.9724315,lat:23.7573327};

        let insertedObject1 = storage.insert(10, object1);

        assert.equal(_.size(storage.locationDataPerID), 1);
        let transformedObject1 =  storage.locationDataPerID.get(10);
        assert.equal(transformedObject1.long, 37.9724315);

        let object2 = {long:38.9724315,lat:23.7573327};

        let insertedObject2 = storage.insert(10, object2);

        assert.equal(_.size(storage.locationDataPerID), 1);
        let transformedObject2 =  storage.locationDataPerID.get(10);
        assert.equal(transformedObject2.long, 38.9724315);

        assert.notEqual(transformedObject1, transformedObject2);
        assert.notEqual(insertedObject1, insertedObject2);
    });

    it('insert update already existing - ignored - no movement', function() {
        let object1 = {long:37.9724315,lat:23.7573327};

        let insertedObject1 = storage.insert(10, object1);

        assert.equal(_.size(storage.locationDataPerID), 1);
        let transformedObject1 =  storage.locationDataPerID.get(10);
        assert.equal(transformedObject1.long, 37.9724315);

        let object2 = {long:37.9724315,lat:23.7573327};

        let insertedObject2 = storage.insert(10, object2);

        assert.equal(_.size(storage.locationDataPerID), 1);
        let transformedObject2 =  storage.locationDataPerID.get(10);
        assert.equal(transformedObject2.long, 37.9724315);

        assert.equal(transformedObject1, transformedObject2);
        assert.equal(insertedObject1, insertedObject2);
    });

    it('insert two element and call clear', function() {
        let object1 = {long:37.9724315,lat:23.7573327};
        let object2 = {long:32.9724315,lat:23.7573327};

        storage.insert(10, object1);
        storage.insert(20, object2);

        assert.equal(_.size(storage.locationDataPerID), 2);
        storage.clear();
        assert.equal(_.size(storage.locationDataPerID), 0);
    });

    it('6 elements and get 2 elements that are older than 10 seconds', function() {
        let objectArray = [];
        objectArray.push( {long:31.9724315,lat:23.7573327} );
        objectArray.push( {long:32.9724315,lat:23.7573327} );
        objectArray.push( {long:33.9724315,lat:23.7573327} );
        objectArray.push( {long:34.9724315,lat:23.7573327} );
        objectArray.push( {long:35.9724315,lat:23.7573327} );
        objectArray.push( {long:36.9724315,lat:23.7573327} );

        epocMsec = 1522951209000;
        storage.insert(1, objectArray[0]);

        epocMsec = 1522951211000;
        storage.insert(2, objectArray[1]);

        epocMsec = 1522951202000;
        storage.insert(3, objectArray[2]);

        epocMsec = 1522951212000;
        storage.insert(4, objectArray[3]);

        epocMsec = 1522951204000;
        storage.insert(5, objectArray[4]);

        epocMsec = 1522951200500;
        storage.insert(6, objectArray[5]);

        assert.equal(_.size(storage.locationDataPerID), 6);

        epocMsec = 1522951212500;
        let oldObjects = storage.getRecordsOlderThan(10000);

        assert.equal(_.size(oldObjects), 2);
    });

    it('6 elements and delete the 2 elements that are older than 10 seconds', function() {
        let objectArray = [];
        objectArray.push( {long:31.9724315,lat:23.7573327} );
        objectArray.push( {long:32.9724315,lat:23.7573327} );
        objectArray.push( {long:33.9724315,lat:23.7573327} );
        objectArray.push( {long:34.9724315,lat:23.7573327} );
        objectArray.push( {long:35.9724315,lat:23.7573327} );
        objectArray.push( {long:36.9724315,lat:23.7573327} );

        epocMsec = 1522951209000;
        storage.insert(1, objectArray[0]);

        epocMsec = 1522951211000;
        storage.insert(2, objectArray[1]);

        epocMsec = 1522951202000;
        storage.insert(3, objectArray[2]);

        epocMsec = 1522951212000;
        storage.insert(4, objectArray[3]);

        epocMsec = 1522951204000;
        storage.insert(5, objectArray[4]);

        epocMsec = 1522951200500;
        storage.insert(6, objectArray[5]);

        assert.equal(_.size(storage.locationDataPerID), 6);

        epocMsec = 1522951212500;
        storage.clearRecordsOlderThan(10000);

        assert.equal(_.size(storage.locationDataPerID), 4);

        assert.isDefined(storage.locationDataPerID.get(1));
        assert.isDefined(storage.locationDataPerID.get(2));
        assert.isDefined(storage.locationDataPerID.get(4));
        assert.isDefined(storage.locationDataPerID.get(5));

        assert.isUndefined(storage.locationDataPerID.get(3));
        assert.isUndefined(storage.locationDataPerID.get(6));
    });
});
