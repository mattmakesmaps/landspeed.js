/**
 *
 * Created by mkenny on 10/3/14.
 */
var fs = require('fs');
var xml2js = require('xml2js');

var geojson_feat = {"type": "FeatureCollection", "features": [
    {"geometry": {"type": "Point", "coordinates": [102.564, 46.516]}, "type": "Feature", "properties": {"pt_br": "Mongólia", "ko_kr": "몽골", "map_code": 0, "synonyms": [], "en_us": null, "de_de": "Mongolei", "id": 2029969, "none": "Mongolia", "fr_fr": "Mongolie", "ja_jp": "モンゴル国", "zh_cn": "蒙古", "class": 0, "parent_id": 6255147, "es_es": null}}
]}

var xml_builder = new xml2js.Builder();
var xml_feat = xml_builder.buildObject(geojson_feat);

console.log(xml_feat);

// compelete the round trip

var json_builder = xml2js.parseString;
json_builder(xml_feat, function (err, result){
    console.dir(result);

});