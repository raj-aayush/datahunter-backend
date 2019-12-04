var express       =  require("express");
var app           =  express();
var mysql         =  require('mysql');
var bodyParser    =  require("body-parser");
var fs            =  require('fs');
var os            =  require("os");
var car           =  require("./my_modules/car.js");
var user          =  require("./my_modules/user.js");
// const g           =  require('@google/maps').createClient({ key: 'AIzaSyDc1JPdVDs1d9vMufechtLWkfyHaxq1NuY' });
const MongoClient =  require('mongodb').MongoClient;
var dateTime      =  require('node-datetime');

// A second around Chicago is ~ 30m in latitude and ~23m in longitude
var del_lat = 1/7200, del_lng = 1/7200;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(express.json());

if (os.hostname().search("web.illinois.edu") == -1){
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    insecureAuth : true,
    database: "datahunter_user"
  });
}
else{
  var con = mysql.createConnection({
    host: "localhost",
    user: "datahunter_admin",
    password: "datahunter_admin",
    insecureAuth : true,
    database: "datahunter_user_info"
  });
}

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected to mySQL dB!");
});

const mongo_uri = "mongodb+srv://datahunter_admin:datahunter_admin@chicago-crashes-c68oc.gcp.mongodb.net/test?retryWrites=true&w=majority";
const mongo_client = new MongoClient(mongo_uri, { useNewUrlParser: true, useUnifiedTopology: true });
mongo_client.connect(function(err){
  if (err) throw err;
  console.log("Connected to Mongo dB!");
});

//Handle navigation
app.get('/',async function(req,res){
  nav('./login.html', fs, res);
});
app.get('/map/', function(req, res){
  nav('./map.html', fs, res);
});

//Handle Mongo dB requests
app.post('/node/accident_count', async function(req, res){
  const collection = mongo_client.db("accident").collection("chicago");
  var sum_incidents = 0;
  var q = JSON.parse(req.body.q);
  for (var i = 0; i < q.length; i++) {
    var s0 = parseFloat(q[i][0])-del_lat;
    var s1 = parseFloat(q[i][1])-del_lng;
    var e0 = parseFloat(q[i][0])+del_lat;
    var e1 = parseFloat(q[i][1])+del_lng;
    var larger0  = (s0 > e0)? s0 : e0;
    var smaller0 = (s0 > e0)? e0 : s0;
    var larger1  = (s1 > e1)? s1 : e1;
    var smaller1 = (s1 > e1)? e1 : s1;

    var num_of_incidents = await collection.countDocuments({
      $and : [
        { LATITUDE : { $gte: String(smaller0), $lte: String(larger0) } },
        { LONGITUDE: { $gte: String(larger1), $lte: String(smaller1) } }
      ]
    });
    sum_incidents += num_of_incidents;
  }
  console.log("Sum: "+sum_incidents);
  var resp = String(sum_incidents);

  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write(resp);
  res.end();
});

app.post('/node/user/login'     , function(req, res){
  user.login(con, req.body.username, req.body.password, res);
});
app.post('/node/user/create'    , function(req, res){
  user.create(con, req.body.username, req.body.password, req.body.first_name, req.body.last_name, res);
});
app.post('/node/user/query'     , function(req, res){
  user.get(con, req.body.username, res);
});
app.post('/node/user/update'    , function(req, res){
  user.update(con, req.body.username, req.body.password, req.body.first_name, req.body.last_name, res);
});
app.post('/node/user/delete'    , function(req, res){
  user.delete(con, req.body.username, res);
});
app.post('/node/user/cars_query', function(req, res){
  user.get_cars(con, req.body.username, res);
});

app.post('/node/car/create'     , function(req, res){
  car.create(con, req.body.username, req.body.brand, req.body.model, req.body.licence, res);
});
app.post('/node/car/query'      , function(req, res){
  car.get(con, req.body.id, res);
});
app.post('/node/car/update'     , function(req, res){
  car.update(con, req.body.id, req.body.username, req.body.brand, req.body.model, req.body.licence, res);
});
app.post('/node/car/delete'     , function(req, res){
  car.delete(con, req.body.id, res);
});

app.listen(3000,function(){
  console.log("Started on PORT 3000");
});

function nav(url, fs, res){
  console.log("Opening "+url);
  fs.readFile(url, function(err, data) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(data);
    res.end();
  });
}
