// Copyright (c) Mark Voortman - mark@voortman.name. All rights reserved. Licensed under the MIT license. See LICENSE.txt in the project root for license information.
// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See LICENSE.txt in the project root for license information.
var fs = require("fs");
var express = require("express");
var path = require("path");
var favicon = require("serve-favicon");
var logger = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var formidable = require("formidable");

require("dotenv").config();

var index = require("./routes/index");
var authorize = require("./routes/authorize");
var portfolio = require("./routes/portfolio");
var submissions = require("./routes/submissions");
var templates = require("./routes/templates");

var authHelper = require("./helpers/auth");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, "public", "favicon.ico")));
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", index);
app.use("/authorize", authorize);
app.use("/portfolio", portfolio);
app.use("/submissions", submissions);
app.use("/templates", templates);

app.post("/save_templates", async function(req, res, next) {
  const accessToken = await authHelper.getAccessToken(req.cookies, res);
  const userAdmin = req.cookies.graph_user_admin;
  if (accessToken && userAdmin) {
    res.setHeader("Content-Type", "application/json");
    fs.writeFile("data/templates.json", req.body.data+"\n", "utf8", function(err) {
      res.send(JSON.stringify({
        error: err
      }));
    });
  }
});

async function loadTemplates(req, res, cb) {
  const accessToken = await authHelper.getAccessToken(req.cookies, res);
  const userEmail = req.cookies.graph_user_email;
  if (accessToken && userEmail) {
    res.setHeader("Content-Type", "application/json");
    fs.readFile("data/templates.json", "utf8", function(err, templatesstr) {
      var tmp = err ? {} : JSON.parse(templatesstr);
      if (err && err.code !== "ENOENT") {
        tmp.error = err;
      }
      cb(tmp);
    });
  }
}

app.get("/load_templates", async function(req, res, next) {
  loadTemplates(req, res, function(data) {
    res.send(data);
  });
});

app.post("/save_data", async function(req, res, next) {
  const accessToken = await authHelper.getAccessToken(req.cookies, res);
  var userEmail = req.cookies.graph_user_email;
  if (accessToken && userEmail) {
    const userAdmin = req.cookies.graph_user_admin;
    if (userAdmin && req.query.email) {
      userEmail = req.query.email;
    }
    res.setHeader("Content-Type", "application/json");
    fs.writeFile("data/" + userEmail + ".json", req.body.data+"\n", "utf8", function(err) {
      res.send(JSON.stringify({
        error: err
      }));
    });
  }
});

app.get("/load_data", async function(req, res, next) {
  const accessToken = await authHelper.getAccessToken(req.cookies, res);
  var userEmail = req.cookies.graph_user_email;
  if (accessToken && userEmail) {
    const userAdmin = req.cookies.graph_user_admin;
    if (userAdmin && req.query.email) {
      userEmail = req.query.email;
    }
    res.setHeader("Content-Type", "application/json");
    fs.readFile("data/" + userEmail + ".json", "utf8", function(err, templatestr) {
      var tmp = err ? {} : JSON.parse(templatestr);
      if (err && err.code !== "ENOENT") {
        tmp.error = err;
      }
      if (!tmp.email) {
        tmp.email = userEmail;
      }
      res.send(tmp);
    });
  }
});

app.get("/load_submissions", async function(req, res, next) {
  const accessToken = await authHelper.getAccessToken(req.cookies, res);
  const userEmail = req.cookies.graph_user_email;
  if (accessToken && userEmail) {
    res.setHeader("Content-Type", "application/json");
    fs.readdir("data/", function(err, items) {
      var tmp = {};
      if (err && err.code !== "ENOENT") {
        tmp.error = err;
      }
      if (!tmp.email) {
        tmp.email = userEmail;
      }
      tmp.submissions = [];
      var cnt = 0;
      for (var i = 0; i < items.length; i++) {
        (function(i) {
          if (items[i].endsWith("@pointpark.edu.json")) {
            cnt++;
            fs.readFile("data/" + items[i], "utf8", function(err, userstr) {
              var userdata = err ? null : JSON.parse(userstr);
              if (err && err.code !== "ENOENT") {
                // do nothing
              }
              else {
                var lastsubmission = null;
                if (userdata.portfolios) {
                  for (var j = 0; j < userdata.portfolios.length; j++) {
                    var portfolio = userdata.portfolios[j];
                    if (portfolio.submitted) {
                      lastsubmission = Math.max.apply(null, portfolio.submitted);
                    }
                  }
                }
                tmp.submissions.push({
                  email: items[i].split(".json")[0],
                  lastsubmission: lastsubmission
                });
              }
              cnt--;
              if (cnt === 0) {
                tmp.submissions.sort(function(a, b) {
                  return b.lastsubmission - a.lastsubmission;
                });
                res.send(tmp);
              }
            });
          }
        })(i);
      }
      if (cnt === 0) {
        res.send(tmp);
      }
    });
  }
});

app.post("/fileupload", async function(req, res, next) {
  const accessToken = await authHelper.getAccessToken(req.cookies, res);
  var userEmail = req.cookies.graph_user_email;
  if (accessToken && userEmail) {
    const userAdmin = req.cookies.graph_user_admin;
    if (userAdmin && req.query.email) {
      userEmail = req.query.email;
    }
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
      if (err) {
        res.setHeader("Content-Type", "application/json");
        res.send(JSON.stringify({
          error: err
        }));
      }
      else {
        var id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        fs.rename(files.file.path, "data/" + userEmail + ":" + id + ":" + files.file.name, function(err) {
          res.setHeader("Content-Type", "application/json");
          res.send(JSON.stringify({
            error: err,
            id: id,
            name: files.file.name
          }));
        });
      }
    });
  }
});

app.get("/files/*", async function(req, res, next) {
  const accessToken = await authHelper.getAccessToken(req.cookies, res);
  var userEmail = req.cookies.graph_user_email;
  if (accessToken && userEmail) {
    const userAdmin = req.cookies.graph_user_admin;
    if (userAdmin && req.query.email) {
      userEmail = req.query.email;
    }
    var parts = req.url.split("?")[0].split("/");
    var id = decodeURIComponent(parts[2]);
    var name = decodeURIComponent(parts[3]);
    res.sendFile(__dirname + "/data/" + userEmail + ":" + id + ":" + name);
  }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
