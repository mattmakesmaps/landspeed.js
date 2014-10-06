/**
 * Created by mkenny on 10/3/14.
 * This module handles the extraction of layers
 * from a Mapnik XML stylesheet, and returns
 * back a valid GetCapabilities XML document.
 */

var fs = require('fs');
var xml2js = require('xml2js');

var xml_parser = new xml2js.Parser();
var xml_builder = new xml2js.Builder();

function populate_getcapabilities_template(parsed_stylesheet, callback) {
    // Given a parsed mapnik stylesheet xml file,
    // parse a getcapabilities_template file and populate
    // with layers from the stylesheet.
    fs.readFile('demo/get_capabilities_template.xml', function (err, data) {
        xml_parser.parseString(data, function (err, parsed_template) {
            // empty-out layer array
            parsed_template.WMT_MS_Capabilities.Capability[0].Layer[0]['Layer'] = []
            for (var i = 0; i < parsed_stylesheet.Map.Layer.length; i++) {
                create_layer_stub(parsed_stylesheet.Map.Layer[i], parsed_template);
            }
            // Could I structure this to use a callback?
            callback(xml_builder.buildObject(parsed_template));
        })
    })
}

function create_layer_stub(stylesheet_layer, template_layer) {
    // given a layer from a mapnik stylesheet
    // return a layer formatted for WMS GetCapabilities
    // response.
    var layer_template = '<Layer queryable="0" opaque="0" cascaded="0">\n<Name>Example Name</Name>\n<Title>Example Title</Title>\n<SRS>EPSG:4326</SRS>\n<LatLonBoundingBox minx="-180.0" miny="-90.0" maxx="180.0" maxy="90.0" />\n<BoundingBox SRS="EPSG:4326"\nminx="-180.0" miny="-90.0" maxx="180.0" maxy="90.0" /></Layer>'
    xml2js.parseString(layer_template, function(err, result) {
        // Reset Name Using Mapnik Stylesheet Value.
        result.Layer.Name[0] = stylesheet_layer['$']['name'];
        result.Layer.Title[0] = stylesheet_layer['$']['name'];
        // Remove the '+init=' characters.
        result.Layer.SRS[0] = stylesheet_layer['$']['srs'].substring(6);
        template_layer.WMT_MS_Capabilities.Capability[0].Layer[0]['Layer'].push(result);
    })
}

// Parse a mapnik stylesheet,
// and return a get capabilities XML doc with layer names appended.
module.exports = function(stylesheet_path, callback) {
    fs.readFile(stylesheet_path, function (err, data) {
        // Body of Callback
        xml_parser.parseString(data, function (err, result) {
            // Parse get_capabilities template
            populate_getcapabilities_template(result, callback);
        })
    })
}
