var events = require('events');
var util = require('util');
var nsq = require('nsqjs');
var q = require('q');

function Bus(options) {
    options = options || {};
    var bus = this;
    bus._deferred = q.defer();

    events.EventEmitter.call(this);

    // Stub for development
    if (options.mode === 'development') {
        bus._bus = {
            publish: function (topic, message, callback) {
                console.log('topic: ' + topic);
                console.log(message);
                callback()
            }
        };
        console.warn('NSQ is not using! Please change "development" mode.');
        bus._deferred.resolve();
        return;
    }

    // connect to the Bus
    var busClient = new nsq.Writer(options.address, options.port);

    bus._bus = busClient;
    busClient.connect();
    busClient.on('ready', function () {
        console.log('ServiceBus is started.');
        bus._deferred.resolve();
    });
    busClient.on('error', function (err) {
        console.log(err);
        bus._deferred.reject(err);
    });
}

util.inherits(Bus, events.EventEmitter);

Bus.prototype.publish = function () {
    var args = arguments;
    var callback = arguments[arguments.length - 1];
    var bus = this._bus;
    this._deferred.promise.then(function () {
        bus.publish.apply(this, args);
    }, function (err) {
        callback(err);
    });
};

module.exports = Bus;