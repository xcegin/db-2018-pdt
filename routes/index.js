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
    /**TODO: dodat distinct on na name */
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

/*on click hradu zobrazenie vsetkych hovadin v jeho blizkosti ako polygonov*/
router.get('/closeInterests', function(req, res, next) {
  res.writeHead(200, {"Content-Type": "application/json"});
  
  var client = new pg.Client(conString);
  client.connect(function(err) {
    if(err) {
      return console.error('could not connect to postgres', err);
    }

    /*on click hradu zobrazenie vsetkych hovadin v jeho blizkosti ako polygonov*/
    client.query({text:`with castle_points as (
      SELECT DISTINCT ON(way) osm_id,historic,name,way FROM planet_osm_point 
        WHERE historic in ('castle') and name is not null 
        UNION SELECT DISTINCT ON(way) osm_id,historic,name,ST_Centroid(way) AS way FROM planet_osm_polygon
        WHERE historic in ('castle') and name is not null
      )
      select osm_id, name, ST_AsGeoJSON(ST_Transform(way,4326)) AS geometry, historic, amenity, tourism, man_made, leisure, shop from planet_osm_polygon as pol where name is not null and building in ('yes') and ST_DWithin(pol.way, (select way from castle_points where osm_id=$1), $2);`, values:[req.query.id, req.query.num]}, function(err, result) {

    if(err) {
      return console.error('error running query', err);
    }
    client.end();
    console.dir(req.query);

    result.rows.map(function(row){
      try {
        row.geometry = JSON.parse(row.geometry);
        row.type = "Feature";

        if(row.tourism == "museum" || row.tourism == "gallery"){
          row.properties = {"title": row.name, "marker-symbol": "museum", "marker-size": "small", "marker-color": "#00FF7F", "stroke": "#00FF7F", "fill": "#00FF7F"}
        } else if(row.man_made == "tower"){
          row.properties = {"title": row.name, "marker-symbol": "place-of-worship", "marker-size": "small", "marker-color": "#005129", "stroke": "#005129", "fill": "#005129"};
        } else if(row.leisure == "sports_centre"){
          row.properties = {"title": row.name, "marker-symbol": "basketball", "marker-size": "small", "marker-color": "#e3ff01", "stroke": "#e3ff01", "fill": "#e3ff01"};
        } else if(row.historic == "castle"){
          row.properties = {"title": row.name, "marker-symbol": "monument", "marker-size": "large", "marker-color": "#9ACD32", "stroke": "#9ACD32", "fill": "#9ACD32"};
        } else if(row.amenity == "restaurant"){
          row.properties = {"title": row.name, "marker-symbol": "restaurant", "marker-size": "small", "marker-color": "#156bcc", "stroke": "#156bcc", "fill": "#156bcc"};
        } else if(row.amenity == "embassy"){
          row.properties = {"title": row.name, "marker-symbol": "embassy", "marker-size": "small", "marker-color": "#9010ff", "stroke": "#9010ff", "fill": "#9010ff"};
        } else if(row.amenity == "bank"){
          row.properties = {"title": row.name, "marker-symbol": "bank", "marker-size": "small", "marker-color": "#ff9410", "stroke": "#ff9410", "fill": "#ff9410"};
        } else if(row.tourism == "hotel" || row.tourism == "guest_house"){
          row.properties = {"title": row.name, "marker-symbol": "hotel", "marker-size": "small", "marker-color": "#ff1010", "stroke": "#ff1010", "fill": "#ff1010"};
        } else if(row.shop){
          row.properties = {"title": row.name, "marker-symbol": "commercial", "marker-size": "small", "marker-color": "#3e2d31", "stroke": "#3e2d31", "fill": "#3e2d31"};
        } else if(row.amenity == "place_of_worship"){
          row.properties = {"title": row.name, "marker-symbol": "place-of-worship", "marker-size": "small", "marker-color": "#635400", "stroke": "#635400", "fill": "#635400"};
        } else {
          row.properties = {"title": row.name, "marker-symbol": "building", "marker-size": "small", "marker-color": "#6d6d66", "stroke": "#6d6d66", "fill": "#6d6d66"};
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