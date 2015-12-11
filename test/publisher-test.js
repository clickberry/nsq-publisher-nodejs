var Publisher = require('..');
var util = require('util');

describe('Publish function', function () {
    it('should send message', function (done) {
        var publisher = new Publisher({mode: 'development'});
        publisher.publish('my topic', 'my message', done);
    });

    it('should emit reconnect error', function (done) {
        var publisher = new Publisher({retryCount:1, retryTimeout: 100});
        publisher.on('reconnect_failed', function(err){
            done();
        });
    });
});

describe('Inherit', function () {
    function Bus(options) {
        Publisher.call(this, options);
    }

    util.inherits(Bus, Publisher)

    Bus.prototype.myMessagePub = function (message, callback) {
        this.publish('test-topic', message, function (err) {
            if (err) {
                return callback(err);
            }
            callback();
        });
    };

    it('should send message', function (done) {
        var bus = new Bus({mode: 'development'});
        bus.myMessagePub('my message', done)
    });
});