let chai = require('chai');
let chaiHttp = require('chai-http');
let assert = chai.assert;
let expect = chai.expect;
let storage = require('../storage.js').locationStorage;
let _ = require('lodash');
//let should = chai.should;

chai.use(chaiHttp);

let server = require('../httpServer.js');

let epocMsec;
let originalDateNow = 1522951238123;

function mockDateNow() {
    return epocMsec;
}

describe('HTTP server', () => {

    beforeEach(async () => {
        storage.clear();
        originalDateNow = Date.now;
        Date.now = mockDateNow;
    });

    afterEach(function () {
        Date.now = originalDateNow;
    });

    it('ignore unrecognized url', function(done) { // <= Pass in done callback
        assert.isDefined(server);
        chai.request(server)
            .get('/test')
            .end(function(err, res) {
                //should.not.exist(err);
                expect(res).to.have.status(200);
                expect(res).to.have.property('text');
                expect(res.text).to.equal('Request ignored: /test');
                done();                               // <= Call done to signal callback end
            });
    });

    it('recognize nonMovingDrones url path empty list', function(done) { // <= Pass in done callback
        assert.isDefined(server);
        chai.request(server)
            .get('/nonMovingDrones')
            .end(function(err, res) {
                //should.not.exist(err);
                expect(res).to.have.status(200);
                expect(res).to.have.property('text');
                expect(res.text).to.equal('[]');
                done();                               // <= Call done to signal callback end
            });
    });

    it('recognize nonMovingDrones url path - non moving drones found', function(done) { // <= Pass in done callback
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

        assert.isDefined(server);
        chai.request(server)
            .get('/nonMovingDrones')
            .end(function(err, res) {
                //should.not.exist(err);
                expect(res).to.have.status(200);
                expect(res).to.have.property('text');
                expect(res.text).to.equal('[3,6]');
                done();                               // <= Call done to signal callback end
            });
    });
});
