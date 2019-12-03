var express       =  require("express");
var mysql         =  require('mysql');
var bodyParser    =  require("body-parser");
var fs            =  require('fs');
var app           =  express();
var os            =  require("os");
var car           =  require("./my_modules/car.js");
var user          =  require("./my_modules/user.js");
const g           =  require('@google/maps').createClient({ key: 'AIzaSyDc1JPdVDs1d9vMufechtLWkfyHaxq1NuY' });
const MongoClient =  require('mongodb').MongoClient;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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
  console.log("Connected!");
});

//Handle navigation
app.get('/',async function(req,res){

  const uri = "mongodb+srv://datahunter_admin:datahunter_admin@chicago-crashes-c68oc.gcp.mongodb.net/test?retryWrites=true&w=majority";
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
        await client.connect();
        const collection = client.db("accident").collection("chicago");
        var shorter = collection.find({RD_NO : "JC334993"})
        console.log(await shorter.toArray());

        // console.log(sth);

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
  // client.connect(async function(err){
  //   const collection = client.db("accident").collection("chicago");
  //   // perform actions on the collection object
  //   collection.aggregate([
  //     {$match: {$RD_NO : "JC334993"}}
  //     // {$match: {
  //     //   $and: [
  //     //       {LATITUDE : 41.8861404879},
  //     //       {LONGITUDE: -87.614274106164}
  //     //       ]
  //     //     }
  //     //   },
  //     // {$group: {_id: "$RD_NO", num: {$sum: 1}}}
  //     // {$project: {_id: 0, country: "$_id", avg_ratings: 1}}
  //   ]);
  //   console.log(results);
  //   if (results.length > 0) {
  //       console.log('Found some results');
  //       results.forEach((result, i) => {
  //           // date = new Date(result.last_review).toDateString();
  //           // console.log(`${i + 1}. name: ${result.name}`);
  //           console.log(result);
  //           // console.log(`   bedrooms: ${result.bedrooms}`);
  //           // console.log(`   bathrooms: ${result.bathrooms}`);
  //           // console.log(`   most recent review date: ${new Date(result.last_review).toDateString()}`);
  //       });
  //   } else {
  //       console.log('No results found');
  //   }
  //
  //   client.close();
  // });

  nav('./login.html', fs, res);
});
app.get('/map/', function(req, res){
  nav('./map.html', fs, res);
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
})

function nav(url, fs, res){
  console.log("Opening "+url);
  fs.readFile(url, function(err, data) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(data);
    res.end();
  });
}
