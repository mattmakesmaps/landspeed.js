#!/usr/bin/env node

// Increase the libuv threadpool size to 1.5x the number of logical CPUs.
var threadpool_size = Math.ceil(Math.max(4, require('os').cpus().length * 1.5));
process.env.UV_THREADPOOL_SIZE = threadpool_size

var http = require('http');
var url = require('url');
var fs = require('fs');
var mapnik = require('mapnik');
var mapnik2gc = require('./stylesheet_2_getcapabilities.js');
// register fonts and datasource plugins
mapnik.register_default_fonts();
mapnik.register_default_input_plugins();

var stylesheet = process.argv[2];
// the '+process.argv[3]' converts the parsed string to an integer.
var port = +process.argv[3] || 8000;
// parseInt() function used to convert from string to integer of given base.
// In this case, specify base 10.
var concurrency = parseInt(process.argv[4] || 32, 10);
/**
Ternary operation stating: if process.argv[5], then assign variable palette to a
new instance of mapnik.Palette, or assign variable palette a value of false.
**/
var palette = process.argv[5] ? new mapnik.Palette(fs.readFileSync(process.argv[5]), 'act') : false;

if (!stylesheet) {
   console.warn('usage: ./server.js <stylesheet> <port> <concurrency> <palette>');
   process.exit(1);
}

var renderer = require('./renderer')({
    stylesheet: stylesheet,
    concurrency: concurrency,
    palette: palette
});

function isPNG(data) {
    /**
     * The first 8 members of the data array are evaluated against these hex values.
     * Each evaluation returns true or false.
     *
     * If any of the evaluations return false, the value of the entire && comparison
     * is set to false, and the function returns false. However, if all evaluations
     * return true, the value of the last evaluation (of data[7], which is true) is
     * returned.
     *
     * Just an interesting example of logical operators in JS.
     * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_Operators
     *
     * I bet that this is checking the headers of a binary file to determine if
     * the file is a PNG  or not.
     */
    return data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4E &&
        data[3] === 0x47 && data[4] === 0x0D && data[5] === 0x0A &&
        data[6] === 0x1A && data[7] === 0x0A;
}

/**
 * QUESTION: Why do we call the http.createServer() method
 * rather then something like, new http.createServer().
 * http.createServer() returns an object, aren't we essentially
 * instanciating something?
 *
 * ANSWER(?): the http.createServer() method actually returns
 * an instance of Server instanciated using the `new` keyword
 * See: https://github.com/joyent/node/blob/master/lib/http.js#L61-L63
 */
var server = http.createServer(function(req, res) {
    var uri = url.parse(req.url.toLowerCase(), true);

    /**
     * uri.query is an object:
     * { query param name: query param value }
     *
     * I think the anonymous function is a callback used
     * to handle the return value from the renderer()
     * method.
     */

    // If we have a getmap query, return the image.
    if (uri.query.hasOwnProperty('request') && uri.query.request.toLowerCase() == 'getmap') {
        renderer(uri.query, function(err, tile) {
            if (err || !tile || !isPNG(tile)) {
                res.writeHead(500, {
                    'Content-Type': 'text/plain; charset=utf-8'
                });
                res.end(err ? err.stack : "Rendering didn't produce a proper tile");
            } else {
                res.writeHead(200, {
                    'Content-Length': tile.length,
                    'Content-Type': 'image/png'
                });
                res.end(tile);
            }
        });
    }

    if (uri.query.hasOwnProperty('request') && uri.query.request.toLowerCase() == 'getcapabilities') {
        // Create readstream to example getcapabilities response
        mapnik2gc('demo/world_latlon.xml', function(gc_response){
            // write out content type
            res.writeHead(200, {'Content-Type': 'application/vnd.ogc.wms_xml'});
            // pipe out xml to response
            res.write(gc_response);
            res.end();
        });
    }
});

server.listen(port, function() {
    var address = server.address();
    console.warn('Listening at %s:%d', address.address, address.port);
});

/**
 * TODO: Lookup pattern for setting up a node server using the http module.
 * In this script, it's a 2-step process.
 * 1. assign a variable to http.createServer() with a callback to handle request and response.
 * 2. call listen() on variable assigned in step 1, with a port and callback function.
**/