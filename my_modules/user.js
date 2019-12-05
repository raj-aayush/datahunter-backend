exports.login = function(con, username, password, res){
  console.log("Validating login");
  var q = "SELECT username,password FROM user WHERE username=\""+username+"\" AND password=\""+password+"\"";
  console.log(q);
  con.query(q, function (err, result, fields) {
    if (err) throw err;
    var ret = (result.length == 1)? "valid": "invalid";
    console.log(ret);
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(ret);
    res.end();
  });
}

exports.create = function(con, username, password, fname, lname, res){
  console.log("Creating new user");
  //Check if username already exists:
  var q = "SELECT username FROM user WHERE username=\""+username+"\"";
  con.query(q, function (err, result, fields) {
    if (err) throw err;
    var ret = (result.length != 0)? "invalid": "valid";
    if (ret == "invalid"){
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write(ret);
      res.end();
    }
    else{
        var q = "INSERT INTO user (first_name, last_name, username, password) VALUES (\""+fname+"\", \""+lname+"\", \""+username+"\", \""+password+"\")";
        console.log(q);
        con.query(q, function (err, result) {
          if (err) throw err;
          console.log(result);
          res.writeHead(200, {'Content-Type': 'text/html'});
          res.write("valid");
          res.end();
        });
    }
  });
}

exports.delete = function(con, username, res){
  console.log("Deleting user");
  var q = "DELETE FROM user WHERE username=\""+username+"\"";
  console.log(q);
  con.query(q, function (err, result, fields) {
    if (err) throw err;
    res.redirect('/nav/logout');
  });
}

exports.get =  function(con, username, res){
  console.log("Get user");
  var q = "SELECT * FROM user WHERE username=\""+username+"\"";
  console.log(q);
  con.query(q, function (err, result, fields) {
    if (err) throw err;
    var ret = (result.length == 1)? JSON.stringify(result): "invalid";
    console.log(ret);
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(ret);
    res.end();
  });
}

exports.get_cars = function(con, username, res){
  console.log("Get cars");
  var q = "SELECT * FROM car WHERE owner_username=\""+username+"\"";
  console.log(q);
  con.query(q, function (err, result, fields) {
    if (err) throw err;
    console.log(result);
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(JSON.stringify(result));
    res.end();
  });
}

exports.update = function(con, username, password, fname, lname, res){
  console.log("Updating user");
  var q = "UPDATE user SET user.password=\""+password+"\", user.first_name=\""+fname+"\", user.last_name=\""+lname+"\" WHERE user.username=\""+username+"\"";
  console.log(q);
  con.query(q, function (err, result) {
    if (err) throw err;
    console.log(result);
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write("valid");
    res.end();
  });
}
