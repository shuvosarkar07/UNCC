const EventEmitter = require('events');

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();

myEmitter.on('event', () => {
    console.log('an event occurred!');
});

myEmitter.once('play', () => {
    console.log('play once');
});

myEmitter.on('greet', (name) => {
    console.log(`Hello ${name}`);
});


// myEmitter.emit('event');
// myEmitter.emit('event');
// myEmitter.emit('event');

// myEmitter.emit('play');
// myEmitter.emit('play');
// myEmitter.emit('play');

myEmitter.emit('greet', 'Shuvo');
myEmitter.emit('greet', 'Rohan');


