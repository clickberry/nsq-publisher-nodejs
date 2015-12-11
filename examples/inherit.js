var Publisher = require('..');

function Bus(options) {
    Publisher.call(this, options);
}

util.inherits(Bus, Publisher);

Bus.prototype.myMessagePub = function (message, callback) {
    this.publish('test-topic', message, function (err) {
        if (err) {
            return callback(err);
        }
        callback();
    });
};


var count = 1;
var bus = new Bus({
    //mode: 'development',
    address: '192.168.99.100',
    port: 4150,
    retryTimeout: 1000
});

setInterval(function () {
    bus.myMessagePub('my message' + count++, function (err) {
        if (err) {
            console.warn('Error');
            return console.log(err);
        }
        console.log('Ok.');
    });
}, 1000);