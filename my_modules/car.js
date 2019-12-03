exports.get = function(con, id, res){
  console.log("Get car");
  var q = "SELECT * FROM car WHERE car_id=\""+id+"\"";
  console.log(q);
  con.query(q, function (err, result, fields) {
    if (err) throw err;
    var result = (result.length != 0)? JSON.stringify(result): "invalid";
    console.log(result);
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(result);
    res.end();
  });
}

exports.create = function(con, owner_username, brand, model, licence, res){
  console.log("Create car");
  var q = "INSERT INTO car (brand, model, owner_username, licence) VALUES (\""+brand+"\", \""+model+"\", \""+owner_username+"\", \""+licence+"\")";
  console.log(q);
  con.query(q, function (err, result) {
    if (err) throw err;
    console.log(result);
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write("valid");
    res.end();
  });
}

exports.update = function(con, id, owner_username, brand, model, licence, res){
  console.log("Update car");
  var q = "UPDATE car SET car.owner_username=\""+owner_username+"\", car.brand=\""+brand+"\", car.model=\""+model+"\", car.licence=\""+licence+"\" WHERE car.car_id=\""+id+"\"";
  console.log(q);
  con.query(q, function (err, result) {
    if (err) throw err;
    console.log(result);
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write("valid");
    res.end();
  });
}

exports.delete = function(con, car_id, res){
  console.log("Delete car");
  var q = "DELETE FROM car WHERE car_id=\""+car_id+"\"";
  console.log(q);
  con.query(q, function (err, result, fields) {
    if (err) throw err;
    var ret = JSON.stringify(result);
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(ret);
    res.end();
  });
}
