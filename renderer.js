var mapnik = require('mapnik');
var fs = require('fs');
var path = require('path');
var util = require('util');
var Pool = require('./pool');

/**
 * This module exports a function, which itself returns a function.
 * When external code `require(./renderer.js)` and calls the renderer()
 * method, a Pool instance is constructed, to handle processing of indivudal tiles.
 * Additionally, a function is returned that accepts a query and a callback.
 */

module.exports = function(args) {
    if (!args.stylesheet) throw new Error('missing stylesheet');
    args.stylesheet = path.resolve(args.stylesheet);
    if (!args.concurrency) args.concurrency = 10;
    if (!args.bufferSize) args.bufferSize = 0;

    var created = 0;
    // The anonymous function passed to the Pool constructor is executed
    // each tick as as many times as is set by args.concurrency,
    // or defaults to five.
    var maps = new Pool(function() {
        // This function actually handles the code to render the map tile.
        var map = new mapnik.Map(256, 256);
        map.bufferSize = args.bufferSize;
        map.load(args.stylesheet, {
            strict: true,
            base: path.dirname(args.stylesheet)
        }, function(err, map) {
            // Is this a callback for the load() method
            // of whatever is returned by mapnik.Map()?
            if (err) throw err;
            map.zoomAll();
            created++;
            util.print('\rCreating map objects (' + created + '/' + args.concurrency + ')...');
            // Call the release() method of the pool object.
            maps.release(map);
        });
    }, args.concurrency);

    return function(query, callback) {
        /**
         * This function parses width,height,bbox from set of URL query params.
         *
         * After, it calls the acquire() method on the Pool() instance `maps`.
         * This basically loads the Pool queue with instances of mapnik.Map(),
         * to be rendered according to a specific width/height/bbox.
         *
         * Question: How are the individual tiles being requested? That must be
         * happeneing through a client such as openlayers or leaflet.
         */
        // Set width and height if not specified.
        query.width = +query.width || 256;
        query.height = +query.height || 256;

        // Throw error in event of invalid sizes.
        if (query.width < 1 || query.width > 2048 || query.height < 1 || query.height > 2048) {
            return callback(new Error('Invalid size: ' + query.width + '×' + query.height));
        }

        // check for valid bbox passed in from URL.
        var bbox = query.bbox ? query.bbox.split(',') : [];
        // error checking on number of bbox elements.
        if (bbox.length !== 4) return callback(new Error('Invalid bbox: ' + util.inspect(bbox)));
        // Map the function parseFloat to all elements of the bbox array, replacing elements with floats.
        bbox = bbox.map(parseFloat);
        // error checking on bbox element types.
        for (var i = 0; i < 4; i++) {
            if (isNaN(bbox[i])) return callback(new Error('Invalid bbox: ' + util.inspect(bbox)));
        }

        maps.acquire(function(map) {
            // I think all this is doing is setting the tile width heigh and bbox,
            // then actually generating the tile.
            map.resize(query.width, query.height);
            if (query.srs) map.srs = '+init=' + query.srs;
            map.extent = bbox;

            var canvas = new mapnik.Image(query.width, query.height);
            map.render(canvas, function(err, image) {
                // Wait until the next tick to avoid Mapnik warnings.
                process.nextTick(function() { maps.release(map); });

                if (err) {
                    callback(err);
                } else {
                    if (args.palette) {
                        image.encode('png8:z=1', {palette: args.palette}, callback);
                    } else {
                        image.encode('png32:z=1', callback);
                    }
                }
            });
        });
    };
};
