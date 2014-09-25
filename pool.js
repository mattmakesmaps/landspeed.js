// This module exports a constructor for an object, 'Pool'.
module.exports = Pool;
function Pool(initialize, capacity) {
    this.objects = [];
    this.waiting = [];

    if (!capacity) capacity = 5;
    console.warn('Pool capacity: %d', capacity);

    // SEE: http://nodejs.org/api/process.html#process_process_nexttick_callback
    // On the next run of the event loop, execute the function passed in on
    // Pool's construction as many times as the capacity parameter is set to.
    process.nextTick(function() {
        for (var i = 0; i < capacity; i++) {
            initialize();
        }
    });
}

// Pool.acquire(): Given a callback, add it to the Pool's "waiting" array.
// Then call supply() to perform an action in "waiting" against an "object"
Pool.prototype.acquire = function(callback) {
    this.waiting.push(callback);
    this.supply();
};

// Pool.release(): Given an object, add it to the "objects" array.
// Then call supply() to perform an action in "waiting" against an "object".
Pool.prototype.release = function(object) {
    this.objects.push(object);
    this.supply();
};

Pool.prototype.supply = function() {
    while (this.objects.length && this.waiting.length) {
        // Return an element from the waiting array;
        // Execute the returned element (a function) against
        // the first member of the objects array.
        this.waiting.shift()(this.objects.shift());
    }
};
