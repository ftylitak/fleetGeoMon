var chai = require('chai');
var _ = require('lodash');
var assert = chai.assert;
var expect = chai.expect;

var storage = require('../storage.js');

console.log(JSON.stringify(storage.locationStorage));

describe('Storage testing', () => {

    beforeEach(async () => {
        storage.locationStorage.clear();
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

        storage.locationStorage.insert(10, object1);

        assert.equal(_.size(storage.locationStorage.locationDataPerID), 1);
        var transformedObject1 =  storage.locationStorage.locationDataPerID.get(10);
        assert.equal(transformedObject1.long, 37.9724315);

        var object2 = {long:38.9724315,lat:23.7573327};

        storage.locationStorage.insert(10, object2);

        assert.equal(_.size(storage.locationStorage.locationDataPerID), 1);
        var transformedObject2 =  storage.locationStorage.locationDataPerID.get(10);
        assert.equal(transformedObject2.long, 38.9724315);

        assert.notEqual(transformedObject1, transformedObject2);
    });

    it('insert update already existing - ignored - no movement', function() {
        var object1 = {long:37.9724315,lat:23.7573327};

        storage.locationStorage.insert(10, object1);

        assert.equal(_.size(storage.locationStorage.locationDataPerID), 1);
        var transformedObject1 =  storage.locationStorage.locationDataPerID.get(10);
        assert.equal(transformedObject1.long, 37.9724315);

        var object2 = {long:37.9724315,lat:23.7573327};

        storage.locationStorage.insert(10, object2);

        assert.equal(_.size(storage.locationStorage.locationDataPerID), 1);
        var transformedObject2 =  storage.locationStorage.locationDataPerID.get(10);
        assert.equal(transformedObject2.long, 37.9724315);

        assert.equal(transformedObject1, transformedObject2);
    });
});
