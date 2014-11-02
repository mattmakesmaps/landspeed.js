// Parse Layer elements from Mapnik XML Sheet
// Read template Get Capabilities response into memory
// Replace Layer elements in Get Capabilities Reponse with Parsed Layer Elements
// from Mapnik XML Sheet.

var combinedStream = require('combined-stream');
var fs = require('fs');
var through2 = require('through2');
var xmlNodes = require('xml-nodes');
var xml2js = require('xml2js');

var xml_parser = new xml2js.Parser();
var xml_builder = new xml2js.Builder({headless: true});

// Extract Layer Nodes from Mapnik XML Sheet
var filepath_mapnik_xml = '/Users/matt/Projects/sources/landspeed.js/demo/world_latlon.xml';
var stream_mapnik_xml = fs.createReadStream(filepath_mapnik_xml);

var filepath_gc_template_xml = '/Users/matt/Projects/sources/landspeed.js/demo/get_capabilities_template.xml';
var stream_gc_template_xml = fs.createReadStream(filepath_gc_template_xml);

// through2 stream 
function mapnikLayer2GetCapLayer(chunk, encoding, callback) {
    // Given a JSON Object representing Mapnik Layer XML node,
    // convert that to an entry formatted for insertion
    // into the GetCapabilities response template.
    xml_parser.parseString(chunk, function (err, result) {
        var mapnik_layer_name = result['Layer']['$']['name'];

        // Stub layer entry for GC Response
        var gcr_layer_template = '<Layer queryable="0" opaque="0" cascaded="0">\n<Name>Example Name</Name>\n<Title>Example Title</Title>\n<SRS>EPSG:4326</SRS>\n<LatLonBoundingBox minx="-180.0" miny="-90.0" maxx="180.0" maxy="90.0" />\n<BoundingBox SRS="EPSG:4326"\nminx="-180.0" miny="-90.0" maxx="180.0" maxy="90.0" /></Layer>';

        // Convert GCR Template String to JSON Object, add Mapnik Layer Name,
        // Convert populated response back to XML.
        xml2js.parseString(gcr_layer_template, function(err, result) {
            result['Layer']['Name'][0] = mapnik_layer_name;
            result['Layer']['Title'][0] = mapnik_layer_name;
            callback(null, xml_builder.buildObject(result));
        });
    });
}

// DO WORK
var layer_stream = stream_mapnik_xml
    .pipe(xmlNodes('Layer')) // Subset xml 'Layer' nodes.
    .pipe(through2(mapnikLayer2GetCapLayer));

var comboStream = combinedStream.create();
comboStream.append(stream_gc_template_xml);
comboStream.append(layer_stream)
    .pipe(process.stdout);

// TODO: Add closing </Layer>; </Capability>; </WMT_MS_Capabilities> tags.
// TODO: Wrap in module.exports accepting abritary path to mapnik xml file.