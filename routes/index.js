var express = require('express');
var router = express.Router();
var pg = require('pg');
var conString = "postgres://postgres:Chidori3@localhost/pdt";

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Slovak castles' });
});

/*vsetky hrady*/
router.get('/castles', function(req, res, next) {
  res.writeHead(200, {"Content-Type": "application/json"});
  
  var client = new pg.Client(conString);
  client.connect(function(err) {
    if(err) {
      return console.error('could not connect to postgres', err);
    }

    /*vsetky hrady ako body*/
    client.query("SELECT osm_id,historic,name,ST_AsGeoJSON(ST_Transform(way,4326)) AS geometry FROM planet_osm_point WHERE historic in ('castle') and name is not null UNION SELECT osm_id,historic,name,ST_AsGeoJSON(ST_Transform(ST_Centroid(way),4326)) AS geometry FROM planet_osm_polygon WHERE historic in ('castle') and name is not null", function(err, result) {

    if(err) {
      return console.error('error running query', err);
    }
    client.end();

    result.rows.map(function(row){
      try {
        row.geometry = JSON.parse(row.geometry);
        row.type = "Feature";
        if(row.historic == "castle"){
            row.properties = {"title": row.name, "marker-symbol": "monument", "marker-size": "large", "marker-color": "#9ACD32", "stroke": "#9ACD32", "fill": "#9ACD32"}
        } 
      } catch (e) {
        row.geometry = null;
      }
      return row;
     });
    res.end(JSON.stringify(result.rows));
    });
  });
});

/*vsetky hrady ak su aj polygony*/
router.get('/castles-poly', function(req, res, next) {
  res.writeHead(200, {"Content-Type": "application/json"});
  
  var client = new pg.Client(conString);
  client.connect(function(err) {
    if(err) {
      return console.error('could not connect to postgres', err);
    }

    /*vsetky hrady ako polygony a body - iba ak su aj aj*/
    client.query("SELECT osm_id,historic,name,ST_AsGeoJSON(ST_Transform(way,4326)) AS geometry FROM planet_osm_polygon WHERE historic in ('castle') and name is not null UNION SELECT osm_id,historic,name,ST_AsGeoJSON(ST_Transform(ST_Centroid(way),4326)) AS geometry FROM planet_osm_polygon WHERE historic in ('castle') and name is not null", function(err, result) {

    if(err) {
      return console.error('error running query', err);
    }
    client.end();

    result.rows.map(function(row){
      try {
        row.geometry = JSON.parse(row.geometry);
        row.type = "Feature";
        if(row.historic == "castle"){
            row.properties = {"title": row.name, "marker-symbol": "monument", "marker-size": "large", "marker-color": "#9ACD32", "stroke": "#9ACD32", "fill": "#9ACD32"}
        } 
      } catch (e) {
        row.geometry = null;
      }
      return row;
     });
    res.end(JSON.stringify(result.rows));
    });
  });
});

/*vsetky zariadenia okrem lekarni*/
router.get('/hospitals', function(req, res, next) {
  res.writeHead(200, {"Content-Type": "application/json"});
  
  var client = new pg.Client(conString);
  client.connect(function(err) {
    if(err) {
      return console.error('could not connect to postgres', err);
    }
    /*vsetky zariadenia okrem lekarni*/
    client.query("SELECT osm_id,amenity,name,ST_AsGeoJSON(ST_Transform(way,4326)) AS geometry FROM planet_osm_point WHERE amenity in('hospital','clinic','dentist','doctors') UNION SELECT osm_id,amenity,name,ST_AsGeoJSON(ST_Transform(way,4326)) AS geometry FROM planet_osm_polygon WHERE amenity in('hospital','clinic','dentist','doctors')", function(err, result) {

    if(err) {
      return console.error('error running query', err);
    }
    client.end();

    result.rows.map(function(row){
      try {
        row.geometry = JSON.parse(row.geometry);
        row.type = "Feature";
        if(row.amenity == "pharmacy"){
            row.properties = {"title": row.name, "marker-symbol": "pharmacy", "marker-size": "small", "marker-color": "#9ACD32", "stroke": "#9ACD32", "fill": "#9ACD32"}
        } else if(row.amenity == "dentist"){
            row.properties = {"title": row.name, "marker-symbol": "dentist", "marker-size": "large", "marker-color": "#006400", "stroke": "#006400", "fill": "#006400"};
        } else if(row.amenity == "hospital"){
            row.properties = {"title": row.name, "marker-symbol": "commercial", "marker-size": "large", "marker-color": "#006400", "stroke": "#006400", "fill": "#006400"};
        } else {
            row.properties = {"title": row.name, "marker-symbol": "hospital", "marker-size": "large", "marker-color": "#006400", "stroke": "#006400", "fill": "#006400"};
        }
      } catch (e) {
        row.geometry = null;
      }
      return row;
     });
    res.end(JSON.stringify(result.rows));
    });
  });
});

/*vsetko spolu*/
router.get('/allHealthCare', function(req, res, next) {
  res.writeHead(200, {"Content-Type": "application/json"});
  
  var client = new pg.Client(conString);
  client.connect(function(err) {
    if(err) {
      return console.error('could not connect to postgres', err);
    }

    /*vsetko*/
    client.query("SELECT osm_id,amenity,name,ST_AsGeoJSON(ST_Transform(way,4326)) AS geometry FROM planet_osm_point WHERE amenity in('pharmacy','hospital','clinic','dentist','doctors') UNION SELECT osm_id,amenity,name,ST_AsGeoJSON(ST_Transform(way,4326)) AS geometry FROM planet_osm_polygon WHERE amenity in('pharmacy','hospital','clinic','dentist','doctors')", function(err, result) {

    if(err) {
      return console.error('error running query', err);
    }
    client.end();

    result.rows.map(function(row){
      try {
        row.geometry = JSON.parse(row.geometry);
        row.type = "Feature";
        if(row.amenity == "pharmacy"){
            row.properties = {"title": row.name, "marker-symbol": "pharmacy", "marker-size": "small", "marker-color": "#9ACD32", "stroke": "#9ACD32", "fill": "#9ACD32"}
        } else if(row.amenity == "dentist"){
            row.properties = {"title": row.name, "marker-symbol": "dentist", "marker-size": "large", "marker-color": "#006400", "stroke": "#006400", "fill": "#006400"};
        } else if(row.amenity == "hospital"){
            row.properties = {"title": row.name, "marker-symbol": "commercial", "marker-size": "large", "marker-color": "#006400", "stroke": "#006400", "fill": "#006400"};
        } else {
            row.properties = {"title": row.name, "marker-symbol": "hospital", "marker-size": "large", "marker-color": "#006400", "stroke": "#006400", "fill": "#006400"};
        }
      } catch (e) {
        row.geometry = null;
      }
      return row;
     });
    res.end(JSON.stringify(result.rows));
    });
  });
});

/*vsetky lekarne ktore su v nejakom zdravotnickom zariadeni*/
router.get('/pharmacyInHospital', function(req, res, next) {
  res.writeHead(200, {"Content-Type": "application/json"});
  
  var client = new pg.Client(conString);
  client.connect(function(err) {
    if(err) {
      return console.error('could not connect to postgres', err);
    }

    /*vsetky lekarne v zariadeniach a tie zariadenia*/
    client.query("SELECT pol.osm_id AS osm_id, ST_AsGeoJSON(ST_Transform(pol.way,4326)) AS geometry, pol.amenity, pol.name FROM planet_osm_point AS poi CROSS JOIN planet_osm_polygon AS pol WHERE ST_CONTAINS(pol.way, poi.way) = 't' AND pol.amenity in ('hospital','clinic','dentist','doctors') AND poi.amenity ='pharmacy' GROUP BY pol.osm_id, pol.way, pol.amenity, pol.name UNION SELECT poi.osm_id AS osm_id, ST_AsGeoJSON(ST_Transform(poi.way,4326)) AS geometry, poi.amenity, poi.name FROM planet_osm_point AS poi CROSS JOIN planet_osm_polygon AS pol WHERE ST_CONTAINS(pol.way, poi.way) = 't' AND pol.amenity in ('hospital','clinic','dentist','doctors') AND poi.amenity ='pharmacy' GROUP BY poi.osm_id, poi.way, poi.amenity, poi.name", function(err, result) {

    if(err) {
      return console.error('error running query', err);
    }
    client.end();

    result.rows.map(function(row){
      try {
        row.geometry = JSON.parse(row.geometry);
        row.type = "Feature";
        if(row.amenity == "pharmacy"){
            row.properties = {"title": row.name, "marker-symbol": "pharmacy", "marker-size": "small", "marker-color": "#9ACD32", "stroke": "#9ACD32", "fill": "#9ACD32"}
        } else if(row.amenity == "dentist"){
            row.properties = {"title": row.name, "marker-symbol": "dentist", "marker-size": "large", "marker-color": "#006400", "stroke": "#006400", "fill": "#006400"};
        } else if(row.amenity == "hospital"){
            row.properties = {"title": row.name, "marker-symbol": "commercial", "marker-size": "large", "marker-color": "#006400", "stroke": "#006400", "fill": "#006400"};
        } else {
            row.properties = {"title": row.name, "marker-symbol": "hospital", "marker-size": "large", "marker-color": "#006400", "stroke": "#006400", "fill": "#006400"};
        }
      } catch (e) {
        row.geometry = null;
      }
      return row;
     });
    res.end(JSON.stringify(result.rows));
    });
  });
});

/*naplnenie selectu v html*/
router.get('/selectCounties', function(req, res, next) {
  res.writeHead(200, {"Content-Type": "application/json"});
  
  var client = new pg.Client(conString);
  client.connect(function(err) {
    if(err) {
      return console.error('could not connect to postgres', err);
    }

    /*naplnenie selectu v html*/
    client.query("SELECT * from planet_osm_polygon where name like '% kraj' and boundary like 'administrative'", function(err, result) {

    if(err) {
      return console.error('error running query', err);
    }
    client.end();
    res.end(JSON.stringify(result.rows));
    });
  });
});

/*najblizsie lekarne*/
router.get('/nearPharmacy', function(req, res, next) {
  res.writeHead(200, {"Content-Type": "application/json"});
  
  var client = new pg.Client(conString);
  client.connect(function(err) {
    if(err) {
      return console.error('could not connect to postgres', err);
    }

    /*vsetky lekarne v zariadeniach a tie zariadenia*/d
    client.query({text:"(SELECT point2.amenity, point2.name, ST_AsGeoJSON(ST_Transform(point2.way,4326)) AS geometry,ST_Distance(point1.way, point2.way) AS distance FROM planet_osm_point AS point1, planet_osm_point AS point2 WHERE point1.osm_id = $1 AND point2.amenity = 'pharmacy' ORDER BY distance LIMIT $2) UNION (SELECT amenity, name, ST_AsGeoJSON(ST_Transform(way,4326)) as geometry,'0' AS distance FROM planet_osm_point WHERE osm_id = $1) ORDER BY distance", values:[req.query.id]}, function(err, result) {

    if(err) {
      return console.error('error running query', err);
    }
    client.end();
    console.dir(req.query);

    result.rows.map(function(row){
      try {
        row.geometry = JSON.parse(row.geometry);
        row.type = "Feature";
        if(row.amenity == "pharmacy"){
            row.properties = {"title": row.name, "marker-symbol": "pharmacy", "marker-size": "small", "marker-color": "#9ACD32", "stroke": "#9ACD32", "fill": "#9ACD32"}
        } else if(row.amenity == "dentist"){
            row.properties = {"title": row.name, "marker-symbol": "dentist", "marker-size": "large", "marker-color": "#006400", "stroke": "#006400", "fill": "#006400"};
        } else if(row.amenity == "hospital"){
            row.properties = {"title": row.name, "marker-symbol": "commercial", "marker-size": "large", "marker-color": "#006400", "stroke": "#006400", "fill": "#006400"};
        } else {
            row.properties = {"title": row.name, "marker-symbol": "hospital", "marker-size": "large", "marker-color": "#006400", "stroke": "#006400", "fill": "#006400"};
        }
      } catch (e) {
        row.geometry = null;
      }
      return row;
     });
    res.end(JSON.stringify(result.rows));
    });
  });
});

module.exports = router;