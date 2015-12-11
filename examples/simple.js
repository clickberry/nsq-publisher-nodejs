var Publisher = require('..');

var publisher = new Publisher({
    //mode: 'development',
    address: '192.168.99.100',
    port: 4150,
    retryTimeout: 1000,
    retryCount: 10,
    retryRate: 1, // rate of 'retryTimeout'.
    attemptCount: 3, // quantity of attempt sending fail message
    attemptTimeout: 1000 // timeout for sending fail message
});


var count = 1;

setInterval(function () {
    var message = 'my message' + count++;
    console.log('Attempt publish: ' + message);
    publisher.publish('test-topic', message, function (err) {
        if (err) {
            console.log(err);
            return console.log('Error to send message.');
        }
        console.log(message);
    });
}, 1000);

publisher.on('reconnect_failed', function (err) {
    console.log(err);
    process.exit(1);
});