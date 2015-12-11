var events = require('events');
var util = require('util');
var nsq = require('nsqjs');
var q = require('q');

var retryCount = 0;

function Publisher(options) {
    var self = this;
    this._options = options = initialize(options || {});
    this._deferred = q.defer();
    this._messages = [];

    events.EventEmitter.call(this);

    // Stub for development
    if (options.mode === 'development') {
        self.publish = function (topic, message, callback) {
            console.log('topic: ' + topic);
            console.log(message);
            callback()
        };
        console.warn('NSQ is not using! Please change "development" mode.');
        self._deferred.resolve();
        return;
    }

    // connect to the Bus
    self._bus = createBusClient();
    self._bus.connect();

    function createBusClient() {
        var busClient = new nsq.Writer(self._options.address, self._options.port);

        busClient.on('ready', function () {
            console.log('ServiceBus is started.');
            self._hasConnection = true;
            self._deferred.resolve();
            retryCount = 0;

            if (self._messages.length > 0) {
                console.log('Resend messages.');
                self.sendMessages();
            }
        });

        busClient.on('error', function (err) {
            console.log(err);
        });

        busClient.on('closed', function () {
            console.log('NSQ Writer connection was closed.');
            self._hasConnection = false;

            if (retryCount < self._options.retryCount) {
                setTimeout(function () {
                    self._deferred = q.defer();
                    self._bus = createBusClient();
                    self._bus.connect();
                }, self._options.retryTimeout * ((self._options.retryRate - 1) * retryCount + 1));
                retryCount++;
            } else {
                var err = new Error('Can not reconnect to NSQ.');
                self._deferred.reject(err);
                self.emit('reconnect_failed', err);
            }
        });

        return busClient;
    }
}

function initialize(options) {
    options.retryTimeout = options.retryTimeout > 0 ? options.retryTimeout : 1000;
    options.retryCount = options.retryCount > 0 ? options.retryCount : 10;
    options.retryRate = options.retryRate > 0 ? options.retryRate : 1;
    options.attemptCount = options.attemptCount > 0 ? options.attemptCount : 3;
    options.attemptTimeout = options.attemptTimeout > 0 ? options.attemptTimeout : 1000;

    return options;
}

util.inherits(Publisher, events.EventEmitter);

Publisher.prototype.sendMessages = function () {
    var self = this;
    var messages = this._messages;

    self._deferred.promise.then(function () {
        while (messages.length > 0 && self._hasConnection) {
            var msg = messages.shift();
            (function (msg) {
                self._bus.publish(msg.topic, msg.message, function (err) {
                    if (err) {
                        if (!self._options.attemptCount || msg.attemptCount < self._options.attemptCount) {
                            msg.attemptCount++;
                            console.log('Publish error: ' + err.message);
                            console.log('Attempts count: ' + msg.attemptCount);
                            console.log(msg.message);

                            setTimeout(function () {
                                self.publish(msg.topic, msg.message, msg.callback);
                            }, self._options.attemptTimeout)
                        } else {
                            msg.callback(err);
                        }

                        return;
                    }

                    msg.callback(null);
                });
            })(msg);
        }
    }, function (err) {
        console.log('Can not send messages.')
    });
};

Publisher.prototype.publish = function (topic, message, callback) {
    var self = this;
    var msg = createMessaage(topic, message, callback);
    self._messages.push(msg);
    self.sendMessages();
};

function createMessaage(topic, message, callback) {
    return {
        topic: topic,
        message: message,
        callback: callback,
        attemptCount: 0
    };
}

module.exports = Publisher;

