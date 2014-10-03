/**
 *
 * Created by mkenny on 10/3/14.
 */
var fs = require('fs');
var xml2js = require('xml2js');

var xml_parser = new xml2js.Parser();
var xml_builder = new xml2js.Builder();

// Roundtrip the conversion of an XML file on disk
// From XML --> JSON --> XML
fs.readFile('../demo/layer_example.xml', function(err, data) {
    // Body of Callback
    console.log(data);
    xml_parser.parseString(data, function (err, result) {
        console.log(xml_builder.buildObject(result));
    })
})