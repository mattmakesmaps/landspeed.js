// This module exports a constructor for an object, 'Pool'.
module.exports = Pool;
function Pool(initialize, capacity) {
    this.objects = [];
    this.waiting = [];

    if (!capacity) capacity = 5;
    console.warn('Pool capacity: %d', capacity);

    // SEE: http://nodejs.org/api/process.html#process_process_nexttick_callback
    process.nextTick(function() {
        for (var i = 0; i < capacity; i++) {
            initialize();
        }
    });
}

Pool.prototype.acquire = function(callback) {
    this.waiting.push(callback);
    this.supply();
};

Pool.prototype.release = function(object) {
    this.objects.push(object);
    this.supply();
};

Pool.prototype.supply = function() {
    while (this.objects.length && this.waiting.length) {
        this.waiting.shift()(this.objects.shift());
    }
};
