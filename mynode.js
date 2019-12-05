var express       =  require("express");
var app           =  express();
var mysql         =  require('mysql');
var bodyParser    =  require("body-parser");
var fs            =  require('fs');
var os            =  require("os");
var car           =  require("./my_modules/car.js");
var user          =  require("./my_modules/user.js");
const MongoClient =  require('mongodb').MongoClient;
var dateTime      =  require('node-datetime');
var cookieParser  =  require('cookie-parser');
var session       =  require('express-session');

// A second around Chicago is ~ 30m in latitude and ~23m in longitude
var del_lat = 1/7200, del_lng = 1/7200;
var del_lat_p = 0.01, del_long_p = 0.015;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
    key: 'user_id',
    secret: 'datahunter_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { expires: 600000 }
}));

app.use((req, res, next) => {
    if (req.cookies.user_id && !req.session.user) res.clearCookie('user_id');
    next();
});
var sessionChecker = (req, res, next) => {
    if (req.session.user && req.cookies.user_id) res.redirect('/nav/dashboard');
    else next();
};
app.get('/', sessionChecker, (req, res) => {
    res.redirect('/nav/login');
});
app.get('/nav/logout', (req, res) => {
    if (req.session.user && req.cookies.user_id) {
        res.clearCookie('user_id');
        res.redirect('/');
    } else {
        res.redirect('/nav/login');
    }
});
app.route('/nav/signup')
    .get(sessionChecker, (req, res) => { res.sendFile(__dirname + '/html/signup.html') })
    .post((req, res) => {
      var username = req.body.username, password = req.body.password,
      fname = req.body.first_name, lname = req.body.last_name;
      var q = "INSERT INTO user (first_name, last_name, username, password) VALUES (\""+fname+"\", \""+lname+"\", \""+username+"\", \""+password+"\")";
      console.log(q);
      con.query(q, function (err, result) {
        if (err) res.redirect('/nav/signup');
        else{
            req.session.user = username;
            res.redirect('/nav/dashboard');
        }
      });
    });
app.route('/nav/login')
    .get(sessionChecker, (req, res) => { res.sendFile(__dirname + '/html/login.html') })
    .post((req, res) => {
        var username = req.body.username, password = req.body.password;
        var q = "SELECT username,password FROM user WHERE username=\""+username+"\" AND password=\""+password+"\"";
        console.log(q);
        con.query(q, function (err, result, fields) {
          if (err || result.length != 1) res.redirect('/nav/login');
          else {
            req.session.user = username;
            res.redirect('/nav/dashboard');
          }
        });
    });
app.get('/nav/dashboard', (req, res) => {
    if (req.session.user && req.cookies.user_id) res.sendFile(__dirname + '/html/dashboard.html');
    else  res.redirect('/nav/login');
});
app.get('/nav', (req, res) => {
    res.redirect('/nav/login');
});
app.get('/nav/cars', (req, res) => {
    if (req.session.user && req.cookies.user_id) res.sendFile(__dirname + '/html/cars.html');
    else  res.redirect('/nav/login');
});
app.get('/nav/profile', (req, res) => {
    if (req.session.user && req.cookies.user_id) res.sendFile(__dirname + '/html/profile.html');
    else  res.redirect('/nav/login');
});

if (os.hostname().search("web.illinois.edu") == -1){
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    insecureAuth : true,
    database: "datahunter_user"
  });
  var parking_db_con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    insecureAuth : true,
    database: "datahunter_tickets"
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
  var parking_db_con = mysql.createConnection({
    host: "localhost",
    user: "datahunter_admin",
    password: "datahunter_admin",
    insecureAuth : true,
    database: "datahunter_tickets"
  });
}

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected to mySQL dB!");
});
parking_db_con.connect(function(err) {
  if (err) throw err;
  console.log("Connected to parking ticket mySQL dB!");
});

app.get('/img/traffic.jpeg', (req, res) => { res.sendFile(__dirname + '/html/traffic.jpeg') });
app.get('/img/road.jpeg'   , (req, res) => { res.sendFile(__dirname + '/html/road.jpeg'   ) });

const mongo_uri = "mongodb+srv://datahunter_admin:datahunter_admin@chicago-crashes-c68oc.gcp.mongodb.net/test?retryWrites=true&w=majority";
const mongo_client = new MongoClient(mongo_uri, { useNewUrlParser: true, useUnifiedTopology: true });
mongo_client.connect(function(err){
  if (err) throw err;
  console.log("Connected to Mongo dB!");
});

//Handle navigation
app.get('/login',async function(req,res){
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
  var route_i = req.body.route;
  for (var i = 0; i < q.length; i++) {
    var smaller0 = parseFloat(q[i][0])-del_lat;
    var smaller1 = parseFloat(q[i][1])-del_lng;
    var larger0 = parseFloat(q[i][0])+del_lat;
    var larger1 = parseFloat(q[i][1])+del_lng;

    var num_of_incidents = await collection.countDocuments({
      $and : [  { LATITUDE : { $gte: String(smaller0), $lte: String(larger0) } },
                { LONGITUDE: { $gte: String(larger1), $lte: String(smaller1) } }  ]
    });
    sum_incidents += num_of_incidents;
  }
  console.log("Sum: "+sum_incidents);
  var resp = String(sum_incidents);

  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write(resp+"\n"+route_i);
  res.end();
});

//Handle parking violation requests to sql
app.post('/node/parking_violation', async function(req, res){
    console.log("Get parking violations");
      var lat = req.body.lat, long = req.body.long;
      var start_lat  = parseFloat(lat)  - del_lat_p,
      end_lat  = parseFloat(lat)  + del_lat_p,
      start_long = parseFloat(long) - del_long_p,
      end_long = parseFloat(long) + del_long_p
      var q = "CALL p_ticket("+start_lat+", "+end_lat+", "+start_long+", "+end_long+");";
      console.log(q);
      parking_db_con.query(q, function (err, result, fields) {
        if (err) throw err;
        var ret = [];
        for(var i = 0; i < result[0].length; i++)
            ret.push([ JSON.stringify(result[0][i].geocoded_lat), JSON.stringify(result[0][i].geocoded_lng) ]);
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(JSON.stringify({a: ret}));
        res.end();
      });
});
app.get('/node/user/query'     , function(req, res){
  user.get(con, req.session.user, res);
});
app.post('/node/user/update'    , function(req, res){
  user.update(con, req.body.username, req.body.password, req.body.first_name, req.body.last_name, res);
});
app.post('/node/user/delete'    , function(req, res){
  user.delete(con, req.session.user, res);
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
app.use(function (req, res, next) {
  res.status(404).send("404 error: File not found!")
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
