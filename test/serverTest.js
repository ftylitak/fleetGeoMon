var chai = require('chai');
var chaiHttp = require('chai-http');
var assert = chai.assert;
var expect = chai.expect;
//var should = chai.should;

chai.use(chaiHttp);

var server = require('../server.js');

describe('server', () => {

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

    it('recognize nonMovingDrones url path', function(done) { // <= Pass in done callback
        assert.isDefined(server);
        chai.request(server)
            .get('/nonMovingDrones')
            .end(function(err, res) {
                //should.not.exist(err);
                expect(res).to.have.status(200);
                expect(res).to.have.property('text');
                expect(res.text).to.equal('/nonMovingDrones');
                done();                               // <= Call done to signal callback end
            });
    });
});
