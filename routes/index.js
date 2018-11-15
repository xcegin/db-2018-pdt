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

/*hrad s parkoviskami do metrov nejakych*/
router.get('/closeParking', function(req, res, next) {
  res.writeHead(200, {"Content-Type": "application/json"});
  
  var client = new pg.Client(conString);
  client.connect(function(err) {
    if(err) {
      return console.error('could not connect to postgres', err);
    }

    /*hrady a parkoviska do danych metrov*/
    client.query({text:`SELECT  pol.osm_id, pol.name, ST_AsGeoJSON(ST_Transform(pol.way,4326)) AS geometry, pol.type as type
    FROM (SELECT osm_id,amenity as name,way, amenity as type
    FROM planet_osm_polygon WHERE amenity in ('parking')) as pol CROSS JOIN (SELECT osm_id,name,way, historic as type
    FROM planet_osm_point WHERE historic in ('castle') and name is not null 
    UNION SELECT osm_id,name,ST_Centroid(way) AS way, historic as type 
    FROM planet_osm_polygon WHERE historic in ('castle') and name is not null) as poi WHERE  ST_DWithin(poi.way, pol.way, $1)
    UNION  
    SELECT  poi.osm_id, poi.name, ST_AsGeoJSON(ST_Transform(poi.way,4326)) AS geometry, poi.type as type
    FROM (SELECT osm_id,name,way, historic as type
    FROM planet_osm_point WHERE historic in ('castle') and name is not null 
    UNION SELECT osm_id,name,ST_Centroid(way) AS way, historic as type 
    FROM planet_osm_polygon WHERE historic in ('castle') and name is not null) as poi CROSS JOIN (SELECT osm_id,amenity as name,way, amenity as type
    FROM planet_osm_polygon WHERE amenity in ('parking')) as pol WHERE ST_DWithin(poi.way, pol.way, $1)`, values:[req.query.num]}, function(err, result) {

    if(err) {
      return console.error('error running query', err);
    }
    client.end();
    console.dir(req.query);

    result.rows.map(function(row){
      try {
        row.geometry = JSON.parse(row.geometry);
        row.type = "Feature";
        if(row.name == "parking"){
            row.properties = {"title": row.name, "marker-symbol": "parking", "marker-size": "large", "marker-color": "#006400", "stroke": "#006400", "fill": "#006400"};
        }   else {
            row.properties = {"title": row.name, "marker-symbol": "monument", "marker-size": "large", "marker-color": "#9ACD32", "stroke": "#9ACD32", "fill": "#9ACD32"};
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

/*hrad vo vzdialenosti do x km od daneho krajskeho mesta*/
router.get('/closeTowns', function(req, res, next) {
  res.writeHead(200, {"Content-Type": "application/json"});
  
  var client = new pg.Client(conString);
  client.connect(function(err) {
    if(err) {
      return console.error('could not connect to postgres', err);
    }

    /*hrad vo vzdialenosti do x km od daneho krajskeho mesta*/
    client.query({text:`Select osm_id, name, ST_AsGeoJSON(ST_Transform(way,4326)) AS geometry, historic 
      from (SELECT osm_id,name,way, historic
      FROM planet_osm_point WHERE historic in ('castle') and name is not null 
      UNION SELECT osm_id,name,ST_Centroid(way) AS way, historic
      FROM planet_osm_polygon WHERE historic in ('castle') and name is not null) as data
      where ST_DWithin(data.way, (Select way from planet_osm_point points where osm_id=$1), $2)`, values:[req.query.id, req.query.num*1000]}, function(err, result) {

    if(err) {
      return console.error('error running query', err);
    }
    client.end();
    console.dir(req.query);

    result.rows.map(function(row){
      try {
        row.geometry = JSON.parse(row.geometry);
        row.type = "Feature";
        row.properties = {"title": row.name, "marker-symbol": "monument", "marker-size": "large", "marker-color": "#9ACD32", "stroke": "#9ACD32", "fill": "#9ACD32"};
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
router.get('/selectBigCities', function(req, res, next) {
  res.writeHead(200, {"Content-Type": "application/json"});
  
  var client = new pg.Client(conString);
  client.connect(function(err) {
    if(err) {
      return console.error('could not connect to postgres', err);
    }

    /*naplnenie selectu v html*/
    client.query("select * from planet_osm_point points where place in ('city') and population::integer > 54931 ORDER BY population::integer DESC", function(err, result) {

    if(err) {
      return console.error('error running query', err);
    }
    client.end();
    res.end(JSON.stringify(result.rows));
    });
  });
});

module.exports = router;