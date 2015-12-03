var Publisher = require('..');
var util = require('util');

describe('Publish function', function () {
    it('should send message', function (done) {
        var publisher = new Publisher({mode: 'development'});
        publisher.publish('my topic', 'my message', done);
    });

    it('should err', function (done) {
        var publisher = new Publisher();
        publisher.publish('my topic', 'my message', function(err){
            if(err){
                return done();
            }
        });
    });
});

describe('Inherit', function () {
    function Bus(options){
        Publisher.call(this, options);
    }

    util.inherits(Bus, Publisher)

    Bus.prototype.myMessagePub= function (message, callback) {
        this._bus.publish('test-topic', message, function (err) {
            if (err) {
                return callback(err);
            }
            callback();
        });
    };

    it('should send message', function (done) {
        var bus=new Bus({mode: 'development'});
        bus.myMessagePub('my message', done)
    });
});