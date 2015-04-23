var ourProcess = require('./browser');
var assert = require('assert');

describe('test errors', function (t) {
    it ('works', function (done) {
    var order = 0;
    process.removeAllListeners('uncaughtException');
    process.once('uncaughtException', function(err) {
        assert.equal(2, order++, 'error is third');
        process.nextTick(function () {
            assert.equal(5, order++, 'schedualed in error is last');
            done();
        });
    });
    process.nextTick(function () {
        assert.equal(0, order++, 'first one works');
        process.nextTick(function () {
        assert.equal(4, order++, 'recursive one is 4th');
        });
    });
    process.nextTick(function () {
        assert.equal(1, order++, 'second one starts');
        throw(new Error('an error is thrown'));
    });
    process.nextTick(function () {
        assert.equal(3, order++, '3rd schedualed happens after the error');
    });
    });
});
